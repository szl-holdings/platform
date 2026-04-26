import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { OmniaShellProvider } from '@szl-holdings/omnia-shell/provider';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'sentra.szlholdings.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: 'sentra', tracesSampleRate: 0.2 });
initWebVitals('sentra', '/api/');
initAnalytics({ appSlug: 'sentra' });

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sentra/sw.js', { scope: '/sentra/' }).catch((_err) => {
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary appName="TENAX Cyber Resilience Command" accentColor="#22c55e">
    <GraphQLProvider>
      <OmniaShellProvider config={{ artifactId: 'sentra', accentColor: '#22c55e' }}>
        <App />
      </OmniaShellProvider>
    </GraphQLProvider>
  </ErrorBoundary>,
);
