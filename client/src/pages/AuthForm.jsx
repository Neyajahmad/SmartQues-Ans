import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Page from '../components/Page';
import Field from '../components/Field';
import Spinner from '../components/Spinner';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { errorMessage } from '../config/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared form for /login and /register
function AuthForm({ mode }) {
    const isRegister = mode === 'register';
    const { user, login, register, loginWithGoogle } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/';

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(0);

    if (user && !loading) return <Navigate to={redirectTo} replace />;

    const update = (key) => (event) => {
        setForm((current) => ({ ...current, [key]: event.target.value }));
        setErrors((current) => ({ ...current, [key]: undefined, api: undefined }));
    };

    const validate = () => {
        const next = {};
        if (isRegister && !form.name.trim()) next.name = 'Please enter your name.';
        if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.';
        if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const finishSignIn = (signedIn, created) => {
        toast({
            tone: 'success',
            title: created ? 'Account created' : 'Welcome back',
            description: `Signed in as ${signedIn.name}.`,
        });
        navigate(redirectTo, { replace: true });
    };

    const handleGoogle = async (credential) => {
        setLoading(true);
        setErrors({});
        try {
            finishSignIn(await loginWithGoogle(credential), false);
        } catch (error) {
            setErrors({ api: errorMessage(error, 'Google sign-in failed. Please try again.') });
            setShake((n) => n + 1);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) {
            setShake((n) => n + 1);
            return;
        }
        setLoading(true);
        try {
            const signedIn = isRegister
                ? await register(form.name.trim(), form.email.trim(), form.password)
                : await login(form.email.trim(), form.password);
            finishSignIn(signedIn, isRegister);
        } catch (error) {
            setErrors({ api: errorMessage(error, 'Something went wrong. Please try again.') });
            setShake((n) => n + 1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page className="center-page">
            <motion.div
                key={shake}
                className="form-card glass"
                animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                <div className="form-card-header">
                    <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
                    <p>
                        {isRegister
                            ? 'Host rooms, keep your name across sessions, and get started in seconds.'
                            : 'Log in to host rooms and join sessions as yourself.'}
                    </p>
                </div>

                {errors.api && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert">
                        {errors.api}
                    </motion.div>
                )}

                {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <>
                        <GoogleButton
                            onCredential={handleGoogle}
                            text={isRegister ? 'signup_with' : 'continue_with'}
                        />
                        <div className="divider"><span>or use email</span></div>
                    </>
                )}

                <form onSubmit={handleSubmit} noValidate className="form-stack">
                    {isRegister && (
                        <Field
                            id="name" label="Full name" icon={User} autoComplete="name"
                            placeholder="Jane Doe" value={form.name} onChange={update('name')}
                            error={errors.name} disabled={loading}
                        />
                    )}
                    <Field
                        id="email" label="Email" icon={Mail} type="email" autoComplete="email"
                        placeholder="you@example.com" value={form.email} onChange={update('email')}
                        error={errors.email} disabled={loading}
                    />
                    <Field
                        id="password" label="Password" icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        placeholder={isRegister ? 'At least 6 characters' : 'Your password'}
                        value={form.password} onChange={update('password')}
                        error={errors.password} disabled={loading}
                        trailing={(
                            <button
                                type="button"
                                className="icon-btn-sm"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        )}
                    />

                    <motion.button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? <Spinner /> : <>{isRegister ? 'Create account' : 'Log in'} <ArrowRight size={18} /></>}
                    </motion.button>
                </form>

                <p className="form-footer">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <Link to={isRegister ? '/login' : '/register'} state={location.state}>
                        {isRegister ? 'Log in' : 'Create one'}
                    </Link>
                </p>
            </motion.div>
        </Page>
    );
}

export default AuthForm;
