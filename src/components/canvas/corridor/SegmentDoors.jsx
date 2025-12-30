import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * SegmentDoors Component
 * 
 * Double doors at the end of a corridor segment WITH full surrounding wall.
 * Position Y should be the FLOOR level (e.g., -1.75 for corridorHeight 3.5)
 */
const SegmentDoors = ({
    position = [0, 0, 0],
    corridorHeight = 3.5,
    corridorWidth = 7
}) => {
    const leftDoorRef = useRef();
    const rightDoorRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const { camera } = useThree();

    // Door dimensions - no gap between doors
    const doorWidth = 1.05;
    const doorOpeningWidth = doorWidth * 2; // No extra gap
    const doorHeight = 2.4;
    const wallThickness = 0.12;

    // Floor is at Y = -corridorHeight/2 = -1.75
    const floorY = -corridorHeight / 2;

    // Trigger distances
    const openDistance = 12;
    const closeDistance = 18;

    // Wall panel sizes
    const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;
    const topWallHeight = corridorHeight - doorHeight;

    // Check distance and animate doors
    useFrame(() => {
        if (!leftDoorRef.current || !rightDoorRef.current) return;

        const distance = Math.abs(camera.position.z - position[2]);

        if (distance < openDistance && !isOpen) {
            setIsOpen(true);
            gsap.to(leftDoorRef.current.rotation, { y: -Math.PI * 0.55, duration: 0.9, ease: 'power2.out' });
            gsap.to(rightDoorRef.current.rotation, { y: Math.PI * 0.55, duration: 0.9, ease: 'power2.out' });
        }

        if (distance > closeDistance && isOpen) {
            setIsOpen(false);
            gsap.to(leftDoorRef.current.rotation, { y: 0, duration: 0.7, ease: 'power2.in' });
            gsap.to(rightDoorRef.current.rotation, { y: 0, duration: 0.7, ease: 'power2.in' });
        }
    });

    // Y positions - doors sit on floor
    const doorBottomY = floorY;
    const doorCenterY = doorBottomY + doorHeight / 2;
    const wallCenterY = floorY + corridorHeight / 2; // Center of full wall
    const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;

    return (
        <group position={[position[0], 0, position[2]]}>
            {/* === LEFT WALL PANEL === */}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* === RIGHT WALL PANEL === */}
            <mesh position={[(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* === TOP WALL PANEL (above doors) === */}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* === DOOR FRAME === */}
            {/* Top bar */}
            <mesh position={[0, doorBottomY + doorHeight + 0.04, 0.03]}>
                <boxGeometry args={[doorOpeningWidth + 0.08, 0.08, 0.14]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Left post */}
            <mesh position={[-doorOpeningWidth / 2 - 0.02, doorCenterY, 0.03]}>
                <boxGeometry args={[0.06, doorHeight, 0.14]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Right post */}
            <mesh position={[doorOpeningWidth / 2 + 0.02, doorCenterY, 0.03]}>
                <boxGeometry args={[0.06, doorHeight, 0.14]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* === LEFT DOOR === */}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                <mesh position={[doorWidth / 2, 0, 0.05]}>
                    <boxGeometry args={[doorWidth, doorHeight - 0.05, 0.05]} />
                    <meshStandardMaterial color="#f0e8dc" roughness={0.9} />
                </mesh>
                <mesh position={[doorWidth / 2, 0.4, 0.08]}>
                    <planeGeometry args={[doorWidth * 0.6, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e8e0d2" roughness={1} />
                </mesh>
                <mesh position={[doorWidth / 2, -0.35, 0.08]}>
                    <planeGeometry args={[doorWidth * 0.6, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e8e0d2" roughness={1} />
                </mesh>
                <mesh position={[doorWidth - 0.1, 0, 0.1]}>
                    <sphereGeometry args={[0.04, 10, 10]} />
                    <meshStandardMaterial color="#222" metalness={0.7} roughness={0.25} />
                </mesh>
            </group>

            {/* === RIGHT DOOR === */}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                <mesh position={[-doorWidth / 2, 0, 0.05]}>
                    <boxGeometry args={[doorWidth, doorHeight - 0.05, 0.05]} />
                    <meshStandardMaterial color="#f0e8dc" roughness={0.9} />
                </mesh>
                <mesh position={[-doorWidth / 2, 0.4, 0.08]}>
                    <planeGeometry args={[doorWidth * 0.6, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e8e0d2" roughness={1} />
                </mesh>
                <mesh position={[-doorWidth / 2, -0.35, 0.08]}>
                    <planeGeometry args={[doorWidth * 0.6, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e8e0d2" roughness={1} />
                </mesh>
                <mesh position={[-doorWidth + 0.1, 0, 0.1]}>
                    <sphereGeometry args={[0.04, 10, 10]} />
                    <meshStandardMaterial color="#222" metalness={0.7} roughness={0.25} />
                </mesh>
            </group>

            {/* Light */}
            <pointLight position={[0, doorBottomY + doorHeight + 0.8, 0.8]} intensity={0.5} color="#fff8e8" distance={8} decay={2} />
        </group>
    );
};

export default SegmentDoors;
