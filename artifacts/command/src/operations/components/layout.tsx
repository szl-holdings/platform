import {
  DashboardShell,
  SidebarNav,
  type SidebarNavSection,
} from '@szl-holdings/shared-ui/design-system';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import { colors, } from '@szl-holdings/shared-ui/tokens';
import { UserButton } from '@szl-holdings/shared-ui/UserButton';
import { toAlpha } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  Clock,
  DollarSign,
  Gauge,
  LayoutDashboard,
  Shield,
  Target,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { CommandLogo } from './CommandLogo';

const COMMAND_ACCENT = LANE_ACCENT_HEX.lyte.primary;
const SIDEBAR_BG = '#08090d';
const HEADER_BG = toAlpha('#08090d', 0.9);

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: {
    total: number;
    liveConfigured: number;
    mockedDemoMode: number;
    manualRequired: number;
  };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ['app-health-lyte'],
    queryFn: () => fetch('/api/services/health/app/lyte').then((r) => r.json()),
    refetchInterval: 60000,
  });
  if (!data) return null;
  const hasUnhealthy = data.summary.manualRequired > 0;
  const hasDemoMode = data.summary.mockedDemoMode > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;

  if (hasUnhealthy) {
    return (
      <div
        className="px-4 py-1.5 flex items-center gap-2 shrink-0"
        style={{
          background: toAlpha(colors.semantic.error, 0.08),
          borderBottom: `1px solid ${toAlpha(colors.semantic.error, 0.18)}`,
        }}
      >
        <WifiOff className="w-3 h-3" style={{ color: colors.semantic.error }} />
        <span className="text-[11px]" style={{ color: colors.semantic.error }}>
          {data.summary.manualRequired} integration(s) not configured
        </span>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-1 flex items-center gap-2 shrink-0"
      style={{ borderBottom: `1px solid ${toAlpha(COMMAND_ACCENT, 0.1)}` }}
    >
      <span
        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
        style={{
          color: toAlpha(COMMAND_ACCENT, 0.75),
          border: `1px solid ${toAlpha(COMMAND_ACCENT, 0.2)}`,
          background: toAlpha(COMMAND_ACCENT, 0.06),
        }}
      >
        DEMO
      </span>
      <span className="text-[10px]" style={{ color: toAlpha(COMMAND_ACCENT, 0.55) }}>
        Business observability demo data
      </span>
    </div>
  );
}

