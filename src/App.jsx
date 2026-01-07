import { useState, Suspense, useEffect, useCallback, useLayoutEffect, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, useTexture, Text, PerformanceMonitor } from '@react-three/drei';

import Preloader from './components/dom/Preloader';
import { AudioProvider, useAudio } from './context/AudioManager';
import { PerformanceProvider, usePerformance } from './context/PerformanceContext';
import AudioControls from './components/ui/AudioControls';

// Lazy load the heavy 3D experience
const Experience = lazy(() => import('./components/canvas/Experience'));

import './styles/main.scss';

// --- BATCH ASSET PRELOADING ---
// This preloads ALL entrance and corridor textures during the preloader phase
// Room textures are NOT preloaded - they load on-demand when user clicks a door
import { PRELOAD_ALL } from './config/texturePreloadList';
PRELOAD_ALL.forEach(path => useTexture.preload(path));

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

function AppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  // Use Performance Context
  const { settings, downgradeTier, tier } = usePerformance();

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
              antialias: settings.antialias,
              alpha: false,
              powerPreference: settings.powerPreference,
              localClippingEnabled: true,
              failIfMajorPerformanceCaveat: true
            }}
            dpr={settings.dpr}
            shadows={settings.shadows}
          >
            <color attach="background" args={['#fafafa']} />
            <fog attach="fog" args={['#fafafa', 15, 50]} />

            {/* Scale performance down if fps drops */}
            <PerformanceMonitor
              onDecline={() => downgradeTier()}
              flipflops={3}
              onFallback={() => downgradeTier()}
            />

            <Suspense fallback={null}>
              <Experience
                isLoaded={isLoaded}
                onSceneReady={handleSceneReady}
                performanceTier={tier} // Pass tier to Experience
              />
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

export default function App() {
  return (
    <PerformanceProvider>
      <AppContent />
    </PerformanceProvider>
  );
}
