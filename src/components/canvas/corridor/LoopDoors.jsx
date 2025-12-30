import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * LoopDoors Component
 * 
 * Double doors at the end of corridor that automatically open
 * when the camera approaches, creating an infinite loop illusion.
 */
const LoopDoors = ({
    position = [0, 0, -70],
    corridorHeight = 3.5,
    onLoopTriggered
}) => {
    const leftDoorRef = useRef();
    const rightDoorRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);
    const { camera } = useThree();

    const doorWidth = 1.2;
    const doorHeight = corridorHeight - 0.4;
    const triggerDistance = 8; // When camera is this close, doors start opening
    const loopDistance = 3; // When camera is this close, trigger loop

    // Check camera distance and trigger animations
    useFrame(() => {
        if (!leftDoorRef.current || !rightDoorRef.current) return;

        const distance = camera.position.z - position[2];

        // Start opening doors when approaching
        if (distance < triggerDistance && distance > loopDistance && !isOpen) {
            setIsOpen(true);

            // Animate doors opening outward
            gsap.to(leftDoorRef.current.rotation, {
                y: -Math.PI * 0.6,
                duration: 1.2,
                ease: 'power2.out'
            });
            gsap.to(rightDoorRef.current.rotation, {
                y: Math.PI * 0.6,
                duration: 1.2,
                ease: 'power2.out'
            });
        }

        // Trigger loop when very close
        if (distance < loopDistance && !hasTriggered && isOpen) {
            setHasTriggered(true);
            onLoopTriggered?.();

            // Reset after loop
            setTimeout(() => {
                setHasTriggered(false);
                setIsOpen(false);

                // Close doors instantly (they'll be at the "end" again after loop)
                if (leftDoorRef.current && rightDoorRef.current) {
                    leftDoorRef.current.rotation.y = 0;
                    rightDoorRef.current.rotation.y = 0;
                }
            }, 500);
        }
    });

    return (
        <group position={position}>
            {/* Door Frame */}
            <mesh position={[0, doorHeight / 2 + 0.15, 0]}>
                <boxGeometry args={[doorWidth * 2 + 0.3, 0.15, 0.15]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>

            {/* Left Door Frame */}
            <mesh position={[-doorWidth - 0.08, 0, 0]}>
                <boxGeometry args={[0.12, doorHeight + 0.3, 0.15]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>

            {/* Right Door Frame */}
            <mesh position={[doorWidth + 0.08, 0, 0]}>
                <boxGeometry args={[0.12, doorHeight + 0.3, 0.15]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>

            {/* Left Door - pivots from left edge */}
            <group
                ref={leftDoorRef}
                position={[-doorWidth, 0, 0]}
            >
                <mesh position={[doorWidth / 2, 0, 0.05]}>
                    <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
                    <meshStandardMaterial color="#f0ebe0" roughness={0.9} />
                </mesh>

                {/* Door panel details */}
                <mesh position={[doorWidth / 2, 0.3, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.7, doorHeight * 0.35]} />
                    <meshStandardMaterial color="#e8e3d8" roughness={1} />
                </mesh>
                <mesh position={[doorWidth / 2, -0.4, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.7, doorHeight * 0.35]} />
                    <meshStandardMaterial color="#e8e3d8" roughness={1} />
                </mesh>

                {/* Handle */}
                <mesh position={[doorWidth - 0.15, 0, 0.12]}>
                    <sphereGeometry args={[0.05, 12, 12]} />
                    <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>

            {/* Right Door - pivots from right edge */}
            <group
                ref={rightDoorRef}
                position={[doorWidth, 0, 0]}
            >
                <mesh position={[-doorWidth / 2, 0, 0.05]}>
                    <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
                    <meshStandardMaterial color="#f0ebe0" roughness={0.9} />
                </mesh>

                {/* Door panel details */}
                <mesh position={[-doorWidth / 2, 0.3, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.7, doorHeight * 0.35]} />
                    <meshStandardMaterial color="#e8e3d8" roughness={1} />
                </mesh>
                <mesh position={[-doorWidth / 2, -0.4, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.7, doorHeight * 0.35]} />
                    <meshStandardMaterial color="#e8e3d8" roughness={1} />
                </mesh>

                {/* Handle */}
                <mesh position={[-doorWidth + 0.15, 0, 0.12]}>
                    <sphereGeometry args={[0.05, 12, 12]} />
                    <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>

            {/* Light above doors */}
            <pointLight
                position={[0, 1.5, 1]}
                intensity={0.8}
                color="#fff8e0"
                distance={8}
                decay={2}
            />
        </group>
    );
};

export default LoopDoors;
