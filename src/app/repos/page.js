'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/components/AppShell';

export default function ReposPage() {
  const { addToast, syncing, setSyncing } = useApp();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRepoName, setNewRepoName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/repos');
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleConnectRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newRepoName.includes('/')) {
      addToast('Please provide a repository in format: owner/repo', 'warning');
      return;
    }
    try {
      setConnecting(true);
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newRepoName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Connected ${newRepoName}!`, 'success');
        setNewRepoName('');
        setShowAddModal(false);
        fetchRepos();
      } else {
        addToast(data.error || 'Failed to connect repository', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncRepo = async (fullName) => {
    try {
      setSyncing(true);
      addToast(`Syncing ${fullName}... Snooze Agent is triaging!`, 'info');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: fullName }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Triage complete: ${data.results?.triaged || 0} issues sorted.`, 'success');
        fetchRepos();
      } else {
        addToast(data.error || 'Sync failed', 'error');
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (fullName) => {
    if (!confirm(`Are you sure you want to disconnect ${fullName}?`)) return;
    try {
      const res = await fetch(`/api/repos?fullName=${encodeURIComponent(fullName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast(`Disconnected ${fullName}`, 'info');
        fetchRepos();
      } else {
        addToast('Failed to disconnect repo', 'error');
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div className="editorial-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="stamp-tag stamp-tag-green" style={{ marginBottom: '8px' }}>
              AUTONOMOUS WATCH
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px' }}>
              Connected Repositories
            </h1>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Manage GitHub repositories audited overnight by Snooze Agent
            </p>
          </div>
          <button className="btn-ink" onClick={() => setShowAddModal(true)}>
            + Connect Repository
          </button>
        </div>
      </div>

      {/* Repo Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {repos.map((repo) => (
          <div key={repo._id || repo.fullName} className="editorial-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{repo.fullName}</h3>
                  <span className="stamp-tag stamp-tag-green">ACTIVE</span>
                </div>
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  {repo.description || 'Monitored repository'}
                </p>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  <span>★ {repo.stars || 0} STARS</span>
                  <span>🍴 {repo.forks || 0} FORKS</span>
                  <span>📌 {repo.openIssuesCount || 0} OPEN</span>
                  <span>LAST SYNCED: {repo.lastSynced ? new Date(repo.lastSynced).toLocaleTimeString() : 'Never'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-outline btn-pill-sm"
                  onClick={() => handleSyncRepo(repo.fullName)}
                  disabled={syncing}
                >
                  {syncing ? 'Triaging...' : '🔄 Run Triage Now'}
                </button>
                <button
                  className="btn-outline btn-pill-sm"
                  style={{ color: 'var(--stamp-red)' }}
                  onClick={() => handleDisconnect(repo.fullName)}
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Webhook endpoint */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--ink-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-secondary)' }}>
                <strong>GITHUB WEBHOOK ENDPOINT:</strong>{' '}
                <span style={{ background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: '3px' }}>
                  https://your-domain.tech/api/webhooks/github
                </span>
              </div>
              <span className="stamp-tag stamp-tag-blue" style={{ fontSize: '0.62rem' }}>EVENT: ISSUES</span>
            </div>
          </div>
        ))}

        {repos.length === 0 && (
          <div className="editorial-card" style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📂</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No repositories connected</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '20px' }}>
              Connect your first GitHub repository to start overnight triage.
            </p>
            <button className="btn-ink" onClick={() => setShowAddModal(true)}>
              Connect Repository
            </button>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showAddModal && (
        <div className="editorial-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="editorial-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '20px', borderBottom: '1.5px solid var(--ink-border-dark)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 800 }}>Connect Repository</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleConnectRepo}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
                  REPOSITORY (OWNER/REPO)
                </label>
                <input
                  type="text"
                  className="input-editorial"
                  placeholder="e.g. ayushg-1506/snooze-agent"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  required
                />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ink-border)', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-outline btn-pill-sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-ink btn-pill-sm" disabled={connecting}>
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
