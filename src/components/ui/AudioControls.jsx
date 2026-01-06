import { useAudio } from '../../context/AudioManager';
import '../../styles/AudioControls.scss';

const AudioControls = () => {
    const { isMuted, toggleMute, globalVolume, setGlobalVolume } = useAudio();

    // Hand-drawn SVG Icons
    const SoundOnIcon = () => (
        <svg viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeWidth="2.5" />
            <path d="M15 9a5 5 0 0 1 0 6" />
            <path d="M18 5a9 9 0 0 1 0 14" />
        </svg>
    );

    const SoundOffIcon = () => (
        <svg viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeWidth="2.5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
    );

    return (
        <div className="audio-controls">
            {/* Volume Slider - Revealed on Hover via CSS */}
            <div className="volume-slider-container">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={globalVolume}
                    onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                    aria-label="Volume"
                />
            </div>

            {/* Mute Toggle Button */}
            <button
                className="mute-btn"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted || globalVolume === 0 ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>
        </div>
    );
};

export default AudioControls;
