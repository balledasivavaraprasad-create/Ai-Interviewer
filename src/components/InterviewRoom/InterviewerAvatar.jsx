import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useInterview } from '../../context/InterviewContext';
import { InterviewerLipSyncController } from '../../controllers/avatar/InterviewerLipSyncController';
import { InterviewerFacialController } from '../../controllers/avatar/InterviewerFacialController';
import { InterviewerAnimationController } from '../../controllers/avatar/InterviewerAnimationController';
import { AudioAnalyzer } from '../../services/speech/AudioAnalyzer';
import { getFaceRig } from '../../services/vision/FaceRigService';

// High-precision vertex shader with depth displacement, breathing, and posture motion
const avatarVertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uBreathingIntensity;
  uniform float uDisplacementScale;
  uniform vec2 uHeadOffset;
  uniform float uHeadTilt;
  uniform sampler2D uDepthMap;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDepth;

  void main() {
    vUv = uv;
    
    // Sample depth from displacement map (0.0 = background, 1.0 = foreground/person)
    float depth = texture2D(uDepthMap, uv).r;
    vDepth = depth;

    vec3 pos = position;

    // Organic breathing wave: affects chest and shoulders (uv.y between 0.2 and 0.7)
    float breathRate = 1.35;
    float breathWave = sin(uTime * breathRate) * 0.5 + 0.5;
    breathWave = smoothstep(0.1, 0.9, breathWave);
    
    // Chest / Torso vertical & forward expansion
    float chestMask = smoothstep(0.15, 0.45, uv.y) * smoothstep(0.85, 0.45, uv.y) * smoothstep(0.35, 0.85, depth);
    float breathDisplacement = breathWave * uBreathingIntensity * chestMask;
    
    // Subtle head micro-motion (slight idle tilt & sway)
    float headMask = smoothstep(0.48, 0.95, uv.y) * smoothstep(0.45, 0.9, depth);
    vec2 headSway = uHeadOffset * headMask;

    // Subtle head tilt (rotation around Z axis)
    if (headMask > 0.05) {
      float pivotX = 0.0;
      float pivotY = 0.5;
      float angle = uHeadTilt * headMask;
      float cosA = cos(angle);
      float sinA = sin(angle);
      float rx = pos.x - pivotX;
      float ry = pos.y - pivotY;
      pos.x = pivotX + (rx * cosA - ry * sinA);
      pos.y = pivotY + (rx * sinA + ry * cosA);
    }

    // Parallax response to mouse / camera
    vec2 parallax = (uMouse - 0.5) * (1.0 - depth) * 0.12;

    // Apply displacements
    pos.x += headSway.x + parallax.x;
    pos.y += headSway.y + (breathDisplacement * 0.4) + parallax.y;
    pos.z += (depth * uDisplacementScale) + breathDisplacement;

    vNormal = normalMatrix * normal;
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader with real-time viseme mouth morphing, eyelid blinks, and normal lighting
const avatarFragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform float uTime;
  uniform float uBlink;
  uniform float uEyebrowRaise;
  uniform float uJawOpen;
  uniform float uLipWidth;
  uniform float uLipPucker;
  uniform float uUpperLipRaise;
  uniform float uLowerLipDepress;
  uniform float uLipClose;
  uniform float uMouthCornerPull;
  uniform float uChinRaise;
  uniform vec2 uMouthCenter;
  uniform float uMouthWidth;
  uniform vec2 uEyeCenter;
  uniform float uEyebrowY;
  uniform float uChinY;
  uniform vec3 uKeyLightColor;
  uniform vec3 uFillLightColor;
  uniform float uFadeIn;
  uniform int uState; // 0=IDLE, 1=LISTENING, 2=THINKING, 3=SPEAKING

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDepth;

  void main() {
    vec2 uv = vUv;

    // -------------------------------------------------------------------------
    // 1. Viseme Mouth Morphing using CV Landmarked Coordinates
    // -------------------------------------------------------------------------
    vec2 mouthCenter = uMouthCenter;
    float distToMouthX = abs(uv.x - mouthCenter.x);
    float distToMouthY = abs(uv.y - mouthCenter.y);

    if (distToMouthX < (uMouthWidth * 1.35) && uv.y > (uChinY - 0.01) && uv.y < (mouthCenter.y + 0.07)) {
      float mouthHorizMask = smoothstep(uMouthWidth * 1.15, 0.0, distToMouthX);

      // Jaw and Lower Lip Depress
      if (uv.y <= mouthCenter.y) {
        float lowerJawInfluence = smoothstep(uChinY, mouthCenter.y, uv.y) * mouthHorizMask;
        uv.y += (uJawOpen * 0.024 + uLowerLipDepress * 0.016) * lowerJawInfluence;
      }

      // Upper Lip Raise
      if (uv.y > mouthCenter.y && uv.y < (mouthCenter.y + 0.065)) {
        float upperLipInfluence = smoothstep(mouthCenter.y + 0.065, mouthCenter.y, uv.y) * mouthHorizMask;
        uv.y -= uUpperLipRaise * 0.012 * upperLipInfluence;
      }

      // Lip Width
      float cornerInfluence = smoothstep(uMouthWidth * 0.15, uMouthWidth * 0.75, distToMouthX) * smoothstep(0.05, 0.0, distToMouthY);
      uv.x += (uv.x - mouthCenter.x) * uLipWidth * cornerInfluence * 0.32;

      // Lip Pucker
      float puckerRadius = length(uv - mouthCenter);
      float puckerInfluence = smoothstep(uMouthWidth * 0.85, 0.0, puckerRadius);
      uv.x -= (uv.x - mouthCenter.x) * uLipPucker * puckerInfluence * 0.26;
      uv.y -= (uv.y - mouthCenter.y) * uLipPucker * puckerInfluence * 0.15;
    }

    // -------------------------------------------------------------------------
    // 2. Eyebrow Micro-Expressions anchored to CV Eyebrows
    // -------------------------------------------------------------------------
    if (abs(uv.y - uEyebrowY) < 0.045 && abs(uv.x - 0.502) < 0.15) {
      float browInfluence = smoothstep(0.045, 0.0, abs(uv.y - uEyebrowY)) * smoothstep(0.15, 0.0, abs(uv.x - 0.502));
      uv.y += uEyebrowRaise * browInfluence * 0.018;
    }

    // -------------------------------------------------------------------------
    // 3. Eyelid Micro-Blinks anchored to CV Eyes
    // -------------------------------------------------------------------------
    if (uBlink > 0.005) {
      float distY = abs(uv.y - uEyeCenter.y);
      float distX = abs(uv.x - uEyeCenter.x);
      
      if (distY < 0.040 && distX < 0.12) {
        float eyeMask = smoothstep(0.040, 0.0, distY) * smoothstep(0.12, 0.0, distX);
        uv.y += (uv.y - uEyeCenter.y) * uBlink * eyeMask * 0.44;
      }
    }

    vec4 texColor = texture2D(uTexture, uv);

    // -------------------------------------------------------------------------
    // 4. Subtle Oral Cavity Depth Shadowing
    // -------------------------------------------------------------------------
    if (uJawOpen > 0.12 && distToMouthX < (uMouthWidth * 0.6) && distToMouthY < 0.022) {
      float mouthInterior = smoothstep(uMouthWidth * 0.6, 0.0, distToMouthX) * smoothstep(0.022, 0.0, distToMouthY);
      float shadowFactor = 1.0 - (mouthInterior * uJawOpen * 0.35);
      texColor.rgb *= shadowFactor;
    }

    // -------------------------------------------------------------------------
    // 5. Normal & Room Lighting Interaction
    // -------------------------------------------------------------------------
    vec2 texelSize = vec2(1.0 / 1024.0, 1.0 / 571.0);
    float depthLeft = texture2D(uDepthMap, uv - vec2(texelSize.x * 2.0, 0.0)).r;
    float depthRight = texture2D(uDepthMap, uv + vec2(texelSize.x * 2.0, 0.0)).r;
    float depthDown = texture2D(uDepthMap, uv - vec2(0.0, texelSize.y * 2.0)).r;
    float depthUp = texture2D(uDepthMap, uv + vec2(0.0, texelSize.y * 2.0)).r;

    vec3 normalMod = normalize(vec3((depthLeft - depthRight) * 1.5, (depthDown - depthUp) * 1.5, 1.0));

    // Window light from top-left (natural daylight)
    vec3 windowLightDir = normalize(vec3(-0.6, 0.4, 0.7));
    float diffKey = max(dot(normalMod, windowLightDir), 0.0);

    // Warm ceiling office practical light
    vec3 warmLightDir = normalize(vec3(0.3, 0.8, 0.5));
    float diffWarm = max(dot(normalMod, warmLightDir), 0.0);

    // Subtle ambient lighting modulation
    vec3 ambient = vec3(0.92, 0.93, 0.96);
    vec3 lighting = ambient + (diffKey * vec3(0.14, 0.15, 0.18)) + (diffWarm * vec3(0.10, 0.08, 0.05));
    
    vec3 finalColor = texColor.rgb * lighting;

    // Apply fade-in during entrance transition
    gl_FragColor = vec4(finalColor, texColor.a * uFadeIn);
  }
`;

export const InterviewerAvatar = ({ mousePos }) => {
  const { selectedInterviewer, avatarState, transitionSubphase } = useInterview();
  const meshRef = useRef();
  const materialRef = useRef();

  // Retrieve calibrated face rig for selected interviewer persona
  const faceRig = useMemo(() => getFaceRig(selectedInterviewer.id), [selectedInterviewer.id]);

  // Instantiate dedicated modular sub-controllers
  const lipSyncController = useMemo(() => new InterviewerLipSyncController(), []);
  const facialController = useMemo(() => new InterviewerFacialController(), []);
  const animationController = useMemo(() => new InterviewerAnimationController(), []);

  useEffect(() => {
    lipSyncController.init();
    return () => {
      lipSyncController.dispose();
    };
  }, [lipSyncController]);

  // Load color photo and depth map
  const [texture, depthMap] = useLoader(THREE.TextureLoader, [
    selectedInterviewer.image,
    selectedInterviewer.depthMap
  ]);

  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
    }
    if (depthMap) {
      depthMap.minFilter = THREE.LinearFilter;
      depthMap.magFilter = THREE.LinearFilter;
      depthMap.generateMipmaps = false;
      depthMap.needsUpdate = true;
    }
  }, [texture, depthMap]);

  // Shader uniforms
  const uniforms = useMemo(() => {
    return {
      uTexture: { value: texture },
      uDepthMap: { value: depthMap },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uBreathingIntensity: { value: 0.052 },
      uDisplacementScale: { value: 0.28 },
      uHeadOffset: { value: new THREE.Vector2(0, 0) },
      uHeadTilt: { value: 0.0 },
      uBlink: { value: 0.0 },
      uEyebrowRaise: { value: 0.0 },
      uJawOpen: { value: 0.0 },
      uLipWidth: { value: 0.0 },
      uLipPucker: { value: 0.0 },
      uUpperLipRaise: { value: 0.0 },
      uLowerLipDepress: { value: 0.0 },
      uLipClose: { value: 0.0 },
      uMouthCornerPull: { value: 0.0 },
      uChinRaise: { value: 0.0 },
      uMouthCenter: { value: new THREE.Vector2(faceRig.mouth.center.x, faceRig.mouth.center.y) },
      uMouthWidth: { value: faceRig.mouth.width },
      uEyeCenter: { value: new THREE.Vector2(0.502, (faceRig.eyes.left.y + faceRig.eyes.right.y) * 0.5) },
      uEyebrowY: { value: (faceRig.eyebrows.left.y + faceRig.eyebrows.right.y) * 0.5 },
      uChinY: { value: faceRig.jaw.chin.y },
      uFadeIn: { value: 0.0 },
      uKeyLightColor: { value: new THREE.Color('#dce6f2') },
      uFillLightColor: { value: new THREE.Color('#f0dfc8') },
      uState: { value: 0 }
    };
  }, [texture, depthMap, faceRig]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const u = materialRef.current.uniforms;
    const time = state.clock.getElapsedTime();
    u.uTime.value = time;

    // Get real-time audio energy
    const speechEnergy = AudioAnalyzer.getEnergy();
    const isSpeaking = avatarState === 'SPEAKING';

    // 1. Update Lip-Sync controller (Viseme weights)
    const mouthWeights = lipSyncController.update(delta);
    u.uJawOpen.value = mouthWeights.jawOpen;
    u.uLipWidth.value = mouthWeights.lipWidth;
    u.uLipPucker.value = mouthWeights.lipPucker;
    u.uUpperLipRaise.value = mouthWeights.upperLipRaise;
    u.uLowerLipDepress.value = mouthWeights.lowerLipDepress;
    u.uLipClose.value = mouthWeights.lipClose;
    u.uMouthCornerPull.value = mouthWeights.mouthCornerPull;
    u.uChinRaise.value = mouthWeights.chinRaise;

    // 2. Update Facial controller (Blink, Eyebrows, Cheeks, Gaze)
    const facial = facialController.update(delta, time, avatarState, isSpeaking, speechEnergy);
    u.uBlink.value = facial.blink;
    u.uEyebrowRaise.value = facial.eyebrowRaise;

    // 3. Update Body & Head animation controller (Breathing, posture gestures, listening nods)
    const anim = animationController.update(delta, time, avatarState, isSpeaking, speechEnergy);
    u.uHeadOffset.value.set(anim.headOffset.x + facial.gazeOffset.x, anim.headOffset.y + facial.gazeOffset.y);
    u.uHeadTilt.value = anim.headTilt;
    u.uBreathingIntensity.value = anim.breathIntensity;

    // Smooth mouse target interpolation
    u.uMouse.value.lerp(new THREE.Vector2(mousePos.current.x, mousePos.current.y), 0.04);

    // Fade-in during entrance transition
    let targetFade = 1.0;
    if (transitionSubphase === 'fade-ui' || transitionSubphase === 'camera-push') {
      targetFade = 0.2;
    } else if (transitionSubphase === 'entering-office') {
      targetFade = 0.55;
    } else if (transitionSubphase === 'settling') {
      targetFade = 0.85;
    } else {
      targetFade = 1.0;
    }
    u.uFadeIn.value = THREE.MathUtils.lerp(u.uFadeIn.value, targetFade, 0.05);
  });

  const width = 8.5;
  const height = width / selectedInterviewer.aspectRatio;

  return (
    <group position={[0, -0.15, 0]}>
      {/* 
        Modular Architecture: 
        If a rigged 3D GLTF avatar is loaded later, render <primitive object={model} /> here.
        Currently using near-photorealistic depth-displaced digital human mesh calibrated with MediaPipe CV landmarks.
      */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[width, height, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={avatarVertexShader}
          fragmentShader={avatarFragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
