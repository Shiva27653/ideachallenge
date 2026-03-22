// ──────────────────────────────────────────────
// NavBar.jsx — Top navigation with tab switching
// ──────────────────────────────────────────────

import React from 'react';

const TABS = [
  { key: 'branch-kiosk',    icon: '🏦', label: 'Branch Kiosk' },
  { key: 'contact-center',  icon: '🎧', label: 'Contact Center' },
  { key: 'privacy-proxy',   icon: '🔒', label: 'Privacy Proxy' },
];

export default function NavBar({ activeTab, onTabChange }) {
  return (
    <nav className="top-nav">
      {/* Left: Logo */}
      <div className="nav-left">
        <div className="nav-logo">
          <svg className="logo-icon" viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L4 8v8c0 7.73 5.12 14.95 12 16 6.88-1.05 12-8.27 12-16V8L16 2z" fill="#e02020" opacity="0.15" stroke="#e02020" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M16 7l-6 3v4c0 4.42 2.56 8.54 6 9.5 3.44-.96 6-5.08 6-9.5v-4l-6-3z" fill="#e02020" opacity="0.35" stroke="#e02020" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M14 15l2 2 4-4" stroke="#e02020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">NexaBank <span className="logo-accent">AI Platform</span></span>
        </div>
      </div>

      {/* Center: Tabs */}
      <div className="nav-center">
        <div className="nav-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`nav-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Status Pill */}
      <div className="nav-right">
        <div className="status-pill">
          <span className="status-dot"></span>
          <span className="status-label">Live Demo</span>
        </div>
      </div>
    </nav>
  );
}
