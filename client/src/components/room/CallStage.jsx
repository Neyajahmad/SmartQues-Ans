import { AnimatePresence, motion } from 'framer-motion';
import VideoTile from '../VideoTile';

function CallStage({ call, participants, selfId, selfName }) {
    const me = participants.find((p) => p.socketId === selfId);
    const others = participants.filter((p) => p.inCall && p.socketId !== selfId);
    const count = others.length + 1;

    return (
        <motion.section
            className="call-stage glass"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="call-stage-inner">
                <div className="call-stage-header">
                    <span className="live-dot" /> On call · {count} {count === 1 ? 'person' : 'people'}
                    {count === 1 && <span className="hint"> — waiting for others to join</span>}
                </div>
                <div className={`tile-grid tiles-${Math.min(count, 4)}`}>
                    <AnimatePresence>
                        <VideoTile
                            key="local"
                            isLocal
                            stream={call.localStream}
                            name={selfName}
                            audioOn={call.audioOn}
                            videoOn={call.videoOn}
                            handRaised={me?.handRaised}
                        />
                        {others.map((p) => (
                            <VideoTile
                                key={p.socketId}
                                stream={call.remoteStreams[p.socketId]}
                                name={p.name}
                                audioOn={p.audio}
                                videoOn={p.video}
                                handRaised={p.handRaised}
                                connecting={!call.remoteStreams[p.socketId] && (p.audio || p.video)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.section>
    );
}

export default CallStage;
