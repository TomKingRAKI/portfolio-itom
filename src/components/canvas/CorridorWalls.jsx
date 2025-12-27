import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * CorridorWalls Component
 * 
 * Just the walls/floor/ceiling for a corridor segment.
 * Separated so we can reuse in segments.
 */
const CorridorWalls = ({ zStart = 10, length = 80 }) => {
    const corridorWidth = 4;
    const corridorHeight = 3.5;

    // Center of this segment's corridor
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

            {/* Vertical accent lines */}
            <WallLines corridorWidth={corridorWidth} corridorHeight={corridorHeight} zStart={zStart} length={length} />
        </group>
    );
};

/**
 * Vertical decorative lines on walls
 */
const WallLines = ({ corridorWidth, corridorHeight, zStart, length }) => {
    const lines = useMemo(() => {
        const result = [];
        for (let z = zStart - 10; z > zStart - length + 5; z -= 15) {
            result.push(z);
        }
        return result;
    }, [zStart, length]);

    return (
        <group>
            {lines.map((z, i) => (
                <group key={i}>
                    <mesh position={[-corridorWidth / 2 + 0.01, 0, z]}>
                        <planeGeometry args={[0.012, corridorHeight * 0.6]} />
                        <meshBasicMaterial color="#e5e5e5" side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[corridorWidth / 2 - 0.01, 0, z]}>
                        <planeGeometry args={[0.012, corridorHeight * 0.6]} />
                        <meshBasicMaterial color="#e5e5e5" side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

export default CorridorWalls;
