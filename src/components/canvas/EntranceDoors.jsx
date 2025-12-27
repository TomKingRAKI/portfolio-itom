import { useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * EntranceDoors Component
 * 
 * Positioned at Z=20 to avoid conflict with segment SegmentDoors.
 * Has a THICK back wall to completely block the view of content behind.
 */
const EntranceDoors = ({
    position = [0, 0, 20],
    onDoorClick,
    canClick = false,
    corridorHeight = 3.5,
    corridorWidth = 4
}) => {
    const leftDoorRef = useRef();
    const rightDoorRef = useRef();
    const backWallRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Door dimensions
    const doorWidth = 1.3;
    const doorOpeningWidth = doorWidth * 2;
    const doorHeight = 2.6;
    const wallThickness = 0.15;

    const floorY = -corridorHeight / 2;
    const doorCenterY = floorY + doorHeight / 2;
    const wallCenterY = floorY + corridorHeight / 2;
    const topWallHeight = corridorHeight - doorHeight;
    const topWallCenterY = floorY + doorHeight + topWallHeight / 2;
    const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;

    // Handle click to open doors
    const handleClick = (e) => {
        e.stopPropagation();
        if (isOpen || !canClick) return;

        setIsOpen(true);

        // Create timeline for door animation
        const tl = gsap.timeline();

        // Open doors
        tl.to(leftDoorRef.current.rotation, {
            y: -Math.PI * 0.7,
            duration: 0.8,
            ease: 'power2.out'
        }, 0);

        tl.to(rightDoorRef.current.rotation, {
            y: Math.PI * 0.7,
            duration: 0.8,
            ease: 'power2.out'
        }, 0);

        // Fade out back wall
        if (backWallRef.current) {
            tl.to(backWallRef.current.material, {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.out'
            }, 0);
        }

        // Start walking after doors open
        tl.call(() => {
            onDoorClick?.();
        }, null, 0.5);
    };

    return (
        <group position={[position[0], 0, position[2]]}>
            {/* === THICK BACK WALL (blocks view completely until doors open) === */}
            <mesh ref={backWallRef} position={[0, wallCenterY, -1]}>
                <boxGeometry args={[corridorWidth + 1, corridorHeight + 0.5, 2]} />
                <meshStandardMaterial
                    color="#fafafa"
                    transparent
                    opacity={1}
                />
            </mesh>

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

            {/* === TOP WALL PANEL === */}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* === DOOR FRAME === */}
            <mesh position={[0, floorY + doorHeight + 0.05, 0.04]}>
                <boxGeometry args={[doorOpeningWidth + 0.12, 0.1, 0.18]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-doorOpeningWidth / 2 - 0.03, doorCenterY, 0.04]}>
                <boxGeometry args={[0.08, doorHeight + 0.1, 0.18]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[doorOpeningWidth / 2 + 0.03, doorCenterY, 0.04]}>
                <boxGeometry args={[0.08, doorHeight + 0.1, 0.18]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* === LEFT DOOR === */}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                <mesh
                    position={[doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={() => canClick && setIsHovered(true)}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <boxGeometry args={[doorWidth, doorHeight - 0.05, 0.06]} />
                    <meshStandardMaterial
                        color={isHovered && canClick ? '#e8e0d2' : '#f0e8dc'}
                        roughness={0.85}
                    />
                </mesh>
                <mesh position={[doorWidth / 2, 0.5, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e5ddd0" roughness={1} />
                </mesh>
                <mesh position={[doorWidth / 2, -0.4, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e5ddd0" roughness={1} />
                </mesh>
                <mesh position={[doorWidth - 0.12, 0, 0.12]}>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>

            {/* === RIGHT DOOR === */}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                <mesh
                    position={[-doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={() => canClick && setIsHovered(true)}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <boxGeometry args={[doorWidth, doorHeight - 0.05, 0.06]} />
                    <meshStandardMaterial
                        color={isHovered && canClick ? '#e8e0d2' : '#f0e8dc'}
                        roughness={0.85}
                    />
                </mesh>
                <mesh position={[-doorWidth / 2, 0.5, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e5ddd0" roughness={1} />
                </mesh>
                <mesh position={[-doorWidth / 2, -0.4, 0.1]}>
                    <planeGeometry args={[doorWidth * 0.65, doorHeight * 0.25]} />
                    <meshStandardMaterial color="#e5ddd0" roughness={1} />
                </mesh>
                <mesh position={[-doorWidth + 0.12, 0, 0.12]}>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>

            {/* === FLOATING LABEL === */}
            {canClick && !isOpen && (
                <group position={[0, floorY + doorHeight + 0.6, 0.4]}>
                    <Text
                        fontSize={0.18}
                        color="#1a1a1a"
                        anchorX="center"
                        anchorY="middle"
                    >
                        CLICK TO ENTER
                    </Text>
                    <Text
                        position={[0, -0.25, 0]}
                        fontSize={0.22}
                        color="#39FF14"
                        anchorX="center"
                    >
                        ▼
                    </Text>
                </group>
            )}

            {/* Light */}
            <pointLight
                position={[0, floorY + doorHeight + 1, 1]}
                intensity={0.8}
                color="#fff8e8"
                distance={10}
            />
        </group>
    );
};

export default EntranceDoors;
