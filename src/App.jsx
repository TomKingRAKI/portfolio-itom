import { useState, Suspense, useEffect, useCallback, useLayoutEffect, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, useTexture, Text, PerformanceMonitor } from '@react-three/drei';

import Preloader from './components/dom/Preloader';
import { AudioProvider, useAudio } from './context/AudioManager';
import AudioControls from './components/ui/AudioControls';

// Lazy load the heavy 3D experience
const Experience = lazy(() => import('./components/canvas/Experience'));

import './styles/main.scss';

// --- ASSET PRELOADING ---
useTexture.preload('/images/avatar-thinking.webp');
useTexture.preload('/textures/paper-texture.webp');
useTexture.preload('/images/avatar-happy.webp');
useTexture.preload('/images/avatar-hero.webp');
useTexture.preload('/images/ink-splash.webp');

const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

// Helper component to handle global audio enable on interaction
const GlobalAudioEnabler = () => {
  const { enableAudio } = useAudio();
  useEffect(() => {
    const handleInteraction = () => enableAudio();
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [enableAudio]);
  return null;
};

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [dpr, setDpr] = useState(1.5);

  useLayoutEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDpr(isMobile ? 1 : [1, 2]);
  }, []);

  const handleSceneReady = useCallback(() => {
    requestAnimationFrame(() => {
      setSceneReady(true);
    });
  }, []);

  return (
    <AudioProvider>
      <GlobalAudioEnabler />
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

            <PerformanceMonitor
              onDecline={() => setDpr(1)}
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
              <div className="instructions">
                <p>🖱️ Scroll to walk • Click doors to enter</p>
              </div>
            </>
          )}
        </div>

        {/* Audio Controls - Always Visible */}
        <AudioControls />

        {/* 2D Preloader */}
        <Preloader
          ready={sceneReady}
          onComplete={() => setIsLoaded(true)}
        />
      </div>
    </AudioProvider>
  );
}

export default App;
