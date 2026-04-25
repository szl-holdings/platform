import { Suspense, lazy } from 'react';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import Shell from './components/Shell';
import FrontierFeed from './pages/FrontierFeed';

const MythosIndex = lazy(() => import('./pages/MythosIndex'));
const CapabilityProposals = lazy(() => import('./pages/CapabilityProposals'));
const BenchmarkScoreboard = lazy(() => import('./pages/BenchmarkScoreboard'));
const ScannerAdmin = lazy(() => import('./pages/ScannerAdmin'));
const RecalibrationMemos = lazy(() => import('./pages/RecalibrationMemos'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/helios';

const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--helios-text-muted)',
    fontSize: '0.825rem',
    gap: 10,
  }}>
    <div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%' }} />
    Loading surface…
  </div>
);

export default function App() {
  return (
    <Shell>
      <ErrorBoundary>
        <Switch>
          <Route path={`${BASE}/`} component={FrontierFeed} />
          <Route path={`${BASE}`} component={FrontierFeed} />
          <Route path={`${BASE}/mythos`}>
            {() => <Suspense fallback={<PageLoader />}><MythosIndex /></Suspense>}
          </Route>
          <Route path={`${BASE}/proposals`}>
            {() => <Suspense fallback={<PageLoader />}><CapabilityProposals /></Suspense>}
          </Route>
          <Route path={`${BASE}/benchmarks`}>
            {() => <Suspense fallback={<PageLoader />}><BenchmarkScoreboard /></Suspense>}
          </Route>
          <Route path={`${BASE}/scanners`}>
            {() => <Suspense fallback={<PageLoader />}><ScannerAdmin /></Suspense>}
          </Route>
          <Route path={`${BASE}/memos`}>
            {() => <Suspense fallback={<PageLoader />}><RecalibrationMemos /></Suspense>}
          </Route>
          <Route path={`${BASE}/system`}>
            {() => <Suspense fallback={<PageLoader />}><SystemHealth /></Suspense>}
          </Route>
          <Route component={FrontierFeed} />
        </Switch>
      </ErrorBoundary>
    </Shell>
  );
}
