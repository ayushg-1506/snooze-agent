import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'Snooze Agent — AI GitHub Issue Triage Bot',
  description: 'Wake up to a sorted, labeled, prioritized issue queue with AI responses drafted by open-weight AI.',
  keywords: ['Hacktoberfest', 'AI Agent', 'Open Source', 'GitHub Triage', 'Gemma', 'Llama 3.1', 'Dev Challenges'],
  authors: [{ name: 'Ayush' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
