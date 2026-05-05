import { registerWithA11oy } from '@workspace/a11oy-orchestration/client';
import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { OmniaShellProvider } from '@szl-holdings/omnia-shell/provider';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'counsel.szlholdings.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: 'counsel', tracesSampleRate: 0.2 });
initWebVitals('counsel', '/api/');
initAnalytics({ appSlug: 'counsel' });

void registerWithA11oy({
  product: 'counsel',
  displayName: 'Counsel — Legal Matter Command',
  basePath: '/counsel/',
  accentColor: '#8b5cf6',
  capabilities: [
    { id: 'matter_review', label: 'Matter Review', governanceClass: 'recommendation' },
    { id: 'esign', label: 'eSignature Dispatch', governanceClass: 'external_action' },
    { id: 'court_filing', label: 'Court Filing', governanceClass: 'external_action' },
  ],
});

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/counsel/sw.js', { scope: '/counsel/' }).catch((_err) => {
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary appName="Counsel Legal Matter Command" accentColor="#8b5cf6">
    <GraphQLProvider>
      <OmniaShellProvider config={{ artifactId: 'counsel', accentColor: '#8b5cf6' }}>
        <App />
      </OmniaShellProvider>
    </GraphQLProvider>
  </ErrorBoundary>,
);
