import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import api, { errorMessage } from '../config/api';
import { useToast } from '../context/toast-context';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';

const MAX_LENGTH = 1000;

// Composer for posting a question to the room
function Question({ roomCode, authorName }) {
    const toast = useToast();
    const [question, setQuestion] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event?.preventDefault();
        if (!question.trim()) {
            setError('Your question cannot be empty.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post(`/room/${roomCode}/question`, {
                content: question.trim(),
                createdBy: authorName || 'Anonymous',
            });
            setQuestion('');
            toast({ tone: 'success', title: 'Question posted' });
        } catch (err) {
            setError(errorMessage(err, 'Could not submit your question. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit(event);
    };

    return (
        <form className="composer glass" onSubmit={submit} noValidate>
            <Avatar name={authorName} size="md" />
            <div className="composer-main">
                <textarea
                    aria-label="Your question"
                    className={error ? 'has-error' : ''}
                    rows={2}
                    maxLength={MAX_LENGTH}
                    value={question}
                    onChange={(e) => { setQuestion(e.target.value); setError(''); }}
                    onKeyDown={onKeyDown}
                    placeholder="Ask the room something…"
                    disabled={loading}
                />
                <div className="composer-footer">
                    {error
                        ? <span className="field-error" role="alert">{error}</span>
                        : <span className="hint">Press ⌘/Ctrl + Enter to send · {question.length}/{MAX_LENGTH}</span>}
                    <motion.button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={loading || !question.trim()}
                        whileTap={{ scale: 0.95 }}
                    >
                        {loading ? <Spinner size={14} /> : <Send size={15} />} Ask
                    </motion.button>
                </div>
            </div>
        </form>
    );
}

export default Question;
