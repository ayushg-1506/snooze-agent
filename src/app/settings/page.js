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
      addToast('Populating rich demo dataset...', 'info');
      const res = await fetch('/api/demo', { method: 'POST' });
      if (res.ok) {
        addToast('Rich demo dataset loaded successfully!', 'success');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>System Status & Configuration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
          Inspect open-weight AI runtime status, database connectivity, and triage automation rules.
        </p>
      </div>

      {/* Integration Diagnostics */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
          🔌 Integration Diagnostics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {/* GitHub */}
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>GitHub REST API</span>
              <span className={`badge ${settingsData?.integrations?.github?.status === 'connected' ? 'badge-emerald' : 'badge-amber'}`}>
                {settingsData?.integrations?.github?.status === 'connected' ? 'Connected' : 'Token Missing'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Provides repo read/write access, issue comment drafting, and label management.
            </p>
          </div>

          {/* AI Runtime */}
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Open-Weight AI Runtime</span>
              <span className="badge badge-purple">
                {settingsData?.integrations?.ai?.provider || 'Gemma / Groq'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Model: {settingsData?.integrations?.ai?.model || 'Google Gemma 2 / Llama 3.1 70B'}
            </p>
          </div>

          {/* Database */}
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Database Layer</span>
              <span className={`badge ${settingsData?.integrations?.database?.status === 'connected' ? 'badge-emerald' : 'badge-sky'}`}>
                {settingsData?.integrations?.database?.label || 'Persistent Engine'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Stores issues, embeddings, activities, and duplicate clusters with instant querying.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Data Seeder */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h3 className="section-title">✨ Evaluation & Demo Dataset</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
              Load a realistic suite of overnight issues (Node 20 bug, feature request, duplicate, memory leak) to review the UI.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleSeedDemo}>
            Populate Demo Issues
          </button>
        </div>
      </div>

      {/* Hacktoberfest Prize Narrative */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', background: 'linear-gradient(135deg, rgba(20, 24, 54, 0.6), rgba(12, 16, 34, 0.6))' }}>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
          🦥 Hacktoberfest Week 3: "Slow and Steady" Alignment
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
          Snooze Agent is crafted specifically for the sloth theme: open-source maintainers should not suffer from notification anxiety or spend mornings sorting repetitive issues. Snooze Agent operates autonomously overnight using <strong>open-weight models (Gemma & Llama 3.1)</strong> to classify, triage, detect duplicates, and draft maintainer responses.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span className="badge badge-purple">Best Use of Gemma ($200)</span>
          <span className="badge badge-sky">Best Use of MongoDB Atlas ($100)</span>
          <span className="badge badge-emerald">Best Use of Render ($200)</span>
          <span className="badge badge-amber">Best Use of .tech Domain ($100)</span>
        </div>
      </div>
    </div>
  );
}
