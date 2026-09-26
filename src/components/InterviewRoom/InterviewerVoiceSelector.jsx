import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronDown, Check } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';
import { AVAILABLE_VOICES, getVoicesForGender } from '../../config/interviewers';

/**
 * Subtle Interviewer Voice Selection Control.
 * 
 * Allows selecting the interviewer voice without dominating the UI.
 * Connects directly to setInterviewerVoice(voiceId) in InterviewContext and SpeechEngine.
 */
export const InterviewerVoiceSelector = () => {
  const { interviewerVoice, setInterviewerVoice, selectedInterviewer } = useInterview();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const gender = selectedInterviewer?.gender?.toLowerCase() || 'female';
  const voices = getVoicesForGender(gender);
  const activeVoice = AVAILABLE_VOICES.find(v => v.voiceId === interviewerVoice) || voices[0] || AVAILABLE_VOICES[0];

  const handleSelectVoice = (voiceId) => {
    setInterviewerVoice(voiceId);
    setIsOpen(false);
  };

  return (
    <div className="voice-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="voice-selector-pill"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Change Interviewer Voice"
      >
        <Volume2 size={12} className="voice-icon" />
        <span className="voice-active-label">{activeVoice.name}</span>
        <ChevronDown size={11} className={`voice-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="voice-dropdown-menu"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="listbox"
          >
            <div className="voice-menu-header">Interviewer Voice</div>
            {voices.map((v) => {
              const isSelected = v.voiceId === activeVoice.voiceId;
              return (
                <button
                  key={v.voiceId}
                  type="button"
                  className={`voice-menu-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectVoice(v.voiceId)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="voice-item-info">
                    <span className="voice-item-name">{v.displayName}</span>
                    <span className="voice-item-style">{v.style}</span>
                  </div>
                  {isSelected && <Check size={13} className="voice-check-icon" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
