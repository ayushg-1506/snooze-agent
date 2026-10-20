'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ToastContainer from '@/components/ToastContainer';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

const NAV_LINKS = [
  { href: '/', label: 'Morning Dossier' },
  { href: '/issues', label: 'Triage Queue' },
  { href: '/analytics', label: 'Patterns & Velocity' },
  { href: '/repos', label: 'Monitored Repos' },
  { href: '/settings', label: 'Diagnostics' },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [toasts, setToasts] = useState([]);
  const [repos, setRepos] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/repos');
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const value = {
    toasts,
    addToast,
    repos,
    setRepos,
    fetchRepos,
    syncing,
    setSyncing,
  };

  return (
    <AppContext.Provider value={value}>
      <div className="dossier-layout">
        {/* Editorial Top Navigation */}
        <header className="dossier-nav">
          <div className="brand-mark">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-symbol">
                🦥
              </div>
              <div>
                <span className="brand-title">snooze agent</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--taupe)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
                  ed. 03
                </span>
              </div>
            </Link>
          </div>

          <nav className="nav-links">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="chip chip-sage" style={{ fontSize: '0.68rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--moss)', display: 'inline-block' }} />
              NIGHT WATCH ACTIVE · GEMMA 2
            </span>
          </div>
        </header>

        <main>{children}</main>
      </div>

      <ToastContainer toasts={toasts} />
    </AppContext.Provider>
  );
}
