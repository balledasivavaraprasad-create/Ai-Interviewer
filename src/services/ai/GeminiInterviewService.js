/**
 * Client-side Gemini Interview Service.
 * Communicates with the secure local backend proxy to retrieve LLM-reasoned interview questions.
 * Guarantees single-source-of-truth: the returned question string is used for display, audio, and visemes.
 */
class GeminiInterviewService {
  async generateNextQuestion(context = {}) {
    const {
      targetJob = 'Software Developer',
      resumeText = '',
      interviewHistory = [],
      previousQuestion = '',
      candidateAnswer = ''
    } = context;

    try {
      const response = await fetch('/api/gemini/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetJob,
          resumeText,
          interviewHistory,
          previousQuestion,
          candidateAnswer
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} from Gemini proxy`);
      }

      const data = await response.json();
      return {
        id: data.id || `q_${Date.now()}`,
        text: data.question,
        competency: data.competency || 'System Architecture',
        difficulty: data.difficulty || 3,
        reason: data.reason || 'Evaluates technical depth and problem-solving',
        source: data.source || 'gemini'
      };
    } catch (err) {
      console.warn('Gemini question generation fallback due to network/server issue:', err);
      // Resilience fallback
      return {
        id: `q_${Date.now()}`,
        text: previousQuestion
          ? "How would you monitor and measure performance metrics for that implementation in a production environment?"
          : "Welcome. Can you walk me through the most technically challenging project you have designed or engineered recently?",
        competency: "Production Engineering & Observability",
        difficulty: 3,
        reason: "Core technical evaluation",
        source: 'resilience-fallback'
      };
    }
  }
}

export const GeminiService = new GeminiInterviewService();
