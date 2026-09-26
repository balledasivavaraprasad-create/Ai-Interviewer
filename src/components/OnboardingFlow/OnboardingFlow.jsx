import { AnimatePresence } from 'framer-motion';
import { useInterview } from '../../context/InterviewContext';
import { STEPS } from '../../config/constants';
import { ProfileSetup } from './ProfileSetup';
import { InterviewerSelection } from './InterviewerSelection';

export const OnboardingFlow = () => {
  const { currentStep } = useInterview();

  const isVisible = currentStep === STEPS.PROFILE_SETUP || currentStep === STEPS.INTERVIEWER_SELECTION;

  if (!isVisible) return null;

  return (
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        {currentStep === STEPS.PROFILE_SETUP && (
          <ProfileSetup key="profile-setup" />
        )}
        {currentStep === STEPS.INTERVIEWER_SELECTION && (
          <InterviewerSelection key="interviewer-selection" />
        )}
      </AnimatePresence>
    </div>
  );
};
