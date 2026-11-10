import { useEffect, useState } from 'react';

// True while the stream's audio is above a speaking threshold
export function useSpeaking(stream, enabled = true) {
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!enabled || !stream || !AudioCtx || stream.getAudioTracks().length === 0) {
            setSpeaking(false);
            return;
        }

        const context = new AudioCtx();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        context.resume?.().catch(() => {});

        const data = new Uint8Array(analyser.frequencyBinCount);
        let current = false;
        let lastLoud = 0;
        const timer = setInterval(() => {
            analyser.getByteFrequencyData(data);
            const average = data.reduce((sum, value) => sum + value, 0) / data.length;
            const now = Date.now();
            if (average > 14) lastLoud = now;
            const next = now - lastLoud < 350; // brief hold avoids flicker
            if (next !== current) {
                current = next;
                setSpeaking(next);
            }
        }, 100);

        return () => {
            clearInterval(timer);
            source.disconnect();
            context.close().catch(() => {});
        };
    }, [stream, enabled]);

    return speaking;
}
