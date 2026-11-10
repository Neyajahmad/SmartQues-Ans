import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Crown, Inbox, TriangleAlert, Users } from 'lucide-react';
import Page from '../components/Page';
import Avatar from '../components/Avatar';
import Question from './Question';
import NameGate from '../components/room/NameGate';
import ParticipantsPanel from '../components/room/ParticipantsPanel';
import TopQuestionsPanel from '../components/room/TopQuestionsPanel';
import CallStage from '../components/room/CallStage';
import ControlDock from '../components/room/ControlDock';
import api, { GUEST_NAME_KEY, storage } from '../config/api';
import socket from '../config/socket';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { useWebRTC } from '../hooks/useWebRTC';
import { useNow } from '../hooks/useNow';
import { timeAgo } from '../utils/format';

// One entry per person: tabs logged into the same account are merged
const mergePeople = (participants, selfId) => {
    const people = new Map();
    for (const p of participants) {
        const key = p.userId ? `user:${p.userId}` : `socket:${p.socketId}`;
        const person = people.get(key);
        if (!person) {
            people.set(key, { ...p, key, socketIds: [p.socketId] });
            continue;
        }
        person.socketIds.push(p.socketId);
        if (p.socketId === selfId) person.socketId = selfId;
        if (p.handRaised && (!person.handRaised || p.handRaisedAt < person.handRaisedAt)) {
            person.handRaised = true;
            person.handRaisedAt = p.handRaisedAt;
        }
        person.inCall ||= p.inCall;
        person.audio ||= p.audio;
        person.video ||= p.video;
    }
    return Array.from(people.values());
};

function RoomSkeleton() {
    return (
        <div className="room-skeleton">
            <span className="skeleton tall" />
            <div className="room-grid">
                <div className="skeleton-stack">
                    {[0, 1, 2, 3].map((i) => <span key={i} className="skeleton card" />)}
                </div>
                <div className="skeleton-stack">
                    <span className="skeleton card" /><span className="skeleton card" />
                </div>
            </div>
        </div>
    );
}

