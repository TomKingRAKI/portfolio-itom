import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Preloader Component - Minimal Overlay
 * 
 * Shows loading progress in corner until doors phase.
 * Fades out when entering through doors.
 */
const Preloader = ({ loadingPhase, progress }) => {
  const containerRef = useRef(null);

  // Fade out when entering through doors
  useEffect(() => {
    if (loadingPhase === 'entering' && containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }, [loadingPhase]);

  // Don't render after entering
  if (loadingPhase === 'ready') return null;

  return (
    <div
      ref={containerRef}
      className="preloader-minimal"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 100,
        pointerEvents: 'none'
      }}
    >
      {/* Progress counter */}
      <div
        className="preloader-minimal__content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '3rem',
            fontWeight: 700,
            color: '#1a1a1a',
            lineHeight: 1
          }}
        >
          {Math.round(progress)}%
        </span>

        <span
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#666',
            fontFamily: 'var(--font-body, sans-serif)'
          }}
        >
          {loadingPhase === 'loading' ? 'Loading...' : 'Click to enter'}
        </span>

        {/* Progress bar */}
        <div
          style={{
            width: '120px',
            height: '2px',
            background: '#e0e0e0',
            borderRadius: '1px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#39FF14',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Preloader;
