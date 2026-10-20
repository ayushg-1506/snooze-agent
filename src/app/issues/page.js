'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/AppShell';

function IssuesContent() {
  const { addToast } = useApp();
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get('id');

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/issues?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
        if (initialSelectedId && !selectedIssue) {
          const match = data.issues?.find((i) => i._id === initialSelectedId);
          if (match) setSelectedIssue(match);
        }
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [categoryFilter, priorityFilter, searchQuery]);

  const handleApplyLabels = async (issue) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/issues/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue._id, action: 'label' }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Labels applied to GitHub issue!', 'success');
        fetchIssues();
        if (selectedIssue?._id === issue._id) {
          setSelectedIssue({
            ...selectedIssue,
            triage: { ...selectedIssue.triage, labelsApplied: true },
          });
        }
      } else {
        addToast(data.error || 'Failed to apply labels', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostResponse = async (issue) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/issues/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue._id, action: 'respond' }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('AI Draft Response posted to GitHub!', 'success');
        fetchIssues();
        if (selectedIssue?._id === issue._id) {
          setSelectedIssue({
            ...selectedIssue,
            triage: { ...selectedIssue.triage, responsePosted: true },
          });
        }
      } else {
        addToast(data.error || 'Failed to post response', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header and Filter Controls */}
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search issues by title, body, or author..."
              style={{ width: '100%' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Categories</option>
              <option value="bug">🐛 Bug</option>
              <option value="feature">✨ Feature</option>
              <option value="question">❓ Question</option>
              <option value="docs">📝 Docs</option>
              <option value="duplicate">🔁 Duplicate</option>
              <option value="enhancement">🔧 Enhancement</option>
            </select>

            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Priorities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            {(categoryFilter || priorityFilter || searchQuery) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setCategoryFilter('');
                  setPriorityFilter('');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Issues Table / List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading issue queue...
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🦥</div>
            <div className="empty-state-title">No issues found</div>
            <div className="empty-state-text">
              Try adjusting your search criteria, or trigger an overnight sync.
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Issue</th>
                <th>Title & AI Summary</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Author</th>
                <th>Labels</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td style={{ fontWeight: 700, color: 'var(--purple-300)' }}>
                    #{issue.number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {issue.triage?.summary || issue.body?.slice(0, 90)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      issue.triage?.category === 'bug'
                        ? 'badge-rose'
                        : issue.triage?.category === 'feature'
                        ? 'badge-purple'
                        : 'badge-sky'
                    }`}>
                      {issue.triage?.category || 'unknown'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      issue.triage?.priority === 'critical'
                        ? 'badge-rose'
                        : issue.triage?.priority === 'high'
                        ? 'badge-amber'
                        : 'badge-neutral'
                    }`}>
                      {issue.triage?.priority || 'normal'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {issue.authorAvatar && (
                        <img src={issue.authorAvatar} alt="" className="avatar avatar-sm" />
                      )}
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        @{issue.author}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(issue.labels || []).slice(0, 2).map((l, i) => (
                        <span key={i} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {issue.triage?.labelsApplied ? (
                      <span style={{ color: 'var(--emerald-400)', fontSize: 'var(--text-xs)' }}>✓ Labeled</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Pending Label</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedIssue(issue)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Issue Detail & AI Review */}
      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--purple-300)' }}>
                  #{selectedIssue.number}
                </span>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                  {selectedIssue.title}
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedIssue(null)}
                style={{ fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Meta Ribbon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`badge ${selectedIssue.triage?.category === 'bug' ? 'badge-rose' : 'badge-purple'}`}>
                    Category: {selectedIssue.triage?.category}
                  </span>
                  <span className={`badge ${selectedIssue.triage?.priority === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                    Priority: {selectedIssue.triage?.priority}
                  </span>
                  <span className="badge badge-sky">
                    Sentiment: {selectedIssue.triage?.sentiment}
                  </span>
                </div>
                {selectedIssue.url && (
                  <a
                    href={selectedIssue.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--purple-300)', textDecoration: 'underline' }}
                  >
                    Open on GitHub ↗
                  </a>
                )}
              </div>

              {/* Original Issue Description */}
              <div style={{ background: 'var(--bg-deep)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  ORIGINAL ISSUE TEXT
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedIssue.body || 'No description provided.'}
                </div>
              </div>

              {/* AI Triage Reasoning */}
              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '1rem' }}>🦥</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--purple-300)' }}>
                    AI TRIAGE REASONING & SUMMARY
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedIssue.triage?.reasoning || selectedIssue.triage?.summary}
                </div>
              </div>

              {/* Duplicates Alert if any */}
              {selectedIssue.triage?.duplicates?.length > 0 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--amber-400)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--amber-400)', marginBottom: 'var(--space-2)' }}>
                    🔁 POTENTIAL DUPLICATE DETECTED
                  </div>
                  {selectedIssue.triage.duplicates.map((dup, i) => (
                    <div key={i} style={{ fontSize: 'var(--text-sm)' }}>
                      Matches <strong>#{dup.issueNumber}</strong> ({Math.round(dup.confidence * 100)}% match): {dup.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Draft Response Section */}
              <div style={{ background: 'linear-gradient(135deg, rgba(20, 24, 54, 0.9), rgba(12, 16, 34, 0.9))', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--purple-400)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--sky-400)' }}>
                    ✍️ AI DRAFTED RESPONSE
                  </div>
                  {selectedIssue.triage?.responsePosted && (
                    <span className="badge badge-emerald">✓ Already Posted</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                  {selectedIssue.triage?.draftResponse || 'No response drafted.'}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handlePostResponse(selectedIssue)}
                    disabled={actionLoading || selectedIssue.triage?.responsePosted}
                  >
                    {selectedIssue.triage?.responsePosted ? 'Posted to GitHub' : 'Approve & Post to GitHub'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApplyLabels(selectedIssue)}
                    disabled={actionLoading || selectedIssue.triage?.labelsApplied}
                  >
                    {selectedIssue.triage?.labelsApplied ? 'Labels Applied' : 'Apply AI Labels'}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedIssue(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading issues...</div>}>
      <IssuesContent />
    </Suspense>
  );
}
