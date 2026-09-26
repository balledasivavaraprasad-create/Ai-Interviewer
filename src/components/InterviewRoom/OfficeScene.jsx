import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraController } from './CameraController';
import { OfficeEnvironment } from './OfficeEnvironment';
import { InterviewerAvatar } from './InterviewerAvatar';

const SceneLoadingFallback = () => {
  return (
    <div className="preparing-room-overlay">
      <div className="preparing-spinner" />
      <div className="preparing-title">Preparing your interview room...</div>
      <div className="preparing-subtitle">Calibrating environment & lighting</div>
    </div>
  );
};

export const OfficeScene = () => {
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current.x = e.clientX / window.innerWidth;
      mousePos.current.y = e.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="office-viewport-container">
      <Suspense fallback={<SceneLoadingFallback />}>
        <Canvas
          className="canvas-container"
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: [0, 0.4, 6.6], fov: 46, near: 0.1, far: 50 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color('#08090D'), 1);
          }}
        >
          <CameraController mousePos={mousePos} />
          <OfficeEnvironment />
          <InterviewerAvatar mousePos={mousePos} />
        </Canvas>
      </Suspense>
    </div>
  );
};
