import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Tunnel Component
 * 
 * Creates an infinite tunnel effect using an inverted cylinder
 * with a paper texture. Fades into white fog at the end.
 */
const Tunnel = ({ parallax = { x: 0, y: 0 } }) => {
    const meshRef = useRef();

    // Load paper texture
    const paperTexture = useTexture('/textures/paper-texture.png');

    // Configure texture for tiling
    useMemo(() => {
        paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping;
        paperTexture.repeat.set(3, 6);
        paperTexture.colorSpace = THREE.SRGBColorSpace;
    }, [paperTexture]);

    // Animate tunnel rotation based on parallax
    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Subtle rotation based on mouse parallax
        const targetRotationZ = parallax.x * 0.08;
        const targetRotationX = Math.PI / 2 + parallax.y * 0.04;

        // Smooth interpolation
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
            meshRef.current.rotation.z,
            targetRotationZ,
            delta * 2
        );
        meshRef.current.rotation.x = THREE.MathUtils.lerp(
            meshRef.current.rotation.x,
            targetRotationX,
            delta * 2
        );
    });

    return (
        <mesh
            ref={meshRef}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, -15]}
        >
            <cylinderGeometry args={[10, 10, 40, 64, 1, true]} />
            <meshStandardMaterial
                map={paperTexture}
                side={THREE.BackSide}
                roughness={1}
                metalness={0}
                color="#ffffff"
            />
        </mesh>
    );
};

export default Tunnel;
