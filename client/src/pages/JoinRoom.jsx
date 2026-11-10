import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, LogIn, User } from 'lucide-react';
import Page from '../components/Page';
import Field from '../components/Field';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import api, { GUEST_NAME_KEY, storage } from '../config/api';
import { useAuth } from '../context/auth-context';

function JoinRoom() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [name, setName] = useState(() => storage.get(GUEST_NAME_KEY) || '');
    const [roomCode, setRoomCode] = useState(() => (searchParams.get('code') || '').toUpperCase());
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const next = {};
        if (!user && !name.trim()) next.name = 'Your name is required.';
        if (!roomCode.trim()) next.roomCode = 'A room code is required.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;
        const code = roomCode.trim();
        setLoading(true);
        try {
            await api.get(`/room/${encodeURIComponent(code)}`);
            if (!user) storage.set(GUEST_NAME_KEY, name.trim());
            navigate(`/room/${code}`);
        } catch (error) {
            setErrors({
                roomCode: error.response?.status === 404
                    ? 'No room found with that code. Double-check and try again.'
                    : 'Could not reach the server. Please try again.',
            });
            setLoading(false);
        }
    };

    return (
        <Page className="center-page">
            <div className="form-card glass">
                <motion.span
                    className="form-card-icon"
                    initial={{ scale: 0, rotate: 30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                >
                    <LogIn size={26} />
                </motion.span>
                <div className="form-card-header">
                    <h1>Join a room</h1>
                    <p>Enter the code your host shared with you.</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="form-stack">
                    {user ? (
                        <div className="host-chip">
                            <Avatar name={user.name} size="sm" />
                            <span>Joining as <strong>{user.name}</strong></span>
                        </div>
                    ) : (
                        <Field
                            id="name" label="Your name" icon={User} autoComplete="name"
                            placeholder="Enter your name" value={name} maxLength={60}
                            onChange={(e) => setName(e.target.value)} error={errors.name} disabled={loading}
                        />
                    )}
                    <Field
                        id="roomCode" label="Room code" icon={Hash}
                        className="code-input" placeholder="ABC123" value={roomCode} maxLength={12}
                        autoComplete="off" spellCheck={false}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                        error={errors.roomCode} disabled={loading}
                    />
                    <motion.button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} whileTap={{ scale: 0.98 }}>
                        {loading ? <><Spinner /> Checking room…</> : 'Join room'}
                    </motion.button>
                </form>
            </div>
        </Page>
    );
}

export default JoinRoom;
