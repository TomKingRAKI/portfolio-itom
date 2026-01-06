import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const ContactRoom = ({ showRoom }) => {
    // Refs
    const groupRef = useRef();
    const receiverRef = useRef();

    // State
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    // Placeholder interaction
    const handlePhoneClick = () => {
        alert("Ring Ring! (Opening Email...)");
        // window.location.href = "mailto:contact@itom.com";
    };

    return (
        <group position={[0, -1.2, -12]}>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
                <circleGeometry args={[10, 32]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* PHONE BOOTH STRUCTURE */}
            <group position={[0, 1.2, 0]}>
                {/* Frame */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.5, 2.4, 1.5]} />
                    <meshStandardMaterial color="#c00" wireframe /> {/* Red wireframe placeholder */}
                </mesh>

                {/* Glass Panels (Ghostly) */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.4, 2.3, 1.4]} />
                    <meshStandardMaterial color="#aaf" opacity={0.1} transparent />
                </mesh>

                {/* THE PHONE UNIT */}
                <group position={[0, 0.2, -0.4]}>
                    {/* Body */}
                    <mesh>
                        <boxGeometry args={[0.4, 0.6, 0.2]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>

                    {/* Receiver (Handset) */}
                    <mesh
                        ref={receiverRef}
                        position={[0.3, 0.1, 0.1]}
                        rotation={[0, 0, 0.5]}
                        onClick={handlePhoneClick}
                        onPointerOver={() => setHover(true)}
                        onPointerOut={() => setHover(false)}
                    >
                        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
                        <meshStandardMaterial color={hovered ? "#f00" : "#111"} />

                        {/* Cord (Visual only for now) */}
                    </mesh>

                    {/* Dial / Buttons */}
                    <group position={[-0.1, -0.1, 0.11]}>
                        <mesh>
                            <circleGeometry args={[0.15, 16]} />
                            <meshBasicMaterial color="#eee" />
                        </mesh>
                    </group>
                </group>

                {/* Overhead Light */}
                <pointLight position={[0, 1, 0]} intensity={1} distance={3} color="orange" />
            </group>

            {/* Labels */}
            <Text position={[0, 2.6, 0]} fontSize={0.2} color="white">
                CALL ME
            </Text>

            {/* Links as floating cards nearby */}
            <ContactLink position={[-1.2, 1.5, 0.5]} label="LINKEDIN" color="#0077b5" />
            <ContactLink position={[1.2, 1.5, 0.5]} label="GITHUB" color="#333" />
            <ContactLink position={[0, 0.5, 1]} label="EMAIL" color="#ea4335" />

        </group>
    );
};

const ContactLink = ({ position, label, color }) => {
    const [hover, setHover] = useState(false);
    useCursor(hover);

    return (
        <group
            position={position}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <mesh scale={hover ? 1.1 : 1}>
                <planeGeometry args={[0.8, 0.3]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <Text position={[0, 0, 0.01]} fontSize={0.1} color="white">
                {label}
            </Text>
        </group>
    );
};

export default ContactRoom;
