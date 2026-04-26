import {
  Activity,
  AlertTriangle,
  BarChart2,
  DollarSign,
  GitBranch,
  type LucideIcon,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';

export interface OpsFeature {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: LucideIcon;
  accent: string;
  bgGradient: string;
  capabilities: { title: string; desc: string }[];
  vsCompetitors: { name: string; us: string; them: string }[];
  includedIn: ('Initiate' | 'Command Pro' | 'Enterprise')[];
  ctaPath: string;
}

export const OPS_FEATURES: Record<string, OpsFeature> = {
  alerts: {
    slug: 'alerts',
    name: 'Alert Inbox',
    tagline: 'Unified Alert Triage',
    description:
      'Every firing alert across every platform, ranked by impact and ready for one-click action.',
    longDescription:
      'The Alert Inbox replaces a tab-graveyard of monitoring tools with a single ranked queue. Alerts from Lyte (latency, errors), Aegis (security), Vessels (fleet), and every other domain land in one place — already enriched with context, owner, and the playbook that resolves them.',
    icon: AlertTriangle,
    accent: '#ef4444',
    bgGradient: 'from-red-500/20',
    capabilities: [
      {
        title: 'Cross-domain Aggregation',
        desc: 'All firing alerts from every platform in a single ranked feed — no more switching tools to triage.',
      },
      {
        title: 'Severity Normalisation',
        desc: 'Critical / high / medium severity is normalised across providers so your team can trust the priority order.',
      },
      {
        title: 'One-click Acknowledgement',
        desc: 'Acknowledge, escalate, or silence with full audit trail captured in the governance log automatically.',
      },
    ],
    vsCompetitors: [
      { name: 'PagerDuty', us: 'Cross-domain (security + ops + finance)', them: 'Ops-only' },
      {
        name: 'Opsgenie',
        us: 'Native context from your business apps',
        them: 'Generic alert pipe',
      },
    ],
    includedIn: ['Command Pro', 'Enterprise'],
    ctaPath: '/alerts',
  },
  sla: {
    slug: 'sla',
    name: 'SLA Dashboard',
    tagline: 'Live Service-Level Tracking',
    description:
      'P95 latency, error rate, throughput, and uptime — measured from the same telemetry your customers feel.',
    longDescription:
      'The SLA Dashboard reads directly from production metrics (Lyte API latency p95, error rate, throughput, plus health-check pass-rate) and shows monthly compliance against every objective. Burn-rate alerts fire before you blow the budget, not after.',
    icon: Activity,
    accent: '#4d8fcc',
    bgGradient: 'from-sky-500/20',
    capabilities: [
      {
        title: 'Real Telemetry, Not Synthetic',
        desc: 'Reads p95 latency, error rate, and throughput from the same lyte_metrics stream that powers your dashboards.',
      },
      {
        title: 'Monthly Compliance Tracking',
        desc: 'Every SLO carries a rolling 30-day compliance percentage and a burn-rate indicator.',
      },
      {
        title: 'Owner Routing',
        desc: "Each SLO is owned by a team — breaches route to that team's on-call without configuration.",
      },
    ],
    vsCompetitors: [
      {
        name: 'Nobl9',
        us: 'Bundled with the rest of ops',
        them: 'Standalone, requires integration',
      },
      {
        name: 'Datadog SLOs',
        us: 'Same UI as your alerts and approvals',
        them: 'Separate product, separate pricing',
      },
    ],
    includedIn: ['Command Pro', 'Enterprise'],
    ctaPath: '/sla',
  },
  health: {
    slug: 'health',
    name: 'Health Score',
    tagline: 'Composite Ecosystem Health',
    description:
      'One number — 0 to 100 — that summarises the operational truth of your entire platform.',
    longDescription:
      'The Health Score blends four real-data dimensions: security (firing Aegis alerts + health-check pass-rate), operational (API latency p95 + uptime), financial (usage burn vs prior month), and compliance (active policies + pending approvals). The composite is weighted, transparent, and recomputed every minute.',
    icon: BarChart2,
    accent: '#8b7ac8',
    bgGradient: 'from-purple-500/20',
    capabilities: [
      {
        title: 'Four Real Dimensions',
        desc: 'Security, operational, financial, and compliance scores are each computed from live source-of-record tables.',
      },
      {
        title: 'Transparent Weighting',
        desc: 'Every dimension shows its weight, the signals it considered, and the source dataset — no black box.',
      },
      {
        title: 'Live Recomputation',
        desc: 'Refreshed every minute against production telemetry; surfaces regression instantly to leadership.',
      },
    ],
    vsCompetitors: [
      {
        name: 'Custom dashboards',
        us: 'Pre-built on real platform tables',
        them: 'Months of analyst time to assemble',
      },
      {
        name: 'Status-page metrics',
        us: 'Internal truth, not customer perception',
        them: 'Lagging incident-driven view',
      },
    ],
    includedIn: ['Command Pro', 'Enterprise'],
    ctaPath: '/health',
  },
  costs: {
    slug: 'costs',
    name: 'Cost Analytics',
    tagline: 'Usage × Rate Card',
    description:
      'Real consumption from usage_events, priced against your live rate card — no spreadsheets.',
    longDescription:
      'Cost Analytics aggregates platform usage events by feature key and multiplies them against your active rate card to produce true cost-of-ops in real time. Compare MTD against trend, drill by domain, and see exactly where the spend is going.',
    icon: DollarSign,
    accent: '#22c55e',
    bgGradient: 'from-emerald-500/20',
    capabilities: [
      {
        title: 'Source-of-Record Aggregation',
        desc: 'Reads usage_events and applies the active rate card — no estimates, no extrapolation.',
      },
      {
        title: 'MTD vs Trend',
        desc: 'Spot burn-rate spikes the day they start, not at month-end close.',
      },
      {
        title: 'Per-Domain Drill',
        desc: 'Filter by feature, domain, or workspace to see exactly which workload is driving spend.',
      },
    ],
    vsCompetitors: [
      {
        name: 'Cloud bill viewers',
        us: 'Application-level, not infra-level',
        them: 'Tells you AWS cost, not feature cost',
      },
      {
        name: 'FinOps platforms',
        us: 'Native to the platform you already run',
        them: 'Another integration to maintain',
      },
    ],
    includedIn: ['Command Pro', 'Enterprise'],
    ctaPath: '/costs',
  },
  governance: {
    slug: 'governance',
    name: 'Governance & Approvals',
    tagline: 'Policy + Approval Audit Trail',
    description:
      'Every guardian policy, every approval request, every audit event — joined and searchable.',
    longDescription:
      'Governance joins guardian_policies with the approval_requests queue and the approval_audit_trail to give legal, compliance, and security a single pane: which policies are active, which decisions are pending, and the full chain of who approved what.',
    icon: ShieldCheck,
    accent: '#a855f7',
    bgGradient: 'from-purple-500/20',
    capabilities: [
      {
        title: 'Live Policy Catalogue',
        desc: 'All active and inactive guardian policies surfaced from the same engine that gates production actions.',
      },
      {
        title: 'Approval Chain Audit',
        desc: 'For every approval request, see the role, approver, status, decision date, and comment — straight from the audit trail.',
      },
      {
        title: 'Compliance-Ready Export',
        desc: 'Generate audit artifacts for SOC 2, ISO 27001, or internal review with a single click.',
      },
    ],
    vsCompetitors: [
      {
        name: 'GRC suites',
        us: 'Bound to live operational decisions',
        them: 'Document repository disconnected from runtime',
      },
      {
        name: 'Manual approval queues',
        us: 'Auditable, queryable, exportable',
        them: 'Email threads and Slack DMs',
      },
    ],
    includedIn: ['Enterprise'],
    ctaPath: '/governance',
  },
  releases: {
    slug: 'releases',
    name: 'Release Feed',
    tagline: 'Unified Deployment Timeline',
    description:
      'Every deploy across every app — with status, severity, owner, and rollback indicator.',
    longDescription:
      'The Release Feed reads the deployments table directly. Every promotion to staging or production, every rollback, every hotfix shows up here in chronological order — labelled by domain, type, and severity, with the commit and the engineer who shipped it.',
    icon: GitBranch,
    accent: '#f97316',
    bgGradient: 'from-orange-500/20',
    capabilities: [
      {
        title: 'Live Deployment Stream',
        desc: 'Reads deployments table directly — every promotion, rollback, and hotfix shows up automatically.',
      },
      {
        title: 'Type & Severity Normalised',
        desc: 'Deploys, features, fixes, security patches, breaking changes — categorised consistently across all apps.',
      },
      {
        title: 'Roll-back Tracking',
        desc: 'Failed and rolled-back releases are tagged so leadership can see deployment health at a glance.',
      },
    ],
    vsCompetitors: [
      {
        name: 'Backstage Catalog',
        us: 'Out-of-the-box, no plugin engineering',
        them: 'Requires significant setup investment',
      },
      {
        name: 'Internal changelogs',
        us: 'Cross-app, ranked, audited',
        them: 'App-by-app, manual maintenance',
      },
    ],
    includedIn: ['Command Pro', 'Enterprise'],
    ctaPath: '/changelog',
  },
  team: {
    slug: 'team',
    name: 'Team & Access',
    tagline: 'RBAC + Roster',
    description:
      "The roster of who can do what, derived from the platform's role table — no separate IAM tool.",
    longDescription:
      'Team & Access shows the live roster gated by role: super_admin, admin, ops, and compliance see the membership, role assignments, last-active timestamps, and team groupings — all sourced from the same users table that powers authentication.',
    icon: Users,
    accent: '#4d8fcc',
    bgGradient: 'from-sky-500/20',
    capabilities: [
      {
        title: 'Single Source of Truth',
        desc: 'Roster pulled from the users table — the same one that authenticates every request.',
      },
      {
        title: 'Role-Gated Visibility',
        desc: 'Page itself is gated by RBAC — only super_admin, admin, ops, and compliance see member detail.',
      },
      {
        title: 'Last-Active Telemetry',
        desc: 'Identify dormant accounts and license waste with last-login timestamps surfaced inline.',
      },
    ],
    vsCompetitors: [
      { name: 'External IAM dashboards', us: 'Native to the platform', them: 'Yet another login' },
      { name: 'Spreadsheet rosters', us: 'Live, audited, gated', them: 'Stale within a week' },
    ],
    includedIn: ['Enterprise'],
    ctaPath: '/team',
  },
  digest: {
    slug: 'digest',
    name: 'Daily Digest',
    tagline: 'Personalised Morning Briefing',
    description:
      'A role-aware summary of what changed overnight — alerts, SLAs, approvals, and activity.',
    longDescription:
      'The Daily Digest builds a personalised briefing from real signals: firing alerts, p95 latency from the last 24h, pending governance approvals, and the platform activity log. Section priority adapts to your role — executives see health first, security sees alerts first, legal sees approvals first.',
    icon: Zap,
    accent: '#f59e0b',
    bgGradient: 'from-amber-500/20',
    capabilities: [
      {
        title: 'Role-Aware Prioritisation',
        desc: 'Executive, security, operations, finance, and legal each get the sections most relevant to them, ranked.',
      },
      {
        title: 'Real Signal Sources',
        desc: 'Built from firing alerts, p95 latency, pending approvals, and activity-log events — not hand-curated copy.',
      },
      {
        title: 'One-Click Drill-Through',
        desc: 'Every section links to the live ops page so you can act without leaving the briefing.',
      },
    ],
    vsCompetitors: [
      {
        name: 'Manual exec briefings',
        us: 'Generated in seconds, daily',
        them: 'Costs an analyst a half-day per executive',
      },
      { name: 'Dashboard email blasts', us: 'Personalised by role', them: 'One-size-fits-none' },
    ],
    includedIn: ['Command Pro', 'Enterprise'],
    ctaPath: '/digest',
  },
};

export const OPS_FEATURE_LIST: OpsFeature[] = Object.values(OPS_FEATURES);
