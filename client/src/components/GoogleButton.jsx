import { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let scriptPromise = null;
const loadGoogleScript = () => {
    if (window.google?.accounts?.id) return Promise.resolve(window.google);
    scriptPromise ||= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Failed to load Google sign-in'));
        };
        document.head.appendChild(script);
    });
    return scriptPromise;
};

// Official "Sign in with Google" button. Calls onCredential with a Google ID
// token, which the server verifies. Renders nothing if no client ID is set.
function GoogleButton({ onCredential, text = 'continue_with' }) {
    const containerRef = useRef(null);
    const callbackRef = useRef(onCredential);
    const [failed, setFailed] = useState(false);

    useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

    useEffect(() => {
        if (!CLIENT_ID) return;
        let cancelled = false;
        loadGoogleScript()
            .then((google) => {
                const container = containerRef.current;
                if (cancelled || !container) return;
                google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: (result) => callbackRef.current?.(result.credential),
                });
                google.accounts.id.renderButton(container, {
                    theme: 'filled_black',
                    size: 'large',
                    shape: 'pill',
                    text,
                    logo_alignment: 'center',
                    width: Math.max(200, Math.min(400, container.offsetWidth)),
                });
            })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [text]);

    if (!CLIENT_ID) return null;
    if (failed) return <p className="field-error">Couldn't load Google sign-in. Check your connection.</p>;
    return <div ref={containerRef} className="google-btn" />;
}

export default GoogleButton;
