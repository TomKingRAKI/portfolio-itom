import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import CorridorWalls from './CorridorWalls';
import Door from './Door';
import SegmentDoors from './SegmentDoors';
import Avatar from './Avatar';
import HeroText from './HeroText';
import Doodles from './Doodles';

/**
 * CorridorSegment Component
 * 
 * A single repeatable chunk of the infinite corridor.
 * Each segment contains: walls, avatar, ITOM text, doors, decorations.
 * 
 * Segment length: 80 units
 * Positioned based on segmentIndex * segmentLength
 */
const SEGMENT_LENGTH = 80;

const CorridorSegment = ({
    segmentIndex = 0,
    onDoorEnter
}) => {
    // Calculate Z offset based on segment index
    // Segment 0 starts at Z=10, goes to Z=-70
    // Segment 1 starts at Z=-70, goes to Z=-150
    // Segment -1 starts at Z=90, goes to Z=10
    const zOffset = 10 - (segmentIndex * SEGMENT_LENGTH);

    // Door positions within this segment (relative to segment start)
    const doors = useMemo(() => [
        {
            id: `gallery-${segmentIndex}`,
            relativeZ: -18,
            side: 'left',
            label: 'THE GALLERY',
            icon: '◈',
            color: '#f5efe6'
        },
        {
            id: `studio-${segmentIndex}`,
            relativeZ: -32,
            side: 'right',
            label: 'THE STUDIO',
            icon: '▶',
            color: '#e6f5ef'
        },
        {
            id: `diary-${segmentIndex}`,
            relativeZ: -48,
            side: 'left',
            label: 'DEV DIARY',
            icon: '✎',
            color: '#efe6f5'
        },
        {
            id: `connect-${segmentIndex}`,
            relativeZ: -62,
            side: 'right',
            label: "LET'S CONNECT",
            icon: '✉',
            color: '#f5e6e6'
        },
    ], [segmentIndex]);

    // Decorations
    const decorations = useMemo(() => [
        { relZ: -5, x: 1.5, y: 1 },
        { relZ: -25, x: -1.2, y: 0.8 },
        { relZ: -40, x: 1, y: 1.2 },
        { relZ: -55, x: -1.5, y: 0.5 },
    ], []);

    return (
        <group position={[0, 0, 0]}>
            {/* === CORRIDOR WALLS === */}
            <CorridorWalls
                zStart={zOffset}
                length={SEGMENT_LENGTH}
            />

            {/* === WELCOME AREA (Start of segment) === */}
            <group position={[0, 0, zOffset - 5]}>
                {/* ITOM Text */}
                <HeroText position={[0, 0.3, -0.5]} />

                {/* Avatar */}
                <Avatar position={[0, -0.4, 0.5]} />

                {/* Doodles around avatar */}
                <Doodles />

                {/* Segment number (debug - can remove later) */}
                <Text
                    position={[1.7, 1.4, 0]}
                    fontSize={0.12}
                    color="#ccc"
                    anchorX="center"
                >
                    #{segmentIndex}
                </Text>
            </group>

            {/* === DOORS === */}
            {doors.map((door) => (
                <Door
                    key={door.id}
                    position={[
                        door.side === 'left' ? -2 : 2,
                        -0.5,
                        zOffset + door.relativeZ
                    ]}
                    side={door.side}
                    label={door.label}
                    icon={door.icon}
                    color={door.color}
                    onEnter={() => onDoorEnter?.(door.id)}
                />
            ))}

            {/* === DECORATIONS === */}
            {decorations.map((dec, i) => (
                <mesh key={i} position={[dec.x, dec.y, zOffset + dec.relZ]}>
                    <octahedronGeometry args={[0.05, 0]} />
                    <meshBasicMaterial
                        color="#39FF14"
                        transparent
                        opacity={0.4}
                        wireframe
                    />
                </mesh>
            ))}

            {/* === LIGHTING for this segment === */}
            <pointLight
                position={[0, 1.5, zOffset - 5]}
                intensity={0.6}
                color="#fffaf0"
                distance={15}
            />
            {doors.map((door, i) => (
                <pointLight
                    key={`light-${i}`}
                    position={[door.side === 'left' ? -1.5 : 1.5, 1.5, zOffset + door.relativeZ]}
                    intensity={0.3}
                    color="#fffaf0"
                    distance={5}
                />
            ))}

            {/* === SEGMENT END DOORS (auto-open when approaching) === */}
            <SegmentDoors
                position={[0, 0, zOffset - SEGMENT_LENGTH + 5]}
                corridorHeight={3.5}
            />
        </group>
    );
};

export { SEGMENT_LENGTH };
export default CorridorSegment;
