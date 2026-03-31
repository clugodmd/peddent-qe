/**
 * Adaptive Tutor Bot
 * - Personalizes explanations based on user's weak topics
 * - All explanations via Cloudflare Worker (Claude Haiku)
 */

export async function generateExplanation(question, userAnswer, correctAnswer, isPaid = false, onChunk = null, weakTopics = []) {
  const prompt = buildPrompt(question, userAnswer, correctAnswer, weakTopics);
  return generateWithClaude(prompt);
}

/**
 * Get user's weak topics from Firestore stats
 * Returns array of topic names where accuracy < 70% (min 3 attempts)
 */
export function getWeakTopics(topicBreakdown = {}) {
  return Object.entries(topicBreakdown)
    .filter(([, data]) => data.answered >= 3 && (data.correct / data.answered) < 0.70)
    .sort((a, b) => (a[1].correct / a[1].answered) - (b[1].correct / b[1].answered))
    .slice(0, 3)
    .map(([topic]) => topic);
}

/**
 * Get adaptive question weights — weak topics get 3x probability
 */
export function getAdaptiveQuestions(allQuestions, topicBreakdown = {}, count = 20) {
  if (!allQuestions?.length) return [];
  const weakTopics = getWeakTopics(topicBreakdown);
  
  if (weakTopics.length === 0) {
    // No weak areas yet — random
    return [...allQuestions].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // Separate weak and other questions
  const weakQs = allQuestions.filter(q => weakTopics.includes(q.topic));
  const otherQs = allQuestions.filter(q => !weakTopics.includes(q.topic));

  // Target: 60% weak topics, 40% other
  const weakCount = Math.min(Math.round(count * 0.6), weakQs.length);
  const otherCount = Math.min(count - weakCount, otherQs.length);

  const selected = [
    ...weakQs.sort(() => Math.random() - 0.5).slice(0, weakCount),
    ...otherQs.sort(() => Math.random() - 0.5).slice(0, otherCount),
  ].sort(() => Math.random() - 0.5);

  return selected;
}

function buildPrompt(question, userAnswer, correctAnswer, weakTopics = []) {
  const weakContext = weakTopics.length > 0
    ? `\nNote: This student has shown repeated difficulty with: ${weakTopics.join(', ')}. If relevant, briefly connect your explanation to these patterns.`
    : '';

  return `You are an adaptive pediatric dental board exam tutor grounded in AAPD and IADT best practices.
You are explaining to an exam candidate why their answer was incorrect.

Question: ${question}

The candidate chose: ${userAnswer}
The correct answer is: ${correctAnswer}
${weakContext}

Provide a concise, clinical explanation (2-3 sentences max) that:
1. Explains why their answer was incorrect
2. States the correct answer and why it's right  
3. Includes relevant clinical reasoning

Be direct and educational. Do not be condescending.`;
}

async function generateWithClaude(prompt) {
  try {
    const response = await fetch('https://peddent-tutor.clugodmd.workers.dev', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error(`Worker error: ${response.status}`);
    const data = await response.json();
    return (data.text || 'Unable to generate explanation').trim();
  } catch (error) {
    console.error('Claude error:', error);
    return 'Explanation temporarily unavailable. Please try again.';
  }
}
