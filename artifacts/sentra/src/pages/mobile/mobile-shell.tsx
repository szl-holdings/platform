import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Crosshair,
  Lock,
  Network,
  Shield,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';

const SocOverview = lazy(() => import('./soc-overview'));
const IncidentTriage = lazy(() => import('./incident-triage'));
const MeshHealth = lazy(() => import('./mesh-health'));
const PqcSummary = lazy(() => import('./pqc-summary'));
const HuntFeed = lazy(() => import('./hunt-feed'));

type Tab = 'soc' | 'triage' | 'mesh' | 'intel' | 'hunt';

const TABS: { id: Tab; label: string; icon: typeof Shield; path: string }[] = [
  { id: 'soc', label: 'SOC', icon: Shield, path: '/mobile' },
  { id: 'triage', label: 'Triage', icon: AlertTriangle, path: '/mobile/triage' },
  { id: 'mesh', label: 'Mesh', icon: Network, path: '/mobile/mesh' },
  { id: 'intel', label: 'PQC', icon: Lock, path: '/mobile/intel' },
  { id: 'hunt', label: 'Hunt', icon: Crosshair, path: '/mobile/hunt' },
];

function MobileLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  );
}

export default function MobileShell() {
  const [location] = useLocation();

  const activeTab = TABS.find((t) => {
    if (t.path === '/mobile') return location === '/mobile' || location === '/mobile/';
    return location.startsWith(t.path);
  })?.id ?? 'soc';

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white overflow-hidden">
      <header className="flex items-center gap-2.5 px-4 py-3 border-b border-white/6 shrink-0">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: 'rgba(245,245,245,0.06)', border: '1px solid rgba(245,245,245,0.10)' }}
        >
          <Shield className="w-3.5 h-3.5 text-[#f5f5f5]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[#f5f5f5] tracking-tight">Sentra Mobile</h1>
          <p className="text-[9px] font-mono uppercase tracking-wider text-white/40">
            Cyber Command
          </p>
        </div>
        <Link href="/dashboard">
          <span className="text-[10px] text-white/40 hover:text-white/60 transition-colors cursor-pointer">
            Desktop →
          </span>
        </Link>
      </header>

      <main className="flex-1 overflow-auto">
        <Suspense fallback={<MobileLoader />}>
          <Switch>
            <Route path="/mobile" component={SocOverview} />
            <Route path="/mobile/triage" component={IncidentTriage} />
            <Route path="/mobile/mesh" component={MeshHealth} />
            <Route path="/mobile/intel" component={PqcSummary} />
            <Route path="/mobile/hunt" component={HuntFeed} />
            <Route>
              <SocOverview />
            </Route>
          </Switch>
        </Suspense>
      </main>

      <nav className="flex items-stretch border-t border-white/8 bg-[#09090b]/95 backdrop-blur-md shrink-0 safe-area-bottom">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <Link key={tab.id} href={tab.path}>
              <button
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors min-w-0',
                  active ? 'text-[#f5f5f5]' : 'text-white/30',
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase tracking-wider">{tab.label}</span>
                {active && (
                  <div className="w-4 h-0.5 rounded-full bg-[#f5f5f5] mt-0.5" />
                )}
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
