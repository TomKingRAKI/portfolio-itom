import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * EmptyCorridor Component
 * 
 * Simple corridor walls for loading phase.
 * No doors, no decorations, no ITOM - just the corridor structure.
 * Used during preloader auto-scroll.
 */
const EmptyCorridor = ({ cameraZ = 10 }) => {
    const corridorWidth = 4;
    const corridorHeight = 3.5;

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
                />
            ))}
        </group>
    );
};

/**
 * Single empty corridor segment
 */
const CorridorSegmentEmpty = ({ zStart, corridorWidth, corridorHeight }) => {
    const length = 40;
    const zCenter = zStart - length / 2;

    return (
        <group>
            {/* Floor */}
            <mesh
                position={[0, -corridorHeight / 2, zCenter]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[corridorWidth, length]} />
                <meshStandardMaterial color="#f5f2eb" roughness={1} metalness={0} />
            </mesh>

            {/* Floor grid */}
            <gridHelper
                args={[length, length * 2, '#d5d5d5', '#e8e8e8']}
                position={[0, -corridorHeight / 2 + 0.01, zCenter]}
                rotation={[0, Math.PI / 2, 0]}
            />

            {/* Ceiling */}
            <mesh
                position={[0, corridorHeight / 2, zCenter]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[corridorWidth, length]} />
                <meshStandardMaterial color="#fefefe" roughness={1} />
            </mesh>

            {/* Left Wall */}
            <mesh
                position={[-corridorWidth / 2, 0, zCenter]}
                rotation={[0, Math.PI / 2, 0]}
            >
                <planeGeometry args={[length, corridorHeight]} />
                <meshStandardMaterial color="#faf8f5" roughness={1} />
            </mesh>

            {/* Right Wall */}
            <mesh
                position={[corridorWidth / 2, 0, zCenter]}
                rotation={[0, -Math.PI / 2, 0]}
            >
                <planeGeometry args={[length, corridorHeight]} />
                <meshStandardMaterial color="#faf8f5" roughness={1} />
            </mesh>

            {/* Baseboard */}
            <mesh position={[-corridorWidth / 2 + 0.01, -corridorHeight / 2 + 0.08, zCenter]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.06]} />
                <meshBasicMaterial color="#ddd" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[corridorWidth / 2 - 0.01, -corridorHeight / 2 + 0.08, zCenter]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.06]} />
                <meshBasicMaterial color="#ddd" side={THREE.DoubleSide} />
            </mesh>

            {/* Crown molding */}
            <mesh position={[-corridorWidth / 2 + 0.01, corridorHeight / 2 - 0.05, zCenter]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.04]} />
                <meshBasicMaterial color="#eee" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[corridorWidth / 2 - 0.01, corridorHeight / 2 - 0.05, zCenter]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.04]} />
                <meshBasicMaterial color="#eee" side={THREE.DoubleSide} />
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
