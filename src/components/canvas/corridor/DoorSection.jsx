import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import RoomInterior from './RoomInterior';
import { useScene } from '../../../context/SceneContext';

// Constants from CorridorSegment
const WALL_X_OUTER = 3.5;
const WALL_X_INNER = 1.7;
const DOOR_Z_SPAN = 4;
const CORRIDOR_HEIGHT = 3.5;

// Calculate sawtooth wall geometry
const WALL_DX = WALL_X_OUTER - WALL_X_INNER; // 1.8
const WALL_DZ = DOOR_Z_SPAN; // 4
const WALL_LENGTH = Math.sqrt(WALL_DX * WALL_DX + WALL_DZ * WALL_DZ);
const BASE_WALL_ANGLE = Math.atan2(WALL_DX, WALL_DZ); // Sawtooth angle (~24 degrees)

// Camera look-at angle when aligning with door (adjust this to fix alignment)
// Math.PI * 0.33 is ~60 degrees
const DOOR_LOOK_ANGLE = Math.PI * 0.334;

// Camera X offset when aligning with door (adjust this to move camera left/right relative to door)
// Higher value = further from door center horizontally
const DOOR_ALIGN_X = 1.2;

// Door texture mapping - maps label to texture file
const DOOR_TEXTURES = {
    'THE GALLERY': '/textures/corridor/doors/drzwiprojekty.webp',
    'THE STUDIO': '/textures/corridor/doors/drzwisocial.webp',
    'THE ABOUT': '/textures/corridor/doors/drzwiabout.webp',
    "LET'S CONNECT": '/textures/corridor/doors/drzwikontakt.webp',
};


/**
 * DoorSection Component
 * 
 * Groups the angled wall + door + label as one unit.
 * Uses 2D textures for door, frame, and handle (like entrance doors).
 * Pivots from the OUTER edge (where wall connects to corridor).
 * Dynamic tilt: starts nearly flat, tilts more when camera approaches.
 */
