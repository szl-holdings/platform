import { lazy, Suspense } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { GraphQLProvider } from './graphql';

function stripTrailingSlash(path: string) {
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const base = stripTrailingSlash((import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, ''));

const REVIEWED_PUBLIC_ROUTES = [
  { path: '/', label: 'A11oy candidate home' },
  { path: '/agent-viz', label: 'Agent visualization fixture' },
  { path: '/adversarial', label: 'Governance stress-test fixture' },
  { path: '/frontier', label: 'Positioning UI fixture' },
  { path: '/verifier', label: 'Verification workflow fixture' },
  { path: '/security-agents', label: 'Security-agent workflow fixture' },
] as const;

function routeHref(path: string) {
  return path === '/' ? `${base}/` || '/' : `${base}${path}`;
}

function Loader() {
  return (
    <div
      data-testid="route-loader"
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div
        aria-label="Loading reviewed route"
        role="status"
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.08)', borderTopColor: '#c9b787' }}
      />
    </div>
  );
}

function CandidateBoundaryBanner() {
  return (
    <aside
      data-testid="candidate-boundary"
      aria-label="Publication evidence boundary"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        left: 12,
        zIndex: 1000,
        padding: '0.65rem 1rem',
        border: '1px solid rgba(201,183,135,0.55)',
        borderRadius: 8,
        background: 'rgba(16,16,16,0.96)',
        color: '#f5f5f5',
        boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
        fontSize: '0.75rem',
        lineHeight: 1.5,
        textAlign: 'center',
      }}
    >
      <strong style={{ color: '#d9c58f' }}>CANDIDATE DEMO:</strong> repository fixtures and target
      contracts only. No page establishes production operation, certification, external attestation,
      or durable signed proof without separately linked exact-head evidence.
    </aside>
  );
}

function PublicationHoldPage() {
  const [location] = useLocation();

  return (
    <main
      data-testid="publication-hold"
      className="min-h-screen px-6 py-20"
      style={{ background: '#0a0a0a', color: '#f5f5f5' }}
    >
      <div
        className="mx-auto max-w-3xl rounded-xl p-8"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(201,183,135,0.35)',
        }}
      >
        <div
          className="mb-3 font-mono text-xs uppercase tracking-[0.2em]"
          style={{ color: '#d9c58f' }}
        >
          PUBLICATION HOLD · UNREVIEWED ROUTE
        </div>
        <h1 className="mb-4 text-3xl font-semibold">Evidence review required before publication</h1>
        <p className="mb-4 leading-7" style={{ color: '#b8b8b8' }}>
          This route is intentionally excluded from the public candidate bundle. Its legacy content
          has not completed claim-by-claim source review and may contain seeded customer, security,
          compliance, or operational scenarios that must not be presented as facts.
        </p>
        <dl className="mb-7 grid gap-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt style={{ color: '#8a8a8a' }}>Requested path:</dt>
            <dd className="font-mono" style={{ color: '#f5f5f5' }}>
              {location}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt style={{ color: '#8a8a8a' }}>Promotion condition:</dt>
            <dd style={{ color: '#f5f5f5' }}>
              dated sources, exact-head tests, and an approved evidence receipt
            </dd>
          </div>
        </dl>
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: '#d9c58f' }}
        >
          Reviewed candidate routes
        </h2>
        <nav aria-label="Reviewed candidate routes" className="grid gap-2 sm:grid-cols-2">
          {REVIEWED_PUBLIC_ROUTES.map((route) => (
            <a
              key={route.path}
              href={routeHref(route.path)}
              className="rounded-lg px-3 py-2 text-sm transition-colors"
              style={{
                color: '#f5f5f5',
                background: 'rgba(201,183,135,0.07)',
                border: '1px solid rgba(201,183,135,0.16)',
              }}
            >
              {route.label}
            </a>
          ))}
        </nav>
      </div>
    </main>
  );
}

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const AgentViz = lazy(() =>
  import('./pages/AgentViz').then((module) => ({ default: module.AgentViz })),
);
const AdversarialResilience = lazy(() =>
  import('./pages/AdversarialResilience').then((module) => ({
    default: module.AdversarialResilience,
  })),
);
const FrontierIntelligence = lazy(() =>
  import('./pages/FrontierIntelligence').then((module) => ({
    default: module.FrontierIntelligence,
  })),
);
const VerifierAgent = lazy(() =>
  import('./pages/VerifierAgent').then((module) => ({ default: module.VerifierAgent })),
);
const GovernedSecurityAgents = lazy(() =>
  import('./pages/GovernedSecurityAgents').then((module) => ({
    default: module.GovernedSecurityAgents,
  })),
);

export default function App() {
  return (
    <GraphQLProvider>
      <CandidateBoundaryBanner />
      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path={`${base}/`} component={HomePage} />
          {base ? <Route path={base} component={HomePage} /> : null}
          <Route path={`${base}/agent-viz`} component={AgentViz} />
          <Route path={`${base}/adversarial`} component={AdversarialResilience} />
          <Route path={`${base}/frontier`} component={FrontierIntelligence} />
          <Route path={`${base}/verifier`} component={VerifierAgent} />
          <Route path={`${base}/security-agents`} component={GovernedSecurityAgents} />
          <Route component={PublicationHoldPage} />
        </Switch>
      </Suspense>
    </GraphQLProvider>
  );
}
