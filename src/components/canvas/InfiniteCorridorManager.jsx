import { useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import CorridorSegment, { SEGMENT_LENGTH } from './CorridorSegment';

/**
 * InfiniteCorridorManager Component
 * 
 * Manages dynamic generation/removal of corridor segments.
 * Keeps 3 segments active at any time (prev, current, next).
 * Works in both directions for true infinite scrolling.
 */
const InfiniteCorridorManager = ({ onDoorEnter }) => {
    const { camera } = useThree();
    const [activeSegments, setActiveSegments] = useState([0]);

    // Calculate which segment the camera is in
    const getSegmentFromZ = useCallback((z) => {
        // Segment 0 starts at Z=10
        // Each segment is SEGMENT_LENGTH units
        return Math.floor((10 - z) / SEGMENT_LENGTH);
    }, []);

    // Update active segments based on camera position
    useFrame(() => {
        const currentSegment = getSegmentFromZ(camera.position.z);

        // Define which segments should be active (prev, current, next)
        const shouldBeActive = [
            currentSegment - 1,
            currentSegment,
            currentSegment + 1
        ];

        // Check if we need to update
        const needsUpdate = shouldBeActive.some(seg => !activeSegments.includes(seg)) ||
            activeSegments.some(seg => !shouldBeActive.includes(seg));

        if (needsUpdate) {
            setActiveSegments(shouldBeActive);
        }
    });

    return (
        <group>
            {activeSegments.map((segmentIndex) => (
                <CorridorSegment
                    key={`segment-${segmentIndex}`}
                    segmentIndex={segmentIndex}
                    onDoorEnter={onDoorEnter}
                />
            ))}
        </group>
    );
};

export default InfiniteCorridorManager;
