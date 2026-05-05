import { useState, useEffect, useCallback } from 'react';
import { IdentityPage } from './pages/IdentityPage';
import { OptimizerPage } from './pages/OptimizerPage';
import { FabricPage } from './pages/FabricPage';
import { ResearchPage } from './pages/ResearchPage';
import { ProofPage } from './pages/ProofPage';
import { NavBar } from './components/NavBar';

export type AppPage = 'identity' | 'optimizer' | 'fabric' | 'research' | 'proof';

const VALID_PAGES: ReadonlyArray<AppPage> = [
  'identity', 'optimizer', 'fabric', 'research', 'proof',
];

function getPageFromHash(): AppPage {
  const hash = window.location.hash.replace(/^#\/?/, '') as AppPage;
  return VALID_PAGES.includes(hash) ? hash : 'identity';
}

export default function App() {
  const [page, setPage] = useState<AppPage>(getPageFromHash);

  // Sync state when the user presses Back/Forward or types a hash manually.
  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigate: update the hash so the URL reflects current surface.
  const navigate = useCallback((p: AppPage) => {
    window.location.hash = p;
    setPage(p);
  }, []);

  return (
    <div id="main-content" style={{ minHeight: '100vh', background: '#030712' }}>
      <NavBar current={page} onNavigate={navigate} />
      {page === 'identity'   && <IdentityPage  onNavigate={navigate} />}
      {page === 'optimizer'  && <OptimizerPage onNavigate={navigate} />}
      {page === 'fabric'     && <FabricPage />}
      {page === 'research'   && <ResearchPage />}
      {page === 'proof'      && <ProofPage />}
    </div>
  );
}
