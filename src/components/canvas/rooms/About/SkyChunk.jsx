import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * SkyChunk Component
 * 
 * A single repeatable segment of sky with clouds.
 * Similar to CorridorSegment but for the About room flight experience.
 * 
 * Each chunk contains clouds at random positions.
 * Chunks recycle as player scrolls forward.
 */
const CHUNK_LENGTH = 40; // Length of each sky chunk
const CHUNK_WIDTH = 20;  // Width of the sky area
const CHUNK_HEIGHT = 12; // Height of the sky area

const SkyChunk = ({ chunkIndex = 0, seed = 0 }) => {
    // Calculate Z position based on chunk index
    // Chunks are placed ahead of the airplane (negative Z)
    const zOffset = -(chunkIndex * CHUNK_LENGTH) - 15; // Start 15 units ahead

    // Generate clouds with deterministic randomness based on seed + chunkIndex
    const clouds = useMemo(() => {
        const items = [];
        const random = seededRandom(seed + chunkIndex * 1000);

        const cloudCount = 6 + Math.floor(random() * 4); // 6-9 clouds per chunk

        for (let i = 0; i < cloudCount; i++) {
            // Spread clouds across the chunk
            const x = (random() - 0.5) * CHUNK_WIDTH;
            const y = (random() - 0.5) * CHUNK_HEIGHT;
            const z = zOffset - (random() * CHUNK_LENGTH);

            items.push({
                id: `${chunkIndex}-${i}`,
                position: [x, y, z],
                scale: 0.8 + random() * 1.5,
                opacity: 0.5 + random() * 0.4,
            });
        }

        return items;
    }, [chunkIndex, seed, zOffset]);

    return (
        <group>
            {clouds.map((cloud) => (
                <Cloud
                    key={cloud.id}
                    position={cloud.position}
                    scale={cloud.scale}
                    opacity={cloud.opacity}
                />
            ))}

            {/* Debug: Chunk boundary marker (can remove later) */}
            <mesh position={[0, 0, zOffset]}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshBasicMaterial color="#ff0000" opacity={0.3} transparent />
            </mesh>
        </group>
    );
};

// Simple cloud component (placeholder - will be styled later)
const Cloud = ({ position, scale, opacity }) => (
    <group position={position} scale={scale}>
        {/* Main cloud body - cluster of spheres */}
        <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
                color="#ffffff"
                opacity={opacity}
                transparent
            />
        </mesh>
        <mesh position={[-0.7, -0.2, 0.1]}>
            <sphereGeometry args={[0.7, 8, 8]} />
            <meshStandardMaterial
                color="#ffffff"
                opacity={opacity}
                transparent
            />
        </mesh>
        <mesh position={[0.6, -0.1, -0.2]}>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial
                color="#ffffff"
                opacity={opacity}
                transparent
            />
        </mesh>
    </group>
);

// Seeded random number generator for deterministic cloud placement
function seededRandom(seed) {
    let s = seed;
    return function () {
        s = Math.sin(s * 9999) * 10000;
        return s - Math.floor(s);
    };
}

export { CHUNK_LENGTH };
export default SkyChunk;
