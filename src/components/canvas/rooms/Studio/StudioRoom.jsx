import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { CONTENT_DATA, PLATFORM_CONFIG, getLatestContent } from './contentData';
import { useScene } from '../../../../context/SceneContext';

// ============================================
// CONFIG - Adjust these values as needed
// ============================================
const CAMERA_Y_OFFSET = -4; // Negative = camera lower, Positive = camera higher
const CAMERA_ZOOM_DISTANCE = 4; // Distance from monitor front when zoomed in
const CAMERA_PAN_RIGHT = 1; // How far camera moves right after zoom (for content panel space)
const TOWER_RADIUS = 2.2; // All monitors at same distance from center (smaller = narrower)
const MONITORS_PER_RING = 4; // How many monitors per vertical level
const FALL_SPEED = 0.3; // How fast monitors fall down
const TOWER_HEIGHT = 12; // Total visible height of tower
const VERTICAL_SPACING = 2.5; // Space between monitor rings
const TOWER_Y_START = -3; // Starting Y offset for tower (negative = lower)

const StudioRoom = ({ showRoom }) => {
    const groupRef = useRef();
    const towerRef = useRef();
    const { camera, size } = useThree();

    // Responsive camera parameters based on PIXEL width
    const responsiveParams = useMemo(() => {
        const isMobile = size.width < 768; // Standard mobile breakpoint
        const isTablet = size.width < 1024 && size.width >= 768;

        console.log('Screen px width:', size.width, 'isMobile:', isMobile, 'isTablet:', isTablet);

        return {
            zoomDistance: isMobile ? 2 : isTablet ? 3 : CAMERA_ZOOM_DISTANCE,
            panRight: isMobile ? 0 : isTablet ? 0.5 : CAMERA_PAN_RIGHT,
            panDown: isMobile ? 8 : 0, // Positive = camera DOWN = monitor at TOP
            yOffset: isMobile ? 2.5 : isTablet ? -3 : CAMERA_Y_OFFSET,
            isMobile, // Pass through boolean
        };
    }, [size.width]);

    // Store original camera position for reset
    const originalCameraY = useRef(null);
    const originalCameraZ = useRef(null);
    const originalCameraX = useRef(null);

    // State
    const [isDragging, setIsDragging] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [dragDistance, setDragDistance] = useState(0);
    const rotationVelocity = useRef(0);
    const autoRotationSpeed = 0.12;

    // Content State
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Global Scene Context for Overlay
    const { openOverlay, overlayContent } = useScene();

    const latestContent = getLatestContent();

    // Monitor Y offsets for falling animation (mutable)
    const monitorOffsets = useRef([]);

    // Build cylindrical tower - all monitors at same radius, shuffled content, staggered heights
    const monitors = useMemo(() => {
        const items = [];

        // Shuffle content for mixed appearance (seeded for consistency)
        const shuffledContent = [...CONTENT_DATA].sort(() => 0.5 - Math.random());

        // Calculate how many rings we need
        const totalMonitors = shuffledContent.length;
        const ringsNeeded = Math.ceil(totalMonitors / MONITORS_PER_RING);

        let contentIndex = 0;

        for (let ring = 0; ring < ringsNeeded && contentIndex < shuffledContent.length; ring++) {
            const angleStep = (Math.PI * 2) / MONITORS_PER_RING;
            const angleOffset = ring % 2 === 0 ? 0 : angleStep / 2; // Offset alternate rings

            for (let i = 0; i < MONITORS_PER_RING && contentIndex < shuffledContent.length; i++) {
                const contentItem = shuffledContent[contentIndex];
                const platform = PLATFORM_CONFIG[contentItem.platform];
                const angle = i * angleStep + angleOffset;

                const x = Math.cos(angle) * TOWER_RADIUS;
                const z = Math.sin(angle) * TOWER_RADIUS;

                // Staggered Y - base + random jitter for organic look
                const baseY = ring * VERTICAL_SPACING;
                const yJitter = (Math.sin(contentIndex * 1.7) + Math.cos(contentIndex * 2.3)) * 0.4; // Pseudo-random
                const finalY = baseY + yJitter;

                let width, height, depth;
                switch (platform.shape) {
                    case 'tv':
                        width = 1.6; height = 1.2; depth = 1.0;
                        break;
                    case 'monitor':
                        width = 1.4; height = 1.0; depth = 0.3;
                        break;
                    case 'phone':
                        width = 0.6; height = 1.1; depth = 0.1;
                        break;
                    default:
                        width = 1.4; height = 1.0; depth = 0.6;
                }

                items.push({
                    ...contentItem,
                    index: contentIndex,
                    x,
                    baseY: finalY, // Staggered Y position
                    z,
                    width, height, depth,
                    angle: angle,
                    rot: -angle + Math.PI / 2,
                    platformConfig: platform,
                    isLatest: contentItem.id === latestContent.id,
                });

                contentIndex++;
            }
        }

        // Initialize offsets
        monitorOffsets.current = items.map(() => 0);

        return items;
    }, [latestContent.id]);

    // --- INTERACTION ---
    const handlePointerDown = (e) => {
        if (isAnimating) return;
        setIsDragging(true);
        setLastX(e.clientX);
        setDragDistance(0);
        rotationVelocity.current = 0;
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !towerRef.current || isAnimating) return;

        const deltaX = e.clientX - lastX;
        setLastX(e.clientX);
        setDragDistance(prev => prev + Math.abs(deltaX));
        rotationVelocity.current = deltaX * 0.005;
        towerRef.current.rotation.y += rotationVelocity.current;
    };

    // STEP 1 ONLY: Rotate tower to center the clicked monitor
    const handleMonitorClick = useCallback((item) => {
        if (dragDistance > 5 || isAnimating || !towerRef.current) return;

        setIsAnimating(true);
        setSelectedMonitor(item);
        rotationVelocity.current = 0;

        // Monitor's facing rotation (item.rot = -angle + PI/2)
        // Monitor's screen faces local +Z, rotated by item.rot
        // Tower rotated by towerRotation
        // World facing = item.rot + towerRotation
        // We want world facing = 0 (toward camera at +Z)
        // So: towerRotation = -item.rot

        const monitorFacingRotation = item.rot;
        let targetRotation = -monitorFacingRotation;

        // Normalize current rotation
        let currentRotation = towerRef.current.rotation.y % (Math.PI * 2);
        if (currentRotation < 0) currentRotation += Math.PI * 2;

        // Normalize target
        while (targetRotation < 0) targetRotation += Math.PI * 2;
        targetRotation = targetRotation % (Math.PI * 2);

        // Find shortest path from current to target
        let delta = targetRotation - currentRotation;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        // Final target = current + shortest delta
        const finalRotation = towerRef.current.rotation.y + delta;

        console.log('Rotating tower:', {
            monitorRot: item.rot,
            currentRotation: towerRef.current.rotation.y,
            targetRotation,
            delta,
            finalRotation
        });

        // STEP 1: Animate tower rotation
        gsap.to(towerRef.current.rotation, {
            y: finalRotation,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                // STEP 2: After rotation, move camera Y to center on monitor
                // Store original camera Y if not stored
                if (originalCameraY.current === null) {
                    originalCameraY.current = camera.position.y;
                }

                // Monitor's world Y position
                // Group is at y=-1.2, tower at y=0 relative to group
                // Monitor's current Y = baseY + offset
                const monitorCurrentY = item.baseY + (monitorOffsets.current[item.index] || 0);
                const monitorWorldY = -1.2 + monitorCurrentY + responsiveParams.yOffset;

                // STEP 3: Move camera FORWARD (in the direction it's looking)
                // Store original camera position if not stored
                if (originalCameraZ.current === null) {
                    originalCameraZ.current = camera.position.z;
                    originalCameraX.current = camera.position.x;
                }

                // Get camera's forward direction
                const forward = new THREE.Vector3();
                camera.getWorldDirection(forward);

                // Get camera's right direction (cross product of forward and up)
                const up = new THREE.Vector3(0, 1, 0);
                const right = new THREE.Vector3();
                right.crossVectors(forward, up).normalize();

                // STEP 3 & 4: Move camera forward + right/down (using responsive values)
                const zoomDist = responsiveParams.zoomDistance;
                const panRight = responsiveParams.panRight;
                const panDown = responsiveParams.panDown;

                const targetX = camera.position.x + forward.x * zoomDist + right.x * panRight;
                const targetZ = camera.position.z + forward.z * zoomDist + right.z * panRight;
                const targetY = monitorWorldY - panDown; // Pan down moves camera down = monitor at top

                console.log('Moving camera:', {
                    zoomDist, panRight, panDown,
                    targetPos: { x: targetX, y: targetY, z: targetZ }
                });

                gsap.to(camera.position, {
                    x: targetX,
                    y: targetY,
                    z: targetZ,
                    duration: 0.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        setIsAnimating(false);
                        openOverlay(item); // Open global overlay in HUD
                    }
                });
            }
        });

    }, [dragDistance, isAnimating, camera, responsiveParams, openOverlay]);

    // Trigger camera return ONLY when overlay is explicitly closed
    // We use a ref to track if overlay was previously open to avoid initial race conditions
    const prevOverlayContent = useRef(null);

    useEffect(() => {
        // If it WAS open (prev) and is NOW closed (null) AND we are viewing a monitor -> Return camera
        if (prevOverlayContent.current && !overlayContent && selectedMonitor && !isAnimating) {
            handleReturnCamera();
        }

        // Update ref for next render
        prevOverlayContent.current = overlayContent;
    }, [overlayContent, selectedMonitor, isAnimating]);

    const handleReturnCamera = useCallback(() => {
        setIsAnimating(true);

        // Slightly faster return
        if (originalCameraX.current !== null && originalCameraY.current !== null && originalCameraZ.current !== null) {
            gsap.to(camera.position, {
                x: originalCameraX.current,
                y: originalCameraY.current,
                z: originalCameraZ.current,
                duration: 0.8,
                ease: 'power2.inOut',
                onComplete: () => {
                    setIsAnimating(false);
                    setSelectedMonitor(null); // Resume auto-rotation
                }
            });
        } else {
            setIsAnimating(false);
            setSelectedMonitor(null);
        }
    }, [camera]);

    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        return () => window.removeEventListener('pointerup', handlePointerUp);
    }, []);

    useFrame((state, delta) => {
        if (!towerRef.current) return;

        // Auto-rotate when idle
        if (!isDragging && !isAnimating && !selectedMonitor) {
            towerRef.current.rotation.y += autoRotationSpeed * delta + rotationVelocity.current;
            rotationVelocity.current *= 0.95;

            // FALLING ANIMATION - only when no monitor selected
            // Calculate total height of all monitors for seamless loop
            const minBaseY = Math.min(...monitors.map(m => m.baseY));
            const maxBaseY = Math.max(...monitors.map(m => m.baseY));
            const totalHeight = maxBaseY - minBaseY + VERTICAL_SPACING;

            monitors.forEach((monitor, index) => {
                // Update offset
                monitorOffsets.current[index] -= FALL_SPEED * delta;

                // Calculate current Y
                const currentY = monitor.baseY + monitorOffsets.current[index];

                // If below threshold (-2), teleport to top (seamless loop)
                if (currentY < -2) {
                    // Add totalHeight to current offset to teleport to top
                    monitorOffsets.current[index] += totalHeight;
                }
            });
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.2, 0]}>

            {/* THE INFINITE TOWER */}
            <group
                ref={towerRef}
                position={[0, TOWER_Y_START, -15]}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
            >
                {monitors.map((item, index) => (
                    <MonitorBlock
                        key={item.id}
                        item={item}
                        index={index}
                        offsetsRef={monitorOffsets}
                        isHovered={hoveredId === item.id}
                        isSelected={selectedMonitor?.id === item.id}
                        onHover={(hovered) => setHoveredId(hovered ? item.id : null)}
                        onClick={() => handleMonitorClick(item)}
                        disabled={isAnimating}
                    />
                ))}
            </group>

            {/* Instruction Text */}
            <Text position={[0, 0.5, -5]} fontSize={0.25} color="#666">
                Drag to Spin • Click to View
            </Text>
        </group>
    );
};