const DoorSection = ({
    position, // [x, y, z] - center of the wall segment
    side = 'left',
    label,
    icon,
    onEnter,
    autoCloseDelay = 3000,
    setCameraOverride // Function to take control of camera from hook
}) => {
    const groupRef = useRef(); // Main group that tilts
    const doorRef = useRef();
    const handleRef = useRef();
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNear, setIsNear] = useState(false);
    const [isInsideRoom, setIsInsideRoom] = useState(false);
    const [isTiltLocked, setIsTiltLocked] = useState(false); // Lock tilt when entering room
    const [shouldRenderRoom, setShouldRenderRoom] = useState(false); // Lazy loading state
    const [roomReady, setRoomReady] = useState(false); // Room signaled it's ready
    const { camera } = useThree();
    const closeTimerRef = useRef(null);

    // Get exit request signal from context
    const { exitRequested, clearExitRequest, exitRoom: contextExitRoom, enterRoom } = useScene();

    // Save camera state before entering room (for ESC exit)
    // Save camera state before entering room (for ESC exit)
    // Now saving FULL rotation (x, y, z) to prevent snap on exit
    const savedCameraState = useRef({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 });
    // Save position ALIGNED with door (intermediate step for exit)
    const doorAlignedState = useRef({ x: 0, y: 0, z: 0, rotationY: 0 });
    // Save position after flying through corridor (before final rotation) 
    const roomEntryState = useRef({ x: 0, y: 0, z: 0, rotationY: 0 });

    // Dynamic tilt state
    const currentTilt = useRef(0);

    // Load wall texture
    const originalWallTexture = useTexture('/textures/corridor/wall_texture.webp');

    // Clone texture to have independent repeat settings (fixes scaling issues)
    const wallTexture = useMemo(() => {
        const tex = originalWallTexture.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

        // ShapeGeometry uses world-space UVs (1 unit = 1 meter), unlike PlaneGeometry (0..1)
        // We want 1 repeat every 2 meters (0.5 density), so we set repeat to 0.5
        tex.repeat.set(0.5, 0.5);

        // Adjust offset to center texture (optional, nice for alignment)
        tex.offset.set(0.5, 0.5);

        return tex;
    }, [originalWallTexture]);

    // Load door textures - use the right texture based on label
    const doorTexturePath = DOOR_TEXTURES[label] || DOOR_TEXTURES['THE GALLERY'];
    const doorTexture = useTexture(doorTexturePath);
    const frameTexture = useTexture('/textures/corridor/doors/ramkasingledoors.webp');
    const handleTexture = useTexture('/textures/corridor/doors/klamkadodrzwi.webp');
    const doorBackTexture = useTexture('/textures/corridor/doors/backsingledoors.webp');

    // Door dimensions - based on texture aspect ratio (door texture ~1:2.5)
    const doorWidth = 1.13;
    const doorHeight = 2.5;

    // Frame dimensions - slightly larger than door
    const frameWidth = 1.35;
    const frameHeight = 2.5;

    // Hole dimensions - MUST fit inside wall (height 3.5, bottom at -1.75)
    // Previous hole went to -1.775 which broke geometry. New range: [-1.7, 0.6]
    const holeWidth = 1.1;
    const holeHeight = 2.4;
    const holeOffsetY = -0.55; // Same as door group Y offset

    // Create wall geometry with door hole
    const wallWithHoleGeometry = useMemo(() => {
        // Create wall shape
        const wallShape = new THREE.Shape();
        const halfW = WALL_LENGTH / 2;
        const halfH = CORRIDOR_HEIGHT / 2;

        wallShape.moveTo(-halfW, -halfH);
        wallShape.lineTo(halfW, -halfH);
        wallShape.lineTo(halfW, halfH);
        wallShape.lineTo(-halfW, halfH);
        wallShape.lineTo(-halfW, -halfH);

        // Create hole for door
        const holePath = new THREE.Path();
        const holeHalfW = holeWidth / 2;
        const holeHalfH = holeHeight / 2;
        const holeY = holeOffsetY; // Center of hole

        holePath.moveTo(-holeHalfW, holeY - holeHalfH);
        holePath.lineTo(holeHalfW, holeY - holeHalfH);
        holePath.lineTo(holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY + holeHalfH);
        holePath.lineTo(-holeHalfW, holeY - holeHalfH);

        wallShape.holes.push(holePath);

        return new THREE.ShapeGeometry(wallShape);
    }, [holeWidth, holeHeight, holeOffsetY]);

    // Tilt parameters
    const BASE_ROTATION = Math.PI / 2; // 90 degrees - side wall orientation
    const BASE_TILT = 0.02;   // ~1 degree additional tilt towards camera
    const MAX_TILT = BASE_WALL_ANGLE + 0.1; // Sawtooth angle + extra (~27 degrees total tilt)
    const TILT_START = 15;    // Start tilting when camera is 15 units away
    const TILT_PEAK = 3;      // Max tilt at 3 units

    // Pivot offset - the group pivots from the OUTER edge
    const pivotX = side === 'left' ? -WALL_X_OUTER : WALL_X_OUTER;

    // Wall offset from pivot - wall extends FROM pivot INWARD
    const wallOffsetX = side === 'left'
        ? WALL_LENGTH / 2
        : -WALL_LENGTH / 2;

    useFrame(() => {
        if (!groupRef.current) return;

        let targetTilt = BASE_TILT;

        // If tilt is locked (clicked/entering), force it to MAX_TILT (fully facing user)
        if (isTiltLocked) {
            targetTilt = MAX_TILT;
        } else {
            // Normal proximity-based tilting
            const distance = Math.abs(camera.position.z - position[2]);
            const near = distance < 8;
            if (near !== isNear) {
                setIsNear(near);
            }

            if (distance < TILT_START && distance > TILT_PEAK) {
                const t = (TILT_START - distance) / (TILT_START - TILT_PEAK);
                const easedT = t * (2 - t); // easeOutQuad
                targetTilt = BASE_TILT + (MAX_TILT - BASE_TILT) * easedT;
            } else if (distance <= TILT_PEAK) {
                targetTilt = MAX_TILT;
            }
        }

        // Smooth interpolation
        currentTilt.current = THREE.MathUtils.lerp(currentTilt.current, targetTilt, 0.06);

        // Apply rotation: BASE_ROTATION (90°) + dynamic tilt
        const baseDir = side === 'left' ? 1 : -1;
        const tiltDir = side === 'left' ? -1 : 1;

        // Calculate the actual rotation angle
        const currentRotation = (BASE_ROTATION * baseDir) + (currentTilt.current * tiltDir);
        groupRef.current.rotation.y = currentRotation;

        // Trigonometric Scaling Fix:
        // We want the Z-projection of the wall to ALWAYS be exactly DOOR_Z_SPAN (4.0m).
        // Formula: Scale = DOOR_Z_SPAN / (WALL_LENGTH * sin(Angle))

        const absSinAngle = Math.abs(Math.sin(currentRotation));

        // Safety to prevent division by zero (angle is clamped ~60-90 deg)
        let exactScale = 1.0;
        if (absSinAngle > 0.1) {
            // -0.01 safety margin to prevent Z-fighting on the exact edge
            exactScale = (DOOR_Z_SPAN - 0.01) / (WALL_LENGTH * absSinAngle);
        }

        // Clamp scale to avoid explosion if math goes wrong, but allow gentle flex
        const currentScale = THREE.MathUtils.clamp(exactScale, 0.8, 1.1);

        groupRef.current.scale.set(currentScale, 1, 1);
    });

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isAnimating) return;

        if (isOpen) {
            closeDoor();
            return;
        }

        // Reset cursor on transition
        document.body.style.cursor = "url('/cursors/cursor-default.png'), auto";

        setIsAnimating(true);

        // Take control of camera from hook
        setCameraOverride?.(true);

        // Lock tilt so the corridor doesn't rotate while we fly through
        setIsTiltLocked(true);

        // Save camera state BEFORE entering (for ESC exit)
        // Save camera state BEFORE entering (for ESC exit)
        savedCameraState.current = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            rotationX: camera.rotation.x,
            rotationY: camera.rotation.y,
            rotationZ: camera.rotation.z
        };

        // Get door world position
        const doorWorldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(doorWorldPos);

        // Camera moves to be at door's Z level (so door is centered when we look at it)
        // and slightly towards the door's side
        const cameraTargetZ = doorWorldPos.z;
        const cameraTargetX = side === 'left' ? DOOR_ALIGN_X : -DOOR_ALIGN_X;

        // Calculate the target rotation to look at the door
        // We need to account for the camera PARENT's rotation (sway), so we get a consistent WORLD angle
        // Current Sway (Parent Rotation) + Camera Rotation = World Rotation
        // World Rotation Target = DOOR_LOOK_ANGLE
        // Camera Target = World Target - Parent Rotation

        let parentRotationY = 0;
        if (camera.parent) {
            // Get parent's world rotation Y (approximate, assuming mostly Y rotation for sway)
            const parentWorldQuat = new THREE.Quaternion();
            camera.parent.getWorldQuaternion(parentWorldQuat);
            const parentEuler = new THREE.Euler().setFromQuaternion(parentWorldQuat, 'YXZ');
            parentRotationY = parentEuler.y;
        }

        const worldTargetRotationY = side === 'left'
            ? DOOR_LOOK_ANGLE   // Target WORLD angle
            : -DOOR_LOOK_ANGLE; // Target WORLD angle

        // Compensate for parent sway to get consistent local rotation
        const targetRotationY = worldTargetRotationY - parentRotationY;

        // Store initial rotation
        const startRotationY = camera.rotation.y;

        // Create a proxy object for the rotation animation
        const rotationProxy = { y: startRotationY };

        // Animate camera position and rotation simultaneously
        gsap.to(camera.position, {
            x: cameraTargetX,
            z: cameraTargetZ,
            duration: 1.0,
            ease: 'power2.inOut'
        });

        gsap.to(rotationProxy, {
            y: targetRotationY,
            duration: 1.0,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.rotation.y = rotationProxy.y;
            },
            onComplete: () => {
                // Save aligned state for reverse animation
                doorAlignedState.current = {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z,
                    rotationY: camera.rotation.y
                };

                // Lazy Load Room:
                // 1. Camera is now aligned.
                // 2. Start rendering the room.
                // 3. Door will open when room signals ready via onReady callback
                //    OR after fallback timeout for rooms without onReady support
                setShouldRenderRoom(true);

                // Fallback: If room doesn't call onReady within 500ms, open door anyway
                // This ensures all rooms work even if they don't implement onReady
                setTimeout(() => {
                    if (!roomReadyRef.current) {
                        roomReadyRef.current = true;
                        setRoomReady(true);
                        openDoor();
                    }
                }, 500);
            }
        });
    }, [camera, side, isOpen, isAnimating, setCameraOverride]);

    const openDoor = useCallback(() => {
        if (!doorRef.current) return;

        setIsOpen(true);
        const openAngle = side === 'left' ? Math.PI * 0.6 : -Math.PI * 0.6;

        // Animate handle down first
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: side === 'left' ? 0.4 : -0.4,
                duration: 0.15,
                ease: 'power2.out'
            });
        }

        gsap.to(doorRef.current.rotation, {
            y: openAngle,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                // Door is open, now fly camera through the door
                // Get the direction the camera is looking AT THE START
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);

                const flyDistance = 8; // Fly through short vestibule (3) + into room

                // Calculate TARGET position BEFORE animating (so flight path is straight)
                const targetX = camera.position.x + direction.x * flyDistance;
                const targetZ = camera.position.z + direction.z * flyDistance;

                // STEP 1: Fly camera forward in a STRAIGHT LINE
                gsap.to(camera.position, {
                    x: targetX,
                    z: targetZ,
                    duration: 1.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        // Save position AFTER flight
                        roomEntryState.current = {
                            x: camera.position.x,
                            y: camera.position.y,
                            z: camera.position.z,
                            rotationY: camera.rotation.y
                        };

                        // NO ROTATION needed - we are already looking perpendicular to corridor
                        // Just mark as inside
                        setIsAnimating(false);
                        setIsInsideRoom(true);

                        // Defer context update to next frame to prevent stutter
                        requestAnimationFrame(() => {
                            enterRoom(label);
                            onEnter?.();
                        });
                    }
                });
            }
        });
    }, [side, onEnter, camera, enterRoom, label]);

    // Handle room ready callback - open door when room is fully loaded
    // Use ref to prevent multiple calls (state might not update fast enough)
    const roomReadyRef = useRef(false);

    const handleRoomReady = useCallback(() => {
        // Guard: only call openDoor once
        if (roomReadyRef.current) return;
        roomReadyRef.current = true;
        setRoomReady(true);
        openDoor();
    }, [openDoor]);

    // Exit room function - TRUE REVERSE animation (like rewinding video)
    const exitRoom = useCallback(() => {
        if (!isInsideRoom || isAnimating) return;

        setIsAnimating(true);

        const saved = savedCameraState.current;
        const aligned = doorAlignedState.current;

        // REVERSE STEP 1: Walk backwards through corridor to ALIGNED position (in front of door)
        // This prevents clipping through walls
        gsap.to(camera.position, {
            x: aligned.x,
            y: aligned.y,
            z: aligned.z,
            duration: 1.5,
            ease: 'power2.inOut',
            onComplete: () => {
                // REVERSE STEP 2: Move back to original center position & rotate to original view
                // This is the reverse of the "align to door" animation

                // 2a. Position
                gsap.to(camera.position, {
                    x: saved.x,
                    y: saved.y,
                    z: saved.z,
                    duration: 1.0,
                    ease: 'power2.inOut'
                });

                // 2b. Rotation (Full restore to avoid snap)
                // We typically only animate Y for smoothness, but we should restore X/Z at the end too
                const rotationProxy = { y: camera.rotation.y };

                // Animate Y rotation smoothly
                gsap.to(rotationProxy, {
                    y: saved.rotationY,
                    duration: 1.0,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                        camera.rotation.y = rotationProxy.y;
                    },
                    onComplete: () => {
                        // Restore precise full rotation (including X/Z pitch/roll) before returning control
                        camera.rotation.set(saved.rotationX, saved.rotationY, saved.rotationZ);

                        // Spread state updates across frames to prevent jank
                        // Frame 1: Critical state
                        setIsInsideRoom(false);
                        setIsAnimating(false);

                        requestAnimationFrame(() => {
                            // Frame 2: Reset room state
                            setIsTiltLocked(false);
                            setRoomReady(false);
                            roomReadyRef.current = false;

                            requestAnimationFrame(() => {
                                // Frame 3: Cleanup and context
                                setShouldRenderRoom(false);
                                contextExitRoom();
                                closeDoor();
                                setCameraOverride?.(false);
                            });
                        });
                    }
                });
            }
        });
    }, [isInsideRoom, isAnimating, camera, setCameraOverride, contextExitRoom]);

    // ESC key listener for exiting room
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isInsideRoom && !isAnimating) {
                exitRoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isInsideRoom, isAnimating, exitRoom]);

    // Listen for exit request from UI back button
    useEffect(() => {
        if (exitRequested && isInsideRoom && !isAnimating) {
            clearExitRequest(); // Clear the request immediately
            exitRoom(); // Trigger the exit animation
        }
    }, [exitRequested, isInsideRoom, isAnimating, clearExitRequest, exitRoom]);

    const closeDoor = useCallback(() => {
        if (!doorRef.current || !isOpen) return;
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

        setIsAnimating(true);

        // Reset handle
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        gsap.to(doorRef.current.rotation, {
            y: 0,
            duration: 0.6,
            ease: 'power2.in',
            onComplete: () => {
                setIsOpen(false);
                setIsAnimating(false);
            }
        });
    }, [isOpen]);

    // Handle hover effects
    const handlePointerEnter = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(true);
        document.body.style.cursor = "url('/cursors/cursor-pointer.png'), pointer";

        // Slightly open door on hover
        if (doorRef.current) {
            gsap.to(doorRef.current.rotation, {
                y: side === 'left' ? 0.15 : -0.15,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        // Slightly rotate handle on hover
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: side === 'left' ? 0.1 : -0.1,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    const handlePointerLeave = () => {
        if (isOpen || isAnimating) return;
        setIsHovered(false);
        document.body.style.cursor = "url('/cursors/cursor-default.png'), auto";

        // Close door
        if (doorRef.current) {
            gsap.to(doorRef.current.rotation, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        // Reset handle
        if (handleRef.current) {
            gsap.to(handleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    };

    // Door pivot position - hinges on the side
    const doorPivotX = side === 'left' ? -doorWidth / 2 : doorWidth / 2;
    const doorMeshX = side === 'left' ? doorWidth / 2 : -doorWidth / 2;

    // Handle position on door (based on texture - handle is on the right side for left doors)
    const handlePivotX = side === 'left' ? doorWidth * 0.25 : -doorWidth * 0.25;

    // Sign texture mapping
    const SIGN_TEXTURES = {
        'THE GALLERY': '/textures/corridor/thegallerysign.webp',
        'THE STUDIO': '/textures/corridor/thestudiosign.webp',
        'THE ABOUT': '/textures/corridor/aboutsign.webp',
        "LET'S CONNECT": '/textures/corridor/contactsign.webp',
    };

    const signTextureUrl = SIGN_TEXTURES[label];
    const signTexture = useTexture(signTextureUrl || SIGN_TEXTURES['THE GALLERY']); // Fallback

    return (
        // Outer group at pivot position (outer edge of wall)
        <group position={[pivotX, position[1], position[2]]}>
            {/* Inner group that rotates - contains wall + door */}
            <group ref={groupRef}>
                {/* Wall segment with door hole */}
                <mesh position={[wallOffsetX, 0, 0]} geometry={wallWithHoleGeometry}>
                    <meshStandardMaterial map={wallTexture} roughness={1} metalness={0} side={THREE.DoubleSide} />
                </mesh>

                {/* Door and frame - centered on wall */}
                <group position={[wallOffsetX, -0.4, 0]}>
                    {/* === TEXTURED SIGN === */}
                    <group position={[0, doorHeight / 2 + 0.45, 0.08]}>
                        {/* 
                            WIELKOŚĆ TABLICZKI (SIGN SIZE):
                            Zmień liczby w args={[Szerokość, Wysokość]}
                            Obecnie: 1.3 szerokości, 0.65 wysokości
                        */}
                        <mesh>
                            {/* Adjusted size for the signs - assuming rectangular aspect ratio */}
                            <planeGeometry args={[1.3, 0.65]} />
                            <meshStandardMaterial
                                map={signTexture}
                                transparent={true}
                                alphaTest={0.1}
                                roughness={0.8}
                            />
                        </mesh>
                    </group>

                    {/* === DOOR FRAME (textured) === */}
                    {/* Moved to Z = 0.02 to sit ON TOP of the wall, hiding the hole edges */}
                    <mesh position={[0, -0.1, 0.02]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                        <planeGeometry args={[frameWidth, frameHeight]} />
                        <meshStandardMaterial
                            map={frameTexture}
                            transparent={true}
                            alphaTest={0.1}
                            roughness={0.9}
                        />
                    </mesh>

                    {/* === DOOR INTERIOR CORRIDOR + ROOM === */}
                    {/* Always render, but pass showRoom prop for lazy loading giant room */}
                    <RoomInterior label={label} showRoom={shouldRenderRoom} onReady={handleRoomReady} />

                    {/* === DOOR PANEL (pivots for opening) === */}
                    {/* Pivot Z at 0.01 to be slightly behind frame but in front of wall if needed, or just flush */}
                    <group ref={doorRef} position={[doorPivotX, 0, 0.01]}>
                        {/* Door Front Texture */}
                        <mesh
                            position={[doorMeshX, -0.2, 0]}
                            scale={[side === 'right' ? -1 : 1, 1, 1]}
                            onClick={handleClick}
                            onPointerEnter={handlePointerEnter}
                            onPointerLeave={handlePointerLeave}
                        >
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshStandardMaterial
                                map={doorTexture}
                                transparent={true}
                                alphaTest={0.1}
                                roughness={0.8}
                            />
                        </mesh>

                        {/* Door Back Texture */}
                        <mesh
                            position={[doorMeshX, -0.2, -0.01]}
                            rotation={[0, Math.PI, 0]}
                            scale={[side === 'right' ? -1 : 1, 1, 1]}
                        >
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshStandardMaterial
                                map={doorBackTexture}
                                transparent={true}
                                alphaTest={0.1}
                                roughness={0.8}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* Handle Layer - pivot at screw position */}
                        <group ref={handleRef} position={[doorMeshX + (side === 'left' ? 0.45 : -0.45), -0.29, 0.03]}>
                            <mesh position={[side === 'left' ? -0.50 : 0.50, 0.14, 0]} scale={[side === 'right' ? -1 : 1, 1, 1]}>
                                <planeGeometry args={[doorWidth, doorHeight]} />
                                <meshStandardMaterial
                                    map={handleTexture}
                                    transparent={true}
                                    alphaTest={0.1}
                                    depthWrite={false}
                                />
                            </mesh>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
};

export default DoorSection;
