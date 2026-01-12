import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SkyChunk, { CHUNK_LENGTH } from './SkyChunk';

/**
 * InfiniteSkyManager Component
 * 
 * Manages dynamic generation/removal of sky chunks for infinite scroll.
 * World group moves with scroll, chunks stay at fixed positions relative to group.
 */
const InfiniteSkyManager = ({ scrollProgress = 0 }) => {
    const [activeChunks, setActiveChunks] = useState([0, 1, 2, 3]); // 4 chunks for buffer
    const worldRef = useRef();

    // Track current chunk for recycling
    const getCurrentChunk = (worldZ) => {
        return Math.floor(worldZ / CHUNK_LENGTH);
    };

    // Update chunks based on world position
    useFrame(() => {
        if (!worldRef.current) return;

        // Move world directly (momentum is handled in parent)
        worldRef.current.position.z = scrollProgress;

        // Figure out which chunk we're in
        const currentChunk = getCurrentChunk(scrollProgress);

        // Keep chunks ahead of and behind current position
        // -1, 0, +1, +2 relative to current
        const shouldBeActive = [
            currentChunk - 1,
            currentChunk,
            currentChunk + 1,
            currentChunk + 2,
        ];

        const needsUpdate = shouldBeActive.some(c => !activeChunks.includes(c)) ||
            activeChunks.some(c => !shouldBeActive.includes(c));

        if (needsUpdate) {
            setActiveChunks(shouldBeActive);
        }
    });

    return (
        <group ref={worldRef}>
            {activeChunks.map((chunkIndex) => (
                <SkyChunk
                    key={`sky-chunk-${chunkIndex}`}
                    chunkIndex={chunkIndex}
                    seed={42}
                />
            ))}
        </group>
    );
};

export default InfiniteSkyManager;
