import { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * EmptyCorridor Component
 * 
 * Simple corridor walls for loading phase.
 * No doors, no decorations, no ITOM - just the corridor structure.
 * Used during preloader auto-scroll.
 */
const EmptyCorridor = ({ camera }) => {
    const corridorWidth = 15; // Wide floor
    const corridorHeight = 3.5; // Standard height for floor level calculation
    const [segmentBase, setSegmentBase] = useState(0);

    // Load floor texture
    const floorTexture = useTexture('/textures/entrance/floor_paper.webp');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 20); // Adjust repeat to match aspect ratio (2816x1536)

    // Update segment base when camera moves to a new segment (not every frame)
    useFrame(() => {
        if (!camera) return;
        const segmentLength = 40;
        const newBase = Math.floor(camera.position.z / segmentLength) * segmentLength;
        if (newBase !== segmentBase) {
            setSegmentBase(newBase);
        }
    });

    // Generate corridor segments around camera
    const segments = useMemo(() => {
        const result = [];
        for (let i = -2; i <= 2; i++) {
            result.push(segmentBase + i * 40);
        }
        return result;
    }, [segmentBase]);

    return (
        <group>
            {segments.map((zStart) => (
                <CorridorSegmentEmpty
                    key={zStart}
                    zStart={zStart}
                    corridorWidth={corridorWidth}
                    corridorHeight={corridorHeight}
                    floorTexture={floorTexture}
                />
            ))}
        </group>
    );
};

/**
 * Single empty corridor segment
 */
const CorridorSegmentEmpty = ({ zStart, corridorWidth, corridorHeight, floorTexture }) => {
    const length = 40;
    const zCenter = zStart - length / 2;

    return (
        <group>
            {/* Floor with Paper Texture */}
            {/* Y position: -1.75 is floor level. Lower value = lower floor */}
            <mesh
                position={[0, -2, zCenter]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[corridorWidth, length]} />
                <meshStandardMaterial
                    map={floorTexture}
                    transparent={true}
                    alphaTest={0.1}
                    roughness={1}
                    metalness={0}
                    color="#ffffff" // Keep white base
                />
            </mesh>

            {/* Simple lighting */}
            <pointLight
                position={[0, 1.2, zCenter]}
                intensity={0.4}
                color="#fffaf0"
                distance={20}
            />
        </group>
    );
};

export default EmptyCorridor;
