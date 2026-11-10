import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Hand, Mic, MicOff, Users, Video } from 'lucide-react';
import Avatar from '../Avatar';

const sortParticipants = (list) => [...list].sort((a, b) => {
    if (a.handRaised !== b.handRaised) return a.handRaised ? -1 : 1;
    if (a.handRaised) return a.handRaisedAt - b.handRaisedAt; // first raised, first served
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    return a.name.localeCompare(b.name);
});

function ParticipantsPanel({ participants, selfId, isHost, onLowerHand, onLowerAll }) {
    const raisedCount = participants.filter((p) => p.handRaised).length;

    return (
        <section className="panel glass">
            <header className="panel-header">
                <h3><Users size={17} /> People <span className="count-badge">{participants.length}</span></h3>
                {isHost && raisedCount > 0 && (
                    <button className="btn btn-ghost btn-xs" onClick={onLowerAll}>Lower all</button>
                )}
            </header>

            {raisedCount > 0 && (
                <p className="panel-note"><Hand size={14} /> {raisedCount} hand{raisedCount > 1 ? 's' : ''} raised</p>
            )}

            <ul className="people-list">
                <AnimatePresence initial={false}>
                    {sortParticipants(participants).map((p) => (
                        <motion.li
                            key={p.key}
                            layout
                            className={`person ${p.handRaised ? 'has-hand' : ''}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        >
                            <Avatar name={p.name} size="sm" />
                            <span className="person-name">
                                {p.name}
                                {p.socketId === selfId && <span className="tag">You</span>}
                                {p.isHost && <span className="tag tag-host"><Crown size={11} /> Host</span>}
                            </span>
                            <span className="person-status">
                                {p.inCall && (
                                    <>
                                        {p.video && <Video size={14} className="text-accent" aria-label="Camera on" />}
                                        {p.audio
                                            ? <Mic size={14} className="text-accent" aria-label="Mic on" />
                                            : <MicOff size={14} className="text-muted" aria-label="Muted" />}
                                    </>
                                )}
                                {p.handRaised && (
                                    isHost && p.socketId !== selfId ? (
                                        <button
                                            className="hand-btn"
                                            onClick={() => onLowerHand(p.socketIds)}
                                            title={`Lower ${p.name}'s hand`}
                                        >
                                            <Hand size={15} className="wave" /> Lower
                                        </button>
                                    ) : (
                                        <Hand size={16} className="text-warning wave" aria-label="Hand raised" />
                                    )
                                )}
                            </span>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </section>
    );
}

export default ParticipantsPanel;
