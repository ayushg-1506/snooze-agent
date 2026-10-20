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
        addToast('Maintainer response published to GitHub!', 'success');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Search and Filters Header */}
      <div className="dossier-card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              className="input-dossier"
              placeholder="Search docket by keyword, error trace, or author..."
              style={{ width: '100%' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="input-dossier"
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
              className="input-dossier"
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
                className="btn-nordic-outline"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => {
                  setCategoryFilter('');
                  setPriorityFilter('');
                  setSearchQuery('');
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="dossier-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--taupe-muted)', fontFamily: 'var(--font-mono)' }}>
            Retrieving triage docket...
          </div>
        ) : issues.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🦥</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No issues found</h3>
            <p style={{ color: 'var(--taupe)', fontSize: '0.85rem', marginTop: '4px' }}>
              No issues matched your filters.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--canvas-subtle)', borderBottom: '1px solid var(--rule)' }}>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Issue</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Title & AI Summary</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Priority</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Author</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Labels</th>
                <th style={{ padding: '12px 18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--taupe)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue._id}
                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--rule)' }}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                    #{issue.number}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--espresso)', marginBottom: '2px' }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>
                      {issue.triage?.summary || issue.body?.slice(0, 90)}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="chip chip-sage">
                      {issue.triage?.category || 'unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {issue.triage?.priority === 'critical' ? (
                      <span className="chip chip-terracotta">CRITICAL</span>
                    ) : issue.triage?.priority === 'high' ? (
                      <span className="chip chip-ochre">HIGH</span>
                    ) : (
                      <span className="chip chip-neutral">{issue.triage?.priority || 'NORMAL'}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--taupe)' }}>
                      @{issue.author}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(issue.labels || []).slice(0, 2).map((l, i) => (
                        <span key={i} className="chip chip-neutral" style={{ fontSize: '0.65rem' }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn-nordic" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={() => setSelectedIssue(issue)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Editorial Docket Review */}
      {selectedIssue && (
        <div className="dossier-modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--moss)' }}>
                  #{selectedIssue.number}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--espresso)' }}>
                  {selectedIssue.title}
                </h3>
              </div>
              <button onClick={() => setSelectedIssue(null)} style={{ fontSize: '1.2rem', color: 'var(--taupe)' }}>✕</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="chip chip-sage">CATEGORY: {selectedIssue.triage?.category}</span>
                  <span className="chip chip-terracotta">PRIORITY: {selectedIssue.triage?.priority}</span>
                  <span className="chip chip-celadon">SENTIMENT: {selectedIssue.triage?.sentiment}</span>
                </div>
                {selectedIssue.url && (
                  <a href={selectedIssue.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--moss)', fontFamily: 'var(--font-mono)', textDecoration: 'underline' }}>
                    Open on GitHub ↗
                  </a>
                )}
              </div>

              {/* Original Issue Text */}
              <div style={{ background: 'var(--canvas-subtle)', padding: '16px', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--taupe-muted)', marginBottom: '8px' }}>
                  ORIGINAL ISSUE DESCRIPTION
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                  {selectedIssue.body || 'No description provided.'}
                </div>
              </div>

              {/* AI Reasoning */}
              <div style={{ background: 'var(--surface)', padding: '16px', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--moss)', marginBottom: '6px' }}>
                  🦥 GEMMA 2 TRIAGE REASONING
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--espresso)' }}>
                  {selectedIssue.triage?.reasoning || selectedIssue.triage?.summary}
                </div>
              </div>

              {/* Duplicates Alert */}
              {selectedIssue.triage?.duplicates?.length > 0 && (
                <div style={{ background: 'var(--ochre-wash)', padding: '14px', border: '1px solid var(--ochre)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--ochre)', marginBottom: '4px' }}>
                    🔁 SEMANTIC DUPLICATE DETECTED
                  </div>
                  {selectedIssue.triage.duplicates.map((dup, i) => (
                    <div key={i} style={{ fontSize: '0.8rem' }}>
                      Shares {Math.round(dup.confidence * 100)}% similarity with <strong>#{dup.issueNumber}</strong>: {dup.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Draft Response */}
              <div style={{ background: '#FFFFFF', padding: '18px', border: '1px solid var(--moss)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--moss)' }}>
                    ✍️ MAINTAINER DRAFT RESPONSE
                  </div>
                  {selectedIssue.triage?.responsePosted && (
                    <span className="chip chip-sage">PUBLISHED</span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px', color: 'var(--espresso)' }}>
                  {selectedIssue.triage?.draftResponse || 'No response drafted.'}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-nordic"
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    onClick={() => handlePostResponse(selectedIssue)}
                    disabled={actionLoading || selectedIssue.triage?.responsePosted}
                  >
                    {selectedIssue.triage?.responsePosted ? 'Published' : 'Approve & Post to GitHub'}
                  </button>
                  <button
                    className="btn-nordic-outline"
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    onClick={() => handleApplyLabels(selectedIssue)}
                    disabled={actionLoading || selectedIssue.triage?.labelsApplied}
                  >
                    {selectedIssue.triage?.labelsApplied ? 'Labels Applied' : 'Apply AI Labels'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--rule)', textAlign: 'right' }}>
              <button className="btn-nordic-outline" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => setSelectedIssue(null)}>
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
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <IssuesContent />
    </Suspense>
  );
}