const PRIMARY_SECTIONS: SidebarNavSection[] = [
  {
    id: 'primary',
    items: [
      {
        id: 'overview',
        href: '/',
        label: 'Command Overview',
        icon: <LayoutDashboard className="w-full h-full" />,
      },
      {
        id: 'signals',
        href: '/signals',
        label: 'Signal Feed',
        icon: <Activity className="w-full h-full" />,
      },
      {
        id: 'insights',
        href: '/insights',
        label: 'Narrative Intelligence',
        icon: <Zap className="w-full h-full" />,
      },
      {
        id: 'agent-insights',
        href: '/agent-insights',
        label: 'Agent Insights',
        icon: <Brain className="w-full h-full" />,
      },
      {
        id: 'action-center',
        href: '/action-center',
        label: 'Action Center',
        icon: <AlertTriangle className="w-full h-full" />,
      },
      {
        id: 'readiness',
        href: '/readiness',
        label: 'Command Readiness',
        icon: <Shield className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Views',
    items: [
      {
        id: 'workflow-latency',
        href: '/workflow-latency',
        label: 'Workflow Latency',
        icon: <Clock className="w-full h-full" />,
      },
      {
        id: 'apm',
        href: '/apm',
        label: 'APM Instrumentation',
        icon: <Gauge className="w-full h-full" />,
      },
      {
        id: 'ownership-map',
        href: '/ownership-map',
        label: 'Ownership Map',
        icon: <Users className="w-full h-full" />,
      },
      {
        id: 'value-at-risk',
        href: '/value-at-risk',
        label: 'Value at Risk',
        icon: <DollarSign className="w-full h-full" />,
      },
      {
        id: 'use-cases',
        href: '/use-cases',
        label: 'Use Cases',
        icon: <BookOpen className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        id: 'platform',
        href: '/platform',
        label: 'Platform Overview',
        icon: <Target className="w-full h-full" />,
      },
    ],
  },
];

const ALL_ITEMS = [
  ...PRIMARY_SECTIONS[0].items,
  ...PRIMARY_SECTIONS[1].items,
  ...PRIMARY_SECTIONS[2].items,
];

export function Layout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();

  const sidebarHeader = (
    <div className="h-14 flex items-center px-2">
      <div className="flex items-center gap-2.5">
        <div
          className="p-1.5 rounded-lg shadow-lg relative shrink-0"
          style={{
            background: `linear-gradient(135deg, ${COMMAND_ACCENT}, #4a80d0)`,
            boxShadow: `0 0 12px ${toAlpha(COMMAND_ACCENT, 0.22)}`,
          }}
        >
          <CommandLogo className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-sm tracking-[0.1em] text-white leading-none">
            COMMAND
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.15em] leading-none mt-0.5"
            style={{ color: toAlpha(COMMAND_ACCENT, 0.75) }}
          >
            Business Observability
          </span>
        </div>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-2">
      <UserButton showName className="w-full" />
      <div className="flex items-center gap-2" style={{ color: colors.text.subtle }}>
        <Zap className="w-3 h-3" />
        <span className="text-[10px]">SZL Holdings</span>
      </div>
      <a
        href="/alloy"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg w-full transition-colors"
        style={{ color: toAlpha(COMMAND_ACCENT, 0.45) }}
        title="Alloy Execution Fabric"
      >
        <span className="text-[10px] font-medium">⬡ Powered by Alloy</span>
      </a>
    </div>
  );

  const topbar = (
    <div className="flex-1 flex items-center justify-between">
      <h1
        className="font-display font-semibold text-base capitalize tracking-wide"
        style={{ color: colors.text.primary }}
      >
        {ALL_ITEMS.find(
          (i) => i.href === location || (i.href !== '/' && location.startsWith(i.href as string)),
        )?.label || 'KORA'}
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: colors.semantic.error }}
          />
          <span style={{ color: colors.semantic.error }}>3 Critical</span>
          <span className="mx-1" style={{ color: colors.border.DEFAULT }}>
            ·
          </span>
          <span style={{ color: colors.semantic.warning }}>5 High</span>
          <span className="mx-1" style={{ color: colors.border.DEFAULT }}>
            ·
          </span>
          <span style={{ color: COMMAND_ACCENT }}>$17.6M at risk</span>
        </div>
        <div className="h-6 w-px" style={{ background: colors.border.DEFAULT }} />
        <button
          className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: colors.text.muted }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: colors.semantic.error }}
          />
        </button>
      </div>
    </div>
  );

  const sidebar = (
    <>
      <DemoModeBanner />
      <SidebarNav
        sections={PRIMARY_SECTIONS}
        currentPath={location}
        accentColor={COMMAND_ACCENT}
        header={sidebarHeader}
        footer={sidebarFooter}
        onNavigate={(item) => {
          if (item.href) navigate(item.href);
        }}
      />
    </>
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: COMMAND_ACCENT, color: '#fff' }}
      >
        Skip to main content
      </a>
      <DashboardShell
        sidebar={sidebar}
        topbar={topbar}
        accentColor={COMMAND_ACCENT}
        theme={{
          accentColor: COMMAND_ACCENT,
          sidebarBg: SIDEBAR_BG,
          headerBg: HEADER_BG,
        }}
      >
        <main id="main-content" className="flex-1 p-6 relative" tabIndex={-1}>
          {children}
        </main>
      </DashboardShell>
    </>
  );
}
