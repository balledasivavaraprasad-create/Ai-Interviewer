import { useInterview } from '../../context/InterviewContext';
import { STEPS } from '../../config/constants';
import { OfficeScene } from './OfficeScene';
import { InterviewRoomUI } from './InterviewRoomUI';

export const InterviewRoom = () => {
  const { currentStep, transitionSubphase, selectedInterviewer } = useInterview();

  const isVisible = currentStep === STEPS.TRANSITIONING_TO_OFFICE || currentStep === STEPS.IN_OFFICE;

  if (!isVisible || !selectedInterviewer) return null;

  // Cinematic curtain opacity calculation
  let curtainOpacity = 0;
  if (transitionSubphase === 'fade-ui') {
    curtainOpacity = 0.85;
  } else if (transitionSubphase === 'camera-push') {
    curtainOpacity = 0.55;
  } else if (transitionSubphase === 'entering-office') {
    curtainOpacity = 0.25;
  } else {
    curtainOpacity = 0;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
      {/* 3D WebGL Scene */}
      <OfficeScene />

      {/* Cinematic Transition Curtain */}
      <div
        className="cinematic-curtain"
        style={{
          opacity: curtainOpacity,
          pointerEvents: 'none'
        }}
      />

      {/* Clean, Non-Intrusive HUD Overlay */}
      <InterviewRoomUI />
    </div>
  );
};
