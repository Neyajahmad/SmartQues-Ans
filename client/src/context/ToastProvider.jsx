import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleAlert, Hand, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';

const ICONS = { success: CircleCheck, error: CircleAlert, hand: Hand, info: Info };

function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(({ title, description, tone = 'info', duration = 4000 }) => {
        const id = ++nextId.current;
        setToasts((current) => [...current.slice(-3), { id, title, description, tone }]);
        setTimeout(() => dismiss(id), duration);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-region" aria-live="polite">
                <AnimatePresence initial={false}>
                    {toasts.map((t) => {
                        const Icon = ICONS[t.tone] || Info;
                        return (
                            <motion.div
                                key={t.id}
                                layout
                                className={`toast toast-${t.tone}`}
                                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            >
                                <Icon size={18} className="toast-icon" />
                                <div className="toast-body">
                                    <strong>{t.title}</strong>
                                    {t.description && <span>{t.description}</span>}
                                </div>
                                <button className="icon-btn-sm" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                                    <X size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export default ToastProvider;