// ===========================================
// MONITOR BLOCK COMPONENT
// ===========================================
const MonitorBlock = ({ item, index, offsetsRef, isHovered, isSelected, onHover, onClick, disabled }) => {
    const meshRef = useRef();
    const scanlineRef = useRef();

    useEffect(() => {
        if (meshRef.current) {
            gsap.to(meshRef.current.scale, {
                x: isHovered && !disabled ? 1.05 : 1,
                y: isHovered && !disabled ? 1.05 : 1,
                z: isHovered && !disabled ? 1.05 : 1,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
    }, [isHovered, disabled]);

    useFrame((state) => {
        // Read current offset from ref (updated by parent)
        const yOffset = offsetsRef?.current?.[index] || 0;
        const currentY = item.baseY + yOffset;

        if (scanlineRef.current) {
            scanlineRef.current.position.y = Math.sin(state.clock.elapsedTime * 3 + currentY) * item.height * 0.35;
        }

        // Update Y position for falling animation
        if (meshRef.current) {
            meshRef.current.position.y = currentY;
        }
    });

    const platformColor = item.platformConfig.color;

    return (
        <group
            ref={meshRef}
            position={[item.x, item.baseY, item.z]}
            rotation={[0, item.rot, 0]}
            onPointerOver={(e) => {
                if (disabled) return;
                e.stopPropagation();
                onHover(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                onHover(false);
                document.body.style.cursor = 'auto';
            }}
            onPointerUp={(e) => {
                if (disabled) return;
                e.stopPropagation();
                onClick();
            }}
        >
            {/* Monitor Case */}
            <mesh>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Screen bezel */}
            <mesh position={[0, 0, item.depth / 2 + 0.005]}>
                <boxGeometry args={[item.width * 0.9, item.height * 0.85, 0.01]} />
                <meshStandardMaterial color="#0a0a0a" />
            </mesh>

            {/* Screen */}
            <mesh position={[0, 0, item.depth / 2 + 0.015]}>
                <planeGeometry args={[item.width * 0.82, item.height * 0.75]} />
                <meshBasicMaterial color={platformColor} />
            </mesh>

            {/* Glow on hover */}
            {isHovered && !disabled && (
                <pointLight
                    position={[0, 0, item.depth / 2 + 0.3]}
                    color={platformColor}
                    intensity={1.5}
                    distance={2}
                />
            )}

            {/* Scanline */}
            <mesh ref={scanlineRef} position={[0, 0, item.depth / 2 + 0.02]}>
                <planeGeometry args={[item.width * 0.82, 0.015]} />
                <meshBasicMaterial color="#ffffff" opacity={0.12} transparent />
            </mesh>

            {/* On Air indicator */}
            {item.isLatest && (
                <mesh position={[item.width / 2 - 0.15, item.height / 2 - 0.1, item.depth / 2 + 0.03]}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
            )}

            {/* Platform icon */}
            <Text
                position={[0, -item.height / 2 + 0.12, item.depth / 2 + 0.02]}
                fontSize={0.1}
                color="#ffffff"
                anchorX="center"
            >
                {item.platformConfig.icon}
            </Text>

            {/* Title on hover */}
            {isHovered && !disabled && (
                <Text
                    position={[0, item.height / 2 + 0.2, 0]}
                    fontSize={0.12}
                    color="#ffffff"
                    anchorX="center"
                    maxWidth={2}
                    textAlign="center"
                    outlineWidth={0.01}
                    outlineColor="#000000"
                >
                    {item.title}
                </Text>
            )}
        </group>
    );
};

export default StudioRoom;
