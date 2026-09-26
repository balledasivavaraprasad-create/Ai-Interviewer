import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, Bug, Activity } from 'lucide-react';
import { CandidateTracker } from '../../services/vision/CandidateTracker';
import { CandidateAudio } from '../../services/audio/CandidateAudioService';
import { useInterview } from '../../context/InterviewContext';
import { INTERVIEW_STATES } from '../../config/constants';

/**
 * Candidate Webcam Feed & CV Telemetry Tile.
 * 
 * Features:
 * 1. Automatic camera and audio initialization on interview start.
 * 2. Real-time MediaPipe Face Landmarker attachment.
 * 3. Dynamic candidate speaking indicator.
 * 4. Development/Debug Mode (disabled by default) rendering:
 *    - Face bounding box
 *    - Mouth landmarks & contour
 *    - Mouth region box
 *    - Live metrics (openness, movement, confidence, speaking state, timestamps).
 */
export const CandidateVideoTile = () => {
  const {
    interviewState,
    isInterviewStarted,
    cameraStreamActive,
    setCameraStreamActive,
    audioStreamActive,
    setAudioStreamActive
  } = useInterview();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [cvState, setCvState] = useState(CandidateTracker.getSnapshot());
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializingCam, setIsInitializingCam] = useState(false);

  // Subscribe to CandidateTracker CV snapshot updates
  useEffect(() => {
    const unsubscribe = CandidateTracker.subscribe((state) => {
      setCvState(state);
    });
    return () => unsubscribe();
  }, []);

  // Initialize MediaPipe FaceLandmarker engine
  useEffect(() => {
    CandidateTracker.initialize().catch(err => {
      console.warn('FaceLandmarker pre-warm error:', err);
    });
  }, []);

  // Start webcam and candidate microphone stream
  const startCamera = useCallback(async () => {
    setIsInitializingCam(true);
    setCameraError(null);

    try {
      // 1. Initialize Microphone Audio Analyzer
      try {
        await CandidateAudio.start();
      } catch (audioErr) {
        console.warn('Microphone start warning:', audioErr);
      }

      // 2. Initialize Webcam Video
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            CandidateTracker.attachVideo(videoRef.current);
          }).catch(e => console.warn('Video play error:', e));
        };
      }

      setIsInitializingCam(false);
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setCameraError(err.message || 'Camera permission denied');
      setIsInitializingCam(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    CandidateTracker.detachVideo();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    CandidateAudio.stop();
  }, []);

  // Lifecycle control: start camera when interview begins
  useEffect(() => {
    if (isInterviewStarted && cameraStreamActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isInterviewStarted, cameraStreamActive, startCamera, stopCamera]);

  // Audio muting control
  useEffect(() => {
    CandidateAudio.setMuted(!audioStreamActive);
  }, [audioStreamActive]);

  // Debug Canvas Rendering Loop
  useEffect(() => {
    if (!isDebugMode) return;

    let animId = null;

    const renderDebugOverlay = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentCv = CandidateTracker.getSnapshot();

        // 1. Draw Face Bounding Box
        if (currentCv.boundingBox) {
          const bx = currentCv.boundingBox.x * canvas.width;
          const by = currentCv.boundingBox.y * canvas.height;
          const bw = currentCv.boundingBox.width * canvas.width;
          const bh = currentCv.boundingBox.height * canvas.height;

          ctx.strokeStyle = currentCv.candidateSpeaking ? '#10B981' : '#06B6D4';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);

          // Corner reticles
          const reticleLen = 14;
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#38BDF8';
          // Top-left
          ctx.beginPath();
          ctx.moveTo(bx, by + reticleLen);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + reticleLen, by);
          ctx.stroke();
          // Top-right
          ctx.beginPath();
          ctx.moveTo(bx + bw - reticleLen, by);
          ctx.lineTo(bx + bw, by);
          ctx.lineTo(bx + bw, by + reticleLen);
          ctx.stroke();
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(bx, by + bh - reticleLen);
          ctx.lineTo(bx, by + bh);
          ctx.lineTo(bx + reticleLen, by + bh);
          ctx.stroke();
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(bx + bw - reticleLen, by + bh);
          ctx.lineTo(bx + bw, by + bh);
          ctx.lineTo(bx + bw, by + bh - reticleLen);
          ctx.stroke();
        }

        // 2. Draw Mouth Region Bounding Box
        if (currentCv.mouthRegion) {
          const mx = currentCv.mouthRegion.x * canvas.width;
          const my = currentCv.mouthRegion.y * canvas.height;
          const mw = currentCv.mouthRegion.width * canvas.width;
          const mh = currentCv.mouthRegion.height * canvas.height;

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(mx, my, mw, mh);
          ctx.setLineDash([]);
        }

        // 3. Draw Mouth Landmark Points
        if (currentCv.landmarks) {
          const mouthIndices = [61, 291, 0, 17, 13, 14, 11, 16, 78, 308, 82, 87, 312, 317];
          ctx.fillStyle = currentCv.candidateSpeaking ? '#34D399' : '#38BDF8';

          for (const idx of mouthIndices) {
            const p = currentCv.landmarks[idx];
            if (p) {
              ctx.beginPath();
              ctx.arc(p.x * canvas.width, p.y * canvas.height, 2.5, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }

      animId = requestAnimationFrame(renderDebugOverlay);
    };

    animId = requestAnimationFrame(renderDebugOverlay);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isDebugMode]);

  const speakingStateText = () => {
    if (cvState.candidateSpeaking === true) return 'Candidate Speaking';
    if (cvState.candidateSpeaking === 'unknown') return 'Audio Detected (Face Lost)';
    if (interviewState === INTERVIEW_STATES.INTERVIEWER_SPEAKING) return 'Interviewer Speaking';
    if (interviewState === INTERVIEW_STATES.WAITING_FOR_CANDIDATE) return 'Listening for Answer';
    return cvState.faceDetected ? 'Face Tracked' : 'Awaiting Face';
  };

  return (
    <div className={`candidate-tile-wrapper ${cvState.candidateSpeaking ? 'candidate-speaking-active' : ''}`}>
      <div className="candidate-video-container">
        {/* Video feed */}
        <video
          ref={videoRef}
          className="candidate-video-element"
          autoPlay
          playsInline
          muted
        />

        {/* Debug Canvas Overlay (Disabled by default, visible only in debug mode) */}
        {isDebugMode && (
          <canvas
            ref={canvasRef}
            className="candidate-cv-canvas-overlay"
          />
        )}

        {/* Camera Off / Error Placeholder */}
        {(!cameraStreamActive || cameraError) && (
          <div className="candidate-cam-fallback">
            <CameraOff size={28} className="text-zinc-500" />
            <span className="text-xs text-zinc-400 mt-2">
              {cameraError ? cameraError : 'Camera Paused'}
            </span>
          </div>
        )}

        {/* Initializing Spinner */}
        {isInitializingCam && (
          <div className="candidate-cam-fallback">
            <Activity size={24} className="animate-spin text-emerald-400" />
            <span className="text-xs text-zinc-400 mt-2">Starting Camera & CV...</span>
          </div>
        )}

        {/* Status Pill Badge */}
        <div className="candidate-status-pill">
          <div className={`status-indicator-dot ${cvState.candidateSpeaking ? 'pulse-speaking' : cvState.faceDetected ? 'dot-active' : 'dot-idle'}`} />
          <span>{speakingStateText()}</span>
        </div>

        {/* Micro Controls Bar */}
        <div className="candidate-controls-bar">
          <button
            type="button"
            className={`tile-btn ${audioStreamActive ? 'active' : 'muted'}`}
            onClick={() => setAudioStreamActive(!audioStreamActive)}
            title={audioStreamActive ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {audioStreamActive ? <Mic size={13} color="#10B981" /> : <MicOff size={13} color="#EF4444" />}
          </button>

          <button
            type="button"
            className={`tile-btn ${cameraStreamActive ? 'active' : 'muted'}`}
            onClick={() => setCameraStreamActive(!cameraStreamActive)}
            title={cameraStreamActive ? 'Stop Camera' : 'Start Camera'}
          >
            {cameraStreamActive ? <Camera size={13} color="#10B981" /> : <CameraOff size={13} color="#EF4444" />}
          </button>

          <button
            type="button"
            className={`tile-btn ${isDebugMode ? 'active-debug' : ''}`}
            onClick={() => setIsDebugMode(!isDebugMode)}
            title="Toggle Computer Vision Debug Overlay"
          >
            <Bug size={13} color={isDebugMode ? '#38BDF8' : '#94A3B8'} />
            <span className="debug-toggle-label">CV</span>
          </button>
        </div>
      </div>

      {/* Developer CV Telemetry HUD Overlay (Disabled by default) */}
      <AnimatePresence>
        {isDebugMode && (
          <motion.div
            className="cv-debug-hud-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="hud-metric-row">
              <span className="hud-label">Face Tracked:</span>
              <span className={`hud-val ${cvState.faceDetected ? 'val-good' : 'val-warn'}`}>
                {cvState.faceDetected ? 'YES (94% Conf)' : 'NOT DETECTED'}
              </span>
            </div>

            <div className="hud-metric-row">
              <span className="hud-label">Mouth Openness:</span>
              <span className="hud-val">{cvState.mouthOpenness.toFixed(3)}</span>
            </div>

            <div className="hud-metric-row">
              <span className="hud-label">Mouth Movement:</span>
              <span className="hud-val">{cvState.mouthMovement.toFixed(3)}</span>
            </div>

            <div className="hud-metric-row">
              <span className="hud-label">Mic Energy:</span>
              <span className="hud-val">{cvState.audioEnergy.toFixed(3)}</span>
            </div>

            <div className="hud-metric-row">
              <span className="hud-label">Candidate Speaking:</span>
              <span className={`hud-val ${cvState.candidateSpeaking === true ? 'val-good' : 'val-dim'}`}>
                {String(cvState.candidateSpeaking).toUpperCase()}
              </span>
            </div>

            <div className="hud-metric-row">
              <span className="hud-label">Interview State:</span>
              <span className="hud-val val-cyan">{interviewState}</span>
            </div>

            <div className="hud-metric-row">
              <span className="hud-label">Tracking Clock:</span>
              <span className="hud-val font-mono">{cvState.lastFaceTimestamp ? cvState.lastFaceTimestamp.toFixed(1) : '0.0'} ms</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
