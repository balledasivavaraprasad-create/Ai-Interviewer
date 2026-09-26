import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InterviewProvider, useInterview } from './context/InterviewContext';
import { STEPS } from './config/constants';
import { BackgroundAmbience } from './components/Shared/BackgroundAmbience';
import { BrandHeader } from './components/Shared/BrandHeader';
import { OnboardingFlow } from './components/OnboardingFlow/OnboardingFlow';
import { InterviewRoom } from './components/InterviewRoom/InterviewRoom';
import { DevTestPanel } from './components/Shared/DevTestPanel';
import { AuthPage } from './components/Auth/AuthPage';
import { RecruiterDashboard } from './components/Recruiter/RecruiterDashboard';
import { RecruiterReportView } from './components/Recruiter/RecruiterReportView';

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const { currentStep } = useInterview();

  // View state: 'candidate' vs 'recruiter'
  const [viewMode, setViewMode] = useState(() => {
    return user?.role === 'RECRUITER' ? 'recruiter' : 'candidate';
  });

  // Selected recruiter report
  const [selectedReportId, setSelectedReportId] = useState(null);

  // If not logged in, show Auth / 2FA Experience
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setViewMode(user?.role === 'RECRUITER' ? 'recruiter' : 'candidate')} />;
  }

  // Recruiter Experience
  if (viewMode === 'recruiter') {
    return (
      <div className="app-viewport recruiter-mode-viewport">
        <BackgroundAmbience />
        <BrandHeader
          onNavigateCandidate={() => setViewMode('candidate')}
          onNavigateRecruiter={() => setViewMode('recruiter')}
        />
        {selectedReportId ? (
          <div className="recruiter-report-wrapper">
            <RecruiterReportView
              sessionId={selectedReportId}
              onBack={() => setSelectedReportId(null)}
            />
          </div>
        ) : (
          <RecruiterDashboard
            onOpenReport={(id) => setSelectedReportId(id)}
            onSwitchToCandidate={() => setViewMode('candidate')}
          />
        )}
      </div>
    );
  }

  // Candidate Experience
  const isOnboarding =
    currentStep === STEPS.PROFILE_SETUP ||
    currentStep === STEPS.ORGANIZATION_SELECTION ||
    currentStep === STEPS.INTERVIEWER_SELECTION ||
    currentStep === STEPS.WAITING_ROOM ||
    currentStep === STEPS.REPORT_VIEW;

  return (
    <div className="app-viewport candidate-mode-viewport">
      {/* Ambient background lighting */}
      <BackgroundAmbience />

      {/* Global Brand Header with Theme & Role Switcher */}
      {isOnboarding && (
        <BrandHeader
          onNavigateCandidate={() => setViewMode('candidate')}
          onNavigateRecruiter={() => setViewMode('recruiter')}
        />
      )}

      {/* Candidate Onboarding & Report Steps */}
      <OnboardingFlow />

      {/* 3D Cinematic Office Environment & Digital Human Interviewer */}
      <InterviewRoom />

      {/* Developer Audio & Voice Verification Panel */}
      <DevTestPanel />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InterviewProvider>
          <AppContent />
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
