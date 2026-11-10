import axios from 'axios';
import { serverEndpoint } from './appConfig';

export const TOKEN_KEY = 'smartqa-token';
export const USER_KEY = 'smartqa-user';
export const GUEST_NAME_KEY = 'participant-name';

export const storage = {
    get(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
    },
    remove(key) {
        try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
    },
};

const api = axios.create({ baseURL: serverEndpoint });

api.interceptors.request.use((config) => {
    const token = storage.get(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const errorMessage = (error, fallback) =>
    error?.response?.data?.message || fallback;

export default api;
