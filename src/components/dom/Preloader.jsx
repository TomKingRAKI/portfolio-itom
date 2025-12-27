import { useState, useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';

const Preloader = ({ onComplete, ready }) => {
  const [isDone, setIsDone] = useState(false);
  const { progress: realProgress, active } = useProgress();

  const containerRef = useRef(null);
  const accentRef = useRef(null);
  const logoRef = useRef(null);

  // Track visual progress in a ref to decouple from re-renders
  // But we will apply it effectively via CSS variable or direct style
  const [visualProgress, setVisualProgress] = useState(0);

  const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

  // ---------------------------------------------------------------------------
  // 1. ROBUST CSS-DRIVEN PROGRESS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // If active, use real progress. If not active (finished), go to 100.
    let target = active ? realProgress : 100;

    // Awwwards Polish:
    // If assets are loaded but scene isn't ready (React mounting/Shader compilation),
    // clamp visuals at 95-99% so the user feels we are "still working".
    // Only snap to 100% when absolutely ready to open.
    if ((!active || target >= 100) && !ready) {
      target = 99;
    }

    setVisualProgress(target);
  }, [realProgress, active, ready]);

  useEffect(() => {
    // Trigger exit ONLY when:
    // 1. Loading is done (active=false, progress=100)
    // 2. Scene is mounted and ready (ready=true)
    if (realProgress >= 100 && !active && ready) {
      startExit();
    }
  }, [realProgress, active, ready]);

  // ---------------------------------------------------------------------------
  // 2. EXIT TRANSITION
  // ---------------------------------------------------------------------------
  const exitStarted = useRef(false);

  const startExit = () => {
    if (exitStarted.current) return;
    exitStarted.current = true;

    // Small delay to ensure "100%" is felt
    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          onComplete?.();
        }
      });

      const getCenterOffset = () => {
        if (!accentRef.current) return { x: 0, y: 0 };
        const rect = accentRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return {
          x: window.innerWidth / 2 - centerX,
          y: window.innerHeight / 2 - centerY
        };
      };

      const offset = getCenterOffset();

      // Step 1: Fade out "IT" and "M" cleanly
      tl.to('.preloader__logo-text', {
        x: (i) => i === 0 ? -60 : 60, // Slide out slightly
        opacity: 0,
        filter: 'blur(10px)', // Cinematic blur out
        duration: 0.8,
        ease: 'power3.in'
      });

      // Step 2: Center the "O"
      tl.to(accentRef.current, {
        x: offset.x,
        y: offset.y,
        scale: 1.1,
        duration: 1.0,
        ease: 'power3.inOut'
      }, '-=0.6');

      // Step 3: Portal Open - ALLOW INTERACTION NOW
      tl.call(() => {
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = 'none';
        }
      }, null, '+=0.1');

      tl.to(containerRef.current, {
        '--mask-size': '150vmax',
        duration: 2.7,
        ease: 'expo.inOut' // Classic elegant ease
      }, '+=0.1');

      tl.to(accentRef.current, {
        scale: 50,
        opacity: 0,
        duration: 2.5,
        ease: 'expo.inOut'
      }, '<');

      // Final cleanup
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.5
      }, '-=0.5');

    }, 300);
  };

  if (isDone) return null;

  // Calculate stroke offset based on visualProgress
  // We simply pass the target value to the style, and CSS transition handles the rest.
  const safeProgress = Math.min(100, Math.max(0, visualProgress));
  const strokeOffset = CIRCUMFERENCE - (CIRCUMFERENCE * safeProgress) / 100;

  return (
    <div ref={containerRef} className="preloader">
      <div className="preloader__content">
        <div className="preloader__logo" ref={logoRef}>

          <span className="preloader__logo-text">IT</span>

          <div ref={accentRef} className="preloader__logo-accent-wrapper">
            <svg viewBox="0 0 100 100" className="preloader__logo-accent">

              {/* Track - subtle gray */}
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="6"
                style={{ opacity: 0.4 }}
              />

              {/* Progress - Neon Green 
                  Using inline style for transition to ensure CSS handles the tweening
              */}
              <circle
                className="preloader__logo-accent-progress"
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#39FF14"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                style={{
                  strokeDashoffset: strokeOffset,
                  transition: 'stroke-dashoffset 0.5s ease-out'
                }}
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>

          <span className="preloader__logo-text">M</span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
