import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const OfficeEnvironment = () => {
  const dustParticlesRef = useRef();

  // Create subtle floating dust particles catching window light
  const particleCount = 75;
  const { positions, randomFactors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const rand = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = Math.random() * 4 + 0.5;
      rand[i] = Math.random() * 10;
    }

    return { positions: pos, randomFactors: rand };
  }, [particleCount]);

  useFrame((state) => {
    if (!dustParticlesRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = dustParticlesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      // Gentle floating motion
      positions[i * 3 + 1] += Math.sin(time * 0.4 + randomFactors[i]) * 0.0015;
      positions[i * 3 + 0] += Math.cos(time * 0.3 + randomFactors[i]) * 0.001;
    }
    dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* ------------------------------------------------------------------ */}
      {/* CINEMATIC LIGHTING RIG                                             */}
      {/* ------------------------------------------------------------------ */}

      {/* Primary Key Light: Soft daylight entering from window on the left */}
      <directionalLight
        position={[-6, 4.5, 4]}
        intensity={1.25}
        color="#F0F4FA"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Secondary Fill Light: Warm ceiling executive luminaire */}
      <pointLight
        position={[3.5, 5, 2.5]}
        intensity={0.65}
        color="#FDE8D0"
        distance={12}
        decay={2}
      />

      {/* Subtle Rim / Backlight for subject separation */}
      <directionalLight
        position={[0, 4, -4]}
        intensity={0.3}
        color="#E5ECF6"
      />

      {/* Ambient office fill */}
      <ambientLight intensity={0.55} color="#181D26" />

      {/* ------------------------------------------------------------------ */}
      {/* ARCHITECTURAL ELEMENTS                                             */}
      {/* ------------------------------------------------------------------ */}

      {/* Back Wall Plane */}
      <mesh position={[0, 0, -2.5]} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial
          color="#161A23"
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Floor with subtle sheen */}
      <mesh position={[0, -3.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial
          color="#0B0D13"
          roughness={0.38}
          metalness={0.15}
        />
      </mesh>

      {/* Ceiling Plane */}
      <mesh position={[0, 4.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial
          color="#10131A"
          roughness={0.95}
        />
      </mesh>

      {/* Left Wall Window Frame Divider */}
      <mesh position={[-5.8, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          color="#0D1017"
          roughness={0.8}
        />
      </mesh>

      {/* ------------------------------------------------------------------ */}
      {/* FLOATING DUST PARTICLES (ATMOSPHERE)                               */}
      {/* ------------------------------------------------------------------ */}
      <points ref={dustParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#E8E2D8"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
