'use client';

import styles from './ToastContainer.module.css';

export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type] || styles.info}`}>
          <span className={styles.icon}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'ℹ'}
            {toast.type === 'warning' && '⚠'}
          </span>
          <span className={styles.message}>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
