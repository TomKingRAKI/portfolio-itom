import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Avatar Component - Hand-drawn character
 * 
 * Main character with proper proportions and subtle idle animation.
 */
const Avatar = ({ position = [0, -0.4, 2] }) => {
    const meshRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 2.4, height: 3.0 });

    // Load avatar texture
    const texture = useTexture('/images/avatar-thinking.png');
    texture.colorSpace = THREE.SRGBColorSpace;

    // Calculate proper aspect ratio
    useEffect(() => {
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const baseHeight = window.innerWidth < 768 ? 2.2 : 3.0;
            setDimensions({
                width: baseHeight * aspectRatio,
                height: baseHeight
            });
        }
    }, [texture]);

    // Responsive sizing
    useEffect(() => {
        const handleResize = () => {
            if (texture.image) {
                const aspectRatio = texture.image.width / texture.image.height;
                const baseHeight = window.innerWidth < 768 ? 2.0 : 3.0;
                setDimensions({
                    width: baseHeight * aspectRatio,
                    height: baseHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [texture]);

    // Subtle idle animation - breathing/swaying
    useFrame((state) => {
        if (meshRef.current) {
            // Gentle sway
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.015;
            // Subtle breathing (scale)
            const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.008;
            meshRef.current.scale.y = breathe;
        }
    });

    // Billboard - always face camera
    useFrame(({ camera }) => {
        if (meshRef.current) {
            meshRef.current.lookAt(camera.position);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={[dimensions.width, dimensions.height]} />
            <meshBasicMaterial
                map={texture}
                transparent={true}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

export default Avatar;
