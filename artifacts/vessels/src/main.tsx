import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'vessels.szlholdings.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: 'vessels', tracesSampleRate: 0.2 });
initWebVitals('vessels', '/api/');
initAnalytics({ appSlug: 'vessels' });

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/vessels/sw.js', { scope: '/vessels/' }).catch((_err) => {
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary appName="Vessels Maritime Intelligence" accentColor="#4a90b8">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
