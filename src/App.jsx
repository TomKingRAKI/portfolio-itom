import { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, useTexture, Text } from '@react-three/drei';

import Preloader from './components/dom/Preloader';
import Experience from './components/canvas/Experience';

import './styles/main.scss';

// Preload textures so they load during preloader phase
useTexture.preload('/images/avatar-thinking.png');
useTexture.preload('/textures/paper-texture.png');

const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

/**
 * App Component - ITom's Creative House
 * 
 * Flow:
 * 1. 2D Preloader shows while loading
 * 2. Preloader fades -> 3D entrance doors visible
 * 3. Click doors -> fly through -> corridor experience
 */
function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="app">
      {/* Full screen 3D Canvas */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{
            position: [0, 0.2, 28], // Start in front of entrance doors at Z=22
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
            <Experience isLoaded={isLoaded} />
            {/* Force font load */}
            <Text font={FONT_URL} visible={false}>preload</Text>
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {isLoaded && (
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

      {/* 2D Preloader */}
      <Preloader onComplete={() => setIsLoaded(true)} />
    </div>
  );
}

export default App;
