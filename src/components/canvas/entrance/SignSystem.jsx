import { useRef, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SignSystem = (props) => {
    const groupRef = useRef();
    const signTexture = useTexture('/textures/entrance/sign.webp');
    const mountTexture = useTexture('/textures/entrance/belka.webp');

    // Physics parameters
    const timeOffset = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        if (groupRef.current) {
            // Simple wind sway (idle animation only)
            const time = state.clock.elapsedTime + timeOffset;
            const windSway = Math.sin(time * 2) * 0.05; // Gentle constant sway

            groupRef.current.rotation.x = windSway;
            groupRef.current.rotation.y = 0;
        }
    });

    return (
        <group {...props}>
            {/* 1. THE MOUNT (Visual Anchor) */}
            {/* Texture is horizontal, so we use Width=3.5, Height=0.4 (approx aspect ratio) */}
            {/* No rotation needed as the texture is already horizontal */}
            <mesh position={[-0.05, 2.05, 0.65]}>
                <planeGeometry args={[2.7, 0.4]} />
                <meshBasicMaterial map={mountTexture} transparent={true} side={THREE.DoubleSide} />
            </mesh>

            {/* 2. THE SIGN (SignGroup) */}
            {/* Positioned exactly at the center of the mounting bar */}
            <group
                ref={groupRef}
                position={[0, 1.9, 0.60]}
            >
                {/* 3. THE PIVOT FIX */}
                {/* Translate geometry DOWN so the top edge (where chains are) is at (0,0,0) of the group */}
                <mesh
                    position={[0, -0.5, 0]} // Moving down by half height (assuming height ~1)
                >
                    {/* Width 2.6 (Narrower), Height 1 */}
                    <planeGeometry args={[2, 1]} />
                    <meshBasicMaterial
                        map={signTexture}
                        transparent={true}
                        side={THREE.DoubleSide}
                        depthWrite={false} // Fix for seeing objects behind transparent parts
                    />
                </mesh>
            </group>
        </group>
    );
};

export default SignSystem;
