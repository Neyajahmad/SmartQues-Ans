import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, MessageCircleQuestion } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import Avatar from './Avatar';

const LINKS = [
    { to: '/', label: 'Home' },
    { to: '/create', label: 'Host' },
    { to: '/join', label: 'Join' },
];

function Navbar() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast({ tone: 'success', title: 'Logged out', description: 'See you next time!' });
        navigate('/');
    };

    return (
        <motion.header
            className="navbar"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <Link to="/" className="brand">
                <span className="brand-mark"><MessageCircleQuestion size={18} /></span>
                <span>Smart<span className="gradient-text">QA</span></span>
            </Link>

            <nav className="nav-links">
                {LINKS.map((link) => (
                    <NavLink key={link.to} to={link.to} end className="nav-link">
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-pill"
                                        className="nav-pill"
                                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                                    />
                                )}
                                <span className="nav-link-text">{link.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="nav-actions">
                {user ? (
                    <>
                        <div className="nav-user" title={user.email}>
                            <Avatar name={user.name} size="sm" />
                            <span className="nav-user-name">{user.name}</span>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Log out">
                            <LogOut size={16} />
                            <span className="hide-sm">Log out</span>
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
                    </>
                )}
            </div>
        </motion.header>
    );
}

export default Navbar;
