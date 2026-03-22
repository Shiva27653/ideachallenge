// ──────────────────────────────────────────────
// ContactCenter.jsx — AI Co-Pilot for call center agents
// ──────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { sendWithSystem } from '../agent.js';

const CONTACT_SYSTEM_PROMPT =
  'You are a bank call center AI co-pilot. Given what the customer said, reply with: ' +
  '1 empathy tip, 1 suggested response under 15 words, 1 action to take. Bullet points only.';

function formatSuggestion(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/•/g, '<span class="suggestion-bullet">•</span>')
    .replace(/(\d+\.)/g, '<span class="suggestion-number">$1</span>');
}

export default function ContactCenter() {
  const [transcript, setTranscript] = useState([]);
  const [suggestion, setSuggestion] = useState(null); // { type: 'loading' | 'result' | 'error', html?, message? }
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText('');
    setIsProcessing(true);

    // Add to transcript
    setTranscript(prev => [...prev, { speaker: 'Customer', text }]);

    // Show loading
    setSuggestion({ type: 'loading' });

    try {
      const reply = await sendWithSystem(CONTACT_SYSTEM_PROMPT, text);
      setSuggestion({ type: 'result', html: formatSuggestion(reply) });
    } catch (err) {
      setSuggestion({ type: 'error', message: err.message });
    }

    setIsProcessing(false);
  };

  return (
    <div className="panel-grid panel-grid--contact">
      {/* Left: Transcript */}
      <div className="glass-card agent-assist">
        <div className="card-header">
          <h2 className="card-title">📞 Live Transcript</h2>
          <span className="card-badge">Agent Assist</span>
        </div>

        <div className="contact-transcript" ref={transcriptRef}>
          {transcript.length === 0 ? (
            <div className="transcript-empty">
              <span className="transcript-empty-icon">🎧</span>
              <p className="transcript-empty-text">Waiting for customer input…</p>
              <p className="transcript-empty-sub">Type what the customer says below to get AI suggestions</p>
            </div>
          ) : (
            transcript.map((line, i) => (
              <div key={i} className="transcript-line">
                <span className={`transcript-speaker transcript-speaker--${line.speaker.toLowerCase()}`}>
                  {line.speaker}:
                </span>
                <span className="transcript-text">{line.text}</span>
              </div>
            ))
          )}
        </div>

        <div className="contact-input-bar">
          <input
            type="text"
            className="contact-input"
            placeholder="Simulate Customer Speech…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={isProcessing}
          />
          <button className="btn btn-primary contact-send" onClick={handleSend} disabled={isProcessing}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Right: AI Suggestions */}
      <div className="glass-card tools-panel">
        <div className="card-header">
          <h2 className="card-title">🤖 AI Suggestions</h2>
          <span className="card-badge">Co-Pilot</span>
        </div>

        <div className="ai-suggestions-content">
          {!suggestion && (
            <div className="suggestions-empty">
              <span className="suggestions-empty-icon">💡</span>
              <p className="suggestions-empty-text">AI suggestions will appear here</p>
              <p className="suggestions-empty-sub">Enter what the customer said to receive real-time coaching</p>
            </div>
          )}

          {suggestion?.type === 'loading' && (
            <div className="contact-loading">
              <div className="typing-indicator" style={{ alignSelf: 'center' }}>
                <span></span><span></span><span></span>
              </div>
              <p className="contact-loading-text">Analyzing customer input…</p>
            </div>
          )}

          {suggestion?.type === 'result' && (
            <div className="ai-suggestion-card">
              <div className="ai-suggestion-header">
                <span className="ai-suggestion-icon">🤖</span>
                <span className="ai-suggestion-title">AI Co-Pilot Suggestion</span>
              </div>
              <div className="ai-suggestion-body" dangerouslySetInnerHTML={{ __html: suggestion.html }} />
            </div>
          )}

          {suggestion?.type === 'error' && (
            <div className="ai-suggestion-card ai-suggestion-card--error">
              <div className="ai-suggestion-header">
                <span className="ai-suggestion-icon">⚠</span>
                <span className="ai-suggestion-title">Error</span>
              </div>
              <div className="ai-suggestion-body">Could not reach AI — {suggestion.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
