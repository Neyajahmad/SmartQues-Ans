import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen, Type } from 'lucide-react';
import Page from '../components/Page';
import Field from '../components/Field';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import api, { errorMessage } from '../config/api';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';

function CreateRoom() {
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/room', { title: title.trim() });
            toast({ tone: 'success', title: 'Room created', description: `Share code ${response.data.roomCode} with your audience.` });
            navigate(`/room/${response.data.roomCode}`);
        } catch (err) {
            setError(errorMessage(err, 'Could not create the room. Please try again later.'));
            setLoading(false);
        }
    };

    return (
        <Page className="center-page">
            <div className="form-card glass">
                <motion.span
                    className="form-card-icon"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                >
                    <DoorOpen size={26} />
                </motion.span>
                <div className="form-card-header">
                    <h1>Create a new room</h1>
                    <p>We'll generate a unique code you can share with participants.</p>
                </div>

                <div className="host-chip">
                    <Avatar name={user.name} size="sm" />
                    <span>Hosting as <strong>{user.name}</strong></span>
                </div>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="form-stack">
                    <Field
                        id="title" label="Session title (optional)" icon={Type}
                        placeholder="e.g. Weekly team AMA" value={title} maxLength={100}
                        onChange={(e) => setTitle(e.target.value)} disabled={loading}
                    />
                    <motion.button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} whileTap={{ scale: 0.98 }}>
                        {loading ? <><Spinner /> Creating room…</> : 'Create room'}
                    </motion.button>
                </form>
            </div>
        </Page>
    );
}

export default CreateRoom;
