import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

const StudioRoom = ({ showRoom }) => {
    const groupRef = useRef();
    const towerRef = useRef();

    // Rotation State
    const [isDragging, setIsDragging] = useState(false);
    const [lastX, setLastX] = useState(0);
    const rotationVelocity = useRef(0);
    const autoRotationSpeed = 0.2; // Constant slow spin

    // Config
    // Procedural Generation of "Tech Pyramid"
    const SCREENS = useMemo(() => {
        const items = [];
        let idCounter = 0;

        // Helper for random range
        const rand = (min, max) => Math.random() * (max - min) + min;

        // Structured Layers to avoid intersection
        // We use geometric shapes (hexagon -> pentagon -> square -> triangle)
        const LAYERS_CONFIG = [
            { count: 6, radius: 3.5, y: 0, type: 'tv_crt' },    // Base: Hexagon
            { count: 5, radius: 2.8, y: 1.8, type: 'tv_crt' },  // Pentagon
            { count: 4, radius: 2.0, y: 3.2, type: 'monitor' }, // Square
            { count: 4, radius: 1.2, y: 4.4, type: 'monitor' }, // Square rotated
            { count: 3, radius: 0.6, y: 5.5, type: 'tablet' },  // Triangle
            { count: 1, radius: 0, y: 6.5, type: 'phone' }      // Peak
        ];

        LAYERS_CONFIG.forEach((config, layerIndex) => {
            const angleStep = (Math.PI * 2) / config.count;
            const angleOffset = layerIndex % 2 === 0 ? 0 : angleStep / 2; // Offset alternate layers

            for (let i = 0; i < config.count; i++) {
                const angle = i * angleStep + angleOffset;

                // Add minor Jitter but preserve structure
                const r = config.radius + rand(-0.1, 0.1);
                const x = Math.cos(angle) * r;
                const z = Math.sin(angle) * r;

                // Base Dimensions
                let width = 2, height = 1.5, depth = 1.5;
                if (config.type === 'tv_crt') { width = rand(2.2, 2.6); height = rand(1.6, 2.0); depth = rand(1.5, 2.0); }
                if (config.type === 'monitor') { width = rand(2.0, 2.4); height = rand(1.2, 1.5); depth = rand(0.3, 0.5); }
                if (config.type === 'tablet') { width = rand(1.2, 1.4); height = rand(0.1, 0.15); depth = rand(0.9, 1.1); }
                if (config.type === 'phone') { width = 0.8; height = 1.6; depth = 0.1; }

                items.push({
                    id: idCounter++,
                    type: config.type,
                    color: `hsl(${rand(0, 360)}, 70%, 50%)`,
                    label: config.type === 'phone' ? 'Viral' : `Screen ${idCounter}`,
                    width, height, depth,
                    x,
                    y: config.y,
                    z,
                    // Rotation Y: Face outward (angle) + 90deg offset usually makes it face center or away
                    // Let's test facing OUT from center
                    rot: -angle + Math.PI / 2,
                    rotX: rand(-0.05, 0.05),
                    rotZ: rand(-0.05, 0.05)
                });
            }
        });

        return items;
    }, []);

    // Helper Component for individual screens
    const STACKED_ITEMS = SCREENS;

    // --- INTERACTION ---
    const handlePointerDown = (e) => {
        setIsDragging(true);
        setLastX(e.clientX);
        rotationVelocity.current = 0;
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !towerRef.current) return;

        const deltaX = e.clientX - lastX;
        setLastX(e.clientX);

        // Add to velocity
        rotationVelocity.current = deltaX * 0.005;
        towerRef.current.rotation.y += rotationVelocity.current;
    };

    useEffect(() => {
        window.addEventListener('pointerup', handlePointerUp);
        return () => window.removeEventListener('pointerup', handlePointerUp);
    }, []);

    useFrame((state, delta) => {
        if (!towerRef.current) return;

        if (!isDragging) {
            // Auto rotation + Inertia decay
            towerRef.current.rotation.y += autoRotationSpeed * delta + rotationVelocity.current;
            rotationVelocity.current *= 0.95; // Friction
        }
    });

    const materials = useMemo(() => ({
        floor: new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.8 }),
        tvCase: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4 }),
        screenPlaceholder: new THREE.MeshBasicMaterial({ color: '#000' })
    }), []);

    return (
        <group ref={groupRef} position={[0, -1.2, -2]}>

            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
                <circleGeometry args={[10, 32]} />
                <primitive object={materials.floor} />
            </mesh>

            {/* THE CHAOTIC STACK */}
            <group
                ref={towerRef}
                position={[0, 0, -12]} // <--- TU ZMIENIASZ POZYCJĘ WIEŻY (im mniejsza liczba tym dalej: -8, -10, -12...)
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
            >
                {STACKED_ITEMS.map((item) => (
                    <ScreenBlock key={item.id} item={item} mat={materials} />
                ))}
            </group>

            {/* Instruction Text */}
            <Text position={[0, 0.5, -4]} fontSize={0.3} color="white" >
                Drag to Spin
            </Text>
        </group>
    );
};

// Helper Component for individual screens
const ScreenBlock = ({ item, mat }) => {
    return (
        <group position={[item.x, item.y, item.z]} rotation={[item.rotX, item.rot, item.rotZ]}>
            {/* Case */}
            <mesh>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                <primitive object={mat.tvCase} />
            </mesh>

            {/* Screen (Front Face) - Slightly protruded */}
            <mesh position={[0, 0, item.depth / 2 + 0.01]}>
                <planeGeometry args={[item.width * 0.85, item.height * 0.85]} />
                <meshBasicMaterial color={item.color} />
            </mesh>
        </group>
    );
};

export default StudioRoom;
