import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

// Shape types
const SHAPE_TYPES = ['icosahedron', 'octahedron', 'tetrahedron'];

// Random helpers
const random = (min, max) => Math.random() * (max - min) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Single floating wireframe shape
 */
const FloatingShape = ({ position, shapeType, rotationSpeed, initialRotation, size }) => {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * rotationSpeed.x;
            meshRef.current.rotation.y += delta * rotationSpeed.y;
        }
    });

    const geometry = useMemo(() => {
        switch (shapeType) {
            case 'icosahedron':
                return <icosahedronGeometry args={[size, 0]} />;
            case 'octahedron':
                return <octahedronGeometry args={[size, 0]} />;
            case 'tetrahedron':
                return <tetrahedronGeometry args={[size, 0]} />;
            default:
                return <icosahedronGeometry args={[size, 0]} />;
        }
    }, [shapeType, size]);

    return (
        <mesh ref={meshRef} position={position} rotation={initialRotation}>
            {geometry}
            <meshBasicMaterial
                wireframe={true}
                color="#333333"
                opacity={0.3}
                transparent={true}
            />
        </mesh>
    );
};

/**
 * FloatingShapes - Decorative wireframe geometry
 * Positioned carefully within corridor bounds
 */
const FloatingShapes = ({ count = 12 }) => {
    const shapes = useMemo(() => {
        return Array(count).fill(null).map((_, i) => ({
            id: i,
            position: [
                random(-2, 2),          // Within corridor width
                random(-0.5, 1.5),      // Floor to ceiling
                random(-15, 1)          // Along corridor
            ],
            shapeType: randomItem(SHAPE_TYPES),
            size: random(0.12, 0.28),
            rotationSpeed: {
                x: random(0.08, 0.18) * (Math.random() > 0.5 ? 1 : -1),
                y: random(0.08, 0.18) * (Math.random() > 0.5 ? 1 : -1),
            },
            initialRotation: [random(0, Math.PI * 2), random(0, Math.PI * 2), 0]
        }));
    }, [count]);

    return (
        <group>
            {shapes.map((shape) => (
                <FloatingShape key={shape.id} {...shape} />
            ))}
        </group>
    );
};

export default FloatingShapes;
