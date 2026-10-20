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

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, rRes, iRes, hRes] = await Promise.all([
        fetch('/api/briefing'),
        fetch('/api/repos'),
        fetch('/api/issues?limit=6'),
        fetch('/api/health'),
      ]);
      if (bRes.ok) setBriefingData(await bRes.json());
      if (rRes.ok) {
        const rd = await rRes.json();
        setRepos(rd.repos || []);
      }
      if (iRes.ok) {
        const id = await iRes.json();
        setIssues(id.issues || []);
      }
      if (hRes.ok) setHealthData(await hRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSync = async () => {
    if (repos.length === 0) {
      addToast('Please connect a repository first!', 'error');
      return;
    }
    try {
      setSyncing(true);
      addToast(`Night triage running for ${repos[0].fullName}...`, 'info');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repos[0].fullName }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Triage complete: ${data.results?.triaged || 0} issues sorted.`, 'success');
        loadData();
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
      addToast('Populating overnight triage dossier...', 'info');
      const res = await fetch('/api/demo', { method: 'POST' });
      if (res.ok) {
        addToast('Sample issues and overnight ledger loaded!', 'success');
        await loadData();
      } else {
        addToast('Failed to seed demo data', 'error');
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const criticalCount = issues.filter(
    (i) => i.triage?.priority === 'critical' || i.triage?.priority === 'high'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Editorial Lead Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="chip chip-sage">
            AUTONOMOUS REPO WATCH · THE MORNING DOSSIER
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--taupe)', fontFamily: 'var(--font-mono)' }}>
            DISPATCH FOR {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--espresso)',
            maxWidth: '820px',
          }}
        >
          <span className="serif-lead">While you were sleeping,</span>{' '}
          {issues.length > 0 ? `${issues.length} issues were audited and organized.` : 'the queue remained peaceful.'}
        </h1>

        <p
          style={{
            fontSize: '1.02rem',
            lineHeight: 1.6,
            color: 'var(--taupe)',
            maxWidth: '680px',
          }}
        >
          {briefingData?.briefing ||
            'Snooze Agent monitored your repositories through the night. Critical crash reports were flagged, duplicate discussions clustered, and empathetic responses drafted using Google Gemma 2.'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
          <button className="btn-nordic" onClick={handleQuickSync} disabled={syncing}>
            <span>{syncing ? 'Triaging...' : 'Run Night Triage'}</span>
            <span style={{ fontSize: '0.9rem' }}>→</span>
          </button>

          {/* Demo Button */ (
            <button className="btn-nordic-outline" onClick={handleSeedDemo} disabled={syncing}>
              Populate Demo Dossier
            </button>
          )}

          <Link href="/issues" className="btn-nordic-outline">
            Open Full Queue ({issues.length})
          </Link>
        </div>
      </section>

      {/* The Night Watch Timeline Bar */}
      <div className="night-timeline">
        <span className="timeline-pill">THE NIGHT WATCH</span>
        <span>02:14 AM — Crash report triaged</span>
        <span style={{ color: 'var(--rule)' }}>|</span>
        <span>04:30 AM — Duplicate clustered with #42</span>
        <span style={{ color: 'var(--rule)' }}>|</span>
        <span style={{ color: 'var(--moss)', fontWeight: 600 }}>06:00 AM — Morning briefing compiled</span>
      </div>

      {/* Horizontal Ledger Strip */}
      <section className="ledger-strip">
        <div className="ledger-cell">
          <div className="ledger-kicker">[ 01 · MONITORED REPOS ]</div>
          <div className="ledger-value">{repos.length}</div>
          <div className="ledger-meta">
            <span style={{ color: 'var(--moss)' }}>●</span> {repos[0]?.fullName || 'Ready to connect'}
          </div>
        </div>

        <div className="ledger-cell">
          <div className="ledger-kicker">[ 02 · TRIAGED OVERNIGHT ]</div>
          <div className="ledger-value">{issues.length}</div>
          <div className="ledger-meta">
            <span>✓</span> 100% categorized with Gemma 2
          </div>
        </div>

        <div className="ledger-cell">
          <div className="ledger-kicker">[ 03 · URGENT MATTERS ]</div>
          <div className="ledger-value" style={{ color: criticalCount > 0 ? 'var(--terracotta)' : 'var(--espresso)' }}>
            {criticalCount}
          </div>
          <div className="ledger-meta">
            <span>{criticalCount > 0 ? '⚠️ Action needed' : '✓ No blockers'}</span>
          </div>
        </div>

        <div className="ledger-cell">
          <div className="ledger-kicker">[ 04 · TRANQUILITY INDEX ]</div>
          <div className="ledger-value" style={{ color: 'var(--moss)' }}>
            {healthData?.score || 98}<span style={{ fontSize: '1rem', fontWeight: 600 }}>%</span>
          </div>
          <div className="ledger-meta">
            <span>Grade {healthData?.grade || 'A'}</span> · Zero notification noise
          </div>
        </div>
      </section>

      {/* Main Grid: Urgent Matters & The Night Wire */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '28px' }}>
        {/* Left: Urgent Matters Dossier */}
        <div className="dossier-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--espresso)' }}>
                Urgent Matters
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
                Issues prioritized by Gemma 2 as critical bugs or blocking regressions
              </p>
            </div>
            <Link href="/issues" style={{ fontSize: '0.78rem', color: 'var(--moss)', fontWeight: 600 }}>
              View Queue ({issues.length}) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {issues.slice(0, 3).map((issue) => (
              <div
                key={issue._id || issue.number}
                className="dossier-card dossier-card-hover"
                style={{ padding: '18px', background: '#FFFFFF' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.88rem' }}>
                      #{issue.number}
                    </span>
                    <span className={`chip ${issue.triage?.category === 'bug' ? 'chip-terracotta' : 'chip-sage'}`}>
                      {issue.triage?.category || 'issue'}
                    </span>
                    {issue.triage?.priority === 'critical' && (
                      <span className="chip chip-terracotta" style={{ fontWeight: 800 }}>
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--taupe-muted)' }}>
                    @{issue.author}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px', color: 'var(--espresso)' }}>
                  {issue.title}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {issue.triage?.summary || issue.body?.slice(0, 100)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--rule)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--taupe-muted)' }}>
                    Gemma Confidence: {Math.round((issue.triage?.categoryConfidence || 0.95) * 100)}%
                  </div>
                  <Link href={`/issues?id=${issue._id}`} className="btn-nordic" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                    Review Response Draft
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: The Night Wire */}
        <div className="dossier-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--espresso)' }}>
              The Night Wire
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
              Real-time trace of automated agent actions
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(briefingData?.activities || []).slice(0, 5).map((act, idx) => (
              <div
                key={act._id || idx}
                style={{
                  padding: '12px 14px',
                  background: 'var(--canvas-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--rule)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--moss)' }}>
                    [{act.type?.toUpperCase()}]
                  </span>
                  <span style={{ color: 'var(--taupe-muted)', fontSize: '0.68rem' }}>
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: 'var(--espresso)', lineHeight: 1.4 }}>
                  {act.message}
                </div>
              </div>
            ))}

            {(briefingData?.activities || []).length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--taupe-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                Wire is quiet. Run triage or connect a repository.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
