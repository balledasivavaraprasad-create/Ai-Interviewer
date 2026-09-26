import { InterviewProvider, useInterview } from './context/InterviewContext';
import { STEPS } from './config/constants';
import { BackgroundAmbience } from './components/Shared/BackgroundAmbience';
import { BrandHeader } from './components/Shared/BrandHeader';
import { OnboardingFlow } from './components/OnboardingFlow/OnboardingFlow';
import { InterviewRoom } from './components/InterviewRoom/InterviewRoom';

const AppContent = () => {
  const { currentStep } = useInterview();
  const isOnboarding = currentStep === STEPS.PROFILE_SETUP || currentStep === STEPS.INTERVIEWER_SELECTION;

  return (
    <div className="app-viewport">
      {/* Ambient background lighting */}
      <BackgroundAmbience />

      {/* Global Brand Header during Onboarding */}
      {isOnboarding && <BrandHeader />}

      {/* Screen 1 (Profile) & Screen 2 (Interviewer Selection) */}
      <OnboardingFlow />

      {/* Screen 3 (Cinematic 3D Office Environment & Interviewer) */}
      <InterviewRoom />
    </div>
  );
};

export default function App() {
  return (
    <InterviewProvider>
      <AppContent />
    </InterviewProvider>
  );
}
