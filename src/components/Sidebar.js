'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/issues', label: 'Issues', icon: 'issues' },
  { href: '/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/repos', label: 'Repositories', icon: 'repos' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="12" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="9" width="7" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  issues: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="2" fill="currentColor"/>
    </svg>
  ),
  analytics: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 17V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 17V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 17V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  repos: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 2.5V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 2.5C7 2.5 7.5 5 10.5 5C13.5 5 14 2.5 14 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 12.5C7 12.5 7.5 10 10.5 10C13.5 10 14 12.5 14 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2V4.5M10 15.5V18M18 10H15.5M4.5 10H2M15.66 4.34L13.89 6.11M6.11 13.89L4.34 15.66M15.66 15.66L13.89 13.89M6.11 6.11L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <span className={styles.logoEmoji}>🦥</span>
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Snooze Agent</span>
            <span className={styles.logoSub}>AI Issue Triage</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{ICONS[item.icon]}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button className={styles.collapseBtn} onClick={onToggle}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
        >
          <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {!collapsed && <span>Collapse</span>}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div className={styles.footer}>
          <div className={styles.footerText}>
            Powered by<br />
            <span className={styles.footerHighlight}>Llama 3.1 70B</span>
          </div>
        </div>
      )}
    </aside>
  );
}
