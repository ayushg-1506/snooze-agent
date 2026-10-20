'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from './AppShell';
import styles from './Header.module.css';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Your overnight command center' },
  '/issues': { title: 'Issues', subtitle: 'AI-triaged issue queue' },
  '/analytics': { title: 'Analytics', subtitle: 'Trends, patterns & insights' },
  '/repos': { title: 'Repositories', subtitle: 'Manage connected repos' },
  '/settings': { title: 'Settings', subtitle: 'Configure Snooze Agent' },
};

export default function Header() {
  const pathname = usePathname();
  const { syncing } = useApp();
  const pageInfo = PAGE_TITLES[pathname] || PAGE_TITLES['/'];

  const [timeState, setTimeState] = useState({
    greeting: 'Good morning',
    formattedDate: '',
  });

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    let g = 'Good evening';
    if (hours < 12) g = 'Good morning';
    else if (hours < 17) g = 'Good afternoon';

    setTimeState({
      greeting: g,
      formattedDate: now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    });
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div>
          <h1 className={styles.title}>{pageInfo.title}</h1>
          <p className={styles.subtitle}>{pageInfo.subtitle}</p>
        </div>
      </div>
      <div className={styles.right}>
        {syncing && (
          <div className={styles.syncIndicator}>
            <div className={styles.syncDot} />
            <span>Syncing...</span>
          </div>
        )}
        <div className={styles.greeting}>
          <span className={styles.greetingText}>{timeState.greeting} 🦥</span>
          {timeState.formattedDate && (
            <span className={styles.greetingTime}>{timeState.formattedDate}</span>
          )}
        </div>
      </div>
    </header>
  );
}
