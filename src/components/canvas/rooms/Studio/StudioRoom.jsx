import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { CONTENT_DATA, PLATFORM_CONFIG, getLatestContent } from './contentData';
import { useScene } from '../../../../context/SceneContext';

// ============================================
// CONFIG - Adjust these values as needed
// ============================================
const CAMERA_Y_OFFSET = -6; // Negative = camera lower, Positive = camera higher
const CAMERA_ZOOM_DISTANCE = 3; // Distance from monitor front when zoomed in
const CAMERA_PAN_RIGHT = 1; // How far camera moves right after zoom (for content panel space)
const TOWER_RADIUS = 2.2; // All monitors at same distance from center (smaller = narrower)
const MONITORS_PER_RING = 4; // How many monitors per vertical level
const FALL_SPEED = 0.3; // How fast monitors fall down
const TOWER_HEIGHT = 12; // Total visible height of tower
const VERTICAL_SPACING = 2.5; // Space between monitor rings
const TOWER_Y_START = -5; // Starting Y offset for tower (negative = lower) -> CONTROLS HEIGHT (UP/DOWN)
const TOWER_Z_START = -10; // Starting Z position (negative = further away) -> CONTROLS DISTANCE

const StudioRoom = ({ showRoom, onReady }) => {
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
            panDown: isMobile ? 9.7 : 0, // Positive = camera DOWN = monitor at TOP
            yOffset: isMobile ? 2.5 : isTablet ? -3 : CAMERA_Y_OFFSET,
            isMobile, // Pass through boolean
        };
    }, [size.width]);

    // Store original camera position for reset
    const originalCameraY = useRef(null);
    const originalCameraZ = useRef(null);
    const originalCameraX = useRef(null);

    // State
    const isDraggingRef = useRef(false);
    const lastXRef = useRef(0);
    const [dragDistance, setDragDistance] = useState(0); // Keep this state as it might be used for rendering or effects, currently used in logic but safe to keep or refactor. Actually used in dependency arrays.

    // Physics
    const rotationVelocity = useRef(0);
    const autoRotationSpeed = useRef(0.12); // Now a ref to support changing direction
    const DRAG_SENSITIVITY = 0.008; // Increased from 0.005
    const FRICTION = 0.98; // Increased from 0.95 (longer spin)

    // Vertical Fall Physics
    const fallSpeed = useRef(FALL_SPEED); // Start with default
    const BASE_FALL_SPEED = FALL_SPEED;
    const SCROLL_SENSITIVITY = 0.006; // Tripled from 0.002
    const SWIPE_SENSITIVITY = 0.005; // Adjusted
    const SPEED_DECAY = 0.985; // Slower return to normal (was 0.96)

    // Content State
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Global Scene Context for Overlay
    const { openOverlay, overlayContent } = useScene();

    const latestContent = getLatestContent();

    // Monitor Y offsets for falling animation (mutable)
    const monitorOffsets = useRef([]);
    // Refs to monitor meshes for direct position updates (avoids 28 useFrame hooks)
    const monitorRefs = useRef([]);

    // Signal that room is ready for door to open
    useEffect(() => {
        // Small delay to ensure all geometry is created
        const timer = setTimeout(() => {
            onReady?.();
        }, 400); // Wait for GPU to finish rendering
        return () => clearTimeout(timer);
    }, [onReady]);

    // Build cylindrical tower - all monitors at same radius, shuffled content, staggered heights
    const monitorData = useMemo(() => {
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

        // Pre-compute totalHeight for seamless loop (avoid calculating in useFrame)
        const minBaseY = Math.min(...items.map(m => m.baseY));
        const maxBaseY = Math.max(...items.map(m => m.baseY));
        const totalHeight = maxBaseY - minBaseY + VERTICAL_SPACING;

        return { items, totalHeight };
    }, [latestContent.id]);

    // Destructure for easier access
    const monitors = monitorData.items;
    const totalHeight = monitorData.totalHeight;

    // Need a ref for lastY too
    const lastYRef = useRef(0);

    // --- INTERACTION ---
    const handlePointerDown = (e) => {
        if (isAnimating) return;
        // e.preventDefault(); // Might block scroll, good for custom drag
        e.stopPropagation(); // Stop bubbling

        isDraggingRef.current = true;
        lastXRef.current = e.clientX;
        lastYRef.current = e.clientY; // Store init Y
        setDragDistance(0);
        rotationVelocity.current = 0;

        // Disable auto-rotate immediately
        document.body.style.cursor = 'grabbing';
    };

    const handlePointerUp = useCallback(() => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'auto';
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!isDraggingRef.current || !towerRef.current || isAnimating) return;

        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

        if (!clientX || !clientY) return;

        const deltaX = clientX - lastXRef.current;
        const deltaY = clientY - lastYRef.current; // Vertical delta

        lastXRef.current = clientX;
        lastYRef.current = clientY;

        setDragDistance(prev => prev + Math.abs(deltaX) + Math.abs(deltaY)); // Add Y check

        // HORIZONTAL -> Rotation
        if (Math.abs(deltaX) > 1) {
            autoRotationSpeed.current = Math.sign(deltaX) * 0.12;
        }
        rotationVelocity.current = deltaX * DRAG_SENSITIVITY;
        towerRef.current.rotation.y += rotationVelocity.current;

        // VERTICAL -> Fall Speed (Inverted: Drag UP = move contents UP = negative speed) (Actually drag logic is usually "pull", so drag up = move up)
        // If I drag UP (deltaY negative), content should move UP (negative offset change)? in 2D touch scrolling, drag up = content moves up (showing bottom).
        // Let's match standard "Direct Manipulation": Finger goes up -> Content goes up.
        // Content Y is `baseY + offset`. Moving UP means increasing Y?
        // Wait, "Falling" is reducing Y (monitorOffsets -= speed).
        // So positive speed = falling down. Negative speed = going up.
        // Drag UP (deltaY < 0). We want monitors to go UP (Move towards +Y).
        // So drag UP -> make speed NEGATIVE.
        // Drag DOWN (deltaY > 0) -> make speed POSITIVE (fall faster).

        // We add directly to speed to give momentum "throw" feel, but since this is continuous move, maybe direct mapping + inertia?
        // Let's try adding to velocity logic similar to rotation.

        // Drag DOWN (deltaY > 0) should increase fallSpeed (more positive).
        // Drag UP (deltaY < 0) should decrease fallSpeed (more negative).
        fallSpeed.current += deltaY * SWIPE_SENSITIVITY;

    }, [isAnimating]);

    // Wheel Listener for Desktop
    useEffect(() => {
        const handleWheel = (e) => {
            // e.deltaY > 0 means scroll DOWN.
            // Scroll DOWN -> Monitors go DOWN (Speed +).
            // Scroll UP -> Monitors go UP (Speed -).
            fallSpeed.current += e.deltaY * SCROLL_SENSITIVITY;
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // Global Event Listeners for seamless drag
    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointermove', handlePointerMove);
        // Also touch events for mobile if pointer events fail (though React usually patches)
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchmove', handlePointerMove); // Native touchmove

        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
            window.removeEventListener('touchmove', handlePointerMove);
        };
    }, [handlePointerUp, handlePointerMove]);

    // STEP 1 ONLY: Rotate tower to center the clicked monitor
    const handleMonitorClick = useCallback((item) => {
        // Prevent click if we were dragging
        if (dragDistance > 5 || isAnimating || !towerRef.current) return;
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

    // Cleaned up old listener effect that is now handled by the global effect above

    useFrame((state, delta) => {
        if (!towerRef.current) return;

        // Auto-rotate and Physics when idle
        if (!isDraggingRef.current && !isAnimating && !selectedMonitor) {
            towerRef.current.rotation.y += autoRotationSpeed.current * delta + rotationVelocity.current;
            rotationVelocity.current *= FRICTION;

            // Decay fall speed back to base speed (but keep direction!)
            // If going down (>0), drift to positive base. If going up (<0), drift to negative base.
            const targetDrift = fallSpeed.current > 0 ? BASE_FALL_SPEED : -BASE_FALL_SPEED;
            fallSpeed.current = THREE.MathUtils.lerp(fallSpeed.current, targetDrift, 1.0 - SPEED_DECAY);

            // totalHeight is now pre-computed in useMemo for performance
            // Update all monitor offsets and positions in a single loop (no child useFrames needed)
            monitors.forEach((monitor, index) => {
                // Update offset
                monitorOffsets.current[index] -= fallSpeed.current * delta;

                // Calculate current Y
                const currentY = monitor.baseY + monitorOffsets.current[index];

                // If below threshold (-2), teleport to top (seamless loop)
                // If moving UP (negative speed), we need to check TOP threshold too!
                if (currentY < -2 && fallSpeed.current > 0) {
                    // Falling Down -> Reset to top
                    monitorOffsets.current[index] += totalHeight;
                } else if (currentY > totalHeight - 2 && fallSpeed.current < 0) {
                    // Moving Up -> Reset to bottom
                    monitorOffsets.current[index] -= totalHeight;
                }

                // Direct DOM update - bypass React reconciliation for performance
                const ref = monitorRefs.current[index];
                if (ref) {
                    ref.position.y = monitor.baseY + monitorOffsets.current[index];
                }
            });
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.2, 0]}>

            {/* THE INFINITE TOWER */}
            <group
                ref={towerRef}
                position={[0, TOWER_Y_START, TOWER_Z_START]}
                onPointerDown={handlePointerDown}
            >
                {/* Invisible Hit Cylinder for easier drag interaction */}
                <mesh visible={false}>
                    <cylinderGeometry args={[TOWER_RADIUS + 0.5, TOWER_RADIUS + 0.5, TOWER_HEIGHT * 1.5, 16]} />
                    <meshBasicMaterial />
                </mesh>

                {monitors.map((item, index) => (
                    <MonitorBlock
                        key={item.id}
                        item={item}
                        index={index}
                        meshRef={(el) => { monitorRefs.current[index] = el; }}
                        isHovered={hoveredId === item.id}
                        isSelected={selectedMonitor?.id === item.id}
                        onHover={(hovered) => setHoveredId(hovered ? item.id : null)}
                        onClick={() => handleMonitorClick(item)}
                        disabled={isAnimating}
                    />
                ))}
            </group>

            {/* TODO: Add instruction as texture or HTML overlay later */}
        </group>
    );
};

// ===========================================
// MONITOR BLOCK COMPONENT (Simplified - no useFrame)
// ===========================================
const MonitorBlock = ({ item, meshRef, isHovered, isSelected, onHover, onClick, disabled }) => {
    // Position.y is updated directly by parent's useFrame via meshRef

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
            {/* Simple device box - will be replaced with textured mesh later */}
            <mesh>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                <meshStandardMaterial color={item.platformConfig.color} roughness={0.4} metalness={0.1} />
            </mesh>
        </group>
    );
};

export default StudioRoom;
