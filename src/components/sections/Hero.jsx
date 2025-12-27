import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

import Experience from '../canvas/Experience';

/**
 * Hero Section - 3D Canvas Experience
 * 
 * The landing section with avatar, text, and interactive 3D scene.
 */
const Hero = ({ isRevealed }) => {
    return (
        <section id="hero" className="hero">
            <div className="hero__canvas">
                <Canvas
                    camera={{
                        position: [0, 0.2, 6],
                        fov: 50,
                        near: 0.1,
                        far: 50
                    }}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance'
                    }}
                    dpr={[1, 2]}
                >
                    <color attach="background" args={['#fefefe']} />
                    <fog attach="fog" args={['#fefefe', 8, 20]} />

                    <Suspense fallback={null}>
                        <Experience isRevealed={isRevealed} />
                    </Suspense>
                </Canvas>
            </div>

            {/* Scroll indicator removed - consolidated into 3D arrow */}
        </section>
    );
};

export default Hero;
