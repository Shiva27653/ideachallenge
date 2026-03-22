// ──────────────────────────────────────────────
// BranchKiosk.jsx — Chat UI with Groq AI + tool detection
// ──────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../agent.js';
import LogicBridge from './LogicBridge';

/* ═══════════════════════════════════════════════
   TOOL DETECTION
   ═══════════════════════════════════════════════ */
const TOOL_MAP = [
  { keywords: ['balance', 'account', 'statement'],
    tool: { name: 'getAccountBalance', icon: '💰', params: { account_id: 'XXXX-4521', type: 'savings' } } },
  { keywords: ['fraud', 'scam', 'unauthorized', 'suspicious'],
    tool: { name: 'flagTransaction', icon: '🚨', params: { alert_level: 'HIGH', auto_block: true } } },
  { keywords: ['appointment', 'book', 'schedule', 'meeting'],
    tool: { name: 'bookAppointment', icon: '📅', params: { branch: 'Indiranagar', slot: 'tomorrow 2 PM' } } },
  { keywords: ['transfer', 'send', 'pay', '50000', 'lakh'],
    tool: { name: 'initiateTransfer', icon: '💸', params: { amount: '₹50,000', mode: 'IMPS', requires_otp: true } } },
];

function detectTool(text) {
  const lower = text.toLowerCase();
  for (const entry of TOOL_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return { ...entry.tool, timestamp: Date.now(), status: 'Success' };
    }
  }
  return null;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 3)  return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function BranchKiosk({ onStats }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Hello! I\'m NexaBank\'s AI assistant. How can I help you today?' },
  ]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [toolHistory, setToolHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const bridgeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async (text) => {
    const msg = text || inputText.trim();
    if (!msg || isProcessing) return;
    setInputText('');
    setIsProcessing(true);

    // 1. User bubble
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    const newHistory = [...conversationHistory, { role: 'user', content: msg }];
    setConversationHistory(newHistory);

    // 2. Show typing
    setIsTyping(true);

    // 3. Fire Logic Bridge
    bridgeRef.current?.fireRules(msg);

    // 4. Detect tool
    const tool = detectTool(msg);

    // 5. Call Groq
    const t0 = performance.now();
    let reply = '';
    let tokens = 0;

    try {
      reply = await sendMessage(msg, newHistory);
      tokens = Math.round(reply.length / 4);
    } catch (err) {
      reply = `⚠ Could not reach AI — ${err.message}`;
    }

    const latency = Math.round(performance.now() - t0);

    // 6. Tool card
    if (tool) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'tool', tool }]);
      setToolHistory(prev => {
        const next = [tool, ...prev];
        return next.slice(0, 3);
      });
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 600));
    }

    // 7. AI reply
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', text: reply, latency }]);
    setConversationHistory(prev => [...prev, { role: 'assistant', content: reply }]);

    // 8. Status bar
    onStats?.({ latency, tokens });

    // 9. Clear bridge
    setTimeout(() => bridgeRef.current?.clearBridge(), 2000);

    setIsProcessing(false);
  };

  const quickChips = [
    { label: '💰 Check Balance', msg: 'What is my current account balance?' },
    { label: '🚨 Report Fraud',  msg: 'I noticed a suspicious unauthorized transaction on my account' },
    { label: '📅 Book Appointment', msg: "I'd like to book an appointment at my nearest branch" },
  ];

  return (
    <div className="panel-grid panel-grid--kiosk">
      {/* Left: Chat */}
      <div className="glass-card chat-area">
        <div className="card-header">
          <h2 className="card-title">💬 Customer Chat</h2>
          <span className="card-badge">AI Assisted</span>
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => {
            if (m.role === 'tool') {
              return (
                <div key={i} className="chat-tool-card">
                  <div className="tool-card-header">
                    <span className="tool-card-icon">🔧</span>
                    <span className="tool-card-title">Tool Executed</span>
                  </div>
                  <div className="tool-card-body">
                    <div className="tool-card-name">{m.tool.icon} {m.tool.name}</div>
                    <pre className="tool-card-params">{JSON.stringify(m.tool.params, null, 2)}</pre>
                  </div>
                  <div className="tool-card-result">
                    <span className="tool-result-check">✓</span> Completed successfully
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
                <div className="bubble-content">{m.text}</div>
                {m.role === 'ai' && m.latency !== undefined && (
                  <span className="bubble-badge">llama-3.3-70b · {m.latency}ms</span>
                )}
              </div>
            );
          })}
          {isTyping && (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={isProcessing}
          />
          <button className="btn btn-primary chat-send" onClick={() => handleSend()} disabled={isProcessing}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div className="quick-chips">
          {quickChips.map(chip => (
            <button key={chip.msg} className="quick-chip" onClick={() => handleSend(chip.msg)} disabled={isProcessing}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Logic Bridge + Tool History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
        <LogicBridge ref={bridgeRef} />
        {toolHistory.length > 0 && (
          <div className="tool-history">
            <div className="tool-history-label">Recent Tool Calls</div>
            {toolHistory.map((t, i) => (
              <div key={`${t.name}-${t.timestamp}`} className="tool-history-card tool-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="thc-header">
                  <span className="thc-icon">{t.icon}</span>
                  <span className="thc-name">{t.name}</span>
                </div>
                <div className="thc-meta">
                  <span className="thc-time">{timeAgo(t.timestamp)}</span>
                  <span className={`thc-status thc-status--${t.status.toLowerCase()}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
