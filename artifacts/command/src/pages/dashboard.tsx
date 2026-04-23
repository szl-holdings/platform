import {
  DEMO_BRIEFING_HISTORY,
  MorningBriefingCard,
} from '@szl-holdings/shared-ui/morning-briefing';
import { type ActivationStep, ActivationBanner, useActivationState } from '@szl-holdings/shared-ui/onboarding';
import { GitBranch, Map, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AmbientSignalRanker } from '../components/ambient-signal-ranker';
import { AtlasKpiSection } from '../components/atlas-kpi-section';
import { CommandActions } from '../components/command-actions';
import { CommandBar } from '../components/command-bar';
import { CorrelationMapViz } from '../components/correlation-map-viz';
import { DemoLaunchpadPanel } from '../components/demo-launchpad-panel';
import { DomainGrid } from '../components/domain-grid';
import { EcosystemAppsGrid } from '../components/ecosystem-apps-grid';
import { EcosystemPulse } from '../components/ecosystem-pulse';
import { FusionBar } from '../components/fusion-bar';
import { GuardianDecisionsTile } from '../components/guardian-decisions-tile';
import { Header } from '../components/header';
import { IntelligencePanel } from '../components/intelligence-panel';
import { OpsCenterGrid } from '../components/ops-center-grid';
import { SignalChainsPanel } from '../components/signal-chains-panel';
import { Timeline } from '../components/timeline';
import { useEcosystemData } from '../hooks/use-ecosystem-data';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function SectionNav() {
  return (
    <nav className="flex items-center gap-2 flex-wrap">
      <Link
        href={`${BASE}/strategy/correlation-map`}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-surface-border)',
          color: 'var(--color-fg-muted)',
        }}
      >
        <Map className="w-3 h-3" />
        Correlation Map
      </Link>
      <Link
        href={`${BASE}/strategy/signal-chains`}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-surface-border)',
          color: 'var(--color-fg-muted)',
        }}
      >
        <Zap className="w-3 h-3" />
        Signal Chains
      </Link>
      <Link
        href={`${BASE}/competitive-atlas`}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'color-mix(in srgb, #8b7ac8 8%, var(--color-bg-elevated))',
          border: '1px solid color-mix(in srgb, #8b7ac8 25%, transparent)',
          color: '#a78bfa',
        }}
      >
        <TrendingUp className="w-3 h-3" />
        Competitive Atlas
      </Link>
    </nav>
  );
}

export function Dashboard() {
  const { data, dataUpdatedAt, sseConnected } = useEcosystemData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setAppSwitcherOpen(false);
        setSearchOpen((v) => !v);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setSearchOpen(false);
        setAppSwitcherOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activation = useActivationState({
    apiBaseUrl: `${BASE}/api`,
    pollIntervalMs: 60_000,
  });

  const activationSteps: ActivationStep[] = [
    {
      id: 'connect-signal',
      label: 'Connect a signal source',
      description: 'Link Slack, Jira, or another source to start receiving live signals',
      completed: activation.signalSourceConnected,
      href: `${BASE}/settings/integrations`,
    },
    {
      id: 'deploy-workflow',
      label: 'Deploy your first workflow',
      description: 'Choose a template and launch it through FORGE',
      completed: activation.workflowDeployed,
      href: `${BASE}/alloy/factory-floor`,
    },
    {
      id: 'triage-action',
      label: 'Triage your first action',
      description: 'Review and approve a pending decision in the action queue',
      completed: activation.actionTriaged,
      href: `${BASE}/operations/action-queue`,
    },
    {
      id: 'invite-team',
      label: 'Invite a team member',
      description: 'Bring your team into the platform',
      completed: activation.teamMemberInvited,
      href: `${BASE}/settings/team`,
    },
  ];

  const handleNavigate = useCallback(
    (href: string) => {
      const base = BASE.replace(/\/$/, '');
      const path = href.startsWith(base) ? href.slice(base.length) || '/' : href;
      navigate(path);
    },
    [navigate],
  );

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-primary)', color: 'rgba(255,255,255,0.7)' }}
      >
        <div className="text-xs font-mono uppercase tracking-widest animate-pulse text-white">
          Aggregating ecosystem data...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-fg-primary)' }}
    >
      <Header
        lastUpdatedAt={dataUpdatedAt}
        sseConnected={sseConnected}
        onSearchOpen={() => setSearchOpen(true)}
        onAppSwitcherOpen={() => setAppSwitcherOpen(true)}
      />

      <CommandBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CommandBar open={appSwitcherOpen} onClose={() => setAppSwitcherOpen(false)} mode="apps" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <FusionBar />
          <SectionNav />
          {!activation.isLoading && (
            <ActivationBanner
              steps={activationSteps}
              accentColor="#8b7ac8"
              storageKey="command_activation_banner"
              variant="banner"
              onNavigate={handleNavigate}
            />
          )}
          <DemoLaunchpadPanel />
        </div>

        <EcosystemPulse
          domains={data.domains}
          compositeScore={data.compositeScore}
          compositeStatus={data.compositeStatus}
        />

        <DomainGrid domains={data.domains} />

        <GuardianDecisionsTile />

        <OpsCenterGrid />

        <EcosystemAppsGrid />

        <AtlasKpiSection />

        <AmbientSignalRanker />

        <MorningBriefingCard briefing={DEMO_BRIEFING_HISTORY[0]} accentColor="#8b7ac8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <IntelligencePanel cards={data.intelligence} />
            <CommandActions actions={data.actions} />
          </div>
          <div className="lg:col-span-1 h-[600px] lg:h-auto">
            <Timeline events={data.timeline} />
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-surface-border)',
            padding: '24px',
          }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" style={{ color: '#8b7ac8' }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Correlation Map Preview
              </span>
            </div>
            <Link
              href={`${BASE}/strategy/correlation-map`}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
              style={{
                color: '#8b7ac8',
                backgroundColor: 'color-mix(in srgb, #8b7ac8 10%, transparent)',
                border: '1px solid color-mix(in srgb, #8b7ac8 25%, transparent)',
              }}
            >
              Full View →
            </Link>
          </div>
          <CorrelationMapViz />
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-surface-border)',
            padding: '24px',
          }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#8b7ac8' }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Active Signal Chains
              </span>
            </div>
            <Link
              href={`${BASE}/strategy/signal-chains`}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
              style={{
                color: '#8b7ac8',
                backgroundColor: 'color-mix(in srgb, #8b7ac8 10%, transparent)',
                border: '1px solid color-mix(in srgb, #8b7ac8 25%, transparent)',
              }}
            >
              Full View →
            </Link>
          </div>
          <SignalChainsPanel />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
