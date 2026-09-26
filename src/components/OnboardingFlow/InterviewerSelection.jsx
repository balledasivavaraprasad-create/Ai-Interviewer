import React from 'react';
import { motion } from 'framer-motion';
import { useInterview } from '../../context/InterviewContext';
import { INTERVIEWERS } from '../../config/interviewers';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

export const InterviewerSelection = () => {
  const { 
    interviewerGender, 
    setInterviewerGender, 
    startOfficeEntrance, 
    goToWaitingRoom,
    goToOrganizationSelection,
    selectedSchedule 
  } = useInterview();

  const isSelected = !!interviewerGender;

  const handleProceed = () => {
    if (selectedSchedule) {
      goToWaitingRoom();
    } else {
      startOfficeEntrance();
    }
  };

  return (
    <motion.div
      className="interviewer-selection-card"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="onboarding-header">
        <h1 className="onboarding-title">Choose your interviewer</h1>
        <p className="onboarding-subtitle">
          Select the interviewer you'd like to meet. Both directors adapt their evaluation to your experience level.
        </p>
      </div>

      <div className="selection-grid">
        {/* FEMALE INTERVIEWER CARD */}
        <div
          className={`interviewer-card ${interviewerGender === 'female' ? 'selected' : ''}`}
          onClick={() => setInterviewerGender('female')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setInterviewerGender('female')}
          aria-pressed={interviewerGender === 'female'}
        >
          <div className="interviewer-image-container">
            <img
              src={INTERVIEWERS.female.image}
              alt={INTERVIEWERS.female.name}
              className="interviewer-portrait"
              loading="eager"
            />
            <div className="selection-check-indicator">
              {interviewerGender === 'female' && <Check size={16} strokeWidth={2.5} />}
            </div>
          </div>

          <div className="interviewer-details">
            <span className="interviewer-gender-pill">Female Interviewer</span>
            <h2 className="interviewer-name">{INTERVIEWERS.female.name}</h2>
            <div className="interviewer-role-title">{INTERVIEWERS.female.title}</div>
            <p className="interviewer-bio">{INTERVIEWERS.female.yearsExperience}</p>

            <div className="interviewer-focus-tags">
              {INTERVIEWERS.female.evaluationFocus.map((tag) => (
                <span key={tag} className="focus-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* MALE INTERVIEWER CARD */}
        <div
          className={`interviewer-card ${interviewerGender === 'male' ? 'selected' : ''}`}
          onClick={() => setInterviewerGender('male')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setInterviewerGender('male')}
          aria-pressed={interviewerGender === 'male'}
        >
          <div className="interviewer-image-container">
            <img
              src={INTERVIEWERS.male.image}
              alt={INTERVIEWERS.male.name}
              className="interviewer-portrait"
              loading="eager"
            />
            <div className="selection-check-indicator">
              {interviewerGender === 'male' && <Check size={16} strokeWidth={2.5} />}
            </div>
          </div>

          <div className="interviewer-details">
            <span className="interviewer-gender-pill">Male Interviewer</span>
            <h2 className="interviewer-name">{INTERVIEWERS.male.name}</h2>
            <div className="interviewer-role-title">{INTERVIEWERS.male.title}</div>
            <p className="interviewer-bio">{INTERVIEWERS.male.yearsExperience}</p>

            <div className="interviewer-focus-tags">
              {INTERVIEWERS.male.evaluationFocus.map((tag) => (
                <span key={tag} className="focus-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={!isSelected}
          onClick={handleProceed}
        >
          <span>{selectedSchedule ? 'Proceed to Waiting Room' : 'Meet your interviewer'}</span>
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          className="btn-secondary-link"
          onClick={goToOrganizationSelection}
        >
          <ArrowLeft size={13} style={{ display: 'inline', marginRight: 6 }} />
          Back to organization selection
        </button>
      </div>
    </motion.div>
  );
};
