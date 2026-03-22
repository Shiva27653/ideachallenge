// ──────────────────────────────────────────────
// agent.js — Groq API calls via backend proxy
// ──────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PROXY_URL = `${BASE_URL}/api/chat`;

// Health check on import
fetch(`${BASE_URL}/health`)
  .then(r => r.json())
  .then(d => console.log('Backend alive:', d))
  .catch(e => console.error('Backend unreachable:', e));

/**
 * Send a user message to Groq via the proxy.
 * @param {string} userMessage
 * @param {Array}  conversationHistory — prior {role, content} messages
 * @returns {Promise<string>} assistant text response
 */
export async function sendMessage(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.error || `Proxy returned ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Send a message with a custom system prompt (Contact Center co-pilot).
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>} assistant text response
 */
export async function sendWithSystem(systemPrompt, userMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.error || `Proxy returned ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Stream a response (placeholder — falls back to non-streaming).
 */
export async function streamMessage(userMessage, conversationHistory = [], onToken = () => {}) {
  const reply = await sendMessage(userMessage, conversationHistory);
  onToken(reply);
  return reply;
}
