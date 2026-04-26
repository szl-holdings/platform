import { initAnalytics, initSentry } from '@szl-holdings/observability/react';
import { OmniaShellProvider } from '@szl-holdings/omnia-shell/provider';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

initSentry({ appSlug: 'aegis', tracesSampleRate: 0.1 });
initAnalytics({ appSlug: 'aegis' });

createRoot(document.getElementById('root')!).render(
  <OmniaShellProvider config={{ artifactId: 'aegis', accentColor: '#ef4444' }}>
    <App />
  </OmniaShellProvider>,
);
