import { useCallback, useEffect, useRef, useState } from 'react';

// Public STUN servers work on most networks. For users behind strict
// corporate/mobile NATs, add a TURN server here for production.
const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
const VIDEO_CONSTRAINTS = { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' };

const getMedia = (constraints) => {
    if (!navigator.mediaDevices?.getUserMedia) {
        return Promise.reject(new Error('Media devices need HTTPS or localhost'));
    }
    return navigator.mediaDevices.getUserMedia(constraints);
};

/**
 * Mesh WebRTC call over the existing Socket.IO connection.
 * The person joining offers to everyone already in the call; existing members
 * create their side when the first offer arrives. Renegotiation (e.g. turning
 * the camera on later) uses the "perfect negotiation" pattern so either side
 * can add tracks without signalling conflicts.
 */
export function useWebRTC(socket, notify) {
    const [inCall, setInCall] = useState(false);
    const [joining, setJoining] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [audioOn, setAudioOn] = useState(false);
    const [videoOn, setVideoOn] = useState(false);

    const streamRef = useRef(null);
    const peersRef = useRef(new Map());
    const notifyRef = useRef(notify);
    useEffect(() => { notifyRef.current = notify; }, [notify]);

    const sendSignal = useCallback((to, data) => {
        socket.emit('call:signal', { to, data });
    }, [socket]);

    const publishLocal = useCallback(() => {
        const stream = streamRef.current;
        const audioTrack = stream?.getAudioTracks()[0];
        const nextAudio = Boolean(audioTrack?.enabled);
        const nextVideo = Boolean(stream?.getVideoTracks()[0]);
        setLocalStream(stream ? new MediaStream(stream.getTracks()) : null);
        setAudioOn(nextAudio);
        setVideoOn(nextVideo);
        return { audio: nextAudio, video: nextVideo };
    }, []);

    const closePeer = useCallback((peerId) => {
        const peer = peersRef.current.get(peerId);
        if (!peer) return;
        peer.pc.close();
        peersRef.current.delete(peerId);
        setRemoteStreams((current) => {
            const next = { ...current };
            delete next[peerId];
            return next;
        });
    }, []);

    // `initiator` is true only for the person joining the call. Letting one side
    // make the first offer avoids offer glare on connect, which can stall ICE.
    const createPeer = useCallback((peerId, initiator = false) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        const peer = {
            pc,
            polite: socket.id > peerId,
            makingOffer: false,
            ignoreOffer: false,
            senders: { audio: null, video: null },
        };
        peersRef.current.set(peerId, peer);

        const stream = streamRef.current;
        stream?.getTracks().forEach((track) => {
            peer.senders[track.kind] = pc.addTrack(track, stream);
        });
        if (initiator) {
            // Still receive audio/video when joining without a mic or camera.
            // A later addTrack of the same kind reuses these transceivers.
            for (const kind of ['audio', 'video']) {
                if (!peer.senders[kind]) pc.addTransceiver(kind, { direction: 'recvonly' });
            }
        }

        pc.onnegotiationneeded = async () => {
            try {
                peer.makingOffer = true;
                await pc.setLocalDescription();
                sendSignal(peerId, { description: pc.localDescription.toJSON() });
            } catch (error) {
                console.warn('Negotiation failed', error);
            } finally {
                peer.makingOffer = false;
            }
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) sendSignal(peerId, { candidate: candidate.toJSON() });
        };

        pc.ontrack = ({ track, streams }) => {
            setRemoteStreams((current) => {
                const tracks = streams[0]
                    ? streams[0].getTracks()
                    : [...(current[peerId]?.getTracks() || []), track];
                return { ...current, [peerId]: new MediaStream(tracks) };
            });
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed') pc.restartIce();
        };

        return peer;
    }, [socket, sendSignal]);

    const handleSignal = useCallback(async ({ from, data }) => {
        if (!streamRef.current || !data) return;
        const peer = peersRef.current.get(from) || createPeer(from);
        const { pc } = peer;
        try {
            if (data.description) {
                const offerCollision = data.description.type === 'offer'
                    && (peer.makingOffer || pc.signalingState !== 'stable');
                peer.ignoreOffer = !peer.polite && offerCollision;
                if (peer.ignoreOffer) return;

                await pc.setRemoteDescription(data.description);
                if (data.description.type === 'offer') {
                    await pc.setLocalDescription();
                    sendSignal(from, { description: pc.localDescription.toJSON() });
                }
            } else if (data.candidate) {
                try {
                    await pc.addIceCandidate(data.candidate);
                } catch (error) {
                    if (!peer.ignoreOffer) console.warn('ICE candidate rejected', error);
                }
            }
        } catch (error) {
            console.warn('Signalling error', error);
        }
    }, [createPeer, sendSignal]);

    const teardown = useCallback(() => {
        for (const peer of peersRef.current.values()) peer.pc.close();
        peersRef.current.clear();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setLocalStream(null);
        setRemoteStreams({});
        setInCall(false);
        setAudioOn(false);
        setVideoOn(false);
    }, []);

    const join = useCallback(async (withVideo) => {
        if (streamRef.current || joining) return;
        setJoining(true);
        let stream = null;
        try {
            stream = await getMedia({ audio: true, video: withVideo ? VIDEO_CONSTRAINTS : false });
        } catch {
            if (withVideo) {
                try {
                    stream = await getMedia({ audio: true });
                    notifyRef.current?.({ tone: 'info', title: 'Camera unavailable', description: 'Joined with audio only.' });
                } catch { /* fall through to listen-only */ }
            }
        }
        if (!stream) {
            // No mic permission: still join so the user can hear and see others
            stream = new MediaStream();
            notifyRef.current?.({ tone: 'info', title: 'Joined in listen-only mode', description: 'Allow microphone access to speak.' });
        }
        streamRef.current = stream;
        const media = publishLocal();
        setInCall(true);
        setJoining(false);
        socket.emit('call:join', media);
    }, [socket, joining, publishLocal]);

    const leave = useCallback(() => {
        if (!streamRef.current) return;
        teardown();
        if (socket.connected) socket.emit('call:leave');
    }, [socket, teardown]);

    // Adds a freshly captured track to the local stream and every peer
    const attachTrack = useCallback(async (track) => {
        const stream = streamRef.current;
        stream.addTrack(track);
        for (const peer of peersRef.current.values()) {
            const sender = peer.senders[track.kind];
            if (sender) await sender.replaceTrack(track);
            else peer.senders[track.kind] = peer.pc.addTrack(track, stream);
        }
    }, []);

    const toggleAudio = useCallback(async () => {
        const stream = streamRef.current;
        if (!stream) return;
        const track = stream.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
        } else {
            try {
                const [newTrack] = (await getMedia({ audio: true })).getAudioTracks();
                await attachTrack(newTrack);
            } catch {
                notifyRef.current?.({ tone: 'error', title: 'Microphone blocked', description: 'Allow microphone access in your browser settings.' });
                return;
            }
        }
        socket.emit('call:media', publishLocal());
    }, [socket, attachTrack, publishLocal]);

    const toggleVideo = useCallback(async () => {
        const stream = streamRef.current;
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (track) {
            // Fully stop the camera so the device light turns off
            track.stop();
            stream.removeTrack(track);
            for (const peer of peersRef.current.values()) {
                await peer.senders.video?.replaceTrack(null);
            }
        } else {
            try {
                const [newTrack] = (await getMedia({ video: VIDEO_CONSTRAINTS })).getVideoTracks();
                await attachTrack(newTrack);
            } catch {
                notifyRef.current?.({ tone: 'error', title: 'Camera blocked', description: 'Allow camera access in your browser settings.' });
                return;
            }
        }
        socket.emit('call:media', publishLocal());
    }, [socket, attachTrack, publishLocal]);

    useEffect(() => {
        const onPeers = (ids) => {
            if (!streamRef.current) return;
            ids.forEach((id) => { if (!peersRef.current.has(id)) createPeer(id, true); });
        };
        const onPeerLeft = ({ socketId }) => closePeer(socketId);
        const onDisconnect = (reason) => {
            if (!streamRef.current || reason === 'io client disconnect') return;
            teardown();
            notifyRef.current?.({ tone: 'error', title: 'Connection lost', description: 'You were disconnected from the call. Rejoin when you are back online.' });
        };

        socket.on('call:peers', onPeers);
        socket.on('call:peer-left', onPeerLeft);
        socket.on('call:signal', handleSignal);
        socket.on('disconnect', onDisconnect);
        return () => {
            socket.off('call:peers', onPeers);
            socket.off('call:peer-left', onPeerLeft);
            socket.off('call:signal', handleSignal);
            socket.off('disconnect', onDisconnect);
        };
    }, [socket, createPeer, closePeer, handleSignal, teardown]);

    // Release camera/mic when leaving the page
    useEffect(() => () => {
        if (!streamRef.current) return;
        teardown();
        if (socket.connected) socket.emit('call:leave');
    }, [socket, teardown]);

    return { inCall, joining, localStream, remoteStreams, audioOn, videoOn, join, leave, toggleAudio, toggleVideo };
}
