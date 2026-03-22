// ──────────────────────────────────────────────
// StatusBar.jsx — Bottom status bar
// ──────────────────────────────────────────────

import React from 'react';

export default function StatusBar({ latency, tokens }) {
  return (
    <footer className="bottom-bar">
      <div className="bar-item">
        <span className="bar-label">Model:</span>
        <span className="bar-value">llama-3.3-70b-versatile (via Groq)</span>
      </div>
      <div className="bar-divider"></div>
      <div className="bar-item">
        <span className="bar-label">Latency:</span>
        <span className="bar-value">{latency ? `${latency}ms` : '--ms'}</span>
      </div>
      <div className="bar-divider"></div>
      <div className="bar-item">
        <span className="bar-label">Tokens:</span>
        <span className="bar-value">{tokens ?? '--'}</span>
      </div>
      <div className="bar-divider"></div>
      <div className="bar-item bar-trust">
        <span className="bar-value"><span className="trust-check">✓</span> Deterministic Bridge Active</span>
      </div>
    </footer>
  );
}
