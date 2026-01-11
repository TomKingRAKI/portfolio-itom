import { useMemo, memo, lazy, Suspense } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Lazy load room components
const GalleryRoom = lazy(() => import('../rooms/Gallery/GalleryRoom'));
const StudioRoom = lazy(() => import('../rooms/Studio/StudioRoom'));
const AboutRoom = lazy(() => import('../rooms/About/AboutRoom'));
const ContactRoom = lazy(() => import('../rooms/Contact/ContactRoom'));

// Room configurations
const ROOM_CONFIG = {
    corridorWidth: 2.2,   // Wider "vestibule" feeling
    corridorHeight: 2.4,  // frameHeight - 0.1
    corridorDepth: 2,     // Shorter - quick transition
    roomWidth: 30,
    roomHeight: 20,
    roomDepth: 25
};

const SUBTITLES = {
    'THE GALLERY': 'Explore my creative projects',
    'THE STUDIO': 'Watch behind the scenes',
    'DEV DIARY': 'My development journey',
    "LET'S CONNECT": 'Get in touch with me'
};

/**
 * RoomInterior Component
 * 
 * Memoized room geometry to prevent re-renders and improve performance.
 * Contains corridor + giant room at the end.
 */
const RoomInterior = memo(({ label, showRoom, onReady }) => {
    const { corridorWidth, corridorHeight, corridorDepth, roomWidth, roomHeight, roomDepth } = ROOM_CONFIG;
    const halfDepth = corridorDepth / 2;
    const roomZ = -corridorDepth - roomDepth / 2;

    // Memoize materials to prevent recreation
    const materials = useMemo(() => ({
        corridorWall: new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.9, side: THREE.DoubleSide }),
        corridorFloor: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.95, side: THREE.DoubleSide }),
        corridorCeiling: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide }),
        roomFloor: new THREE.MeshStandardMaterial({ color: '#e5e5e5', roughness: 0.95, side: THREE.DoubleSide }),
        roomCeiling: new THREE.MeshStandardMaterial({ color: '#fafafa', roughness: 0.9, side: THREE.DoubleSide }),
        roomWall: new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.9, side: THREE.DoubleSide }),
        roomBackWall: new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.9, side: THREE.DoubleSide })
    }), []);

    // Memoize geometries
    const geometries = useMemo(() => ({
        corridorSideWall: new THREE.PlaneGeometry(corridorDepth, corridorHeight),
        corridorFloorCeiling: new THREE.PlaneGeometry(corridorWidth, corridorDepth),
        roomFloorCeiling: new THREE.PlaneGeometry(roomWidth, roomDepth),
        roomSideWall: new THREE.PlaneGeometry(roomDepth, roomHeight),
        roomBackWall: new THREE.PlaneGeometry(roomWidth, roomHeight)
    }), []);

    const isGallery = label === 'THE GALLERY';

    return (
        <group position={[0, -0.149, 0]}>
            {/* === CORRIDOR (The "Mini-Corridor" Transition) === */}
            {/* Left wall */}
            <mesh
                position={[-corridorWidth / 2, 0, -halfDepth]}
                rotation={[0, Math.PI / 2, 0]}
                geometry={geometries.corridorSideWall}
                material={materials.corridorWall}
            />

            {/* Right wall */}
            <mesh
                position={[corridorWidth / 2, 0, -halfDepth]}
                rotation={[0, -Math.PI / 2, 0]}
                geometry={geometries.corridorSideWall}
                material={materials.corridorWall}
            />

            {/* Floor */}
            <mesh
                position={[0, -corridorHeight / 2, -halfDepth]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={geometries.corridorFloorCeiling}
                material={materials.corridorFloor}
            />

            {/* Ceiling */}
            <mesh
                position={[0, corridorHeight / 2, -halfDepth]}
                rotation={[Math.PI / 2, 0, 0]}
                geometry={geometries.corridorFloorCeiling}
                material={materials.corridorCeiling}
            />

            {/* === ROOM CONTENT === */}
            {showRoom && (
                <group>
                    {isGallery ? (
                        // === NEW GALLERY ROOM ===
                        // Positioned at the end of the corridor
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <GalleryRoom showRoom={showRoom} onReady={onReady} />
                            </Suspense>
                        </group>
                    ) : label === 'THE STUDIO' ? (
                        // === NEW STUDIO ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <StudioRoom showRoom={showRoom} onReady={onReady} />
                            </Suspense>
                        </group>
                    ) : label === 'THE ABOUT' ? (
                        // === NEW ABOUT ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <AboutRoom showRoom={showRoom} onReady={onReady} />
                            </Suspense>
                        </group>
                    ) : label === "LET'S CONNECT" ? (
                        // === NEW CONTACT ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <ContactRoom showRoom={showRoom} onReady={onReady} />
                            </Suspense>
                        </group>
                    ) : (
                        // === DEFAULT GENERIC ROOM (For other sections) ===
                        <group position={[0, roomHeight / 2 - corridorHeight / 2, roomZ]}>
                            {/* Floor */}
                            <mesh
                                position={[0, -roomHeight / 2, 0]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                geometry={geometries.roomFloorCeiling}
                                material={materials.roomFloor}
                            />

                            {/* Floor grid */}
                            <gridHelper
                                args={[Math.min(roomWidth, roomDepth), 20, '#cccccc', '#dddddd']}
                                position={[0, -roomHeight / 2 + 0.01, 0]}
                            />

                            {/* Ceiling */}
                            <mesh
                                position={[0, roomHeight / 2, 0]}
                                rotation={[Math.PI / 2, 0, 0]}
                                geometry={geometries.roomFloorCeiling}
                                material={materials.roomCeiling}
                            />

                            {/* Back wall */}
                            <mesh
                                position={[0, 0, -roomDepth / 2]}
                                geometry={geometries.roomBackWall}
                                material={materials.roomBackWall}
                            />

                            {/* Left wall */}
                            <mesh
                                position={[-roomWidth / 2, 0, 0]}
                                rotation={[0, Math.PI / 2, 0]}
                                geometry={geometries.roomSideWall}
                                material={materials.roomWall}
                            />

                            {/* Right wall */}
                            <mesh
                                position={[roomWidth / 2, 0, 0]}
                                rotation={[0, -Math.PI / 2, 0]}
                                geometry={geometries.roomSideWall}
                                material={materials.roomWall}
                            />

                            {/* Title */}
                            <Text
                                position={[0, 2, -roomDepth / 2 + 2]}
                                fontSize={4}
                                color="#1a1a1a"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={roomWidth * 0.8}
                                textAlign="center"
                            >
                                {label}
                            </Text>

                            {/* Subtitle */}
                            <Text
                                position={[0, -1, -roomDepth / 2 + 2]}
                                fontSize={0.8}
                                color="#666666"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={roomWidth * 0.7}
                                textAlign="center"
                            >
                                {SUBTITLES[label] || ''}
                            </Text>

                            {/* Lighting */}
                            <pointLight position={[0, roomHeight / 2 - 2, 0]} intensity={1} distance={40} color="#ffffff" />
                            <pointLight position={[0, 0, -roomDepth / 4]} intensity={0.5} distance={30} color="#fffaf0" />
                        </group>
                    )}
                </group>
            )}
        </group>
    );
});

RoomInterior.displayName = 'RoomInterior';

export default RoomInterior;
