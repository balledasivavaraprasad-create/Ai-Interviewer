import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { INTERVIEWERS, getInterviewer, VOICE_PROFILES } from '../config/interviewers';
import { SpeechEngine } from '../services/speech/SpeechEngine';
import { AudioAnalyzer } from '../services/speech/AudioAnalyzer';
import { GeminiService } from '../services/ai/GeminiInterviewService';
import { InterviewerStateController } from '../controllers/avatar/InterviewerStateController';
import { STEPS, AVATAR_STATES } from '../config/constants';

export { AVATAR_STATES };

const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
  // Step 1 State: Resume & Target Role
  const [resume, setResume] = useState(null);
  const [targetJob, setTargetJob] = useState('');

  // Step 2 State: Selected Interviewer Gender (Session Locked)
  const [interviewerGender, setInterviewerGenderState] = useState(null);

  // Overall Flow Step
  const [currentStep, setCurrentStep] = useState(STEPS.PROFILE_SETUP);
  const [transitionSubphase, setTransitionSubphase] = useState('idle');

  // Avatar & Conversational State
  const [avatarState, setAvatarState] = useState(AVATAR_STATES.IDLE);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  // Authoritative Synchronized Question Object & Subtitle State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [spokenText, setSpokenText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [speechEnergy, setSpeechEnergy] = useState(0);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

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

  // Session-lock gender and voice
  const setInterviewerGender = useCallback((gender) => {
    setInterviewerGenderState(gender);
    SpeechEngine.lockSessionVoice(gender);
  }, []);

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
    SpeechEngine.lockSessionVoice(interviewerGender);
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

  // Audio unlock helper
  const unlockAudio = useCallback(async () => {
    await AudioAnalyzer.unlock();
    setIsAudioUnlocked(true);
  }, []);

  // Authoritative speech execution
  const executeSpeech = useCallback((questionObj) => {
    const text = typeof questionObj === 'string' ? questionObj : questionObj.text;
    if (!text) return;

    const fullObj = typeof questionObj === 'string' 
      ? { id: `q_${Date.now()}`, text, competency: 'Technical Competency', difficulty: 3 }
      : questionObj;

    setCurrentQuestion(fullObj);
    setSpokenText(fullObj.text);
    setCurrentWordIndex(-1);

    // Speak using permanently locked session gender
    stateControllerRef.current.startSpeakingSequence(
      fullObj.text,
      interviewerGender || 'female',
      () => {
        console.log('Interviewer speech completed cleanly.');
      }
    );
  }, [interviewerGender]);

  // Core Gemini Question Lifecycle
  const startInterview = useCallback(async () => {
    await unlockAudio();
    setIsInterviewStarted(true);
    setIsGeneratingQuestion(true);

    try {
      const q = await GeminiService.generateNextQuestion({
        targetJob: targetJob || 'Software Engineer',
        resumeText: resume ? `Candidate file: ${resume.name}` : '',
        interviewHistory: []
      });
      setCurrentQuestionIndex(0);
      executeSpeech(q);
    } catch (e) {
      console.error('Failed to start interview question:', e);
      executeSpeech({
        id: 'q_init',
        text: "Welcome. Can you walk me through the most technically challenging project you have designed or engineered recently?",
        competency: "System Design & Problem Solving",
        difficulty: 3
      });
    } finally {
      setIsGeneratingQuestion(false);
    }
  }, [targetJob, resume, unlockAudio, executeSpeech]);

  const askNextQuestion = useCallback(async (candidateAnswer) => {
    setIsGeneratingQuestion(true);

    // Archive current Q&A in interview history
    if (currentQuestion) {
      setInterviewHistory(prev => [
        ...prev,
        {
          question: currentQuestion.text,
          answer: candidateAnswer || 'Candidate addressed the prompt',
          competency: currentQuestion.competency
        }
      ]);
    }

    try {
      const nextQ = await GeminiService.generateNextQuestion({
        targetJob: targetJob || 'Software Engineer',
        resumeText: resume ? `Candidate file: ${resume.name}` : '',
        interviewHistory,
        previousQuestion: currentQuestion?.text || '',
        candidateAnswer: candidateAnswer || ''
      });

      setCurrentQuestionIndex(prev => prev + 1);
      executeSpeech(nextQ);
    } catch (e) {
      console.error('Failed to generate next Gemini question:', e);
      executeSpeech({
        id: `q_${Date.now()}`,
        text: "What was the most critical architectural decision or trade-off you had to evaluate in that system?",
        competency: "Architecture Decisions",
        difficulty: 4
      });
    } finally {
      setIsGeneratingQuestion(false);
    }
  }, [currentQuestion, targetJob, resume, interviewHistory, executeSpeech]);

  const replayQuestion = useCallback(() => {
    if (currentQuestion && currentQuestion.text) {
      executeSpeech(currentQuestion);
    }
  }, [currentQuestion, executeSpeech]);

  const stopSpeaking = useCallback(() => {
    stateControllerRef.current.stop(AVATAR_STATES.LISTENING);
  }, []);

  // Developer Voice Test Panel (Phase 35)
  const testVoice = useCallback((gender) => {
    SpeechEngine.speak(
      gender === 'female' 
        ? "Hello, I am Sarah Chen. I will be your technical interviewer today." 
        : "Hello, I am David Kim. I look forward to exploring your systems experience.",
      { gender }
    );
  }, []);

  // Dispatch external / future backend API events
  const dispatchInterviewEvent = useCallback((event) => {
    if (!event || !event.type) return;
    switch (event.type) {
      case 'interviewer_question':
        executeSpeech(event.question || event.text);
        break;
      case 'interviewer_state':
        stateControllerRef.current.setState(event.state || AVATAR_STATES.IDLE);
        break;
      case 'stop_speech':
        stopSpeaking();
        break;
      default:
        console.log('Unhandled interview event:', event);
    }
  }, [executeSpeech, stopSpeaking]);

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

        // State Machine & Speech Lifecycle
        avatarState,
        setAvatarState: (st) => stateControllerRef.current.setState(st),
        isInterviewStarted,
        isGeneratingQuestion,
        startInterview,
        askNextQuestion,
        replayQuestion,
        stopSpeaking,
        testVoice,
        dispatchInterviewEvent,

        // Authoritative Question & Subtitle
        currentQuestion,
        currentQuestionIndex,
        interviewHistory,
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
