import { registerWithA11oy } from '@workspace/a11oy-orchestration/client';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Vessels boots in private/offline-first mode. The previous provider stack
// (Sentry, Plausible, OmniaShell, Service Worker) blocked first paint when
// network endpoints were unreachable. We boot to the marketing shell first;
// heavier providers can be re-attached behind feature flags.
// GraphQLProvider is added lazily here — it only opens a WebSocket when a
// component actually subscribes, so it does not affect cold-start paint time.

void registerWithA11oy({
  product: 'vessels',
  displayName: 'Vessels — Maritime Intelligence',
  basePath: '/vessels/',
  accentColor: '#c9b787',
  capabilities: [
    { id: 'voyage_calc', label: 'Voyage Calculation', governanceClass: 'recommendation' },
    { id: 'fleet_track', label: 'Fleet Tracking', governanceClass: 'observation' },
  ],
});

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/vessels/sw.js', { scope: '/vessels/' })
      .catch(() => {
        /* no-op */
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary appName="Vessels Maritime Intelligence" accentColor="#c9b787">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
