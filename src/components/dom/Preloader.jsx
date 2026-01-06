import { useState, useEffect, useRef, useMemo } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';
import { useAudio } from '../../context/AudioManager';

const Preloader = ({ onComplete, ready }) => {
  const [isDone, setIsDone] = useState(false);
  const { progress: realProgress, active } = useProgress();
  const { play } = useAudio();

  // Track audio handle to stop loop
  const pencilSoundRef = useRef(null);

  // Use refs for animation targets
  const containerRef = useRef(null);
  const leftHalfRef = useRef(null);
  const rightHalfRef = useRef(null);
  // Removed single svgPathRef as we now have two lines inside the halves

  // Track visual progress
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // ----------------------------------------
  // GENERATE TEAR PATH
  // ----------------------------------------
  const tearPoints = useMemo(() => {
    const points = [];
    const segments = 12; // Fewer segments

    points.push([50, 0]);

    for (let i = 1; i < segments; i++) {
      const y = (i / segments) * 100;
      const xOffset = (Math.random() - 0.5) * 6;
      const x = 50 + xOffset;
      points.push([x, y]);
    }

    points.push([50, 100]);
    return points;
  }, []);

  const svgPathData = useMemo(() => {
    return tearPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]} `).join(' ');
  }, [tearPoints]);

  const leftClipPoly = useMemo(() => {
    let poly = '0% 0%, ';
    tearPoints.forEach(p => { poly += `${p[0]}% ${p[1]}%, `; });
    poly += '0% 100%';
    return `polygon(${poly})`;
  }, [tearPoints]);

  const rightClipPoly = useMemo(() => {
    let poly = '100% 0%, ';
    poly += '100% 100%, ';
    [...tearPoints].reverse().forEach(p => { poly += `${p[0]}% ${p[1]}%, `; });
    return `polygon(${poly.slice(0, -2)})`;
  }, [tearPoints]);


  // ----------------------------------------
  // SMOOTH LOADING LOGIC
  // ----------------------------------------
  useEffect(() => {
    let newTarget = 0;
    if (active) {
      newTarget = (realProgress / 100) * 85;
    } else {
      if (ready) {
        newTarget = 100;
      } else {
        newTarget = 90;
      }
    }

    setTargetProgress(prev => Math.max(prev, newTarget));
  }, [realProgress, active, ready]);

  // Handle Pencil Sound
  useEffect(() => {
    // Start playing pencil if we are loading and not finished
    // AND not already playing
    if (displayProgress < 99 && !pencilSoundRef.current) {
      pencilSoundRef.current = play('pencil', { loop: true, volume: 0.5 });
    }
    // Stop playing if we are done
    else if (displayProgress >= 99 && pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }

    return () => {
      // Cleanup on unmount or if deps change messily
      if (pencilSoundRef.current) {
        pencilSoundRef.current.stop();
        pencilSoundRef.current = null;
      }
    };
  }, [displayProgress, play]); // Re-eval if play function changes (it shouldn't) or progress updates

  useEffect(() => {
    const tracker = { val: displayProgress };
    const distance = targetProgress - displayProgress;

    let duration = 0.5;

    if (distance > 60) {
      duration = 4.0;
    } else if (distance > 30) {
      duration = 2.5;
    } else if (distance > 10) {
      duration = 1.5;
    } else if (distance > 0) {
      duration = 0.8;
    }

    gsap.killTweensOf(tracker);

    gsap.to(tracker, {
      val: targetProgress,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayProgress(val => Math.max(val, tracker.val));
      }
    });

    return () => gsap.killTweensOf(tracker);
  }, [targetProgress]);


  // ----------------------------------------
  // EXIT SEQUENCE
  // ----------------------------------------
  const exitStarted = useRef(false);

  useEffect(() => {
    if (displayProgress >= 99.5 && ready && !exitStarted.current) {
      startExit();
    }
  }, [displayProgress, ready]);

  const startExit = () => {
    exitStarted.current = true;

    // Final audio check
    if (pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }
    play('tear', { volume: 0.8 });

    const tl = gsap.timeline({
      onComplete: () => {
        setIsDone(true);
        onComplete?.();
      }
    });

    // 1. Wait a moment 
    tl.to({}, { duration: 0.3 });

    // REMOVED: Hiding the drawn line. Now it splits!

    // 2. Tear Apart
    tl.to(leftHalfRef.current, {
      xPercent: -100,
      rotation: -2,
      duration: 2.5,
      ease: "power3.inOut"
    }, 'tear');

    tl.to(rightHalfRef.current, {
      xPercent: 100,
      rotation: 2,
      duration: 2.5,
      ease: "power3.inOut"
    }, 'tear');

    // 3. Fade container
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 1
    }, '-=1');
  };

  if (isDone) return null;

  const pathLength = 120;
  const safeProgress = Math.min(100, Math.max(0, displayProgress));
  const strokeDashoffset = pathLength - (pathLength * safeProgress) / 100;
  const percentageText = `${Math.round(safeProgress)}%`;

  // Reusable SVG Line Component to ensure consistency
  const TearLineSVG = () => (
    <svg
      className="preloader__overlay" // Keep class for positioning (absolute 0 0)
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none' }}
    >
      <path
        d={svgPathData}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="0.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: strokeDashoffset,
        }}
      />
    </svg>
  );

  return (
    <div className="preloader" ref={containerRef}>
      {/* LEFT HALF */}
      <div
        className="preloader__half preloader__half--left"
        ref={leftHalfRef}
        style={{ clipPath: leftClipPoly }}
      >
        {/* Content: Percentage & Line */}
        <div className="preloader__percentage">
          {percentageText}
        </div>
        {/* SVG is now INSIDE the clipped half */}
        <TearLineSVG />
      </div>

      {/* RIGHT HALF */}
      <div
        className="preloader__half preloader__half--right"
        ref={rightHalfRef}
        style={{ clipPath: rightClipPoly }}
      >
        {/* Content: Percentage & Line */}
        <div className="preloader__percentage">
          {percentageText}
        </div>
        {/* SVG is now INSIDE the clipped half */}
        <TearLineSVG />
      </div>

      {/* REMOVED: Standalone Overlay SVG */}
    </div>
  );
};

export default Preloader;
