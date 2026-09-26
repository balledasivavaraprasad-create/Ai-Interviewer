import React from 'react';
import { motion } from 'framer-motion';
import { useInterview } from '../../context/InterviewContext';
import { ResumeUpload } from './ResumeUpload';
import { TargetJobInput } from './TargetJobInput';
import { ArrowRight } from 'lucide-react';

export const ProfileSetup = () => {
  const { goToOrganizationSelection } = useInterview();

  return (
    <motion.div
      className="onboarding-card"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="onboarding-header">
        <h1 className="onboarding-title">Let's prepare your interview.</h1>
        <p className="onboarding-subtitle">
          Add your resume and target role so your interviewer can tailor the conversation to your experience.
        </p>
      </div>

      <ResumeUpload />
      <TargetJobInput />

      <div className="onboarding-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={goToOrganizationSelection}
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          className="btn-secondary-link"
          onClick={goToOrganizationSelection}
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
};
