import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Hand, MessagesSquare, Plus, Sparkles, Video, Zap } from 'lucide-react';
import Page from '../components/Page';
import Avatar from '../components/Avatar';

const FEATURES = [
    { icon: MessagesSquare, title: 'Live questions', text: 'Questions appear for everyone instantly — no refresh, no waiting.' },
    { icon: Sparkles, title: 'AI top questions', text: 'Gemini groups similar questions and surfaces what matters most.' },
    { icon: Hand, title: 'Raise your hand', text: 'Let the host know you want to speak. They see the queue in order.' },
    { icon: Video, title: 'Audio & video', text: 'Jump into a live call right inside the room with one click.' },
];

const PREVIEW_QUESTIONS = [
    { name: 'Aisha Khan', text: 'How does the AI decide which questions are top?' },
    { name: 'Rahul Verma', text: 'Can we join the call with audio only?' },
    { name: 'Sara Ali', text: 'Will the session recording be shared later?' },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function Home() {
    const [code, setCode] = useState('');
    const navigate = useNavigate();

    const quickJoin = (event) => {
        event.preventDefault();
        const trimmed = code.trim();
        navigate(trimmed ? `/join?code=${encodeURIComponent(trimmed)}` : '/join');
    };

    return (
        <Page className="home">
            <section className="hero">
                <motion.div className="hero-copy" variants={container} initial="hidden" animate="show">
                    <motion.span variants={item} className="eyebrow">
                        <Zap size={14} /> Real-time Q&A for classes, meetups & town halls
                    </motion.span>
                    <motion.h1 variants={item} className="hero-title">
                        Ask better questions,<br />
                        <span className="gradient-text">together.</span>
                    </motion.h1>
                    <motion.p variants={item} className="hero-subtitle">
                        Spin up a room in seconds, collect questions live, raise hands,
                        talk face to face, and let AI highlight what your audience cares about most.
                    </motion.p>
                    <motion.div variants={item} className="hero-actions">
                        <Link to="/create" className="btn btn-primary btn-lg">
                            <Plus size={18} /> Create a room
                        </Link>
                        <form className="quick-join" onSubmit={quickJoin}>
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Room code"
                                aria-label="Room code"
                                maxLength={12}
                            />
                            <button type="submit" className="btn btn-ghost" aria-label="Join room">
                                Join <ArrowRight size={16} />
                            </button>
                        </form>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="hero-preview"
                    initial={{ opacity: 0, y: 40, rotate: 2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="preview-card glass float">
                        <div className="preview-header">
                            <span className="live-dot" /> Live · Room <strong>X7K2QD</strong>
                            <span className="preview-people">
                                <Avatar name="Aisha Khan" size="xs" />
                                <Avatar name="Rahul Verma" size="xs" />
                                <Avatar name="Sara Ali" size="xs" />
                            </span>
                        </div>
                        {PREVIEW_QUESTIONS.map((q, index) => (
                            <motion.div
                                key={q.name}
                                className="preview-question"
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.18, duration: 0.5 }}
                            >
                                <Avatar name={q.name} size="sm" />
                                <div>
                                    <span className="preview-name">{q.name}</span>
                                    <p>{q.text}</p>
                                </div>
                            </motion.div>
                        ))}
                        <motion.div
                            className="preview-hand"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3, type: 'spring', stiffness: 300 }}
                        >
                            <Hand size={16} className="wave" /> Rahul raised their hand
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            <motion.section
                className="features"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                {FEATURES.map(({ icon: Icon, title, text }) => (
                    <motion.article
                        key={title}
                        variants={item}
                        className="feature-card glass"
                        whileHover={{ y: -6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <span className="feature-icon"><Icon size={22} /></span>
                        <h3>{title}</h3>
                        <p>{text}</p>
                    </motion.article>
                ))}
            </motion.section>
        </Page>
    );
}

export default Home;
