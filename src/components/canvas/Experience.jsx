import { useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import InfiniteCorridorManager from './InfiniteCorridorManager';
import EntranceDoors from './EntranceDoors';
import EmptyCorridor from './EmptyCorridor';
import useInfiniteCamera from '../../hooks/useInfiniteCamera';

// Positioning:
// - Segment -1's SegmentDoors are at Z=15
// - Entrance doors at Z=22 (in front of segment doors)
// - ITOM/Avatar at Z≈5.5
// - Camera starts at Z=28, ends at Z=8 (in front of avatar)
const ENTRANCE_DOORS_Z = 22;

/**
 * Experience Component
 * 
 * Flow:
 * 1. Preloader fades out -> user sees 3D entrance doors
 * 2. Click doors -> they open + camera flies through
 * 3. Behind doors: infinite corridor with ITOM
 */
const Experience = ({ isLoaded }) => {
    const [hasEntered, setHasEntered] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [cameraZ, setCameraZ] = useState(28);
    const { camera } = useThree();

    // Camera control - only works after entering
    useInfiniteCamera({
        segmentLength: 80,
        scrollSpeed: 0.025,
        parallaxIntensity: 0.4,
        smoothing: 0.06,
        enabled: hasEntered
    });

    // Track camera Z for EmptyCorridor
    useFrame(() => {
        setCameraZ(camera.position.z);
    });

    // Handle entrance complete
    const handleEntranceComplete = useCallback(() => {
        setHasEntered(true);
    }, []);

    // Handle door enter from inside corridor
    const handleDoorEnter = useCallback((doorId) => {
        setCurrentRoom(doorId);
        console.log('Entering:', doorId);
    }, []);

    return (
        <>
            {/* === GLOBAL LIGHTING === */}
            <ambientLight intensity={2.2} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} color="#ffffff" />
            <directionalLight position={[-5, 8, -10]} intensity={0.4} color="#ffffff" />

            {/* === EMPTY CORRIDOR (provides context during entrance) === */}
            {!hasEntered && (
                <EmptyCorridor cameraZ={cameraZ} />
            )}

            {/* === ENTRANCE DOORS (visible until entered) === */}
            {!hasEntered && (
                <EntranceDoors
                    position={[0, 0, ENTRANCE_DOORS_Z]}
                    onComplete={handleEntranceComplete}
                />
            )}

            {/* === INFINITE CORRIDOR (segment -1 SegmentDoors hidden during entrance) === */}
            <InfiniteCorridorManager
                onDoorEnter={handleDoorEnter}
                hideDoorsForSegments={hasEntered ? [] : [-1]} // Hide segment -1's doors until entered
            />
        </>
    );
};

export default Experience;
