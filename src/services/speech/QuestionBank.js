/**
 * Executive technical interview question bank categorized by competency and domain.
 */
export const INTERVIEW_QUESTIONS = [
  {
    id: 'intro',
    role: 'General',
    category: 'Background',
    text: "Welcome. Let's begin by discussing your engineering background and the core technical domains you specialize in."
  },
  {
    id: 'project_challenge',
    role: 'General',
    category: 'System Design',
    text: "Can you walk me through the most technically challenging project you have designed or engineered recently?"
  },
  {
    id: 'tradeoffs',
    role: 'General',
    category: 'Architecture Decisions',
    text: "What was the most critical architectural trade-off you evaluated in that system, and how did you measure its success?"
  },
  {
    id: 'scaling',
    role: 'Backend Engineer',
    category: 'Distributed Systems',
    text: "How would you evolve this architecture to handle a tenfold increase in throughput while maintaining single-digit millisecond latency?"
  },
  {
    id: 'ml_lifecycle',
    role: 'ML Engineer',
    category: 'Production ML',
    text: "How do you manage model degradation, feature store drift, and automated rollback strategies in production serving pipelines?"
  },
  {
    id: 'collaboration',
    role: 'General',
    category: 'Engineering Leadership',
    text: "Tell me about a time you strongly disagreed with another engineer or stakeholder on a system design choice. How did you resolve it?"
  }
];

export const getQuestionsForRole = (role) => {
  const norm = (role || '').toLowerCase();
  if (norm.includes('ml') || norm.includes('machine learning') || norm.includes('ai')) {
    return INTERVIEW_QUESTIONS.filter(q => q.role === 'ML Engineer' || q.role === 'General');
  }
  if (norm.includes('backend') || norm.includes('system') || norm.includes('architect')) {
    return INTERVIEW_QUESTIONS.filter(q => q.role === 'Backend Engineer' || q.role === 'General');
  }
  return INTERVIEW_QUESTIONS;
};
