import { initAnalytics, initSentry } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTelemetry } from './telemetry';

initSentry({ appSlug: 'command', tracesSampleRate: 0.2 });
initAnalytics({ appSlug: 'command' });
try { initTelemetry({ serviceName: 'command-web' }); } catch { /* telemetry is non-critical */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary appName="Command" accentColor="#6366f1">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
