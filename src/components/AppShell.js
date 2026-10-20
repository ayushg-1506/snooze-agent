'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export default function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    } catch (e) {
      // silently fail on first load if no DB yet
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const value = {
    sidebarCollapsed,
    setSidebarCollapsed,
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
      <div className="app-layout">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main
          className="main-content"
          style={{
            marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          }}
        >
          <Header />
          <div className="page-container">{children}</div>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </AppContext.Provider>
  );
}
