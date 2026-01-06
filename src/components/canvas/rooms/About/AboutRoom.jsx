import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Text } from '@react-three/drei';
import * as THREE from 'three';

const AboutRoom = ({ showRoom }) => {
    // Config
    const TUNNEL_LENGTH = 50;

    // Mock Clouds / Islands
    const VISUALS = useMemo(() => {
        const items = [];
        for (let i = 0; i < 30; i++) {
            items.push({
                id: i,
                x: (Math.random() - 0.5) * 15, // Wider spread
                y: (Math.random() - 0.5) * 10,
                z: -5 - (i * 5), // Spread deep into screen
                scale: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? '#ddd' : '#fff'
            });
        }
        return items;
    }, []);

    return (
        <group position={[0, 0, -5]}>
            {/* THE PLANE - Static (World moves around it) */}
            <group position={[0, -0.5, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}> {/* Pointing forward */}
                    <coneGeometry args={[0.2, 1, 4]} />
                    <meshStandardMaterial color="white" />
                </mesh>
            </group>

            {/* THE WORLD (Moves towards player) */}
            <MovingWorld visuals={VISUALS} />

            <ambientLight intensity={0.5} />
        </group>
    );
};

// Separate component to handle scroll state
const MovingWorld = ({ visuals }) => {
    const groupRef = useRef();
    const scrollPos = useRef(0);

    // Speed of flight
    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Auto-flight for prototype "demo" (optional)
        // groupRef.current.position.z = (state.clock.elapsedTime * 2) % 50;
    });

    // We need real scroll. 
    useEffect(() => {
        const onWheel = (e) => {
            // Scroll down -> World moves towards us (+Z) => We fly forward
            scrollPos.current += e.deltaY * 0.01;

            if (groupRef.current) {
                // Modulo for infinite loop
                const LOOP_DIST = 100;
                groupRef.current.position.z = scrollPos.current % LOOP_DIST;
            }
        };
        window.addEventListener('wheel', onWheel);
        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    return (
        <group ref={groupRef}>
            {visuals.map((cloud) => (
                <Cloud key={cloud.id} {...cloud} />
            ))}

            <Text position={[0, 2, -10]} color="black" fontSize={1}>
                SCROLL TO FLY
            </Text>
        </group>
    );
};

const Cloud = ({ x, y, z, scale, color }) => (
    <mesh position={[x, y, z]} scale={scale}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={color} opacity={0.5} transparent />
    </mesh>
);

export default AboutRoom;
