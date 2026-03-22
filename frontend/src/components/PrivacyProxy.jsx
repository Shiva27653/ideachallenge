// ──────────────────────────────────────────────
// PrivacyProxy.jsx — PII masking demo panel
// ──────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';

const PP_MESSAGES = [
  {
    raw: 'Account 9876543210 flagged for review',
    clean: 'Account ****3210 flagged for review',
    pii: ['9876543210'],
    masked: ['****3210'],
    piiCount: 1,
  },
  {
    raw: 'Transfer ₹25,000 from Rahul Sharma',
    clean: 'Transfer ₹25,000 from [CUSTOMER]',
    pii: ['Rahul Sharma'],
    masked: ['[CUSTOMER]'],
    piiCount: 1,
  },
  {
    raw: 'Card 4521 declined at Mumbai Airport',
    clean: 'Card ****4521 declined at [LOCATION]',
    pii: ['4521', 'Mumbai Airport'],
    masked: ['****4521', '[LOCATION]'],
    piiCount: 2,
  },
  {
    raw: 'Anil Kapoor queries home loan status',
    clean: '[CUSTOMER] queries home loan status',
    pii: ['Anil Kapoor'],
    masked: ['[CUSTOMER]'],
    piiCount: 1,
  },
];

export default function PrivacyProxy() {
  const [ppIndex, setPpIndex] = useState(0);
  const [ppOn, setPpOn] = useState(true);
  const [maskedCount, setMaskedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [spinnerPulse, setSpinnerPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPpIndex(prev => {
        const next = (prev + 1) % PP_MESSAGES.length;
        const msg = PP_MESSAGES[next];
        setMaskedCount(c => c + msg.piiCount);
        setBlockedCount(c => c + (Math.random() > 0.5 ? 1 : 0));

        // Spinner pulse
        setSpinnerPulse(true);
        setTimeout(() => setSpinnerPulse(false), 600);

        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const msg = PP_MESSAGES[ppIndex];

  // Build raw HTML with PII highlighted
  let rawHTML = msg.raw;
  msg.pii.forEach(word => {
    rawHTML = rawHTML.replace(word, `<span class="pp-pii-highlight">${word}</span>`);
  });

  // Build clean HTML
  let cleanHTML;
  if (ppOn) {
    cleanHTML = msg.clean;
    msg.masked.forEach(token => {
      cleanHTML = cleanHTML.replace(token, `<span class="pp-masked-token">🔒 ${token}</span>`);
    });
  } else {
    cleanHTML = rawHTML;
  }

  return (
    <div className="privacy-proxy-panel">
      {/* Toggle + Status Banner */}
      <div className="pp-top-bar">
        <div className={`pp-status-banner ${ppOn ? 'pp-status--on' : 'pp-status--off'}`}>
          <span className="pp-status-icon">{ppOn ? '✓' : '⚠'}</span>
          {ppOn ? 'All PII Sanitized' : 'PII Exposed — Not for Production'}
        </div>
        <label className="pp-toggle">
          <input type="checkbox" checked={ppOn} onChange={e => setPpOn(e.target.checked)} />
          <span className="pp-toggle-slider"></span>
          <span className="pp-toggle-label">Privacy Proxy: <strong>{ppOn ? 'ON' : 'OFF'}</strong></span>
        </label>
      </div>

      {/* Three-column grid */}
      <div className="pp-columns">
        {/* LEFT — Raw Input Stream */}
        <div className="glass-card pp-col pp-col-raw">
          <div className="pp-col-header pp-col-header--red">
            <span className="pp-col-icon">📨</span>
            <span className="pp-col-title">Raw Input Stream</span>
          </div>
          <div className="pp-stream">
            <div className="pp-message pp-message-enter" dangerouslySetInnerHTML={{ __html: rawHTML }} />
          </div>
        </div>

        {/* CENTER — Filter Column */}
        <div className="pp-col pp-col-filter">
          <div className="pp-filter-label">Privacy Proxy</div>
          <div className="pp-spinner-wrap">
            <div className={`pp-spinner${spinnerPulse ? ' pp-spinner-pulse' : ''}`}></div>
            <span className="pp-spinner-icon">🛡️</span>
          </div>
          <div className="pp-arrow">→</div>
          <div className="pp-filter-sub">Rules Engine · 14 patterns active</div>
        </div>

        {/* RIGHT — Sanitized Output */}
        <div className="glass-card pp-col pp-col-clean">
          <div className="pp-col-header pp-col-header--green">
            <span className="pp-col-icon">✅</span>
            <span className="pp-col-title">Sanitized Output</span>
          </div>
          <div className="pp-stream">
            <div
              className={`pp-message pp-message-enter${!ppOn ? ' pp-message--exposed' : ''}`}
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="pp-stats-row">
        <div className="glass-card pp-stat-card">
          <span className="pp-stat-icon">🛡</span>
          <div className="pp-stat-info">
            <div className="pp-stat-label">PII Instances Masked</div>
            <div className="pp-stat-value">{maskedCount}</div>
          </div>
        </div>
        <div className="glass-card pp-stat-card">
          <span className="pp-stat-icon">🚫</span>
          <div className="pp-stat-info">
            <div className="pp-stat-label">Trust Boundary Violations Blocked</div>
            <div className="pp-stat-value">{blockedCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
