import { useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';

import InfiniteCorridorManager from './InfiniteCorridorManager';
import EmptyCorridor from './EmptyCorridor';
import EntranceDoors from './EntranceDoors';
import useInfiniteCamera from '../../hooks/useInfiniteCamera';

/**
 * Experience Component
 * 
 * KEY FIX: Always render InfiniteCorridorManager to avoid white flashes.
 * Entrance doors + back wall physically block the view until opened.
 */
const Experience = ({
    loadingPhase = 'loading',
    onEnterComplete,
    onReachDoors,
    onStartEntering
}) => {
    const [currentRoom, setCurrentRoom] = useState(null);
    const [cameraZ, setCameraZ] = useState(60);
    const { camera } = useThree();

    // Unified camera control
    const {
        getCameraZ,
        setTargetZ,
        ENTRANCE_DOORS_Z,
        CAMERA_AFTER_DOORS_Z
    } = useInfiniteCamera({
        segmentLength: 80,
        scrollSpeed: 0.025,
        parallaxIntensity: 0.4,
        smoothing: 0.06,
        loadingPhase,
        onReachDoors
    });

    // Track camera Z
    useFrame(() => {
        setCameraZ(getCameraZ());
    });

    // Handle door click - animate walking through
    const handleDoorClick = useCallback(() => {
        // Change phase to entering
        onStartEntering?.();

        // Animate walking through doors
        gsap.to({ z: getCameraZ() }, {
            z: CAMERA_AFTER_DOORS_Z,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: function () {
                setTargetZ(this.targets()[0].z);
            },
            onComplete: () => {
                onEnterComplete?.();
            }
        });
    }, [getCameraZ, setTargetZ, CAMERA_AFTER_DOORS_Z, onEnterComplete, onStartEntering]);

    // Handle door enter from inside corridor
    const handleDoorEnter = useCallback((doorId) => {
        setCurrentRoom(doorId);
    }, []);

    // Check if we should show entrance area elements
    const showEntranceArea = loadingPhase !== 'ready';

    return (
        <>
            {/* === GLOBAL LIGHTING === */}
            <ambientLight intensity={2.2} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} color="#ffffff" />
            <directionalLight position={[-5, 8, -10]} intensity={0.4} color="#ffffff" />

            {/* === EMPTY CORRIDOR (only during entrance phases) === */}
            {showEntranceArea && (
                <EmptyCorridor cameraZ={cameraZ} />
            )}

            {/* === ENTRANCE DOORS (blocks view until opened) === */}
            {showEntranceArea && (
                <EntranceDoors
                    position={[0, 0, ENTRANCE_DOORS_Z]}
                    onDoorClick={handleDoorClick}
                    canClick={loadingPhase === 'doors'}
                />
            )}

            {/* === MAIN CONTENT (ALWAYS rendered, entrance doors block view) === */}
            <InfiniteCorridorManager onDoorEnter={handleDoorEnter} />
        </>
    );
};

export default Experience;
