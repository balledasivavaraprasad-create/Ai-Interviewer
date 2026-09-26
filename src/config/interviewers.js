import femaleImg from '../assets/female.jpg';
import femaleDepth from '../assets/female_depth.png';
import maleImg from '../assets/male.jpg';
import maleDepth from '../assets/male_depth.png';

/**
 * Enterprise Voice Configuration Layer.
 * Supports multi-provider TTS (Gemini Speech, Web Speech, Neural Cloud TTS).
 */
export const AVAILABLE_VOICES = [
  {
    voiceId: 'gemini_aoede',
    provider: 'gemini-tts',
    name: 'Aoede',
    displayName: 'Aoede (Executive Female)',
    language: 'en-US',
    gender: 'female',
    style: 'Articulate, calm, authoritative tone',
    webSpeechFallback: ['Samantha', 'Victoria', 'Ava', 'Karen', 'Zira']
  },
  {
    voiceId: 'gemini_kore',
    provider: 'gemini-tts',
    name: 'Kore',
    displayName: 'Kore (Analytical Female)',
    language: 'en-US',
    gender: 'female',
    style: 'Focused, precise, natural technical cadence',
    webSpeechFallback: ['Tessa', 'Moira', 'Jenny', 'Samantha']
  },
  {
    voiceId: 'gemini_fenrir',
    provider: 'gemini-tts',
    name: 'Fenrir',
    displayName: 'Fenrir (Principal Male)',
    language: 'en-US',
    gender: 'male',
    style: 'Resonant, analytical, strategic tone',
    webSpeechFallback: ['Daniel', 'Alex', 'Tom', 'Oliver']
  },
  {
    voiceId: 'gemini_puck',
    provider: 'gemini-tts',
    name: 'Puck',
    displayName: 'Puck (Conversational Male)',
    language: 'en-US',
    gender: 'male',
    style: 'Engaging, thoughtful, modern engineering cadence',
    webSpeechFallback: ['Fred', 'David', 'Guy', 'Alex']
  }
];

export const getVoicesForGender = (gender) => {
  const target = (gender || 'female').toLowerCase();
  return AVAILABLE_VOICES.filter(v => v.gender === target);
};

export const getVoiceById = (voiceId) => {
  return AVAILABLE_VOICES.find(v => v.voiceId === voiceId) || AVAILABLE_VOICES[0];
};

/**
 * Default persona profiles
 */
export const VOICE_PROFILES = {
  female: {
    id: 'gemini_aoede',
    gender: 'female',
    displayName: 'Aoede (Executive Female)',
    geminiVoice: 'Aoede',
    preferredWebSpeechVoices: ['Samantha', 'Victoria', 'Ava', 'Karen', 'Tessa', 'Moira', 'Zira', 'Jenny'],
    pitch: 1.02,
    rate: 0.96
  },
  male: {
    id: 'gemini_fenrir',
    gender: 'male',
    displayName: 'Fenrir (Principal Male)',
    geminiVoice: 'Fenrir',
    preferredWebSpeechVoices: ['Daniel', 'Alex', 'Tom', 'Oliver', 'Fred', 'David', 'Guy'],
    pitch: 0.95,
    rate: 0.98
  }
};

/**
 * Reusable interviewer avatar configuration.
 */
export const INTERVIEWERS = {
  female: {
    id: 'female',
    gender: 'Female',
    label: 'Female Interviewer',
    name: 'Sarah Chen',
    title: 'Senior Hiring Director & Technical Lead',
    organization: 'Enterprise Talent Group',
    yearsExperience: '12+ years evaluating top-tier engineering talent',
    evaluationFocus: ['System Architecture', 'Problem Solving', 'Leadership Principles'],
    greeting: "Welcome. I'm your interviewer.",
    image: femaleImg,
    depthMap: femaleDepth,
    aspectRatio: 16 / 9,
    voiceProfile: VOICE_PROFILES.female,
    model3d: null
  },
  male: {
    id: 'male',
    gender: 'Male',
    label: 'Male Interviewer',
    name: 'David Kim',
    title: 'Principal Systems Architect & Partner',
    organization: 'Executive Engineering Board',
    yearsExperience: '14+ years conducting principal and staff-level interviews',
    evaluationFocus: ['Distributed Systems', 'Engineering Execution', 'Strategic Alignment'],
    greeting: "Welcome. I'm your interviewer.",
    image: maleImg,
    depthMap: maleDepth,
    aspectRatio: 16 / 9,
    voiceProfile: VOICE_PROFILES.male,
    model3d: null
  }
};

export const getInterviewer = (genderKey) => {
  return INTERVIEWERS[genderKey] || INTERVIEWERS.female;
};
