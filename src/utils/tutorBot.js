/**
 * Smart Tutor Bot - Generates explanations for wrong answers
 * Uses local Ollama (qwen2.5-coder) for UT residents (free)
 * Uses Claude Haiku for paid residents (premium)
 */

export async function generateExplanation(question, userAnswer, correctAnswer, isPaid = false, onChunk = null) {
  const prompt = buildPrompt(question, userAnswer, correctAnswer);
  
  if (isPaid) {
    return generateWithClaude(prompt);
  } else {
    return generateWithOllama(prompt, onChunk);
  }
}

function buildPrompt(question, userAnswer, correctAnswer) {
  return `You are a pediatric dental exam tutor grounded in AAPD and IADT best practices. 
You are explaining to an exam candidate why their answer was incorrect.

Question: ${question}

The candidate chose: ${userAnswer}
The correct answer is: ${correctAnswer}

Provide a concise, clinical explanation (2-3 sentences max) that:
1. Explains why their answer was incorrect
2. States the correct answer and why it's right
3. Includes relevant clinical reasoning

Focus on pediatric dental best practices. Be direct and educational, not condescending.`;
}

async function generateWithOllama(prompt, onChunk) {
  try {
    // Use Express proxy on Mini (via Tailscale)
    const endpoint = 'http://100.123.132.50:3001/api/generate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec timeout

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:32b',
        prompt: prompt,
        stream: true, // Enable streaming
        temperature: 0.7,
      }),
      signal: controller.signal,
      mode: 'cors'
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.response) {
              fullResponse += json.response;
              if (onChunk) onChunk(fullResponse);
            }
          } catch (e) {
            // Ignore JSON parse errors in stream
          }
        }
      } catch (err) {
        console.error('Stream read error:', err);
        break;
      }
    }

    return fullResponse.trim() || 'Unable to generate explanation';
  } catch (error) {
    console.error('Ollama error:', error);
    return 'Explanation service temporarily unavailable. Please check if Ollama and the proxy are running.';
  }
}

async function generateWithClaude(prompt) {
  try {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) return 'Claude API key not configured';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`Claude error: ${response.status}`);
    const data = await response.json();
    return (data.content?.[0]?.text || 'Unable to generate explanation').trim();
  } catch (error) {
    console.error('Claude error:', error);
    return 'Explanation temporarily unavailable. Please try again.';
  }
}
