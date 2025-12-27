import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import gsap from 'gsap';

// Use same font as App.jsx preload
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

const NeonArrow = ({ position }) => {
    const arrowRef = useRef();

    useFrame((state) => {
        if (arrowRef.current) {
            // Bobbing animation
            arrowRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={arrowRef} position={position}>
            <Text
                font={FONT_URL}
                fontSize={0.6} // Large and visible
                color="#39FF14"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#1a1a1a"
            >
                ↓
            </Text>
            {/* Glow effect duplicate */}
            <Text
                font={FONT_URL}
                position={[0, 0, -0.02]}
                fontSize={0.6}
                color="#39FF14"
                fillOpacity={0.5}
                anchorX="center"
                anchorY="middle"
            >
                ↓
            </Text>
        </group>
    );
};

/**
 * EntranceDoors Component - 3D Entrance to the Corridor
 * 
 * Doors that open and camera flies through.
 * EmptyCorridor provides the surrounding corridor context.
 */
const EntranceDoors = ({
    position = [0, 0, 22],
    onComplete,
    corridorHeight = 3.5,
    corridorWidth = 4
}) => {
    const leftDoorRef = useRef();
    const rightDoorRef = useRef();
    const groupRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { camera } = useThree();

    // Door dimensions - matching SegmentDoors
    const doorWidth = 1.05;
    const doorOpeningWidth = doorWidth * 2;
    const doorHeight = 2.4;
    const wallThickness = 0.12;

    const floorY = -corridorHeight / 2;
    const doorBottomY = floorY;
    const doorCenterY = doorBottomY + doorHeight / 2;
    const wallCenterY = floorY + corridorHeight / 2;
    const topWallHeight = corridorHeight - doorHeight;
    const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;
    const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;

    // Handle click
    const handleClick = (e) => {
        e.stopPropagation();
        if (isOpen || isAnimating) return;

        setIsOpen(true);
        setIsAnimating(true);

        const tl = gsap.timeline({
            onComplete: () => {
                onComplete?.();
            }
        });

        // Open doors - smoother angle (matches SegmentDoors)
        tl.to(leftDoorRef.current.rotation, {
            y: -Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0);

        tl.to(rightDoorRef.current.rotation, {
            y: Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0);

        // Camera flies through
        tl.to(camera.position, {
            z: 8,
            y: 0.2, // Match hook's base Y position
            duration: 1.8,
            ease: 'power2.inOut'
        }, 0.3);
    };

    return (
        <group ref={groupRef} position={[position[0], 0, position[2]]}>
            {/* LEFT WALL PANEL */}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* RIGHT WALL PANEL */}
            <mesh position={[(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* TOP WALL PANEL */}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshStandardMaterial color="#f8f5f0" roughness={0.95} />
            </mesh>

            {/* DOOR FRAME */}
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

            {/* LEFT DOOR */}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                <mesh
                    position={[doorWidth / 2, 0, 0.05]}
                    onClick={handleClick}
                    onPointerEnter={() => !isOpen && setIsHovered(true)}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <boxGeometry args={[doorWidth, doorHeight - 0.05, 0.05]} />
                    <meshStandardMaterial
                        color={isHovered ? '#e8e0d2' : '#f0e8dc'} // Interaction color
                        roughness={0.9}
                    />
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

            {/* RIGHT DOOR */}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                <mesh
                    position={[-doorWidth / 2, 0, 0.05]}
                    onClick={handleClick}
                    onPointerEnter={() => !isOpen && setIsHovered(true)}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <boxGeometry args={[doorWidth, doorHeight - 0.05, 0.05]} />
                    <meshStandardMaterial
                        color={isHovered ? '#e8e0d2' : '#f0e8dc'} // Interaction color
                        roughness={0.9}
                    />
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

            {/* FLOATING ARROW GUIDE */}
            {!isOpen && (
                <NeonArrow position={[0, doorBottomY + doorHeight + 0.3, 0.4]} />
            )}

            {/* Warm lighting */}
            <pointLight
                position={[0, doorBottomY + doorHeight + 1, 1]}
                intensity={0.8}
                color="#fff8e8"
                distance={10}
            />
        </group>
    );
};

export default EntranceDoors;
