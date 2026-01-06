import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AudioContext = createContext({
    isMuted: false,
    toggleMute: () => { },
    play: () => { },
    enableAudio: () => { },
    audioEnabled: false,
    globalVolume: 0.5,
    setGlobalVolume: () => { },
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
    // Persist mute preference
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('audio_muted');
        return saved === 'true';
    });

    // Persist volume preference (0.0 to 1.0)
    const [globalVolume, setGlobalVolume] = useState(() => {
        const saved = localStorage.getItem('audio_volume');
        return saved !== null ? parseFloat(saved) : 0.5;
    });

    const [audioEnabled, setAudioEnabled] = useState(false);

    // Track active sounds to stop them later
    const activeSounds = useRef({});

    useEffect(() => {
        localStorage.setItem('audio_muted', isMuted);
        localStorage.setItem('audio_volume', globalVolume);

        // Update all active sounds
        Object.values(activeSounds.current).forEach(audio => {
            if (audio) {
                audio.muted = isMuted;
                // Scale effective volume by global volume
                // We stored the requested "base" volume on the object as _baseVolume
                const base = audio._baseVolume !== undefined ? audio._baseVolume : 1.0;
                audio.volume = base * globalVolume;
            }
        });

    }, [isMuted, globalVolume]);

    const toggleMute = () => setIsMuted(prev => !prev);

    // Call this on first interaction
    const enableAudio = useCallback(() => {
        if (!audioEnabled) {
            // Create a dummy context or just flip the switch to say "we tried"
            // Real web audio unlock usually needs a context resume, 
            // but for HTML5 Audio elements, just a user interaction event is enough 
            // to "bless" the document for subsequent plays.
            setAudioEnabled(true);
        }
    }, [audioEnabled]);

    const play = useCallback((soundName, { loop = false, volume = 1.0 } = {}) => {
        // Graceful degradation if files missing
        const path = `/sounds/${soundName}.mp3`;

        // In "simulation mode" or if file missing, this might error.
        // We'll trust the browser to handle 404s without crashing JS.
        const audio = new Audio(path);

        // Store metadata
        audio.loop = loop;
        audio._baseVolume = volume; // Custom prop to remember intended relative mix

        // Apply current global state
        audio.muted = isMuted;
        audio.volume = volume * globalVolume;

        // Store reference (clearing old one if exists with same name for simplicity)
        if (activeSounds.current[soundName]) {
            activeSounds.current[soundName].pause();
        }
        activeSounds.current[soundName] = audio;

        // Simulation log
        console.log(`[Audio] Playing ${soundName} (loop: ${loop}, vol: ${audio.volume.toFixed(2)})`);

        // Attempt to play
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.warn('[Audio] Auto-play blocked. Waiting for interaction.');
                    // We could mark audioEnabled = false here
                } else if (error.name === 'NotSupportedError' || error.message.includes('404')) {
                    console.warn(`[Audio] File not found or not supported: ${path}. (This is expected if files are missing)`);
                } else {
                    // Other errors (e.g. 404 often comes as a network error event on the element, not the promise)
                    console.warn('[Audio] Play error:', error);
                }
            });
        }

        // Return a handle to stop it
        return {
            stop: () => {
                console.log(`[Audio] Stopping ${soundName}`);
                audio.pause();
                audio.currentTime = 0;
                delete activeSounds.current[soundName];
            },
            fade: (duration = 1000) => {
                // Simple fade out simulation
                console.log(`[Audio] Fading out ${soundName}`);
                // Logic to decrement volume would go here activeSounds.current[soundName]...
                // For now just stop
                audio.pause();
                delete activeSounds.current[soundName];
            }
        };
    }, [isMuted, globalVolume]);

    return (
        <AudioContext.Provider value={{
            isMuted,
            toggleMute,
            globalVolume,
            setGlobalVolume,
            play,
            enableAudio,
            audioEnabled
        }}>
            {children}
        </AudioContext.Provider>
    );
};
