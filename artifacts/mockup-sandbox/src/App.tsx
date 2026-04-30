import { useEffect, useState } from 'react';
import InternalAuthGate from './components/InternalAuthGate';
import Layout from './components/Layout';
import type { Page } from './lib/types';
import AIQuality from './pages/AIQuality';
import AuditTrail from './pages/AuditTrail';
import Bridge from './pages/Bridge';
import DesignSystemPage from './pages/DesignSystemPage';
import EvalConsole from './pages/EvalConsole';
import EvalLayer from './pages/EvalLayer';
import Home from './pages/Home';
import Ingest from './pages/Ingest';
import Marketplace from './pages/Marketplace';
import Memory from './pages/Memory';
import Orchestrator from './pages/Orchestrator';
import PatternAtlas from './pages/PatternAtlas';
import PromptRegistry from './pages/PromptRegistry';
import Research from './pages/Research';
import Skills from './pages/Skills';
import TokensGovernance from './pages/TokensGovernance';
import KernelDashboard from './pages/KernelDashboard';

const VALID_PAGES: Page[] = [
  'home',
  'research',
  'memory',
  'skills',
  'patterns',
  'bridge',
  'orchestrator',
  'ingest',
  'design-system',
  'tokens-governance',
  'ai-quality',
  'prompt-registry',
  'eval-console',
  'audit',
  'marketplace',
  'kernel',
];

function getInitialPage(): Page {
  const hash = window.location.hash.replace('#', '') as Page;
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

function AppInner() {
  const [page, setPage] = useState<Page>(getInitialPage);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace('#', '') as Page;
      if (VALID_PAGES.includes(hash)) setPage(hash);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  function navigate(p: Page) {
    window.location.hash = p;
    setPage(p);
  }

  if (page === 'marketplace') {
    return <Marketplace onBack={() => navigate('home')} />;
  }

  return (
    <Layout page={page} navigate={navigate}>
      {page === 'home' && <Home navigate={navigate} />}
      {page === 'research' && <Research />}
      {page === 'memory' && <Memory />}
      {page === 'skills' && <Skills />}
      {page === 'patterns' && <PatternAtlas />}
      {page === 'bridge' && <Bridge />}
      {page === 'orchestrator' && <Orchestrator />}
      {page === 'ingest' && <Ingest />}
      {page === 'design-system' && <DesignSystemPage />}
      {page === 'tokens-governance' && <TokensGovernance />}
      {page === 'ai-quality' && <AIQuality />}
      {page === 'prompt-registry' && <PromptRegistry />}
      {page === 'eval-console' && <EvalConsole />}
      {page === 'eval-layer' && <EvalLayer />}
      {page === 'audit' && <AuditTrail />}
      {page === 'kernel' && <KernelDashboard />}
    </Layout>
  );
}

export default function App() {
  return (
    <InternalAuthGate>
      <AppInner />
    </InternalAuthGate>
  );
}
