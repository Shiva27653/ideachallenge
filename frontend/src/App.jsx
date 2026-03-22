// ──────────────────────────────────────────────
// App.jsx — Main layout + tab routing
// ──────────────────────────────────────────────

import React, { useState } from 'react';
import ThreeBackground from './components/ThreeBackground';
import NavBar from './components/NavBar';
import StatusBar from './components/StatusBar';
import BranchKiosk from './components/BranchKiosk';
import ContactCenter from './components/ContactCenter';
import PrivacyProxy from './components/PrivacyProxy';

export default function App() {
  const [activeTab, setActiveTab] = useState('branch-kiosk');
  const [stats, setStats] = useState({ latency: null, tokens: null });

  return (
    <>
      {/* Three.js animated background */}
      <ThreeBackground />

      {/* Top navigation */}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main panels */}
      <main className="panels-wrapper">
        {/* Branch Kiosk */}
        <section className={`panel${activeTab === 'branch-kiosk' ? ' panel-active' : ''}`}>
          {activeTab === 'branch-kiosk' && (
            <BranchKiosk onStats={setStats} />
          )}
        </section>

        {/* Contact Center */}
        <section className={`panel${activeTab === 'contact-center' ? ' panel-active' : ''}`}>
          {activeTab === 'contact-center' && (
            <ContactCenter />
          )}
        </section>

        {/* Privacy Proxy */}
        <section className={`panel${activeTab === 'privacy-proxy' ? ' panel-active' : ''}`}>
          {activeTab === 'privacy-proxy' && (
            <PrivacyProxy />
          )}
        </section>
      </main>

      {/* Bottom status bar */}
      <StatusBar latency={stats.latency} tokens={stats.tokens} />
    </>
  );
}
