import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import './index.css';

const queryClient = new QueryClient();

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'carlotajo.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: 'carlota-jo', tracesSampleRate: 0.2 });
initWebVitals('carlota-jo', '/api/');
initAnalytics({ appSlug: 'carlota-jo' });

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary appName="Carlota Jo Consulting" accentColor="#8b7ac8">
    <QueryClientProvider client={queryClient}>
      <GraphQLProvider>
        <App />
      </GraphQLProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
