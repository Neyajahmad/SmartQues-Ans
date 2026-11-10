import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Hand, Headphones, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import Spinner from '../Spinner';

function DockButton({ active, danger, label, onClick, disabled, children, wide }) {
    return (
        <motion.button
            type="button"
            className={`dock-btn ${active ? 'is-active' : ''} ${danger ? 'is-danger' : ''} ${wide ? 'is-wide' : ''}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            title={label}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
            {children}
        </motion.button>
    );
}

function ControlDock({ handRaised, onToggleHand, call }) {
    // Portal to <body>: the page transition's CSS filter would otherwise make
    // `position: fixed` relative to the page instead of the viewport.
    return createPortal(
        <motion.div
            className="dock glass"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.2 }}
        >
            <DockButton
                active={handRaised}
                label={handRaised ? 'Lower hand' : 'Raise hand'}
                onClick={onToggleHand}
                wide
            >
                <Hand size={20} className={handRaised ? 'wave' : ''} />
                <span>{handRaised ? 'Lower hand' : 'Raise hand'}</span>
            </DockButton>

            <span className="dock-divider" />

            {call.inCall ? (
                <>
                    <DockButton
                        active={call.audioOn}
                        label={call.audioOn ? 'Mute microphone' : 'Unmute microphone'}
                        onClick={call.toggleAudio}
                    >
                        {call.audioOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </DockButton>
                    <DockButton
                        active={call.videoOn}
                        label={call.videoOn ? 'Turn camera off' : 'Turn camera on'}
                        onClick={call.toggleVideo}
                    >
                        {call.videoOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </DockButton>
                    <DockButton danger label="Leave call" onClick={call.leave}>
                        <PhoneOff size={20} />
                    </DockButton>
                </>
            ) : (
                <>
                    <DockButton label="Join with audio" onClick={() => call.join(false)} disabled={call.joining} wide>
                        {call.joining ? <Spinner size={18} /> : <Headphones size={20} />}
                        <span>Audio</span>
                    </DockButton>
                    <DockButton label="Join with video" onClick={() => call.join(true)} disabled={call.joining} wide>
                        {call.joining ? <Spinner size={18} /> : <Video size={20} />}
                        <span>Video</span>
                    </DockButton>
                </>
            )}
        </motion.div>,
        document.body
    );
}

export default ControlDock;
