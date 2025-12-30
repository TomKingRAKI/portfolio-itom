import { useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import CorridorSegment, { SEGMENT_LENGTH } from './CorridorSegment';

/**
 * InfiniteCorridorManager Component
 * 
 * Manages dynamic generation/removal of corridor segments.
 * 
 * hideDoorsForSegments: Array of segment indices that should hide their SegmentDoors
 * (used during entrance to avoid duplicate doors while keeping content preloaded)
 */
const InfiniteCorridorManager = ({
    onDoorEnter,
    hideDoorsForSegments = [], // Segments that should hide their SegmentDoors
    clipSegmentNeg1 = false // Whether to clip segment -1 at EntranceDoors
}) => {
    const { camera } = useThree();
    const [activeSegments, setActiveSegments] = useState([0]);

    // Calculate which segment the camera is in
    const getSegmentFromZ = useCallback((z) => {
        return Math.floor((10 - z) / SEGMENT_LENGTH);
    }, []);

    // Update active segments based on camera position
    useFrame(() => {
        const currentSegment = getSegmentFromZ(camera.position.z);

        // Always render segments around camera (prev, current, next)
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
                    hideSegmentDoors={hideDoorsForSegments.includes(segmentIndex)}
                    zClip={clipSegmentNeg1 && segmentIndex === -1 ? 22 : 100000}
                />
            ))}
        </group>
    );
};

export default InfiniteCorridorManager;
