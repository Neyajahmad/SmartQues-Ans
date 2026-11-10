import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hand, MicOff } from 'lucide-react';
import { useSpeaking } from '../hooks/useSpeaking';
import Avatar from './Avatar';

function VideoTile({ stream, name, isLocal = false, audioOn, videoOn, handRaised, connecting }) {
    const videoRef = useRef(null);
    const speaking = useSpeaking(stream, audioOn);

    useEffect(() => {
        const video = videoRef.current;
        if (video && video.srcObject !== stream) video.srcObject = stream || null;
    }, [stream]);

    return (
        <motion.div
            layout
            className={`tile ${speaking ? 'is-speaking' : ''}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
            {/* Always mounted so remote audio keeps playing when the camera is off */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`tile-video ${isLocal ? 'mirrored' : ''} ${videoOn && stream ? '' : 'is-hidden'}`}
            />
            {!(videoOn && stream) && (
                <div className="tile-placeholder">
                    <div className="tile-avatar-ring">
                        <Avatar name={name} size="lg" />
                    </div>
                    {connecting && <span className="tile-status">Connecting…</span>}
                </div>
            )}
            <div className="tile-label">
                {!audioOn && <MicOff size={14} className="text-danger" />}
                <span>{name}{isLocal ? ' (You)' : ''}</span>
            </div>
            {handRaised && (
                <span className="tile-hand" title="Hand raised"><Hand size={16} /></span>
            )}
        </motion.div>
    );
}

export default VideoTile;
