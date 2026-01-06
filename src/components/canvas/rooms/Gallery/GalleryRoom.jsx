import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

const PROJECT_COUNT = 5; // Placeholder count
const GAP = 2.5; // Distance between cards

const GalleryRoom = ({ showRoom }) => {
    const groupRef = useRef();
    const [scrollOffset, setScrollOffset] = useState(0);
    const targetScroll = useRef(0);
    const currentScroll = useRef(0);

    // Config
    const BALCONY_WIDTH = 5;
    const BALCONY_DEPTH = 3;
    const RAILING_HEIGHT = 1.1;

    // --- INTERACTION ---
    useEffect(() => {
        const handleWheel = (e) => {
            if (!showRoom) return;
            // Horizontal scroll feeling
            targetScroll.current += e.deltaY * 0.005;
            // Clamp scroll to projects range
            const maxScroll = (PROJECT_COUNT - 1) * GAP;
            targetScroll.current = THREE.MathUtils.clamp(targetScroll.current, -2, maxScroll + 2);
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [showRoom]);

    useFrame((state, delta) => {
        // Smooth scroll damping
        currentScroll.current = THREE.MathUtils.lerp(currentScroll.current, targetScroll.current, delta * 5);

        // DEBUG LOGGING (Run every ~60 frames)
        if (state.clock.elapsedTime % 1 < 0.02) {
            console.log("CAMERA POS:", state.camera.position);
            console.log("CAMERA ROT:", state.camera.rotation);
            const worldPos = new THREE.Vector3();
            groupRef.current?.getWorldPosition(worldPos);
            console.log("GALLERY WORLD POS:", worldPos);
        }
    });

    // --- GEOMETRY & MATERIALS ---
    // Load textures
    const floorTexture = useTexture('/textures/entrance/floor_paper.webp');
    // const skyTexture = useTexture('/textures/paper-texture.webp'); // Uncomment when ready

    const materials = useMemo(() => {
        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture,
            color: '#aaaaaa', // Slightly darken to separate from paper
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        return {
            floor: floorMat,
            railing: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.8 }), // Dark iron/wood
            rope: new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 1 }), // Dark brown rope
            card: new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.6 }) // White paper
        };
    }, [floorTexture]);

    // Clothesline Curve - Adjusted to be higher and more visible
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(-8, 2.5, -4),
            new THREE.Vector3(-4, 2.0, -3.5),
            new THREE.Vector3(0, 1.8, -3),   // Closest point
            new THREE.Vector3(4, 2.0, -3.5),
            new THREE.Vector3(8, 2.5, -4),
        ]);
    }, []);

    // Generate points for the rope mesh
    const ropeGeometry = useMemo(() => {
        return new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
    }, [curve]);

    return (
        <group ref={groupRef}>
            {/* === THE BALCONY === */}
            {/* Shifted so camera stands on the edge */}
            <group position={[0, -0.7, -1]}>
                {/* Floor - Extended Deeply */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, -5]} // Center point pushed back
                >
                    <planeGeometry args={[10, 14]} /> {/* Much deeper floor */}
                    <primitive object={materials.floor} />
                </mesh>

                {/* Railing - Pushed far back */}
                <group position={[0, 0, -2]}>
                    {/* Top Rail */}
                    <mesh position={[0, RAILING_HEIGHT, -8]}> {/* Z = -10 global approx */}
                        <boxGeometry args={[10, 0.1, 0.2]} />
                        <primitive object={materials.railing} />
                    </mesh>

                    {/* Posts */}
                    {[-4.8, -2.5, 0, 2.5, 4.8].map((x, i) => (
                        <mesh key={i} position={[x, RAILING_HEIGHT / 2, -8]}>
                            <boxGeometry args={[0.1, RAILING_HEIGHT, 0.1]} />
                            <primitive object={materials.railing} />
                        </mesh>
                    ))}
                </group>

                {/* === CLOTHESLINE SYSTEM === */}
                <group position={[0, 0.5, -9]}> {/* Pushed behind railing */}
                    {/* The Rope */}
                    <mesh geometry={ropeGeometry} material={materials.rope} />

                    {/* Proj Cards */}
                    {Array.from({ length: PROJECT_COUNT }).map((_, i) => (
                        <ProjectCard
                            key={i}
                            index={i}
                            total={PROJECT_COUNT}
                            currentScroll={currentScroll}
                            materials={materials}
                            curve={curve}
                        />
                    ))}
                </group>

                {/* === ENVIRONMENT / SKYBOX === */}
                {/* Placeholder Fog Sphere */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#f0f0f0" side={THREE.BackSide} transparent opacity={0.5} />
                </mesh>
            </group>
        </group>
    );
};

// Sub-component for individual project cards
const ProjectCard = ({ index, currentScroll, materials, curve }) => {
    const cardRef = useRef();
    // Random sway properties
    const swaySpeed = useRef(Math.random() * 0.5 + 0.5);
    const swayOffset = useRef(Math.random() * 100);

    useFrame((state) => {
        if (!cardRef.current) return;

        // Calculate position along the horizontal axis based on scroll
        // Center the collection (index * gap) minus scroll
        const initialX = (index - 2) * GAP; // Centered around 0 for 5 items
        const xPos = initialX - currentScroll.current + ((index * GAP)); // Adjusted

        // We want to map this xPos to the curve
        // Simple approximation: find point on curve where x matches xPos
        // Since curve is mostly along X, we can estimate t roughly
        // Range of curve X is approx -10 to 10.

        // Let's manually position for now relative to center
        // The projects move LEFT as we scroll RIGHT (standard feel)
        const displayX = (index * GAP) - currentScroll.current;

        // To stick to the curve, we find the Y and Z for this X
        // Function of the parabola/catenary approx: y = a*x^2 + c
        // Our points: (0, 2), (10, 3) -> y = 0.01*x^2 + 2
        const yBase = 2 + 0.01 * (displayX * displayX);
        const zBase = -5 - 0.01 * (displayX * displayX); // Slight curve back

        cardRef.current.position.set(displayX, yBase, zBase);

        // Wind / Sway Animation
        const time = state.clock.getElapsedTime();
        const wind = Math.sin(time * swaySpeed.current + swayOffset.current) * 0.1;

        // Rotate slightly based on movement + wind
        cardRef.current.rotation.z = wind;

        // Visibility Check (fade out if too far)
        const dist = Math.abs(displayX);
        const scale = THREE.MathUtils.clamp(1 - (dist / 10), 0, 1);
        cardRef.current.scale.setScalar(scale);
    });

    return (
        <group ref={cardRef}>
            {/* Clothespin (Top Center) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.05, 0.1, 0.05]} />
                <meshStandardMaterial color="#8b4513" />
            </mesh>

            {/* The Paper / Card hanging down */}
            {/* Pivot is at top (0,0,0) so we offset mesh down */}
            <group position={[0, -1.1, 0]}>
                <mesh material={materials.card}>
                    <planeGeometry args={[1.5, 2]} />
                </mesh>
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.2}
                    color="#333"
                    anchorX="center"
                    anchorY="middle"
                >
                    PROJECT {index + 1}
                </Text>
            </group>
        </group>
    );
};

export default GalleryRoom;
