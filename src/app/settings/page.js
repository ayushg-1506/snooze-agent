'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/components/AppShell';

export default function SettingsPage() {
  const { addToast, setSyncing } = useApp();
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) setSettingsData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSeedDemo = async () => {
    try {
      setSyncing(true);
      addToast('Populating sample overnight dataset...', 'info');
      const res = await fetch('/api/demo', { method: 'POST' });
      if (res.ok) {
        addToast('Sample issues and overnight ledger loaded!', 'success');
      } else {
        addToast('Failed to seed demo data', 'error');
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div className="dossier-card" style={{ padding: '24px' }}>
        <span className="chip chip-sage" style={{ marginBottom: '8px' }}>
          SYSTEM DIAGNOSTICS
        </span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px' }}>
          Runtime Health & Integrations
        </h1>
        <p style={{ color: 'var(--taupe)', fontSize: '0.85rem', marginTop: '4px' }}>
          Live diagnostic status of the open-weight AI runtime, GitHub API, and database layer.
        </p>
      </div>

      {/* Diagnostics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* GitHub */}
        <div className="dossier-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>GitHub REST API</span>
            <span className={`chip ${settingsData?.integrations?.github?.status === 'connected' ? 'chip-sage' : 'chip-terracotta'}`}>
              {settingsData?.integrations?.github?.status === 'connected' ? 'ACTIVE' : 'TOKEN MISSING'}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--taupe)', lineHeight: 1.5 }}>
            Handles repo ingestion, automated labeling, and response publishing via Octokit.
          </p>
        </div>

        {/* AI Runtime */}
        <div className="dossier-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Open-Weight AI</span>
            <span className="chip chip-sage">
              {settingsData?.integrations?.ai?.provider || 'Gemma'}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--taupe)', lineHeight: 1.5 }}>
            Model: {settingsData?.integrations?.ai?.model || 'Google Gemma 2 (27B)'}
          </p>
        </div>

        {/* Database */}
        <div className="dossier-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Database Engine</span>
            <span className="chip chip-celadon">
              {settingsData?.integrations?.database?.label || 'Persistent Local Engine'}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--taupe)', lineHeight: 1.5 }}>
            Stores triage history, activity wire, and duplicate vector clusters.
          </p>
        </div>
      </div>

      {/* Evaluation Demo Data Action */}
      <div className="dossier-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--espresso)' }}>
              Sample Evaluation Dataset
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              Load a realistic batch of overnight issues (Node 20 runtime crash, Slack digest hook, memory leak, docs gap) to test the UI.
            </p>
          </div>
          <button className="btn-nordic" onClick={handleSeedDemo}>
            Populate Demo Issues
          </button>
        </div>
      </div>

      {/* Architectural Philosophy */}
      <div className="dossier-card" style={{ padding: '24px', background: 'var(--canvas-subtle)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--moss)', marginBottom: '6px' }}>
          🦥 PHILOSOPHY & DESIGN PRINCIPLES
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--espresso)', lineHeight: 1.6, marginBottom: '14px' }}>
          Snooze Agent is built to eliminate maintainer burnout. Instead of waking up to frantic notifications, open-weight models (Qwen, Llama 3.1, and Gemma) analyze issue context, cluster duplicates, and prepare initial response drafts so maintainers can start their day with a clear, calm queue.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="chip chip-sage">Autonomous Night Ingestion</span>
          <span className="chip chip-celadon">Semantic Duplicate Clustering</span>
          <span className="chip chip-ochre">Sentiment & Urgency Scoring</span>
          <span className="chip chip-neutral">Zero Notification Noise</span>
        </div>
      </div>
    </div>
  );
}
