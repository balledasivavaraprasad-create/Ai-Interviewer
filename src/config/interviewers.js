import femaleImg from '../assets/female.jpg';
import femaleDepth from '../assets/female_depth.png';
import maleImg from '../assets/male.jpg';
import maleDepth from '../assets/male_depth.png';

/**
 * Reusable interviewer avatar configuration.
 * Extensible for future GLTF models, audio TTS voices, viseme mapping, and LLM persona prompts.
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
    // Future 3D asset slot (e.g. GLTF / Metahuman / ReadyPlayerMe)
    model3d: null, 
    // Future TTS audio & voice configuration
    voiceConfig: {
      voiceId: 'en-US-Journey-F',
      pitch: 1.0,
      speakingRate: 0.98,
      accent: 'Neutral Professional'
    }
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
    // Future 3D asset slot (e.g. GLTF / Metahuman / ReadyPlayerMe)
    model3d: null,
    // Future TTS audio & voice configuration
    voiceConfig: {
      voiceId: 'en-US-Journey-D',
      pitch: 0.95,
      speakingRate: 1.0,
      accent: 'Neutral Professional'
    }
  }
};

export const getInterviewer = (genderKey) => {
  return INTERVIEWERS[genderKey] || INTERVIEWERS.female;
};
