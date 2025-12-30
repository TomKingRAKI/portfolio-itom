import { useState, Suspense, useEffect, useCallback, useLayoutEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, useTexture, Text, PerformanceMonitor } from '@react-three/drei';

import Preloader from './components/dom/Preloader';
import Experience from './components/canvas/Experience';

import './styles/main.scss';

// --- ASSET PRELOADING ---
// Explicitly preload heavy assets to ensure they are tracked by useProgress
useTexture.preload('/images/avatar-thinking.png');
useTexture.preload('/textures/paper-texture.png');
useTexture.preload('/images/avatar-happy.png');
useTexture.preload('/images/avatar-hero.png');
useTexture.preload('/images/ink-splash.png');

const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [dpr, setDpr] = useState(1.5); // Default conservative DPR

  // Mobile detection for initial optimizations
  useLayoutEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // On mobile: 1.0 (crisp enough for small screens, much faster)
    // On desktop: [1, 2] (adaptive)
    setDpr(isMobile ? 1 : [1, 2]);
  }, []);

  const handleSceneReady = useCallback(() => {
    // Small delay to ensure the first frame is actually painted
    requestAnimationFrame(() => {
      setSceneReady(true);
    });
  }, []);

  return (
    <div className="app">
      {/* Full screen 3D Canvas */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{
            position: [0, 0.2, 28],
            fov: 60,
            near: 0.1,
            far: 150
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            localClippingEnabled: true
          }}
          dpr={dpr}
        >
          <color attach="background" args={['#fafafa']} />
          <fog attach="fog" args={['#fafafa', 15, 50]} />

          {/* Performance Monitor - adaptive quality if FPS drops */}
          <PerformanceMonitor
            onDecline={() => setDpr(1)} // Downgrade to 1 if stalling
          />

          <Suspense fallback={null}>
            <Experience isLoaded={isLoaded} onSceneReady={handleSceneReady} />
            <Text font={FONT_URL} visible={false}>preload</Text>
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {isLoaded && (
          <>
            {/* Scroll hint removed - consolidated into 3D arrow */}
            <div className="instructions">
              <p>🖱️ Scroll to walk • Click doors to enter</p>
            </div>
          </>
        )}
      </div>

      {/* 2D Preloader */}
      <Preloader
        ready={sceneReady}
        onComplete={() => setIsLoaded(true)}
      />
    </div>
  );
}

export default App;
