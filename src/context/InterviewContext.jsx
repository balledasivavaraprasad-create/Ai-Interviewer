import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { INTERVIEWERS, getInterviewer } from '../config/interviewers';
import { SpeechEngine } from '../services/speech/SpeechEngine';
import { AudioAnalyzer } from '../services/speech/AudioAnalyzer';
import { getQuestionsForRole } from '../services/speech/QuestionBank';
import { InterviewerStateController } from '../controllers/avatar/InterviewerStateController';

const InterviewContext = createContext(null);

import { STEPS, AVATAR_STATES } from '../config/constants';
export { AVATAR_STATES };

export const InterviewProvider = ({ children }) => {
  // Step 1 State: Resume & Target Role
  const [resume, setResume] = useState(null);
  const [targetJob, setTargetJob] = useState('');

  // Step 2 State: Interviewer Selection
  const [interviewerGender, setInterviewerGender] = useState(null);

  // Overall Flow Step
  const [currentStep, setCurrentStep] = useState(STEPS.PROFILE_SETUP);
  const [transitionSubphase, setTransitionSubphase] = useState('idle');

  // Avatar & Conversational State
  const [avatarState, setAvatarState] = useState(AVATAR_STATES.IDLE);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  // Synchronized Subtitle / Transcript State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [spokenText, setSpokenText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [speechEnergy, setSpeechEnergy] = useState(0);

  // Audio & Hardware Permissions
  const [audioStreamActive, setAudioStreamActive] = useState(true);
  const [cameraStreamActive, setCameraStreamActive] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(true);

  // Controller instance
  const stateControllerRef = useRef(null);
  if (!stateControllerRef.current) {
    stateControllerRef.current = new InterviewerStateController((newState) => {
      setAvatarState(newState);
    });
  }

  // Subscribe to authoritative speech timeline frames
  useEffect(() => {
    const unsubscribe = SpeechEngine.subscribe((data) => {
      setIsInterviewerSpeaking(data.isSpeaking);
      setCurrentWordIndex(data.currentWordIndex);
      setSpeechEnergy(data.energy);
      if (data.text) {
        setSpokenText(data.text);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stateControllerRef.current) {
        stateControllerRef.current.dispose();
      }
    };
  }, []);

  // Resume handlers
  const handleUploadResume = useCallback((file) => {
    if (!file) return;
    setResume({
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      lastModified: file.lastModified,
      uploadProgress: 100
    });
  }, []);

  const handleRemoveResume = useCallback(() => {
    setResume(null);
  }, []);

  // Navigation handlers
  const goToInterviewerSelection = useCallback(() => {
    setCurrentStep(STEPS.INTERVIEWER_SELECTION);
  }, []);

  const backToProfileSetup = useCallback(() => {
    setCurrentStep(STEPS.PROFILE_SETUP);
  }, []);

  // Office entrance sequence (0.0s to 5.5s)
  const startOfficeEntrance = useCallback(() => {
    if (!interviewerGender) return;
    setCurrentStep(STEPS.TRANSITIONING_TO_OFFICE);
    setTransitionSubphase('fade-ui');

    setTimeout(() => setTransitionSubphase('camera-push'), 350);
    setTimeout(() => setTransitionSubphase('entering-office'), 1100);
    setTimeout(() => setTransitionSubphase('settling'), 2200);
    setTimeout(() => setTransitionSubphase('reveal-interviewer'), 3400);
    setTimeout(() => {
      setCurrentStep(STEPS.IN_OFFICE);
      setTransitionSubphase('ready');
    }, 4800);
  }, [interviewerGender]);

  // Audio unlock helper (handles browser autoplay policies)
  const unlockAudio = useCallback(async () => {
    await AudioAnalyzer.unlock();
    setIsAudioUnlocked(true);
  }, []);

  // Core Speech & Question Delivery Methods
  const askQuestion = useCallback((text) => {
    if (!text) return;
    setCurrentQuestion({ text });
    setSpokenText(text);
    setCurrentWordIndex(-1);

    stateControllerRef.current.startSpeakingSequence(
      text,
      interviewerGender || 'female',
      () => {
        // Callback on speech completion: returns to LISTENING
        console.log('Interviewer finished speaking.');
      }
    );
  }, [interviewerGender]);

  const startInterview = useCallback(async () => {
    await unlockAudio();
    setIsInterviewStarted(true);

    const questions = getQuestionsForRole(targetJob);
    const firstQ = questions[0] || {
      text: "Welcome. Let's begin by discussing your engineering background and the technical domains you specialize in."
    };

    setCurrentQuestionIndex(0);
    askQuestion(firstQ.text);
  }, [targetJob, unlockAudio, askQuestion]);

  const askNextQuestion = useCallback(() => {
    const questions = getQuestionsForRole(targetJob);
    const nextIdx = (currentQuestionIndex + 1) % questions.length;
    setCurrentQuestionIndex(nextIdx);
    askQuestion(questions[nextIdx].text);
  }, [targetJob, currentQuestionIndex, askQuestion]);

  const replayQuestion = useCallback(() => {
    if (currentQuestion && currentQuestion.text) {
      askQuestion(currentQuestion.text);
    }
  }, [currentQuestion, askQuestion]);

  const stopSpeaking = useCallback(() => {
    stateControllerRef.current.stop(AVATAR_STATES.LISTENING);
  }, []);

  // Dispatch external / future backend API events
  const dispatchInterviewEvent = useCallback((event) => {
    if (!event || !event.type) return;
    switch (event.type) {
      case 'interviewer_question':
        askQuestion(event.text);
        break;
      case 'interviewer_state':
        stateControllerRef.current.setState(event.state || AVATAR_STATES.IDLE);
        break;
      case 'stop_speech':
        stopSpeaking();
        break;
      default:
        console.log('Unhandled event:', event);
    }
  }, [askQuestion, stopSpeaking]);

  const selectedInterviewer = interviewerGender ? getInterviewer(interviewerGender) : null;

  return (
    <InterviewContext.Provider
      value={{
        // Form & Persona
        resume,
        targetJob,
        interviewerGender,
        selectedInterviewer,
        setResume: handleUploadResume,
        removeResume: handleRemoveResume,
        setTargetJob,
        setInterviewerGender,

        // Step navigation
        currentStep,
        transitionSubphase,
        goToInterviewerSelection,
        backToProfileSetup,
        startOfficeEntrance,

        // State Machine & Speech
        avatarState,
        setAvatarState: (st) => stateControllerRef.current.setState(st),
        isInterviewStarted,
        startInterview,
        askQuestion,
        askNextQuestion,
        replayQuestion,
        stopSpeaking,
        dispatchInterviewEvent,

        // Synchronized Subtitle / Transcript
        currentQuestion,
        currentQuestionIndex,
        spokenText,
        currentWordIndex,
        isInterviewerSpeaking,
        speechEnergy,

        // Hardware & Audio Unlocking
        audioStreamActive,
        setAudioStreamActive,
        cameraStreamActive,
        setCameraStreamActive,
        isAudioUnlocked,
        unlockAudio
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
