import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterview } from '../../context/InterviewContext';
import { Mic, MicOff, Video, VideoOff, Play, Volume2, VolumeX } from 'lucide-react';
import { LiveSubtitleTranscript } from './LiveSubtitleTranscript';
import { CandidateVideoTile } from './CandidateVideoTile';
import { InterviewerVoiceSelector } from './InterviewerVoiceSelector';
import { AudioVisualizer } from './AudioVisualizer';

export const InterviewRoomUI = () => {
  const {
    selectedInterviewer,
    avatarState,
    transitionSubphase,
    isInterviewStarted,
    startInterview,
    audioStreamActive,
    setAudioStreamActive,
    cameraStreamActive,
    setCameraStreamActive,
    targetJob,
    isInterviewerSpeaking,
    isInterviewerMuted,
    toggleInterviewerMute
  } = useInterview();

  if (!selectedInterviewer) return null;

  const isSceneSettled = transitionSubphase === 'reveal-interviewer' || transitionSubphase === 'ready';

  return (
    <div className="office-hud">
      {/* ------------------------------------------------------------------ */}
      {/* SPEAKING MODE BACKGROUND DIMMING OVERLAY                           */}
      {/* Dims background by ~20% during speech, preserving interviewer view */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isInterviewStarted && isInterviewerSpeaking && (
          <motion.div
            key="speaking-dim-overlay"
            className="speaking-mode-dim-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* TOP BAR: BRAND LOGO & LIVE SESSION PILL                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="office-hud-top">
        <div className="brand-header" style={{ position: 'static' }}>
          <div className="brand-symbol">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Aura · Talent</span>
            <span className="brand-tagline">Executive Interview Room</span>
          </div>
        </div>

        <motion.div
          className="live-session-pill"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isSceneSettled ? 1 : 0, y: isSceneSettled ? 0 : -10 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="live-dot" />
          <span>Private Session · Live Voice & Lip-Sync Active</span>
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CANDIDATE WEBCAM & COMPUTER VISION TELEMETRY TILE (TOP-LEFT)       */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isSceneSettled && (
          <CandidateVideoTile />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* CENTRAL REAL-TIME AUDIO WAVEFORM STAGE (VIEWPORT CENTERED)         */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isInterviewStarted && isInterviewerSpeaking && (
          <div className="central-speaking-stage-wrapper">
            <motion.div
              key="central-speaking-stage"
              className="central-speaking-stage"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="central-waveform-container">
                <AudioVisualizer
                  speaking={isInterviewerSpeaking}
                  isMuted={isInterviewerMuted}
                  height={140}
                />
              </div>

              <div className="speaking-indicator-tag">
                <span className="speaking-live-dot" />
                <span className="speaking-indicator-label">
                  {selectedInterviewer.name} is speaking
                </span>
                {isInterviewerMuted && (
                  <span className="speaking-muted-badge">Muted</span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* PROGRESSIVE SUBTITLE TRANSCRIPT & CANDIDATE ACTION CARD            */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isInterviewStarted && (
          <LiveSubtitleTranscript />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM ROW: INTERVIEWER STATUS & READY ACTION                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="office-hud-bottom">
        {/* Left/Center: Interviewer Persona Pill */}
        <motion.div
          className="interviewer-status-hud"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: isSceneSettled ? 1 : 0, y: isSceneSettled ? 0 : 16 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <img
            src={selectedInterviewer.image}
            alt={selectedInterviewer.name}
            className="status-avatar-mini"
          />
          <div className="status-text-block">
            <span className="status-interviewer-name">{selectedInterviewer.name}</span>
            <span className="status-interviewer-state">
              {isInterviewStarted
                ? `Director · State: ${avatarState.toLowerCase()}`
                : selectedInterviewer.greeting}
            </span>
          </div>

          {/* Subtle Voice Selection Control */}
          <InterviewerVoiceSelector />

          {/* Subtle Audio Mute/Unmute Control */}
          <button
            type="button"
            className={`interviewer-mute-toggle-btn ${isInterviewerMuted ? 'muted' : ''}`}
            onClick={toggleInterviewerMute}
            title={isInterviewerMuted ? "Unmute Interviewer Voice" : "Mute Interviewer Voice"}
            aria-label={isInterviewerMuted ? "Unmute Interviewer Voice" : "Mute Interviewer Voice"}
          >
            {isInterviewerMuted ? (
              <>
                <VolumeX size={13} color="var(--status-amber)" />
                <span className="mute-btn-text">Voice Muted</span>
              </>
            ) : (
              <>
                <Volume2 size={13} color="var(--accent-warm-gold)" />
                <span className="mute-btn-text">Voice On</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Right: Start Interview / Ready Card */}
        <AnimatePresence>
          {isSceneSettled && !isInterviewStarted && (
            <motion.div
              className="interview-ready-card"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="ready-card-title">Your interview is ready.</h3>
              <p className="ready-card-desc">
                Take a moment. We'll begin when you're ready. {targetJob ? `Tailored for ${targetJob}.` : ''}
              </p>

              {/* Hardware Test Toggles */}
              <div className="device-toggles-row">
                <button
                  type="button"
                  className={`device-btn ${audioStreamActive ? 'active' : ''}`}
                  onClick={() => setAudioStreamActive(!audioStreamActive)}
                >
                  {audioStreamActive ? <Mic size={14} color="#34D399" /> : <MicOff size={14} />}
                  <span>{audioStreamActive ? 'Mic Active' : 'Mic Muted'}</span>
                </button>

                <button
                  type="button"
                  className={`device-btn ${cameraStreamActive ? 'active' : ''}`}
                  onClick={() => setCameraStreamActive(!cameraStreamActive)}
                >
                  {cameraStreamActive ? <Video size={14} color="#34D399" /> : <VideoOff size={14} />}
                  <span>{cameraStreamActive ? 'Video Active' : 'Video Off'}</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={startInterview}
              >
                <Play size={16} fill="currentColor" />
                <span>Start Interview</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
