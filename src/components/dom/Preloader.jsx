import { useState, useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';

const LOADING_TEXTS = ['Sketching...', 'Coding...', 'Brewing coffee...', 'Almost there...'];

/**
 * Preloader - Minimal Overlay
 * 
 * Just shows progress. Disappears when done.
 * 3D entrance doors handle the actual transition.
 */
const Preloader = ({ onComplete }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const containerRef = useRef(null);

  const { progress, loaded } = useProgress();
  const isLoaded = progress === 100 && loaded > 0;

  // Animate progress counter
  useEffect(() => {
    gsap.to({ value: displayProgress }, {
      value: progress,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: function () {
        setDisplayProgress(Math.round(this.targets()[0].value));
      }
    });
  }, [progress]);

  // Cycle loading texts
  useEffect(() => {
    if (isLoaded) return;

    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 400);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Fade out when loaded
  useEffect(() => {
    if (!isLoaded) return;

    // Quick fade out
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      delay: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        setIsDone(true);
        onComplete?.();
      }
    });
  }, [isLoaded, onComplete]);

  if (isDone) return null;

  return (
    <div ref={containerRef} className="preloader">
      <div className="preloader__content">
        {/* Logo */}
        <div className="preloader__logo">
          <span className="preloader__logo-text">IT</span>
          <span className="preloader__logo-accent">O</span>
          <span className="preloader__logo-text">M</span>
        </div>

        {/* Progress */}
        <div className="preloader__progress">
          <span className="preloader__percent">{displayProgress}%</span>
        </div>

        {/* Loading text */}
        <p className="preloader__text">
          {isLoaded ? 'Ready!' : LOADING_TEXTS[textIndex]}
        </p>

        {/* Progress bar */}
        <div className="preloader__bar">
          <div
            className="preloader__bar-fill"
            style={{ transform: `scaleX(${displayProgress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Preloader;
