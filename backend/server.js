// ──────────────────────────────────────────────
// server.js — NexaBank Proxy  |  Groq API Relay
// ──────────────────────────────────────────────
// Lightweight Express proxy that keeps the Groq API key
// server-side. The React frontend talks to localhost:5000.
// ──────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS — allow Vite dev server ──
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── GET /health — quick liveness check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: 'llama-3.3-70b-versatile' });
});

// ── POST /api/chat — relay to Groq ──
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  console.log('[proxy] Request received:', JSON.stringify(req.body).slice(0, 300));

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.error('[proxy] GROQ_API_KEY not set — check .env');
    return res.status(500).json({ error: 'GROQ_API_KEY not configured in .env' });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    console.log('[proxy] Groq status:', response.status);
    return res.json(response.data);
  } catch (err) {
    if (err.response) {
      console.error('[proxy] Groq error status:', err.response.status);
      console.error('[proxy] Groq error body:', JSON.stringify(err.response.data));
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('[proxy] Network/timeout error:', err.message);
    return res.status(502).json({ error: 'Failed to reach Groq API', detail: err.message });
  }
});

// ── Start on 0.0.0.0 ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] NexaBank proxy running → http://0.0.0.0:${PORT}`);
  console.log(`[proxy] Health check → http://localhost:${PORT}/health`);
});
