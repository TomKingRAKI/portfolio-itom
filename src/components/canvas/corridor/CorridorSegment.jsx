import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import CorridorWalls from './CorridorWalls';
import DoorSection from './DoorSection';
import SegmentDoors from './SegmentDoors';
import Avatar from './Avatar';
import HeroText from './HeroText';
import Doodles from '../decorations/Doodles';

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

// Sawtooth Geometry Constants (Shared with CorridorWalls logic conceptually)
const WALL_X_OUTER = 3.5;
const WALL_X_INNER = 1.7;
const DOOR_Z_SPAN = 4;
// Angle of the wall relative to the corridor axis
const WALL_ANGLE = Math.atan2(WALL_X_OUTER - WALL_X_INNER, DOOR_Z_SPAN);

const CorridorSegment = ({
    segmentIndex = 0,
    onDoorEnter,
    hideSegmentDoors = false, // Hide only SegmentDoors while keeping content preloaded
    zClip = 100000 // Clipping plane (render everything with Z < zClip)
}) => {
    // Calculate Z offset based on segment index
    // Segment 0 starts at Z=10, goes to Z=-70
    const zOffset = 10 - (segmentIndex * SEGMENT_LENGTH);

    // Door positions within this segment (relative to segment start)
    const doors = useMemo(() => {
        const doorDefs = [
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
        ];

        return doorDefs.map(def => {
            // Calculate adjusted Position and Rotation for Sawtooth Walls
            const xBase = (WALL_X_OUTER + WALL_X_INNER) / 2; // Midpoint of the angled wall
            const xPos = def.side === 'left' ? -xBase : xBase;

            // Rotation:
            // Left Wall: Normal was (1,0,0) [RotY 90]. Now angle it towards camera (+Z).
            // Rotate Clockwise by WALL_ANGLE.
            // Right Wall: Normal was (-1,0,0) [RotY -90]. Angle towards camera (+Z).
            // Rotate Counter-Clockwise by WALL_ANGLE.

            const baseRot = def.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
            const rotOffset = def.side === 'left' ? -WALL_ANGLE : WALL_ANGLE;

            return {
                ...def,
                x: xPos,
                rotation: baseRot + rotOffset
            };
        });
    }, [segmentIndex]);

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
            {/* Pass door positions so walls can generate gaps/angles correctly */}
            <CorridorWalls
                zStart={zOffset}
                length={SEGMENT_LENGTH}
                doorPositions={doors}
                zClip={zClip}
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

            {/* === DOOR SECTIONS (wall + door + label as one unit) === */}
            {/* Hidden during entrance animation for segment -1 */}
            {!hideSegmentDoors && doors.map((door) => (
                <DoorSection
                    key={door.id}
                    position={[
                        door.x,
                        0,
                        zOffset + door.relativeZ + 2
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

            {/* === LIGHTING === */}
            <pointLight
                position={[0, 1.5, zOffset - 5]}
                intensity={0.6}
                color="#fffaf0"
                distance={15}
            />

            {/* === SEGMENT END DOORS (hidden during entrance) === */}
            {!hideSegmentDoors && (
                <SegmentDoors
                    position={[0, 0, zOffset - SEGMENT_LENGTH + 5]}
                    corridorHeight={3.5}
                />
            )}
        </group>
    );
};

export { SEGMENT_LENGTH, WALL_X_OUTER, WALL_X_INNER, DOOR_Z_SPAN };
export default CorridorSegment;
