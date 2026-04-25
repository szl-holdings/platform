import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'lyte.szlholdings.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: 'lyte', tracesSampleRate: 0.2 });
initWebVitals('lyte', '/api/');
initAnalytics({ appSlug: 'lyte' });

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary appName="Lyte" accentColor="#d4a054">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
