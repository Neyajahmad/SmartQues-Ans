import { motion } from 'framer-motion';

// Shared enter/exit transition for routed pages
function Page({ children, className = '' }) {
    return (
        <motion.main
            className={`page ${className}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.main>
    );
}

export default Page;
