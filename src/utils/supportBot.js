/**
 * Support Bot - Answers student questions about PedBoards QE platform
 * Uses local Ollama (llama3.2:3b) via existing proxy on Mac Mini
 */

const SYSTEM_PROMPT = `You are a helpful support assistant for PedBoards QE, a pediatric dental board exam prep platform.

Answer questions about:
- How the platform works (quiz mode, exam mode, flashcards, Smart Tutor Bot)
- Pricing ($35/month, UTH residents free with @uth.tmc.edu email)
- Account issues (password reset: go to Sign In → Forgot Password)
- Cancellation (email support@pedsdentqe.com)
- Refund policy (24-hour window from purchase, then no refunds)
- Questions in the bank (1,439 questions based on AAPD 2024-2025 guidelines)
- The AI Smart Tutor (click "💡 Why?" after any question to get an explanation)
- Demo mode (visit pedsdentqe.com?demo=true for 15 free questions)
- Technical issues (try hard refresh Cmd+Shift+R, or different browser)
- Contact support: support@pedsdentqe.com

Keep answers SHORT (2-4 sentences max). Be friendly and helpful.
If you do not know the answer, say "I'm not sure about that — please email support@pedsdentqe.com and we'll help you within 24 hours."
Do NOT make up information. Do NOT discuss topics outside the platform.`;

export async function askSupportBot(question) {
  try {
    const endpoint = 'http://100.123.132.50:3001/api/generate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: `${SYSTEM_PROMPT}\n\nUser question: ${question}\n\nAnswer:`,
        stream: false,
        temperature: 0.5,
      }),
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Support bot error: ${response.status}`);

    const data = await response.json();
    return data.response?.trim() || "I'm having trouble right now. Please email support@pedsdentqe.com for help.";
  } catch (error) {
    console.error('Support bot error:', error);
    if (error.name === 'AbortError') {
      return "Sorry, I'm taking too long to respond. Please email support@pedsdentqe.com and we'll help you within 24 hours.";
    }
    return "I'm having trouble connecting right now. Please email support@pedsdentqe.com for help.";
  }
}
