import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import type { OnboardingConfig } from '@szl-holdings/shared-ui/onboarding';
import { BarChart3, FileStack, LayoutDashboard, Network, Scale, Shield } from 'lucide-react';

const PRISM_ACCENT = LANE_ACCENT_HEX.prismCounsel.primary;

export const PRISM_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: 'prism-counsel',
  appName: 'PRISM Counsel',
  accentColor: PRISM_ACCENT,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to PRISM Counsel',
      description:
        'Legal command for GC offices and enterprise litigation teams. Track every matter, obligation, and deadline with full proof-of-evidence — and run it all from one surface.',
      placement: 'center',
      icon: Scale,
    },
    {
      id: 'matter-board',
      title: 'Matter Board',
      description:
        'Your portfolio at a glance. Every active matter, ranked by pressure score, with risk posture and next deadline. Click any card to drill into the full chain of evidence.',
      targetSelector: "a[href='/matters']",
      placement: 'right',
      icon: LayoutDashboard,
    },
    {
      id: 'obligation-graph',
      title: 'Obligation Graph',
      description:
        'See every contractual obligation, statutory duty, and dependency as a connected network. Spot cascading risk and missing coverage in seconds.',
      targetSelector: "a[href='/obligation-graph']",
      placement: 'right',
      icon: Network,
    },
    {
      id: 'deadline-heatmap',
      title: 'Deadline Heatmap',
      description:
        'Calendar view of every filing, hearing, and statutory deadline across the portfolio — color-coded by severity so you can see the next pressure cliff before it hits.',
      targetSelector: "a[href='/deadline-heatmap']",
      placement: 'right',
      icon: BarChart3,
    },
    {
      id: 'proof-chain',
      title: 'Proof Chain Export',
      description:
        'Every action in PRISM is recorded with full provenance. Export an immutable audit trail — admissible, signed, and ready for opposing counsel or regulators.',
      targetSelector: "a[href='/proof-chain']",
      placement: 'right',
      icon: FileStack,
    },
    {
      id: 'privilege',
      title: 'Privilege & Audit',
      description:
        'Privilege Controls let you scope what each team and outside firm sees. Audit Trail surfaces every read, write, and export with operator attribution.',
      targetSelector: "a[href='/privilege']",
      placement: 'right',
      icon: Shield,
    },
  ],
  checklist: [
    {
      id: 'view-matter-board',
      label: 'Open the Matter Board',
      description: 'See your portfolio ranked by pressure',
    },
    {
      id: 'explore-obligation-graph',
      label: 'Explore the Obligation Graph',
      description: 'Spot cascading risk and dependencies',
    },
    {
      id: 'review-heatmap',
      label: 'Review the Deadline Heatmap',
      description: 'Find your next pressure cliff',
    },
    {
      id: 'export-proof-chain',
      label: 'Export a Proof Chain',
      description: 'Generate an admissible audit bundle',
    },
    {
      id: 'configure-privilege',
      label: 'Configure Privilege Controls',
      description: 'Scope access for teams and outside firms',
    },
  ],
};
