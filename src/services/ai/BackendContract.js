/**
 * Backend Integration Contract for Gemini & Audio-Visual Interview Pipeline.
 * 
 * Defines standardized schemas and endpoints for Phase 2:
 * 1. Candidate Audio / Microphone Stream
 * 2. Real-time Speech Transcription (Interim & Finalized)
 * 3. Gemini Interview Reasoning & Adaptive Question Generation
 * 4. Candidate Answer Evaluation
 * 5. Text-to-Speech & Phoneme/Viseme Timeline Generation
 * 
 * SECURITY: All Gemini API keys are server-side only. Never expose in client code.
 */

export const BACKEND_ENDPOINTS = {
  // LLM Reasoning & Question Engine
  GENERATE_QUESTION: '/api/gemini/generate-question',
  ANALYZE_ANSWER: '/api/gemini/evaluate-answer',

  // Audio & Speech Pipeline
  TRANSCRIBE_STREAM: '/api/speech/transcribe-stream',
  SYNTHESIZE_SPEECH: '/api/speech/synthesize',

  // Live Telemetry / Session Synchronization
  SESSION_TELEMETRY: '/api/interview/telemetry'
};

/**
 * Expected schema sent to backend when candidate completes an answer.
 */
export const CandidateSpeechEventSchema = {
  sessionId: 'string',
  questionId: 'string',
  transcript: 'string',
  isFinal: true,
  timestamps: {
    questionPresentedAt: 0,
    speechStartedAt: 0,
    speechEndedAt: 0,
    durationSeconds: 0
  },
  cvTelemetry: {
    faceDetected: true,
    mouthMovementAverage: 0.25,
    confidence: 0.94
  }
};

/**
 * Expected schema returned by backend TTS for Interviewer Lip-Sync.
 */
export const InterviewerSpeechTimelineSchema = {
  audioId: 'audio_17904000',
  audioUrl: 'https://.../speech.mp3',
  duration: 4.82,
  segments: [
    { start: 0.00, end: 0.08, viseme: 'SILENCE' },
    { start: 0.08, end: 0.22, viseme: 'AA' },
    { start: 0.22, end: 0.35, viseme: 'T' }
  ],
  words: [
    { text: 'Can', startTime: 0.08, endTime: 0.35 }
  ]
};
