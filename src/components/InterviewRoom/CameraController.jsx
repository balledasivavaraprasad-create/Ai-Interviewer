import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInterview } from '../../context/InterviewContext';

export const CameraController = ({ mousePos }) => {
  const { transitionSubphase } = useInterview();
  const { camera } = useThree();

  const currentCamPos = useRef(new THREE.Vector3(0, 0.4, 6.6));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    // Determine target camera position and lookAt depending on cinematic subphase
    let targetX = 0;
    let targetY = 0.4;
    let targetZ = 6.6;

    let lookAtX = 0;
    let lookAtY = 0;
    let lookAtZ = 0;

    let lerpSpeed = 0.04;

    switch (transitionSubphase) {
      case 'fade-ui':
        // Establishing wide shot
        targetX = 0;
        targetY = 0.35;
        targetZ = 6.4;
        lerpSpeed = 0.03;
        break;

      case 'camera-push':
        // Camera starts moving forward
        targetX = 0.02;
        targetY = 0.22;
        targetZ = 5.8;
        lerpSpeed = 0.04;
        break;

      case 'entering-office':
        // Pushing in through office doors
        targetX = 0.04;
        targetY = 0.10;
        targetZ = 5.2;
        lerpSpeed = 0.045;
        break;

      case 'settling':
        // Approaching desk, decelerating
        targetX = 0.04;
        targetY = 0.02;
        targetZ = 4.8;
        lerpSpeed = 0.04;
        break;

      case 'reveal-interviewer':
      case 'ready':
      default:
        // Final professional medium shot: centered slightly off-axis
        // Subtly responsive to candidate mouse parallax
        const mouseParallaxX = (mousePos.current.x - 0.5) * 0.22;
        const mouseParallaxY = -(mousePos.current.y - 0.5) * 0.12;

        targetX = 0.05 + mouseParallaxX;
        targetY = -0.05 + mouseParallaxY;
        targetZ = 4.65;
        lookAtX = 0.02 + mouseParallaxX * 0.5;
        lookAtY = -0.1 + mouseParallaxY * 0.5;
        lerpSpeed = 0.04;
        break;
    }

    // Smooth camera position interpolation
    currentCamPos.current.x = THREE.MathUtils.lerp(currentCamPos.current.x, targetX, lerpSpeed);
    currentCamPos.current.y = THREE.MathUtils.lerp(currentCamPos.current.y, targetY, lerpSpeed);
    currentCamPos.current.z = THREE.MathUtils.lerp(currentCamPos.current.z, targetZ, lerpSpeed);

    camera.position.copy(currentCamPos.current);

    // Smooth camera lookAt interpolation
    currentLookAt.current.x = THREE.MathUtils.lerp(currentLookAt.current.x, lookAtX, lerpSpeed);
    currentLookAt.current.y = THREE.MathUtils.lerp(currentLookAt.current.y, lookAtY, lerpSpeed);
    currentLookAt.current.z = THREE.MathUtils.lerp(currentLookAt.current.z, lookAtZ, lerpSpeed);

    camera.lookAt(currentLookAt.current);
  });

  return null;
};
