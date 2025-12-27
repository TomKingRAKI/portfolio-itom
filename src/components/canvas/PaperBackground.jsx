import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * PaperBackground Component
 * 
 * Creates a hand-drawn sketchbook feel with paper texture.
 * Simple planes arranged to create depth.
 */
const PaperBackground = () => {
    // Load paper texture
    const paperTexture = useTexture('/textures/paper-texture.png');

    useMemo(() => {
        paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping;
        paperTexture.repeat.set(2, 2);
        paperTexture.colorSpace = THREE.SRGBColorSpace;
    }, [paperTexture]);

    return (
        <group>
            {/* Main background plane - far back */}
            <mesh position={[0, 0, -8]}>
                <planeGeometry args={[25, 18]} />
                <meshStandardMaterial
                    map={paperTexture}
                    color="#fafafa"
                    roughness={1}
                    metalness={0}
                />
            </mesh>

            {/* Floor plane with grid effect */}
            <mesh position={[0, -2.5, -2]} rotation={[-Math.PI / 2.5, 0, 0]}>
                <planeGeometry args={[20, 15]} />
                <meshStandardMaterial
                    color="#f5f5f5"
                    roughness={1}
                    metalness={0}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Grid lines on floor for perspective */}
            <GridLines />

            {/* Subtle vignette corners using planes */}
            <VignetteCorners />
        </group>
    );
};

/**
 * Perspective grid lines - notebook style
 */
const GridLines = () => {
    const lines = useMemo(() => {
        const result = [];
        // Horizontal lines
        for (let i = -5; i <= 5; i++) {
            result.push({
                position: [0, -2.5 + i * 0.02, -2 - i * 0.8],
                width: 15,
                opacity: 0.15 - Math.abs(i) * 0.01
            });
        }
        return result;
    }, []);

    return (
        <group>
            {lines.map((line, i) => (
                <mesh
                    key={i}
                    position={line.position}
                    rotation={[-Math.PI / 2.5, 0, 0]}
                >
                    <planeGeometry args={[line.width, 0.01]} />
                    <meshBasicMaterial
                        color="#cccccc"
                        transparent
                        opacity={line.opacity}
                    />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Subtle vignette effect using corner shadows
 */
const VignetteCorners = () => {
    return (
        <group>
            {/* Top corners */}
            <mesh position={[-6, 4, 0]}>
                <circleGeometry args={[3, 32]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.03}
                />
            </mesh>
            <mesh position={[6, 4, 0]}>
                <circleGeometry args={[3, 32]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.03}
                />
            </mesh>
        </group>
    );
};

export default PaperBackground;
