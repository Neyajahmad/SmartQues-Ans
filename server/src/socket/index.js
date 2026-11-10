const Rooms = require('../models/Rooms');
const { verifyToken } = require('../middleware/auth');

// In-memory presence: roomCode -> Map<socketId, participant>
const roomParticipants = new Map();

const cleanName = (value) => String(value || '').trim().slice(0, 60);

const listParticipants = (code) =>
    Array.from(roomParticipants.get(code)?.values() || []);

const getParticipant = (socket) =>
    roomParticipants.get(socket.data.roomCode)?.get(socket.id) || null;

const registerSocketHandlers = (io) => {
    const broadcastParticipants = (code) => {
        io.to(code).emit('participants', listParticipants(code));
    };

    const leaveCurrentRoom = (socket) => {
        const code = socket.data.roomCode;
        if (!code) return;
        const participants = roomParticipants.get(code);
        const participant = participants?.get(socket.id);
        if (participant?.inCall) {
            socket.to(code).emit('call:peer-left', { socketId: socket.id });
        }
        participants?.delete(socket.id);
        if (participants && participants.size === 0) roomParticipants.delete(code);
        socket.leave(code);
        socket.data.roomCode = null;
        broadcastParticipants(code);
    };

    // Optional auth: a valid token identifies the user, otherwise they are a guest
    io.use((socket, next) => {
        socket.data.user = verifyToken(socket.handshake.auth?.token);
        next();
    });

    io.on('connection', (socket) => {
        // Accepts either the legacy room code string or { roomCode, name }
        socket.on('join-room', async (payload) => {
            try {
                const rawCode = typeof payload === 'string' ? payload : payload?.roomCode;
                const code = String(rawCode || '').toUpperCase();
                const room = await Rooms.findOne({ roomCode: code });
                if (!room) return socket.emit('room-error', { message: 'Invalid room code' });

                if (socket.data.roomCode !== code) leaveCurrentRoom(socket);
                socket.join(code);
                socket.data.roomCode = code;

                const user = socket.data.user;
                const isHost = Boolean(user && room.hostId && room.hostId.toString() === user.id);
                const name = user?.name || cleanName(payload?.name) || 'Guest';

                if (!roomParticipants.has(code)) roomParticipants.set(code, new Map());
                roomParticipants.get(code).set(socket.id, {
                    socketId: socket.id,
                    userId: user?.id || null,
                    name,
                    isHost,
                    handRaised: false,
                    handRaisedAt: null,
                    inCall: false,
                    audio: false,
                    video: false,
                });

                socket.emit('room-joined', { socketId: socket.id, isHost });
                broadcastParticipants(code);
            } catch (error) {
                console.log('join-room failed', error);
                socket.emit('room-error', { message: 'Could not join the room' });
            }
        });

        // ---- Raise hand ----
        socket.on('hand:raise', () => {
            const participant = getParticipant(socket);
            if (!participant || participant.handRaised) return;
            participant.handRaised = true;
            participant.handRaisedAt = Date.now();
            socket.to(socket.data.roomCode).emit('hand:raised', {
                socketId: socket.id,
                name: participant.name
            });
            broadcastParticipants(socket.data.roomCode);
        });

        // Lower your own hand, or (host only) someone else's
        socket.on('hand:lower', (payload) => {
            const me = getParticipant(socket);
            if (!me) return;
            const targetId = payload?.socketId || socket.id;
            if (targetId !== socket.id && !me.isHost) return;
            const target = roomParticipants.get(socket.data.roomCode)?.get(targetId);
            if (!target || !target.handRaised) return;
            target.handRaised = false;
            target.handRaisedAt = null;
            if (targetId !== socket.id) {
                io.to(targetId).emit('hand:lowered-by-host');
            }
            broadcastParticipants(socket.data.roomCode);
        });

        socket.on('hand:lower-all', () => {
            const me = getParticipant(socket);
            if (!me?.isHost) return;
            for (const participant of listParticipants(socket.data.roomCode)) {
                participant.handRaised = false;
                participant.handRaisedAt = null;
            }
            socket.to(socket.data.roomCode).emit('hand:lowered-by-host');
            broadcastParticipants(socket.data.roomCode);
        });

        // ---- Audio / video call (WebRTC mesh, server only relays signals) ----
        socket.on('call:join', (payload) => {
            const me = getParticipant(socket);
            if (!me) return;
            me.inCall = true;
            me.audio = Boolean(payload?.audio);
            me.video = Boolean(payload?.video);
            const peers = listParticipants(socket.data.roomCode)
                .filter((p) => p.inCall && p.socketId !== socket.id)
                .map((p) => p.socketId);
            // The new member offers to everyone already in the call
            socket.emit('call:peers', peers);
            broadcastParticipants(socket.data.roomCode);
        });

        socket.on('call:media', (payload) => {
            const me = getParticipant(socket);
            if (!me?.inCall) return;
            me.audio = Boolean(payload?.audio);
            me.video = Boolean(payload?.video);
            broadcastParticipants(socket.data.roomCode);
        });

        socket.on('call:signal', (payload) => {
            const me = getParticipant(socket);
            const target = roomParticipants.get(socket.data.roomCode)?.get(payload?.to);
            if (!me?.inCall || !target?.inCall) return;
            io.to(target.socketId).emit('call:signal', { from: socket.id, data: payload.data });
        });

        socket.on('call:leave', () => {
            const me = getParticipant(socket);
            if (!me?.inCall) return;
            me.inCall = false;
            me.audio = false;
            me.video = false;
            socket.to(socket.data.roomCode).emit('call:peer-left', { socketId: socket.id });
            broadcastParticipants(socket.data.roomCode);
        });

        socket.on('leave-room', () => leaveCurrentRoom(socket));
        socket.on('disconnect', () => leaveCurrentRoom(socket));
    });
};

module.exports = { registerSocketHandlers };
