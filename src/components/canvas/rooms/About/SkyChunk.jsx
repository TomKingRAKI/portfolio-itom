import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SkyChunk Component
 * 
 * A single repeatable segment of sky with clouds.
 * Clouds fade out smoothly when too close to camera.
 */
const CHUNK_LENGTH = 40;
const CHUNK_WIDTH = 20;
const CHUNK_HEIGHT = 12;

const FADE_START_Z = -10;
const FADE_END_Z = -4;

const SkyChunk = ({ chunkIndex = 0, seed = 0 }) => {
    const zOffset = -(chunkIndex * CHUNK_LENGTH) - 15;

    const clouds = useMemo(() => {
        const items = [];
        const random = seededRandom(seed + chunkIndex * 1000);
        const cloudCount = 6 + Math.floor(random() * 4);

        for (let i = 0; i < cloudCount; i++) {
            const x = (random() - 0.5) * CHUNK_WIDTH;
            const y = (random() - 0.5) * CHUNK_HEIGHT;
            const z = zOffset - (random() * CHUNK_LENGTH);

            items.push({
                id: `${chunkIndex}-${i}`,
                position: [x, y, z],
                scale: 0.8 + random() * 1.5,
                baseOpacity: 0.5 + random() * 0.4,
            });
        }

        return items;
    }, [chunkIndex, seed, zOffset]);

    return (
        <group>
            {clouds.map((cloud) => (
                <Cloud
                    key={cloud.id}
                    position={cloud.position}
                    scale={cloud.scale}
                    baseOpacity={cloud.baseOpacity}
                />
            ))}
        </group>
    );
};

// Cloud with SMOOTH dynamic fade
const Cloud = ({ position, scale, baseOpacity }) => {
    const groupRef = useRef();
    const materialsRef = useRef([]);
    const { camera } = useThree();

    // Cached values for smooth fade
    const worldPos = useRef(new THREE.Vector3());
    const currentOpacity = useRef(baseOpacity);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Update world position (reuse object to avoid GC)
        groupRef.current.getWorldPosition(worldPos.current);

        // Calculate relative Z
        const relativeZ = worldPos.current.z - camera.position.z;

        // Target opacity based on distance
        let targetOpacity = baseOpacity;
        if (relativeZ > FADE_END_Z) {
            targetOpacity = 0;
        } else if (relativeZ > FADE_START_Z) {
            const t = (FADE_START_Z - relativeZ) / (FADE_START_Z - FADE_END_Z);
            targetOpacity = baseOpacity * t;
        }

        // SMOOTH lerp to target opacity
        currentOpacity.current = THREE.MathUtils.lerp(
            currentOpacity.current,
            targetOpacity,
            1 - Math.pow(0.01, delta)
        );

        // Apply to materials
        materialsRef.current.forEach(mat => {
            if (mat) mat.opacity = currentOpacity.current;
        });
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <mesh>
                <sphereGeometry args={[1, 8, 8]} />
                <meshStandardMaterial
                    ref={el => materialsRef.current[0] = el}
                    color="#ffffff"
                    transparent
                    opacity={baseOpacity}
                />
            </mesh>
            <mesh position={[-0.7, -0.2, 0.1]}>
                <sphereGeometry args={[0.7, 8, 8]} />
                <meshStandardMaterial
                    ref={el => materialsRef.current[1] = el}
                    color="#ffffff"
                    transparent
                    opacity={baseOpacity}
                />
            </mesh>
            <mesh position={[0.6, -0.1, -0.2]}>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshStandardMaterial
                    ref={el => materialsRef.current[2] = el}
                    color="#ffffff"
                    transparent
                    opacity={baseOpacity}
                />
            </mesh>
        </group>
    );
};

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = Math.sin(s * 9999) * 10000;
        return s - Math.floor(s);
    };
}

export { CHUNK_LENGTH };
export default SkyChunk;
