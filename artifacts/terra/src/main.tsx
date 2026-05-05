import { registerWithA11oy } from '@workspace/a11oy-orchestration/client';
import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { OmniaShellProvider } from '@szl-holdings/omnia-shell/provider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'beacon.szlholdings.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: 'terra', tracesSampleRate: 0.2 });
initWebVitals('terra', '/api/');
initAnalytics({ appSlug: 'terra' });

void registerWithA11oy({
  product: 'terra',
  displayName: 'Terra — Real Estate Intelligence',
  basePath: '/terra/',
  accentColor: '#d4a054',
  capabilities: [
    { id: 'cap_rate', label: 'Cap-Rate Forecast', governanceClass: 'recommendation' },
    { id: 'valuation', label: 'Property Valuation', governanceClass: 'recommendation' },
  ],
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary appName="TERRA Real Estate Intelligence" accentColor="#d4a054">
      <GraphQLProvider>
        <OmniaShellProvider config={{ artifactId: 'terra', accentColor: '#22c55e' }}>
          <App />
        </OmniaShellProvider>
      </GraphQLProvider>
    </ErrorBoundary>
  </StrictMode>,
);
