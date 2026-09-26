import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getInterviewer } from '../config/interviewers';
import { SpeechEngine } from '../services/speech/SpeechEngine';
import { AudioAnalyzer } from '../services/speech/AudioAnalyzer';
import { GeminiService } from '../services/ai/GeminiInterviewService';
import { InterviewerStateController } from '../controllers/avatar/InterviewerStateController';
import { STEPS, AVATAR_STATES, INTERVIEW_STATES } from '../config/constants';
import { InterviewTelemetry } from '../services/telemetry/InterviewTelemetry';
import { CandidateTracker } from '../services/vision/CandidateTracker';
import { InterviewerAudioController } from '../services/audio/InterviewerAudioController';

export { AVATAR_STATES, INTERVIEW_STATES };

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

  // Authoritative State Machine (Strict, Single State)
  const [interviewState, setInterviewState] = useState(INTERVIEW_STATES.IDLE);
  const interviewStateRef = useRef(INTERVIEW_STATES.IDLE);
  interviewStateRef.current = interviewState;

  // Candidate CV & Speaking State
  const [candidateSpeaking, setCandidateSpeaking] = useState(false);
  const [candidateCV, setCandidateCV] = useState({
    faceDetected: false,
    mouthDetected: false,
    faceConfidence: 0,
    mouthOpenness: 0,
    mouthMovement: 0,
    lastFaceTimestamp: 0,
    lastAudioActivityTimestamp: 0
  });

  // Authoritative Synchronized Question Object & Subtitle State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [spokenText, setSpokenText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [speechEnergy, setSpeechEnergy] = useState(0);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Authoritative Interviewer Voice Configuration
  const [interviewerVoice, setInterviewerVoiceState] = useState('gemini_aoede');

  // Audio & Hardware Permissions
  const [audioStreamActive, setAudioStreamActive] = useState(true);
  const [cameraStreamActive, setCameraStreamActive] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(true);

  // Telemetry Snapshot
  const [telemetry, setTelemetry] = useState(InterviewTelemetry.getSnapshot());

  // Controller instance
  const stateControllerRef = useRef(null);
  if (!stateControllerRef.current) {
    stateControllerRef.current = new InterviewerStateController((newState) => {
      setAvatarState(newState);
    });
  }

  // Set Interviewer Voice (applies to subsequent speech)
  const setInterviewerVoice = useCallback((voiceId) => {
    setInterviewerVoiceState(voiceId);
    SpeechEngine.setInterviewerVoice(voiceId);
    InterviewerAudioController.setInterviewerVoice(voiceId);
  }, []);

  // Session-lock gender and voice
  const setInterviewerGender = useCallback((gender) => {
    setInterviewerGenderState(gender);
    SpeechEngine.lockSessionVoice(gender);
    const defaultVoice = gender === 'male' ? 'gemini_fenrir' : 'gemini_aoede';
    setInterviewerVoiceState(defaultVoice);
    SpeechEngine.setInterviewerVoice(defaultVoice);
  }, []);

  // Audio Mute State
  const [isInterviewerMuted, setIsInterviewerMuted] = useState(InterviewerAudioController.isMuted);

  const toggleInterviewerMute = useCallback(() => {
    const nextMuted = InterviewerAudioController.toggleMute();
    setIsInterviewerMuted(nextMuted);
    return nextMuted;
  }, []);

  // Subscribe to central InterviewerAudioController playback events
  useEffect(() => {
    const unsub = InterviewerAudioController.subscribe((audioSnap) => {
      setIsInterviewerSpeaking(audioSnap.isSpeaking);
      setIsInterviewerMuted(audioSnap.isMuted);
      setCurrentAudioTime(audioSnap.currentAudioTime);
      setAudioDuration(audioSnap.audioDuration);
    });
    return () => unsub();
  }, []);

  // Subscribe to Telemetry updates
  useEffect(() => {
    const unsub = InterviewTelemetry.subscribe((t) => setTelemetry(t));
    return () => unsub();
  }, []);

  // Subscribe to Candidate CV & Speaking updates
  useEffect(() => {
    const unsub = CandidateTracker.subscribe((cv) => {
      setCandidateSpeaking(cv.candidateSpeaking);
      setCandidateCV({
        faceDetected: cv.faceDetected,
        mouthDetected: cv.mouthDetected,
        faceConfidence: cv.faceConfidence,
        mouthOpenness: cv.mouthOpenness,
        mouthMovement: cv.mouthMovement,
        lastFaceTimestamp: cv.lastFaceTimestamp,
        lastAudioActivityTimestamp: cv.lastAudioActivityTimestamp
      });
    });
    return () => unsub();
  }, []);

  // State Machine Transition Rule Engine (Prevents Conflicting States)
  const transitionInterviewState = useCallback((nextState, reason = '') => {
    const current = interviewStateRef.current;
    if (current === nextState) return;

    // Strict validation rules
    // 1. While INTERVIEWER_SPEAKING, candidate cannot change state or submit turn
    if (current === INTERVIEW_STATES.INTERVIEWER_SPEAKING && nextState === INTERVIEW_STATES.CANDIDATE_SPEAKING) {
      console.warn(`[State Guard] Blocked candidate speaking trigger while interviewer is speaking.`);
      return;
    }

    console.log(`[Interview State Machine] Transition: ${current} -> ${nextState} (${reason})`);
    interviewStateRef.current = nextState;
    setInterviewState(nextState);

    // Record high-resolution telemetry timestamp for state change
    InterviewTelemetry.recordEvent(`STATE_${nextState}`, { from: current, to: nextState, reason });
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

  // Office entrance sequence
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

  // Forward declarations for question lifecycle
  const askNextQuestionRef = useRef(null);

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

    // State transition -> INTERVIEWER_SPEAKING
    transitionInterviewState(INTERVIEW_STATES.INTERVIEWER_SPEAKING, 'Question audio beginning');
    InterviewTelemetry.recordEvent('questionStartedAt', { questionId: fullObj.id, text: fullObj.text });
    InterviewTelemetry.recordEvent('questionAudioStartedAt', { questionId: fullObj.id });

    // Speak using permanently locked session gender
    stateControllerRef.current.startSpeakingSequence(
      fullObj.text,
      interviewerGender || 'female',
      () => {
        console.log('Interviewer speech completed cleanly.');
        InterviewTelemetry.recordEvent('questionAudioEndedAt', { questionId: fullObj.id });

        // Transition from speaking to waiting for candidate response
        transitionInterviewState(INTERVIEW_STATES.WAITING_FOR_CANDIDATE, 'Interviewer finished asking question');
      }
    );
  }, [interviewerGender, transitionInterviewState]);

  // Core Gemini Question Lifecycle
  const startInterview = useCallback(async () => {
    await unlockAudio();
    setIsInterviewStarted(true);

    // 1. Initial State: Camera & CV Initializing
    transitionInterviewState(INTERVIEW_STATES.CAMERA_INITIALIZING, 'Requesting webcam and initializing FaceLandmarker');
    InterviewTelemetry.recordEvent('interviewStartedAt', { targetJob: targetJob || 'Software Engineer' });

    // 2. Camera & CV warm-up
    setTimeout(() => {
      transitionInterviewState(INTERVIEW_STATES.READY, 'Camera and CV tracking confirmed');
      setIsGeneratingQuestion(true);

      GeminiService.generateNextQuestion({
        targetJob: targetJob || 'Software Engineer',
        resumeText: resume ? `Candidate file: ${resume.name}` : '',
        interviewHistory: []
      }).then(q => {
        setCurrentQuestionIndex(0);
        executeSpeech(q);
      }).catch(e => {
        console.error('Failed to start interview question:', e);
        executeSpeech({
          id: 'q_init',
          text: "Welcome. Can you walk me through the most technically challenging project you have designed or engineered recently?",
          competency: "System Design & Problem Solving",
          difficulty: 3
        });
      }).finally(() => {
        setIsGeneratingQuestion(false);
      });
    }, 1400);

  }, [targetJob, resume, unlockAudio, executeSpeech, transitionInterviewState]);

  const askNextQuestion = useCallback(async (candidateAnswer) => {
    transitionInterviewState(INTERVIEW_STATES.ANALYZING, 'Evaluating candidate response');
    setIsGeneratingQuestion(true);

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
      transitionInterviewState(INTERVIEW_STATES.NEXT_QUESTION, 'Formulating next technical question');
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
  }, [currentQuestion, targetJob, resume, interviewHistory, executeSpeech, transitionInterviewState]);

  askNextQuestionRef.current = askNextQuestion;

  // React to Candidate Speaking in WAITING_FOR_CANDIDATE state
  useEffect(() => {
    const current = interviewStateRef.current;

    if (current === INTERVIEW_STATES.WAITING_FOR_CANDIDATE && candidateSpeaking === true) {
      transitionInterviewState(INTERVIEW_STATES.CANDIDATE_SPEAKING, 'Candidate began speaking detected via CV + Audio');
      InterviewTelemetry.recordEvent('candidateSpeechStartedAt', { hr: performance.now() });
    } else if (current === INTERVIEW_STATES.CANDIDATE_SPEAKING && candidateSpeaking === false) {
      // Candidate paused/finished speaking
      transitionInterviewState(INTERVIEW_STATES.TRANSCRIBING, 'Candidate finished response');
      InterviewTelemetry.recordEvent('candidateSpeechEndedAt', { hr: performance.now() });

      // Simulate natural speech ingestion before formulating next turn
      const timer = setTimeout(() => {
        InterviewTelemetry.recordEvent('transcriptReceivedAt', { transcript: 'Candidate completed explanation' });
        if (askNextQuestionRef.current) {
          askNextQuestionRef.current("Candidate presented system design and performance considerations.");
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [candidateSpeaking, transitionInterviewState]);

  const replayQuestion = useCallback(() => {
    if (currentQuestion && currentQuestion.text) {
      executeSpeech(currentQuestion);
    }
  }, [currentQuestion, executeSpeech]);

  const stopSpeaking = useCallback(() => {
    stateControllerRef.current.stop(AVATAR_STATES.LISTENING);
  }, []);

  const testVoice = useCallback((gender) => {
    SpeechEngine.speak(
      gender === 'female' 
        ? "Hello, I am Sarah Chen. I will be your technical interviewer today." 
        : "Hello, I am David Kim. I look forward to exploring your systems experience.",
      { gender }
    );
  }, []);

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
        interviewState,
        transitionInterviewState,
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

        // Candidate CV & Multimodal Speaking State
        candidateSpeaking,
        candidateCV,

        // High-Resolution Telemetry & Timestamps
        telemetry,

        // Authoritative Question & Subtitle
        currentQuestion,
        currentQuestionIndex,
        interviewHistory,
        spokenText,
        currentWordIndex,
        isInterviewerSpeaking,
        interviewerSpeaking: isInterviewerSpeaking,
        currentAudioTime,
        audioDuration,
        interviewerVoice,
        setInterviewerVoice,
        interviewerAudioController: InterviewerAudioController,
        isInterviewerMuted,
        toggleInterviewerMute,
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
