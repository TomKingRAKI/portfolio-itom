import { useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';

import Preloader from './components/dom/Preloader';
import Experience from './components/canvas/Experience';

import './styles/main.scss';

/**
 * App Component - ITom's Creative House
 * 
 * Loading phases:
 * 1. 'loading' - Camera auto-scrolls toward entrance doors
 * 2. 'doors' - Stopped at entrance doors, waiting for click
 * 3. 'entering' - Walking through entrance doors
 * 4. 'ready' - Full experience with scroll control
 */
function App() {
  const [loadingPhase, setLoadingPhase] = useState('loading');
  const [progress, setProgress] = useState(0);

  // Simulate progress from 0 to 100 during loading
  useEffect(() => {
    if (loadingPhase !== 'loading') return;

    const duration = 3000; // 3 seconds
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
    }, 50);

    return () => clearInterval(interval);
  }, [loadingPhase]);

  // When camera reaches doors (called by useInfiniteCamera)
  const handleReachDoors = useCallback(() => {
    setProgress(100);
    setLoadingPhase('doors');
  }, []);

  // When doors are clicked - start entering phase
  const handleStartEntering = useCallback(() => {
    setLoadingPhase('entering');
  }, []);

  // Handle entrance complete (after walking through doors)
  const handleEnterComplete = useCallback(() => {
    setLoadingPhase('ready');
  }, []);

  return (
    <div className="app">
      {/* Full screen 3D Canvas */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{
            position: [0, 0.2, 60], // Start position matches useInfiniteCamera
            fov: 60,
            near: 0.1,
            far: 150
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
        >
          {/* White background */}
          <color attach="background" args={['#fafafa']} />

          {/* Fog for depth */}
          <fog attach="fog" args={['#fafafa', 15, 50]} />

          <Suspense fallback={null}>
            <Experience
              loadingPhase={loadingPhase}
              onReachDoors={handleReachDoors}
              onStartEntering={handleStartEntering}
              onEnterComplete={handleEnterComplete}
            />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {loadingPhase === 'ready' && (
          <>
            <div className="scroll-hint">
              <span className="scroll-hint__text">Scroll to explore</span>
              <span className="scroll-hint__arrow">↓</span>
            </div>
            <div className="instructions">
              <p>🖱️ Scroll to walk • Click doors to enter</p>
            </div>
          </>
        )}
      </div>

      {/* Minimal Preloader Overlay */}
      <Preloader
        loadingPhase={loadingPhase}
        progress={Math.round(progress)}
      />
    </div>
  );
}

export default App;
