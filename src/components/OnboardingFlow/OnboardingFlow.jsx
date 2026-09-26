import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useInterview } from '../../context/InterviewContext';
import { STEPS } from '../../config/constants';
import { ProfileSetup } from './ProfileSetup';
import { InterviewerSelection } from './InterviewerSelection';
import { OrganizationSelection } from '../Candidate/OrganizationSelection';
import { WaitingRoom } from '../Candidate/WaitingRoom';
import { CandidateReportView } from '../Candidate/CandidateReportView';

export const OnboardingFlow = () => {
  const {
    currentStep,
    targetJob,
    selectedSchedule,
    setSelectedSchedule,
    setIsPracticeMode,
    goToInterviewerSelection,
    goToOrganizationSelection,
    goToWaitingRoom,
    startOfficeEntrance,
    backToProfileSetup,
    interviewerGender,
    activeSessionId
  } = useInterview();

  const isVisible =
    currentStep === STEPS.PROFILE_SETUP ||
    currentStep === STEPS.ORGANIZATION_SELECTION ||
    currentStep === STEPS.INTERVIEWER_SELECTION ||
    currentStep === STEPS.WAITING_ROOM ||
    currentStep === STEPS.REPORT_VIEW;

  if (!isVisible) return null;

  return (
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        {currentStep === STEPS.PROFILE_SETUP && (
          <ProfileSetup key="profile-setup" />
        )}

        {currentStep === STEPS.ORGANIZATION_SELECTION && (
          <OrganizationSelection
            key="organization-selection"
            targetJob={targetJob}
            onSelectSchedule={(sch) => {
              setSelectedSchedule(sch);
              setIsPracticeMode(false);
              goToInterviewerSelection();
            }}
            onSelectPractice={() => {
              setSelectedSchedule(null);
              setIsPracticeMode(true);
              goToInterviewerSelection();
            }}
            onBack={backToProfileSetup}
          />
        )}

        {currentStep === STEPS.INTERVIEWER_SELECTION && (
          <InterviewerSelection key="interviewer-selection" />
        )}

        {currentStep === STEPS.WAITING_ROOM && selectedSchedule && (
          <WaitingRoom
            key="waiting-room"
            schedule={selectedSchedule}
            interviewerGender={interviewerGender}
            onEnterInterview={startOfficeEntrance}
            onCancel={goToOrganizationSelection}
          />
        )}

        {currentStep === STEPS.REPORT_VIEW && (
          <CandidateReportView
            key="report-view"
            sessionId={activeSessionId}
            onDone={goToOrganizationSelection}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
