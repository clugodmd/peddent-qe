/**
 * questionGenerator.js
 *
 * AI-powered question generation utility for PedBoards QE.
 * Foundation scaffold — AI API integration to be wired in a later step.
 */

/**
 * Generates quiz questions from a block of clinical text.
 *
 * @param {string} text   - Source clinical text or guideline content
 * @param {string} topic  - Topic label (e.g. "Caries Management", "Sedation")
 * @param {number} count  - Number of questions to generate (default: 5)
 * @returns {Promise<Array>} Array of question objects in the app's standard format
 *
 * TODO: Replace stub with actual AI API call (e.g. OpenAI chat completions).
 *       Expected response shape per question:
 *       {
 *         id: string,
 *         topic: string,
 *         question: string,
 *         choices: { A: string, B: string, C: string, D: string },
 *         answer: 'A' | 'B' | 'C' | 'D',
 *         explanation: string,
 *         source: string  // e.g. "AAPD 2025 Guideline on ..."
 *       }
 */
export async function generateQuestionsFromText(text, topic, count = 5) {
  // TODO: Implement AI API call here.
  // Suggested implementation:
  //   const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
  //     },
  //     body: JSON.stringify({
  //       model: 'gpt-4o',
  //       messages: [
  //         { role: 'system', content: SYSTEM_PROMPT },
  //         { role: 'user', content: buildUserPrompt(text, topic, count) },
  //       ],
  //       response_format: { type: 'json_object' },
  //     }),
  //   });
  //   const data = await response.json();
  //   return JSON.parse(data.choices[0].message.content).questions;

  console.warn('generateQuestionsFromText: AI API not yet wired in. Returning empty array.');
  return [];
}
