import { GoogleGenAI } from '@google/genai';

/**
 * Secure Server-side Gemini Proxy Middleware for Vite.
 * Reads GEMINI_API_KEY from environment, executes LLM reasoning on server,
 * and ensures API keys are NEVER leaked to the client bundle.
 */
export function createGeminiMiddleware(env = {}) {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  let ai = null;

  if (apiKey) {
    try {
      ai = new GoogleGenAI({ apiKey });
      console.log('✓ Gemini API initialized securely on backend.');
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI with provided key:', err);
    }
  } else {
    console.log('ℹ Gemini Proxy running in development fallback mode. Set GEMINI_API_KEY in .env to enable live generation.');
  }

  return async (req, res, next) => {
    if (req.method !== 'POST') return next();

    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { targetJob, resumeText, interviewHistory = [], previousQuestion, candidateAnswer } = payload;

        // If Gemini API is available and key is configured
        if (ai && apiKey) {
          try {
            const prompt = `You are an elite, executive technical interviewer conducting a high-stakes engineering interview.
Target Role: ${targetJob || 'Software Developer'}
${resumeText ? `Candidate Resume: ${resumeText.substring(0, 1500)}` : ''}
${previousQuestion ? `Previous Question Asked: ${previousQuestion}` : ''}
${candidateAnswer ? `Candidate Response: ${candidateAnswer}` : ''}
Previous Q&A History: ${JSON.stringify(interviewHistory.slice(-3))}

Instructions:
1. Formulate the next single, articulate, conversational interview question (1-2 sentences maximum).
2. If the candidate provided an answer, follow up on their specific technical claim or architectural decision.
3. If no answer is provided yet, formulate an insightful opening or domain-focused question.
4. Respond ONLY with valid JSON using this exact schema:
{
  "question": "String containing the exact interview question to be spoken aloud",
  "competency": "Technical domain (e.g. System Design, Concurrency, Production Resiliency)",
  "difficulty": Number from 1 to 5,
  "reason": "Brief explanation of what this question assesses"
}`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
            });

            const text = response.text?.trim();
            const data = JSON.parse(text);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              id: 'q_' + Date.now(),
              question: data.question,
              competency: data.competency || 'System Architecture',
              difficulty: data.difficulty || 3,
              reason: data.reason || 'Gemini dynamic question generation',
              source: 'gemini-live',
              createdAt: new Date().toISOString()
            }));
            return;
          } catch (geminiError) {
            console.error('Gemini API call failed, falling back to local pipeline:', geminiError.message);
          }
        }

        // Development fallback pipeline (deterministic, role-tailored)
        const role = (targetJob || 'Software Engineer').toLowerCase();
        let fallbackQuestion = "Can you walk me through the most technically challenging project you have designed or engineered recently?";
        let competency = "System Design & Architecture";
        let difficulty = 3;

        if (candidateAnswer && candidateAnswer.trim()) {
          // Dynamic follow up on candidate's answer
          fallbackQuestion = `You mentioned that in your response. How did you specifically isolate that bottleneck and measure the latency impact?`;
          competency = "Performance Profiling & RCA";
          difficulty = 4;
        } else if (role.includes('backend') || role.includes('distributed')) {
          fallbackQuestion = "When scaling a distributed data pipeline, how do you handle idempotency and out-of-order event delivery at high throughput?";
          competency = "Distributed Systems & Streaming";
          difficulty = 4;
        } else if (role.includes('ml') || role.includes('ai') || role.includes('data')) {
          fallbackQuestion = "How do you detect feature store drift and implement zero-downtime model rollback strategies in production?";
          competency = "MLOps & Model Evaluation";
          difficulty = 4;
        } else if (role.includes('full') || role.includes('front')) {
          fallbackQuestion = "What architectural patterns do you rely on to prevent cascading state invalidations and keep framerates locked at 60 FPS under heavy data updates?";
          competency = "Frontend Architecture & WebGL";
          difficulty = 3;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: 'q_' + Date.now(),
          question: fallbackQuestion,
          competency: competency,
          difficulty: difficulty,
          reason: 'Dynamic role-tailored pipeline (Add GEMINI_API_KEY in .env for live Gemini reasoning)',
          source: 'gemini-local-pipeline',
          createdAt: new Date().toISOString()
        }));

      } catch (err) {
        console.error('Error handling /api/gemini/generate-question:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error in Gemini proxy', details: err.message }));
      }
    });
  };
}
