import { useState, Suspense, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, useTexture, Text } from '@react-three/drei';

import Preloader from './components/dom/Preloader';
import Experience from './components/canvas/Experience';

import './styles/main.scss';

// Preload textures so they load during preloader phase
useTexture.preload('/images/avatar-thinking.png');
useTexture.preload('/textures/paper-texture.png');

const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

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
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#fafafa']} />
          <fog attach="fog" args={['#fafafa', 15, 50]} />

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
