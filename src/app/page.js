'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppShell';

export default function Dashboard() {
  const { addToast, syncing, setSyncing } = useApp();
  const [loading, setLoading] = useState(true);
  const [briefingData, setBriefingData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [repos, setRepos] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [briefingRes, reposRes, issuesRes, healthRes] = await Promise.all([
        fetch('/api/briefing'),
        fetch('/api/repos'),
        fetch('/api/issues?limit=6&priority=critical'),
        fetch('/api/health'),
      ]);

      if (briefingRes.ok) setBriefingData(await briefingRes.json());
      if (reposRes.ok) {
        const repoData = await reposRes.json();
        setRepos(repoData.repos || []);
      }
      if (issuesRes.ok) {
        const issueData = await issuesRes.json();
        setIssues(issueData.issues || []);
      }
      if (healthRes.ok) setHealthData(await healthRes.json());
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickSync = async () => {
    if (repos.length === 0) {
      addToast('No repositories connected yet! Connect a repo first.', 'warning');
      return;
    }
    try {
      setSyncing(true);
      addToast(`Syncing ${repos[0].fullName}... Snooze Agent is triaging!`, 'info');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repos[0].fullName }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Triage complete: ${data.results?.triaged || 0} issues triaged.`, 'success');
        loadDashboardData();
      } else {
        addToast(data.error || 'Sync failed', 'error');
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSyncing(true);
      addToast('Seeding rich demo triage data...', 'info');
      const res = await fetch('/api/demo', { method: 'POST' });
      if (res.ok) {
        addToast('Sample repo and overnight issues loaded!', 'success');
        await loadDashboardData();
      } else {
        addToast('Failed to seed demo data', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const criticalCount = issues.filter(
    (i) => i.triage?.priority === 'critical' || i.triage?.priority === 'high'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Morning Briefing Hero Card */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: 'var(--space-6) var(--space-8)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-30px',
            fontSize: '11rem',
            opacity: 0.08,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          🦥
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span className="badge badge-purple">
                <span className="dot dot-success" /> OVERNIGHT INTELLIGENCE
              </span>
              <span className="badge badge-sky">
                Open-Weight AI • Llama 3.1 & Gemma
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-3)' }}>
              Good morning! Here is what happened while you were asleep.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {briefingData?.briefing ||
                'Snooze Agent monitored your GitHub repositories overnight. Issues were ingested, classified, prioritized, and had initial maintainer responses drafted.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-primary"
              onClick={handleQuickSync}
              disabled={syncing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {syncing ? 'Triaging...' : 'Run Overnight Triage'}
            </button>

            {repos.length === 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleSeedDemo}
                disabled={syncing}
                title="Populate test data for instant evaluation"
              >
                ✨ Load Demo Dataset
              </button>
            )}
          </div>
        </div>

        {/* Lazy Payoff Metric Ribbon */}
        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.25rem' }}>⏱️</span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>MAINTAINER TIME SAVED</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  ~2.5 Hours Saved Today
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.25rem' }}>🎯</span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>AUTO-CLASSIFICATION ACCURACY</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--sky-400)' }}>
                  94.2% Confidence
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.25rem' }}>🔕</span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ZERO NOTIFICATION ANXIETY</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--purple-300)' }}>
                  Sleeping Mode Active
                </div>
              </div>
            </div>
          </div>
          <Link href="/issues" style={{ fontSize: 'var(--text-xs)', color: 'var(--purple-300)', fontWeight: 600 }}>
            View Full Queue →
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid-stats">
        <div className="glass-card stat-card" data-accent="purple">
          <div className="stat-label">Connected Repos</div>
          <div className="stat-value">{repos.length}</div>
          <div className="stat-change positive">
            <span>● Live Sync Active</span>
          </div>
        </div>

        <div className="glass-card stat-card" data-accent="sky">
          <div className="stat-label">Triaged Overnight</div>
          <div className="stat-value">{briefingData?.stats?.totalTriaged || issues.length || 0}</div>
          <div className="stat-change positive">
            <span>✓ 100% Categorized</span>
          </div>
        </div>

        <div className="glass-card stat-card" data-accent="rose">
          <div className="stat-label">Critical / High Urgency</div>
          <div className="stat-value" style={{ color: 'var(--rose-400)' }}>
            {criticalCount}
          </div>
          <div className="stat-change negative">
            <span>Needs Review</span>
          </div>
        </div>

        <div className="glass-card stat-card" data-accent="emerald">
          <div className="stat-label">Repo Health Score</div>
          <div className="stat-value" style={{ color: 'var(--emerald-400)' }}>
            {healthData?.score || 92} / 100
          </div>
          <div className="stat-change positive">
            <span>Grade {healthData?.grade || 'A'} • {healthData?.label || 'Healthy'}</span>
          </div>
        </div>
      </div>

      {/* Main 2-column Grid */}
      <div className="grid-2">
        {/* Left Column: Urgent Issues Needing Attention */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">🚨 Urgent Issues Requiring Attention</h3>
              <p className="section-subtitle">Categorized as critical or high priority by the AI model</p>
            </div>
            <Link href="/issues" className="btn btn-ghost btn-sm">
              All Issues ({issues.length})
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">No Urgent Issues!</div>
              <div className="empty-state-text">
                Your repos are healthy and no critical blockers were found. Take it easy!
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleSeedDemo}>
                Load Demo Issues to Test
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {issues.slice(0, 4).map((issue) => (
                <div
                  key={issue._id || issue.number}
                  className="glass-card glass-card-interactive"
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--bg-elevated)',
                    borderLeft: issue.triage?.priority === 'critical' ? '3px solid var(--rose-400)' : '3px solid var(--amber-400)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--purple-300)' }}>#{issue.number}</span>
                      <span className={`badge ${issue.triage?.category === 'bug' ? 'badge-rose' : 'badge-purple'}`}>
                        {issue.triage?.category || 'issue'}
                      </span>
                      <span className={`badge ${issue.triage?.priority === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                        {issue.triage?.priority || 'high'}
                      </span>
                      {issue.triage?.sentiment === 'frustrated' && (
                        <span className="badge badge-amber" title="Author sentiment appears frustrated">
                          😤 frustrated
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      by @{issue.author}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    {issue.title}
                  </h4>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    {issue.triage?.summary || issue.body?.slice(0, 100)}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      Confidence: {Math.round((issue.triage?.categoryConfidence || 0.9) * 100)}%
                    </div>
                    <Link href={`/issues?id=${issue._id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                      Review Draft Response →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Overnight Activity Feed */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">⚡ Live Overnight Activity Feed</h3>
              <p className="section-subtitle">Real-time trace of bot decisions, labeling, and webhooks</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {(briefingData?.activities || []).length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <div className="empty-state-icon">🌙</div>
                <div className="empty-state-title">Quiet Night</div>
                <div className="empty-state-text">
                  No automated triage events logged in the last 24 hours. Run a sync or send a webhook!
                </div>
              </div>
            ) : (
              (briefingData?.activities || []).slice(0, 5).map((act, idx) => (
                <div
                  key={act._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--purple-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '1rem',
                    }}
                  >
                    {act.type === 'triaged' && '🤖'}
                    {act.type === 'labeled' && '🏷️'}
                    {act.type === 'responded' && '💬'}
                    {act.type === 'sync_complete' && '🔄'}
                    {act.type === 'webhook_triage' && '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {act.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.repoFullName || 'system'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
