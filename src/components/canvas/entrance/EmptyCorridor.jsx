import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * EmptyCorridor Component
 * 
 * Simple corridor walls for loading phase.
 * No doors, no decorations, no ITOM - just the corridor structure.
 * Used during preloader auto-scroll.
 */
const EmptyCorridor = ({ cameraZ = 10 }) => {
    const corridorWidth = 15; // Wide floor
    const corridorHeight = 3.5; // Standard height for floor level calculation

    // Load floor texture
    const floorTexture = useTexture('/textures/entrance/floor_paper.webp');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 20); // Adjust repeat to match aspect ratio (2816x1536)

    // Generate corridor segments around camera
    const segments = useMemo(() => {
        const segmentLength = 40;
        const result = [];

        // Generate 5 segments around current camera position
        const baseZ = Math.floor(cameraZ / segmentLength) * segmentLength;
        for (let i = -2; i <= 2; i++) {
            result.push(baseZ + i * segmentLength);
        }
        return result;
    }, [Math.floor(cameraZ / 40)]);

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
            <mesh
                position={[0, -corridorHeight / 2, zCenter]}
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
