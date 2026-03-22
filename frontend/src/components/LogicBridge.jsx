// ──────────────────────────────────────────────
// LogicBridge.jsx — Deterministic rule engine panel
// ──────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

/* ═══════════════════════════════════════════════
   RULE DEFINITIONS
   ═══════════════════════════════════════════════ */
const RULES = {
  RULE_01:     { id: 'RULE_01', desc: 'Input sanitization complete',              status: 'ALLOWED'   },
  RULE_02:     { id: 'RULE_02', desc: 'PII scan — no raw data in payload',        status: 'ALLOWED'   },
  RULE_02_PII: { id: 'RULE_02', desc: 'PII scan — sensitive data detected',       status: 'MASKED'    },
  RULE_03:     { id: 'RULE_03', desc: 'Balance inquiry — customer authenticated', status: 'ALLOWED'   },
  RULE_07:     { id: 'RULE_07', desc: 'Service request — self-serve eligible',    status: 'ALLOWED'   },
  RULE_12:     { id: 'RULE_12', desc: 'Fraud keyword detected — mandatory escalation', status: 'ESCALATED' },
  RULE_19:     { id: 'RULE_19', desc: 'PII masked before external API call',      status: 'MASKED'    },
  RULE_21:     { id: 'RULE_21', desc: 'High-value transaction threshold exceeded', status: 'ESCALATED' },
  RULE_04:     { id: 'RULE_04', desc: 'RBI reporting flag triggered',             status: 'ESCALATED' },
};

const KEYWORD_MAP = [
  { keywords: ['balance', 'account', 'statement', 'how much'],        rules: ['RULE_03'] },
  { keywords: ['fraud', 'scam', 'phishing', 'unauthorized', 'hack'], rules: ['RULE_12', 'RULE_19'] },
  { keywords: ['appointment', 'book', 'schedule', 'meeting'],         rules: ['RULE_07'] },
  { keywords: ['50000', '50,000', '₹50', 'lakh', '100000', '1,00,000', 'large amount'], rules: ['RULE_21', 'RULE_04'] },
];

const PII_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  /\b\d{12}\b/,
  /\b[A-Z]{5}\d{4}[A-Z]\b/i,
  /\b\S+@\S+\.\S+\b/,
];

function badgeClass(status) {
  if (status === 'ALLOWED')   return 'lb-badge--allowed';
  if (status === 'ESCALATED') return 'lb-badge--escalated';
  if (status === 'MASKED')    return 'lb-badge--masked';
  return '';
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 3)  return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function analyseMessage(text) {
  const lower = text.toLowerCase();
  const rulesToFire = [];
  const hasPII = PII_PATTERNS.some(p => p.test(text));
  rulesToFire.push({ ...RULES.RULE_01 });
  rulesToFire.push(hasPII ? { ...RULES.RULE_02_PII } : { ...RULES.RULE_02 });
  for (const mapping of KEYWORD_MAP) {
    if (mapping.keywords.some(kw => lower.includes(kw))) {
      mapping.rules.forEach(ruleKey => {
        if (RULES[ruleKey]) rulesToFire.push({ ...RULES[ruleKey] });
      });
    }
  }
  const seen = new Set();
  return rulesToFire.filter(r => {
    if (seen.has(r.id + r.status)) return false;
    seen.add(r.id + r.status);
    return true;
  });
}

const LogicBridge = forwardRef(function LogicBridge(props, ref) {
  const [lastDecision, setLastDecision] = useState(null);
  const [ruleLog, setRuleLog] = useState([]);
  const [progressAnim, setProgressAnim] = useState(false);
  const timeInterval = useRef(null);
  const [, forceUpdate] = useState(0);

  // Tick time-ago display every second
  useEffect(() => {
    timeInterval.current = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(timeInterval.current);
  }, []);

  const fireRules = useCallback((messageText) => {
    const rules = analyseMessage(messageText);
    if (rules.length === 0) return;

    // Fire progress bar
    setProgressAnim(false);
    requestAnimationFrame(() => setProgressAnim(true));
    setTimeout(() => setProgressAnim(false), 1200);

    // Stagger each rule
    rules.forEach((rule, i) => {
      setTimeout(() => {
        const entry = { ...rule, timestamp: Date.now() };
        setLastDecision(entry);
        setRuleLog(prev => {
          const next = [entry, ...prev];
          return next.slice(0, 5);
        });
      }, i * 200);
    });
  }, []);

  const clearBridge = useCallback(() => {
    setLastDecision(null);
    setRuleLog([]);
  }, []);

  // Expose fireRules and clearBridge to parent
  useImperativeHandle(ref, () => ({ fireRules, clearBridge }), [fireRules, clearBridge]);

  return (
    <div className="glass-card bridge-panel">
      <div className="logic-bridge">
        {/* Header */}
        <div className="lb-header">
          <div className="lb-header-left">
            <span className="lb-header-icon">⚡</span>
            <div>
              <div className="lb-header-title">Deterministic Logic Bridge</div>
              <div className="lb-header-sub">Rule Engine · Every decision is auditable</div>
            </div>
          </div>
        </div>

        <div className="lb-body">
          {/* Progress bar */}
          <div className="lb-progress-track">
            <div className={`lb-progress-bar${progressAnim ? ' lb-progress-animate' : ''}`}></div>
          </div>

          {/* Last Decision */}
          <div className="lb-section lb-section-top">
            <div className="lb-section-label">Last Decision</div>
            <div className={`lb-decision-card${!lastDecision ? ' lb-idle' : ''}`}>
              {!lastDecision ? (
                <div className="lb-decision-idle">
                  <div className="lb-idle-icon">⏳</div>
                  <div className="lb-idle-text">Awaiting input…</div>
                </div>
              ) : (
                <div className="lb-decision-active">
                  <div className="lb-rule-id">{lastDecision.id}</div>
                  <div className="lb-rule-desc">{lastDecision.desc}</div>
                  <div className="lb-decision-meta">
                    <span className={`lb-badge ${badgeClass(lastDecision.status)}`}>{lastDecision.status}</span>
                    <span className="lb-time">{timeAgo(lastDecision.timestamp)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rule Log */}
          <div className="lb-section lb-section-bottom">
            <div className="lb-section-label">Rule Log</div>
            <div className="lb-rule-log">
              {ruleLog.length === 0 ? (
                <div className="lb-log-empty">No rules fired yet</div>
              ) : (
                ruleLog.map((r, i) => (
                  <div
                    key={`${r.id}-${r.timestamp}-${i}`}
                    className={`lb-log-row${i % 2 === 1 ? ' lb-log-row--alt' : ''} lb-log-enter`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="lb-log-id">{r.id}</span>
                    <span className="lb-log-desc">{r.desc}</span>
                    <span className={`lb-badge lb-badge--sm ${badgeClass(r.status)}`}>{r.status}</span>
                    <span className="lb-log-time">{timeAgo(r.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LogicBridge;
