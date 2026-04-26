import { configurePlausible } from '@szl-holdings/analytics';
import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { initAnalytics, initSentry, initWebVitals } from '@szl-holdings/observability/react';
import { installAuthClearedRedirect } from '@szl-holdings/shared-ui/api-fetch';
import { ErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { OmniaShellProvider } from '@szl-holdings/omnia-shell/provider';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { initPostHog } from './lib/posthog-init';
import './i18n';
import './index.css';

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'szlholdings.com',
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initPostHog();

initSentry({ appSlug: 'szl-holdings', tracesSampleRate: 0.2 });
initWebVitals('szl-holdings', '/api/');
initAnalytics({ appSlug: 'szl-holdings' });
installAuthClearedRedirect('/api/login');

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <ErrorBoundary appName="SZL Holdings" accentColor="#8b7ac8">
      <GraphQLProvider>
        <OmniaShellProvider config={{ artifactId: 'holdings', accentColor: '#8b7ac8' }}>
          <App />
        </OmniaShellProvider>
      </GraphQLProvider>
    </ErrorBoundary>
  </HelmetProvider>,
);
