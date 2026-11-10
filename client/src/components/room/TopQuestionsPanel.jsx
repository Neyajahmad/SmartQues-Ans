import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import api, { errorMessage } from '../../config/api';
import Spinner from '../Spinner';

function TopQuestionsPanel({ roomCode, questionCount }) {
    const [topQuestions, setTopQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetched, setFetched] = useState(false);

    const fetchTop = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/room/${roomCode}/top-questions`);
            setTopQuestions(response.data || []);
            setFetched(true);
        } catch (err) {
            setError(errorMessage(err, 'Unable to fetch top questions right now.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="panel glass">
            <header className="panel-header">
                <h3><Sparkles size={17} className="text-accent" /> AI top questions</h3>
                <motion.button
                    className="btn btn-ghost btn-xs"
                    onClick={fetchTop}
                    disabled={loading || questionCount === 0}
                    whileTap={{ scale: 0.95 }}
                >
                    {loading ? <Spinner size={12} /> : fetched ? 'Refresh' : 'Summarize'}
                </motion.button>
            </header>

            {error && <p className="field-error">{error}</p>}
            {loading && (
                <div className="skeleton-stack">
                    <span className="skeleton" /><span className="skeleton" /><span className="skeleton short" />
                </div>
            )}
            {!loading && topQuestions.length > 0 && (
                <ol className="top-list">
                    {topQuestions.map((text, index) => (
                        <motion.li
                            key={`${index}-${text}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                        >
                            <span className="top-rank">{index + 1}</span>
                            <span>{text.replace(/^\s*(\d+[.)]|[-*•])\s*/, '')}</span>
                        </motion.li>
                    ))}
                </ol>
            )}
            {!loading && topQuestions.length === 0 && !error && (
                <p className="placeholder-text">
                    {questionCount === 0
                        ? 'Once questions come in, AI can group and rank them for you.'
                        : fetched ? 'No summary returned. Try again shortly.' : 'Click "Summarize" to see what the room cares about most.'}
                </p>
            )}
        </section>
    );
}

export default TopQuestionsPanel;
