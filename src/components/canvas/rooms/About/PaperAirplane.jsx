import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * PaperAirplane Component
 * 
 * A low-poly origami-style paper airplane.
 * Built with BufferGeometry for full control over the shape.
 */
const PaperAirplane = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color = '#f5f5f5' }) => {
    const meshRef = useRef();

    // Create paper airplane geometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();

        // Classic paper airplane shape - seen from above pointing forward (-Z)
        // All measurements in local space, centered at origin
        const vertices = new Float32Array([
            // === MAIN BODY (Top surface) ===
            // Nose tip
            0, 0, -1.5,           // 0: Front tip

            // Wing tips (wide)
            -1.2, 0.05, 0.3,      // 1: Left wing tip
            1.2, 0.05, 0.3,       // 2: Right wing tip

            // Body fold line (center crease, slightly raised)
            0, 0.15, -0.5,        // 3: Front of fold
            0, 0.12, 0.5,         // 4: Back of fold

            // Tail
            -0.3, 0.08, 0.8,      // 5: Left tail
            0.3, 0.08, 0.8,       // 6: Right tail
            0, 0.1, 0.6,          // 7: Tail center (top)

            // === UNDERSIDE (Bottom vertices - mirror but slightly lower) ===
            0, -0.02, -1.5,       // 8: Nose bottom
            -1.2, -0.02, 0.3,     // 9: Left wing bottom
            1.2, -0.02, 0.3,      // 10: Right wing bottom
            0, 0, 0.5,            // 11: Tail center bottom
        ]);

        // Triangle indices for faces
        const indices = [
            // === TOP SURFACE ===
            // Left wing (nose to wing tip to fold)
            0, 1, 3,
            1, 4, 3,
            1, 5, 4,
            5, 7, 4,

            // Right wing (nose to fold to wing tip)
            0, 3, 2,
            3, 4, 2,
            4, 6, 2,
            4, 7, 6,

            // === BOTTOM SURFACE ===
            // Left underside
            8, 11, 9,

            // Right underside  
            8, 10, 11,

            // === SIDE CONNECTIONS (edges) ===
            // Left edge
            0, 8, 1,
            8, 9, 1,
            1, 9, 5,

            // Right edge
            0, 2, 8,
            8, 2, 10,
            2, 6, 10,

            // Back edge
            5, 9, 11,
            5, 11, 7,
            6, 7, 11,
            6, 11, 10,
        ];

        geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        return geo;
    }, []);

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <mesh ref={meshRef} geometry={geometry}>
                <meshStandardMaterial
                    color={color}
                    side={THREE.DoubleSide}
                    roughness={0.7}
                    metalness={0}
                    flatShading={true}
                />
            </mesh>

            {/* Subtle fold line accent */}
            <mesh position={[0, 0.16, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.02, 0.01, 1.8]} />
                <meshBasicMaterial color="#e0e0e0" />
            </mesh>
        </group>
    );
};

export default PaperAirplane;
