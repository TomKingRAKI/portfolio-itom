import { useState, useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import InfiniteCorridorManager from './corridor/InfiniteCorridorManager';
import EntranceDoors from './entrance/EntranceDoors';
import EmptyCorridor from './entrance/EmptyCorridor';
import TeleportRoom from './corridor/TeleportRoom';
import useInfiniteCamera from '../../hooks/useInfiniteCamera';
import SignSystem from './entrance/SignSystem';
import { useScene } from '../../context/SceneContext';

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
const Experience = ({ isLoaded, onSceneReady, performanceTier }) => {
    // Use SceneContext for room state
    const { hasEntered, markEntered, enterRoom, isTeleporting, isInRoom, pendingDoorClick } = useScene();

    const { camera } = useThree();

    // Signal ready on mount (after texture load + initial render)
    useEffect(() => {
        onSceneReady?.();
    }, [onSceneReady]);

    // Camera control - both scroll and parallax only work after entering
    // Disable during teleporting to prevent scroll interference
    const { setCameraOverride } = useInfiniteCamera({
        segmentLength: 80,
        scrollSpeed: 0.025,
        parallaxIntensity: 0.4,
        smoothing: 0.06,
        scrollEnabled: hasEntered && !isTeleporting && !isInRoom,
        parallaxEnabled: hasEntered && !isTeleporting && !isInRoom
    });

    // Enable camera override during teleportation, when in a room, OR when a door click is pending
    // This prevents the corridor camera hook from interfering during transitions
    useEffect(() => {
        if (isTeleporting || isInRoom || pendingDoorClick) {
            setCameraOverride(true);
        } else {
            setCameraOverride(false);
        }
    }, [isTeleporting, isInRoom, pendingDoorClick, setCameraOverride]);


    // Handle entrance complete
    const handleEntranceComplete = useCallback(() => {
        markEntered();
    }, [markEntered]);

    // Handle door enter from inside corridor
    const handleDoorEnter = useCallback((doorId) => {
        enterRoom(doorId);
        console.log('Entering:', doorId);
    }, [enterRoom]);

    // Optimization: Low tier has simpler lighting
    const isLowTier = performanceTier === 'LOW';

    return (
        <>
            {/* === GLOBAL LIGHTING === */}
            <ambientLight intensity={isLowTier ? 2.5 : 2.2} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={0.8}
                color="#ffffff"
                castShadow={!isLowTier}
                shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-5, 8, -10]} intensity={0.4} color="#ffffff" />

            {/* === EMPTY CORRIDOR (provides context during entrance) === */}
            {!hasEntered && (
                <EmptyCorridor camera={camera} />
            )}

            {/* === ENTRANCE DOORS (visible until entered) === */}
            {!hasEntered && (
                <EntranceDoors
                    position={[0, 0, ENTRANCE_DOORS_Z]}
                    onComplete={handleEntranceComplete}
                />
            )}

            {/* Separate SignSystem to avoid fragment nesting issues if any */}
            {!hasEntered && (
                <SignSystem position={[0, 0, ENTRANCE_DOORS_Z]} />
            )}

            {/* === INFINITE CORRIDOR (segment -1 SegmentDoors hidden during entrance) === */}
            <InfiniteCorridorManager
                onDoorEnter={handleDoorEnter}
                hideDoorsForSegments={hasEntered ? [] : [-1]} // Hide segment -1's doors until entered
                clipSegmentNeg1={!hasEntered} // Clip segment -1 visualization until entered
                setCameraOverride={setCameraOverride}
            />

            {/* === TELEPORT ROOM (renders room directly during teleportation) === */}
            <TeleportRoom />
        </>
    );
};

export default Experience;