function Room() {
    const { code: rawCode } = useParams();
    const code = rawCode.toUpperCase();
    const { user, ready } = useAuth();
    const toast = useToast();
    const now = useNow();

    const [guestName, setGuestName] = useState(() => storage.get(GUEST_NAME_KEY) || '');
    const displayName = user?.name || guestName;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [room, setRoom] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [selfId, setSelfId] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);

    const call = useWebRTC(socket, toast);
    const isHostRef = useRef(false);

    // Initial room + question load
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        Promise.all([api.get(`/room/${code}`), api.get(`/room/${code}/question`)])
            .then(([roomResponse, questionsResponse]) => {
                if (cancelled) return;
                setRoom(roomResponse.data);
                setQuestions(questionsResponse.data);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.response?.status === 404
                    ? "This room doesn't exist. Check the code and try again."
                    : 'Unable to load the room. Please try again.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [code]);

    // Real-time connection, once we know who the user is
    useEffect(() => {
        if (!room || !displayName || !ready) return;

        const join = () => socket.emit('join-room', { roomCode: code, name: displayName });
        const onJoined = ({ socketId, isHost: host }) => {
            setSelfId(socketId);
            setIsHost(host);
            isHostRef.current = host;
        };
        const onParticipants = (list) => setParticipants(list);
        const onNewQuestion = (question) => {
            setQuestions((current) =>
                current.some((q) => q._id === question._id) ? current : [question, ...current]);
        };
        const onHandRaised = ({ name }) => {
            if (isHostRef.current) toast({ tone: 'hand', title: `${name} raised their hand` });
        };
        const onLoweredByHost = () => toast({ tone: 'info', title: 'The host lowered your hand' });
        const onRoomError = ({ message }) => setError(message);

        socket.on('connect', join);
        socket.on('room-joined', onJoined);
        socket.on('participants', onParticipants);
        socket.on('new-question', onNewQuestion);
        socket.on('hand:raised', onHandRaised);
        socket.on('hand:lowered-by-host', onLoweredByHost);
        socket.on('room-error', onRoomError);

        if (socket.connected) join();
        else socket.connect();

        return () => {
            socket.off('connect', join);
            socket.off('room-joined', onJoined);
            socket.off('participants', onParticipants);
            socket.off('new-question', onNewQuestion);
            socket.off('hand:raised', onHandRaised);
            socket.off('hand:lowered-by-host', onLoweredByHost);
            socket.off('room-error', onRoomError);
            socket.emit('leave-room');
            socket.disconnect();
        };
    }, [room, code, displayName, ready, toast]);

    const people = mergePeople(participants, selfId);
    const me = participants.find((p) => p.socketId === selfId);
    const handRaised = Boolean(me?.handRaised);

    const toggleHand = useCallback(() => {
        socket.emit(handRaised ? 'hand:lower' : 'hand:raise');
        if (!handRaised) toast({ tone: 'hand', title: 'Hand raised', description: 'The host has been notified.' });
    }, [handRaised, toast]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast({ tone: 'success', title: 'Room code copied', description: code });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ tone: 'error', title: 'Could not copy', description: `The room code is ${code}.` });
        }
    };

    if (!loading && !error && !displayName) {
        return (
            <Page className="center-page">
                <NameGate
                    code={code}
                    onSubmit={(name) => { storage.set(GUEST_NAME_KEY, name); setGuestName(name); }}
                />
            </Page>
        );
    }

    if (error) {
        return (
            <Page className="center-page">
                <div className="status-card glass">
                    <TriangleAlert size={40} className="text-danger" />
                    <h2>Something went wrong</h2>
                    <p>{error}</p>
                    <Link to="/join" className="btn btn-primary">Try another code</Link>
                </div>
            </Page>
        );
    }

    if (loading) {
        return <Page className="room-page"><RoomSkeleton /></Page>;
    }

    return (
        <Page className="room-page">
            <motion.header
                className="room-header glass"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="room-heading">
                    <span className="live-pill"><span className="live-dot" /> Live</span>
                    <div>
                        <h1>{room.title || 'Live Q&A'}</h1>
                        <p className="room-meta">
                            {room.createdBy && <>Hosted by <strong>{room.createdBy}</strong> · </>}
                            <Users size={14} /> {people.length} online
                            {isHost && <span className="tag tag-host"><Crown size={11} /> You're the host</span>}
                        </p>
                    </div>
                </div>
                <button className="code-chip" onClick={copyCode} title="Copy room code">
                    <span className="code-chip-label">Room code</span>
                    <span className="code-chip-value">{code}</span>
                    {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
            </motion.header>

            <AnimatePresence>
                {call.inCall && (
                    <CallStage
                        key="stage"
                        call={call}
                        participants={participants}
                        selfId={selfId}
                        selfName={displayName}
                    />
                )}
            </AnimatePresence>

            <div className="room-grid">
                <section className="feed">
                    <Question roomCode={code} authorName={displayName} />

                    <div className="feed-header">
                        <h2>Questions</h2>
                        <span className="count-badge">{questions.length}</span>
                    </div>

                    {questions.length === 0 ? (
                        <motion.div className="empty-state glass" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Inbox size={36} />
                            <p>No questions yet. Be the first to ask!</p>
                        </motion.div>
                    ) : (
                        <ul className="question-list">
                            <AnimatePresence>
                                {questions.map((q, index) => (
                                    <motion.li
                                        key={q._id}
                                        layout
                                        className="question-card glass"
                                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            type: 'spring', stiffness: 380, damping: 30,
                                            // Staggers the first load; new questions arrive at index 0
                                            delay: Math.min(index, 8) * 0.04,
                                            layout: { type: 'spring', stiffness: 380, damping: 30 },
                                        }}
                                    >
                                        <Avatar name={q.createdBy || 'Anonymous'} size="sm" />
                                        <div className="question-body">
                                            <div className="question-meta">
                                                <strong>{q.createdBy || 'Anonymous'}</strong>
                                                <span>{timeAgo(q.createdAt, now)}</span>
                                            </div>
                                            <p>{q.content}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}
                </section>

                <aside className="sidebar">
                    <ParticipantsPanel
                        participants={people}
                        selfId={selfId}
                        isHost={isHost}
                        onLowerHand={(socketIds) => socketIds.forEach((socketId) => socket.emit('hand:lower', { socketId }))}
                        onLowerAll={() => socket.emit('hand:lower-all')}
                    />
                    <TopQuestionsPanel roomCode={code} questionCount={questions.length} />
                </aside>
            </div>

            <ControlDock handRaised={handRaised} onToggleHand={toggleHand} call={call} />
        </Page>
    );
}

export default Room;
