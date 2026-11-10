import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { storage, TOKEN_KEY, USER_KEY } from '../config/api';
import { AuthContext } from './auth-context';

const readStoredUser = () => {
    if (!storage.get(TOKEN_KEY)) return null;
    try { return JSON.parse(storage.get(USER_KEY)); } catch { return null; }
};

function AuthProvider({ children }) {
    const [user, setUser] = useState(readStoredUser);
    const [ready, setReady] = useState(() => !storage.get(TOKEN_KEY));

    const clearSession = useCallback(() => {
        storage.remove(TOKEN_KEY);
        storage.remove(USER_KEY);
        setUser(null);
    }, []);

    const saveSession = useCallback(({ token, user: nextUser }) => {
        storage.set(TOKEN_KEY, token);
        storage.set(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return nextUser;
    }, []);

    // Validate a stored token on load
    useEffect(() => {
        if (!storage.get(TOKEN_KEY)) return;
        api.get('/auth/me')
            .then((response) => {
                storage.set(USER_KEY, JSON.stringify(response.data.user));
                setUser(response.data.user);
            })
            .catch((error) => {
                if (error.response?.status === 401) clearSession();
            })
            .finally(() => setReady(true));
    }, [clearSession]);

    const value = useMemo(() => ({
        user,
        ready,
        login: async (email, password) =>
            saveSession((await api.post('/auth/login', { email, password })).data),
        register: async (name, email, password) =>
            saveSession((await api.post('/auth/register', { name, email, password })).data),
        loginWithGoogle: async (credential) =>
            saveSession((await api.post('/auth/google', { credential })).data),
        logout: clearSession,
    }), [user, ready, saveSession, clearSession]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
