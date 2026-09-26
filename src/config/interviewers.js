import femaleImg from '../assets/female.jpg';
import femaleDepth from '../assets/female_depth.png';
import maleImg from '../assets/male.jpg';
import maleDepth from '../assets/male_depth.png';

/**
 * Locked, centralized voice configurations for entire session duration.
 * Conforms to Phase 10 & 12 specifications. Voice never changes dynamically per question.
 */
export const VOICE_PROFILES = {
  female: {
    id: 'female_voice',
    gender: 'female',
    displayName: 'Sarah Chen Voice',
    geminiVoice: 'Aoede', // Gemini Female Voice
    preferredWebSpeechVoices: ['Samantha', 'Victoria', 'Ava', 'Karen', 'Tessa', 'Moira', 'Zira', 'Jenny'],
    pitch: 1.04,
    rate: 0.96
  },
  male: {
    id: 'male_voice',
    gender: 'male',
    displayName: 'David Kim Voice',
    geminiVoice: 'Puck', // Gemini Male Voice
    preferredWebSpeechVoices: ['Daniel', 'Alex', 'Tom', 'Oliver', 'Fred', 'David', 'Guy'],
    pitch: 0.94,
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
