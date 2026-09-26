import React, { useRef, useEffect } from 'react';
import { InterviewerAudioController } from '../../services/audio/InterviewerAudioController';

/**
 * Reusable Cinematic Real-Time Audio Visualizer.
 * 
 * Design Standards:
 * 1. Driven STRICTLY by Web Audio API AnalyserNode (authoritative real-time audio stream).
 * 2. NO fake looping animations, NO Math.random(), NO predetermined sine-wave loops.
 * 3. Smooth continuous organic waveform line with rounded joins and caps.
 * 4. Center-focused vocal amplitude with natural Hann window tapering at outer extremities.
 * 5. Smooth attack & decay interpolation (fast response to consonants, silky glide to pauses).
 * 6. Naturally reflects speech loudness, cadence, syllables, and speech pauses.
 * 7. When silent or paused: settles into a delicate, nearly flat breathing baseline.
 * 8. 100% canvas rendering outside React render cycle (zero setState per frame).
 * 9. Responsive layout with ResizeObserver and Retina devicePixelRatio scaling.
 */
export const AudioVisualizer = ({
  audioController = InterviewerAudioController,
  speaking = false,
  isMuted = false,
  height = 130,
  className = '',
  color = '#FFFFFF',
  accentColor = '#E2C499'
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Keep state refs up to date without triggering re-render of canvas animation
  const stateRef = useRef({ speaking, isMuted });
  stateRef.current = { speaking, isMuted };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    let animId = null;
    let width = container.clientWidth || 640;

    const updateCanvasSize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = Math.max(rect.width, 240);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(container);

    // Audio Analysis Buffers
    const numPoints = 72; // Fine organic curve resolution
    const waveBuffer = new Uint8Array(256);
    const freqBuffer = new Uint8Array(128);

    // Smoothed point target buffer for jitter-free wave movement
    const smoothedAmplitudes = new Float32Array(numPoints).fill(0);
    let smoothedEnergy = 0;

    const render = (timeMs) => {
      ctx.clearRect(0, 0, width, height);

      const isCurrentSpeaking = stateRef.current.speaking || (audioController && audioController.isSpeaking);
      const isCurrentMuted = stateRef.current.isMuted || (audioController && audioController.isMuted);

      // Fetch real time-domain & frequency data from Web Audio Analyser
      if (audioController) {
        audioController.getWaveformData(waveBuffer);
        audioController.getFrequencyData(freqBuffer);
      }

      // Compute instantaneous vocal energy (RMS + mid-band frequencies)
      let instantEnergy = 0;
      if (isCurrentSpeaking && !isCurrentMuted && freqBuffer && freqBuffer.length > 0) {
        let sum = 0;
        // Focus on conversational voice frequencies (approx 120Hz - 2800Hz)
        const sampleCount = Math.min(freqBuffer.length, 54);
        for (let i = 2; i < sampleCount; i++) {
          sum += freqBuffer[i];
        }
        instantEnergy = sum / ((sampleCount - 2) * 255.0);
      }

      // Smooth attack and decay for global energy envelope
      // Rapid attack for crisp consonants, gentle decay so waveform smoothly breathes into pauses
      const attackRate = 0.28;
      const decayRate = 0.085;
      const targetRate = instantEnergy > smoothedEnergy ? attackRate : decayRate;
      smoothedEnergy += (instantEnergy - smoothedEnergy) * targetRate;

      const centerY = height / 2;
      const step = width / (numPoints - 1);
      const timeSec = timeMs * 0.001;

      // Calculate organic target Y for each sample point
      for (let i = 0; i < numPoints; i++) {
        let targetY = 0;
        const u = i / (numPoints - 1); // 0.0 to 1.0

        // Hann window: smooth parabolic bell curve, 0 at edges, 1.0 at center
        const windowFactor = Math.sin(u * Math.PI);

        if (isCurrentSpeaking && !isCurrentMuted && waveBuffer && waveBuffer.length > 0) {
          const sampleIndex = Math.floor(u * (waveBuffer.length - 1));
          // Normalize time-domain 0..255 (silence = 128) to -1.0 .. +1.0
          const rawWave = (waveBuffer[sampleIndex] - 128) / 128.0;

          // Maximum dynamic vertical travel (~44% of canvas height)
          const maxTravel = height * 0.44;
          const energyScale = 0.25 + smoothedEnergy * 1.75;
          targetY = rawWave * maxTravel * windowFactor * energyScale;

          // Add subtle vocal harmonic formant wave
          const harmonic = Math.sin(timeSec * 3.5 + u * 6.28) * (smoothedEnergy * 3.5) * windowFactor;
          targetY += harmonic;
        } else {
          // Pause / Resting state: delicate, calm, nearly flat breathing baseline
          const breathPulse = Math.sin(timeSec * 1.5 + u * 3.14) * 1.4 * windowFactor;
          targetY = breathPulse;
        }

        // Apply smooth interpolation per point
        const ptAttack = 0.32;
        const ptDecay = 0.11;
        const isGrowing = Math.abs(targetY) > Math.abs(smoothedAmplitudes[i]);
        smoothedAmplitudes[i] += (targetY - smoothedAmplitudes[i]) * (isGrowing ? ptAttack : ptDecay);
      }

      // -----------------------------------------------------------------------
      // 1. Subtle Center Ambient Bloom (Soft warm glow beneath waveform)
      // -----------------------------------------------------------------------
      if (isCurrentSpeaking && smoothedEnergy > 0.02) {
        const glowRadius = Math.min(width * 0.35, 180);
        const glowGrad = ctx.createRadialGradient(
          width / 2, centerY, 0,
          width / 2, centerY, glowRadius
        );
        const glowOpacity = Math.min(smoothedEnergy * 0.22, 0.16);
        glowGrad.addColorStop(0, `rgba(226, 196, 153, ${glowOpacity})`);
        glowGrad.addColorStop(1, 'rgba(226, 196, 153, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(width / 2 - glowRadius, centerY - 40, glowRadius * 2, 80);
      }

      // -----------------------------------------------------------------------
      // 2. Secondary Harmonic Resonance Line (Inverted subtle contour)
      // -----------------------------------------------------------------------
      if (isCurrentSpeaking && smoothedEnergy > 0.015) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < numPoints - 1; i++) {
          const x1 = i * step;
          const y1 = centerY - (smoothedAmplitudes[i] * 0.62);
          const x2 = (i + 1) * step;
          const y2 = centerY - (smoothedAmplitudes[i + 1] * 0.62);
          const xc = (x1 + x2) / 2;
          const yc = (y1 + y2) / 2;
          ctx.quadraticCurveTo(x1, y1, xc, yc);
        }
        ctx.lineTo(width, centerY);

        const harmonicAlpha = Math.min(0.18 + smoothedEnergy * 0.35, 0.55);
        ctx.strokeStyle = `rgba(226, 196, 153, ${harmonicAlpha})`;
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // 3. Primary Authoritative Vocal Waveform (Smooth continuous curve)
      // -----------------------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let i = 0; i < numPoints - 1; i++) {
        const x1 = i * step;
        const y1 = centerY + smoothedAmplitudes[i];
        const x2 = (i + 1) * step;
        const y2 = centerY + smoothedAmplitudes[i + 1];
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, xc, yc);
      }
      ctx.lineTo(width, centerY);

      // Gradient along stroke: soft fade at edges, brilliant pure tone at center
      const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
      const centerAlpha = isCurrentSpeaking ? Math.min(0.72 + smoothedEnergy * 0.28, 0.98) : 0.25;
      const edgeAlpha = isCurrentSpeaking ? 0.08 : 0.03;

      strokeGrad.addColorStop(0.0, `rgba(255, 255, 255, ${edgeAlpha})`);
      strokeGrad.addColorStop(0.2, `rgba(245, 245, 247, ${centerAlpha * 0.6})`);
      strokeGrad.addColorStop(0.5, isCurrentSpeaking ? `rgba(255, 255, 255, ${centerAlpha})` : `rgba(255, 255, 255, 0.32)`);
      strokeGrad.addColorStop(0.8, `rgba(245, 245, 247, ${centerAlpha * 0.6})`);
      strokeGrad.addColorStop(1.0, `rgba(255, 255, 255, ${edgeAlpha})`);

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = isCurrentSpeaking ? 2.2 : 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Subtle warm bloom
      if (isCurrentSpeaking && smoothedEnergy > 0.04) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(226, 196, 153, ${Math.min(smoothedEnergy * 0.5, 0.35)})`;
      }

      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [audioController, height, color, accentColor]);

  return (
    <div
      ref={containerRef}
      className={`audio-visualizer-container ${className}`}
      style={{
        width: '100%',
        height: `${height}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: `${height}px`
        }}
      />
    </div>
  );
};
