import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * PaperMaterial
 * A MeshStandardMaterial that supports bending via a custom vertex shader.
 * 
 * Uniforms accessible via ref:
 * - uBend: Float. Controls the amount of bending along the vertical axis.
 * - uBendAxis: Vector2. Direction of bending (not yet implemented, defaults to Y-axis bend).
 */
const PaperMaterial = forwardRef(({ color = '#ffffff', roughness = 0.6, map, side = THREE.DoubleSide, ...props }, ref) => {
    const materialRef = useRef();

    // Shader injection logic
    const onBeforeCompile = useMemo(() => (shader) => {
        // Add uniforms
        shader.uniforms.uBend = { value: 0 };
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uWindStrength = { value: 0 }; // Extra flutter intensity

        // Prepend uniforms to vertex shader
        shader.vertexShader = `
            uniform float uBend;
            uniform float uTime;
            uniform float uWindStrength;
        ` + shader.vertexShader;

        // Inject bending logic before gl_Position
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            
            // Simple parabolic bend
            float bendAmount = pow(transformed.y, 2.0) * uBend;
            transformed.z += bendAmount;

            // Add subtle flutter inspired by wind
            // Base flutter + Extra Wind Strength on hover
            float totalWind = 0.02 + uWindStrength; 
            // SLOWER FLUTTER: Reduced speed (uTime * 2.0) and frequency (y * 2.0)
            float flutter = sin(uTime * 2.0 + transformed.y * 2.0) * totalWind * (1.0 + abs(uBend * 3.0));
            transformed.z += flutter;
            `
        );

        // Store reference to shader to update uniforms later
        materialRef.current.userData.shader = shader;
    }, []);

    useImperativeHandle(ref, () => ({
        // Getter/Setter for bend
        set bend(value) {
            if (materialRef.current?.userData?.shader) {
                materialRef.current.userData.shader.uniforms.uBend.value = value;
            }
        },
        get bend() {
            return materialRef.current?.userData?.shader?.uniforms.uBend.value || 0;
        },
        // Getter/Setter for windStrength
        set windStrength(value) {
            if (materialRef.current?.userData?.shader) {
                materialRef.current.userData.shader.uniforms.uWindStrength.value = value;
            }
        },
        get windStrength() {
            return materialRef.current?.userData?.shader?.uniforms.uWindStrength.value || 0;
        },
        // We can also expose the raw material if needed
        material: materialRef.current
    }));

    useFrame((state) => {
        if (materialRef.current?.userData?.shader) {
            materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <meshStandardMaterial
            ref={materialRef}
            map={map}
            color={color}
            roughness={roughness}
            side={side}
            onBeforeCompile={onBeforeCompile}
            {...props}
        />
    );
});

export default PaperMaterial;
