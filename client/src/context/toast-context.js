import { createContext, useContext } from 'react';

export const ToastContext = createContext(() => {});

// toast({ title, description?, tone?: 'info' | 'success' | 'error' | 'hand' })
export const useToast = () => useContext(ToastContext);
