import { useEffect, useRef, useState } from 'react';

export const useWakeLock = (enabled: boolean) => {
    const wakeLock = useRef<WakeLockSentinel | null>(null);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const requestWakeLock = async () => {
            if (!enabled) return;

            try {
                if ('wakeLock' in navigator) {
                    wakeLock.current = await navigator.wakeLock.request('screen');
                    setIsLocked(true);

                    wakeLock.current.addEventListener('release', () => {
                        setIsLocked(false);
                    });
                }
            } catch (err: any) {
                console.error(`${err.name}, ${err.message}`);
            }
        };

        const releaseWakeLock = async () => {
            if (wakeLock.current) {
                try {
                    await wakeLock.current.release();
                    wakeLock.current = null;
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && enabled) {
                requestWakeLock();
            }
        };

        if (enabled) {
            requestWakeLock();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        } else {
            releaseWakeLock();
        }

        return () => {
            releaseWakeLock();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled]);

    return isLocked;
};
