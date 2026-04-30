import { Suspense, lazy } from 'react';
import { Route, Switch } from 'wouter';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DeepDive = lazy(() => import('@/pages/DeepDive'));
const RoiLens = lazy(() => import('@/pages/RoiLens'));

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#080d14]">
      <div className="w-8 h-8 border-2 border-[#22d3ee]/30 border-t-[#22d3ee] rounded-full animate-spin" />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const nav = [
    { path: `${base}/`, label: 'Command' },
    { path: `${base}/deep-dive`, label: 'Deep Dive' },
    { path: `${base}/roi-lens`, label: 'ROI Lens' },
  ];

  return (
    <div className="min-h-screen bg-[#080d14] flex flex-col">
      <header className="border-b border-[#1a2436] px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">K</span>
          </div>
          <span className="text-sm font-semibold text-[#e2e8f0] tracking-tight">KORA</span>
          <span className="text-[10px] text-[#64748b] hidden sm:block">Decision Intelligence</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          {nav.map((n) => (
            <a
              key={n.path}
              href={n.path}
              className="px-3 py-1.5 rounded-lg text-xs text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#0e1520] transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-[#64748b] font-mono">PRAXIS connected</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Suspense fallback={<Spinner />}>
        <Switch>
          <Route path={`${base}/deep-dive`} component={DeepDive} />
          <Route path={`${base}/roi-lens`} component={RoiLens} />
          <Route component={Dashboard} />
        </Switch>
      </Suspense>
    </Shell>
  );
}
