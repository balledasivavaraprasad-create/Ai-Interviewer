import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterview, AVATAR_STATES } from '../../context/InterviewContext';
import { RotateCcw, Square, Sparkles, Send, CheckCircle2 } from 'lucide-react';

export const LiveSubtitleTranscript = () => {
  const {
    selectedInterviewer,
    avatarState,
    spokenText,
    currentWordIndex,
    isInterviewerSpeaking,
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
    <div className={`dialogue-prompt-wrapper ${isInterviewerSpeaking ? 'speaking-mode' : 'candidate-mode'}`}>
      <motion.div
        className={`dialogue-prompt-box ${isInterviewerSpeaking ? 'speaking-mode' : 'candidate-mode'}`}
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        role="region"
        aria-label="Interview Question Subtitle"
      >
      {/* Header: Speaker identity & status */}
      <div className="dialogue-header-row">
        <div className="dialogue-meta-left">
          <span className="dialogue-speaker">
            {selectedInterviewer.name}
          </span>
          <span className="dialogue-meta-dot">·</span>
          <span className={`dialogue-state-badge ${isInterviewerSpeaking ? 'speaking' : 'listening'}`}>
            {isGeneratingQuestion 
              ? 'Formulating Next Question...' 
              : isInterviewerSpeaking 
                ? 'Speaking' 
                : 'Listening'}
          </span>

          {currentQuestion?.competency && (
            <span className="competency-chip">
              {currentQuestion.competency}
            </span>
          )}
        </div>

        {isListening && (
          <div className="candidate-ready-tag">
            <span className="live-dot" />
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

      {/* Candidate Response Controls - Appears when interviewer finishes speaking */}
      <AnimatePresence>
        {!isInterviewerSpeaking && (
          <motion.div
            key="candidate-interaction-controls"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <form onSubmit={handleSendResponse} className="candidate-answer-form">
              <input
                type="text"
                className="form-input candidate-answer-input"
                placeholder="Type your response or summarize your technical answer..."
                value={candidateResponse}
                onChange={(e) => setCandidateResponse(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary answer-submit-btn"
                disabled={!candidateResponse.trim() || isGeneratingQuestion}
              >
                <span>Answer</span>
                <Send size={13} />
              </button>
            </form>

            {/* Question Actions (Repeat Question, Next Question, Counter) */}
            <div className="dialogue-footer-row">
              <div className="dialogue-actions-group">
                <button
                  type="button"
                  className="quick-role-chip"
                  onClick={replayQuestion}
                  title="Repeat current question"
                >
                  <RotateCcw size={11} style={{ marginRight: 5 }} />
                  Repeat Question
                </button>

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

              <div className="question-counter-label">
                Question {currentQuestionIndex + 1}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Pause Speech Chip during Speaking Mode */}
      {isInterviewerSpeaking && (
        <div className="speaking-mode-micro-footer">
          <button
            type="button"
            className="speaking-pause-btn"
            onClick={stopSpeaking}
            title="Pause interviewer speech"
          >
            <Square size={10} style={{ marginRight: 5, fill: 'currentColor' }} />
            <span>Pause Speaking</span>
          </button>
        </div>
      )}
      </motion.div>
    </div>
  );
};
