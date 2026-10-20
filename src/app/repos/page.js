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
        addToast(`Successfully connected ${newRepoName}!`, 'success');
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
        addToast(`Triage finished: ${data.results?.triaged || 0} issues processed.`, 'success');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Connected Repositories</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
              Manage GitHub repositories monitored by Snooze Agent for overnight automated triage.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Connect New Repo
          </button>
        </div>
      </div>

      {/* Repositories Cards */}
      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading repositories...
        </div>
      ) : repos.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No repositories connected</div>
          <div className="empty-state-text">
            Connect a GitHub repository or load the demo dataset to experience autonomous triage.
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Connect a Repo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {repos.map((repo) => (
            <div
              key={repo._id || repo.fullName}
              className="glass-card"
              style={{ padding: 'var(--space-6)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <img
                    src={repo.avatarUrl || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}
                    alt=""
                    className="avatar avatar-lg"
                  />
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                      {repo.fullName}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {repo.description || 'Monitored repository'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      <span>⭐ {repo.stars || 0} stars</span>
                      <span>🍴 {repo.forks || 0} forks</span>
                      <span>📌 {repo.openIssuesCount || 0} open issues</span>
                      <span>
                        Last synced: {repo.lastSynced ? new Date(repo.lastSynced).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSyncRepo(repo.fullName)}
                    disabled={syncing}
                  >
                    {syncing ? 'Triaging...' : '🔄 Run Triage Now'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--rose-400)' }}
                    onClick={() => handleDisconnect(repo.fullName)}
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Webhook Configuration Guide */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  <strong>Live Webhook URL:</strong>{' '}
                  <code style={{ background: 'var(--bg-deep)', padding: '2px 6px', borderRadius: '4px', color: 'var(--purple-300)' }}>
                    https://your-domain.tech/api/webhooks/github
                  </code>
                </div>
                <span className="badge badge-sky">Event: Issues (opened, reopened)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Repo Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Connect GitHub Repository</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleConnectRepo}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Repository Name (owner/repo)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. ayushg-1506/snooze-agent"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Make sure your GitHub Token in .env.local has read access to this repository.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={connecting}>
                  {connecting ? 'Connecting...' : 'Connect Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
