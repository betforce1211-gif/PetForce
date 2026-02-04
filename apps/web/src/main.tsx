import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || 'https://48e223edad869076554be572bb836cc4@o4510824642052096.ingest.us.sentry.io/4510824680849408',
  environment: import.meta.env.MODE || 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in development
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Always capture sessions with errors
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
