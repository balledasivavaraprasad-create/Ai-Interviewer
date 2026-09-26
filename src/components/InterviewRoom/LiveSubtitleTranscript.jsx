import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInterview, AVATAR_STATES } from '../../context/InterviewContext';
import { RotateCcw, SkipForward, Square, Sparkles, Send } from 'lucide-react';

export const LiveSubtitleTranscript = () => {
  const {
    selectedInterviewer,
    avatarState,
    spokenText,
    currentWordIndex,
    isInterviewerSpeaking,
    speechEnergy,
    currentQuestion,
    currentQuestionIndex,
    isGeneratingQuestion,
    askNextQuestion,
    replayQuestion,
    stopSpeaking
  } = useInterview();

  const [candidateResponse, setCandidateResponse] = useState('');

  if (!spokenText) return null;

  const words = spokenText.split(/\s+/).filter(Boolean);
  const isListening = avatarState === AVATAR_STATES.LISTENING;

  const handleSendResponse = (e) => {
    e.preventDefault();
    if (!candidateResponse.trim() || isGeneratingQuestion) return;
    const resp = candidateResponse.trim();
    setCandidateResponse('');
    askNextQuestion(resp);
  };

  return (
    <motion.div
      className="dialogue-prompt-box"
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      role="region"
      aria-label="Interview Question Subtitle"
    >
      {/* Speaker Header, Competency Badge & Micro-Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="dialogue-speaker">
            {selectedInterviewer.name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
          <span style={{
            fontSize: 11,
            color: isInterviewerSpeaking ? 'var(--accent-warm-gold)' : 'var(--status-emerald)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            {isGeneratingQuestion 
              ? 'Gemini Formulating Question...' 
              : isInterviewerSpeaking 
                ? 'Speaking' 
                : 'Listening'}
          </span>

          {currentQuestion?.competency && (
            <span style={{
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-warm)'
            }}>
              {currentQuestion.competency}
            </span>
          )}
        </div>

        {/* Subtle Micro Audio Waveform (Reacts to live speech energy) */}
        {isInterviewerSpeaking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 16 }}>
            {[0.6, 1.0, 0.8, 1.2, 0.7].map((scale, i) => (
              <span
                key={i}
                style={{
                  width: 2.5,
                  height: Math.max(3, speechEnergy * 14 * scale),
                  backgroundColor: 'var(--text-warm)',
                  borderRadius: 1,
                  transition: 'height 0.08s ease-out'
                }}
              />
            ))}
          </div>
        )}

        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--status-emerald)' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span>Ready for your answer</span>
          </div>
        )}
      </div>

      {/* Synchronized Progressive Subtitle Text */}
      <p className="dialogue-text">
        {words.map((word, idx) => {
          let wordOpacity = 0.35;
          let color = 'rgba(255, 255, 255, 0.45)';
          let fontWeight = 400;

          if (!isInterviewerSpeaking || idx <= currentWordIndex) {
            wordOpacity = 1;
            color = '#FFFFFF';
          } else if (idx === currentWordIndex + 1) {
            wordOpacity = 0.65;
            color = 'rgba(255, 255, 255, 0.75)';
          }

          if (isInterviewerSpeaking && idx === currentWordIndex) {
            color = 'var(--text-warm)';
            fontWeight = 600;
          }

          return (
            <span
              key={idx}
              style={{
                opacity: wordOpacity,
                color: color,
                fontWeight: fontWeight,
                transition: 'color 0.15s ease, opacity 0.15s ease',
                marginRight: '0.28em',
                display: 'inline-block'
              }}
            >
              {word}
            </span>
          );
        })}
      </p>

      {/* Dynamic Candidate Response Box (Foundation for Gemini follow-ups) */}
      {isListening && (
        <form onSubmit={handleSendResponse} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="form-input"
            style={{ padding: '8px 12px', fontSize: 13, flex: 1 }}
            placeholder="Type your response or summarize your technical answer..."
            value={candidateResponse}
            onChange={(e) => setCandidateResponse(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: 12.5 }}
            disabled={!candidateResponse.trim() || isGeneratingQuestion}
          >
            <span>Answer</span>
            <Send size={13} />
          </button>
        </form>
      )}

      {/* Minimalist Question Controls (Replay, Stop, Next Question) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isInterviewerSpeaking ? (
            <button
              type="button"
              className="quick-role-chip"
              onClick={stopSpeaking}
              title="Pause interviewer speech"
            >
              <Square size={11} style={{ marginRight: 5, fill: 'currentColor' }} />
              Pause Speaking
            </button>
          ) : (
            <button
              type="button"
              className="quick-role-chip"
              onClick={replayQuestion}
              title="Repeat current question"
            >
              <RotateCcw size={11} style={{ marginRight: 5 }} />
              Repeat Question
            </button>
          )}

          <button
            type="button"
            className="quick-role-chip"
            onClick={() => askNextQuestion()}
            disabled={isGeneratingQuestion}
            title="Generate next question via Gemini"
          >
            <Sparkles size={11} style={{ marginRight: 5 }} color="var(--accent-warm-gold)" />
            Next Question
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Question {currentQuestionIndex + 1}
        </div>
      </div>
    </motion.div>
  );
};
