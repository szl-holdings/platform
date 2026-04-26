import {
  AlertCard,
  AnimatedCounter,
  AutonomyDial,
  DataStateBadge,
  DoctrineLayerBadge,
  LoadingSkeleton,
} from '@szl-holdings/shared-ui';
import {
  Activity,
  BarChart2,
  Bell,
  BookOpen,
  Brain,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  Eye,
  GitBranch,
  Info,
  Layers,
  LayoutDashboard,
  Moon,
  Network,
  Package,
  Palette,
  Search,
  Shield,
  Sun,
  Table,
  ToggleLeft,
  Workflow,
  Zap,
} from 'lucide-react';
import { Component, type CSSProperties, type ErrorInfo, type ReactNode, useState } from 'react';
import { sharedUiExports } from 'virtual:shared-ui-manifest';
import { GENERATED_METADATA } from './patternAtlasMetadata.generated';

interface PropDef {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
  control?: 'text' | 'boolean' | 'select' | 'number';
  options?: string[];
}

type LivePreviewFn = (values: Record<string, string>) => ReactNode;

interface ComponentMetadata {
  category: string;
  description: string;
  status: 'stable' | 'beta' | 'experimental';
  source: string;
  props: PropDef[];
  usageExample: string;
  livePreview?: LivePreviewFn;
}

type MetadataRegistry = Record<string, ComponentMetadata>;

const REGISTRY: MetadataRegistry = {
  AuthGate: {
    category: 'Auth',
    description:
      'Guards routes based on authentication state. Renders children when authenticated, falls back to a login prompt otherwise.',
    status: 'stable',
    source: 'lib/shared-ui/src/AuthGate.tsx',
    props: [
      { name: 'children', type: 'React.ReactNode', required: true, description: 'Content to render when authenticated' },
      { name: 'fallback', type: 'React.ReactNode', required: false, description: 'Shown while session is loading' },
      { name: 'loading', type: 'React.ReactNode', required: false, description: 'Custom loading state' },
    ],
    usageExample: `import { AuthGate } from '@szl-holdings/shared-ui';

<AuthGate fallback={<LoginPage />}>
  <ProtectedDashboard />
</AuthGate>`,
  },

  AutonomyDial: {
    category: 'Controls',
    description: 'Operator control for autonomy levels from Suggest to Full Auto. Renders a circular dial with policy-cap enforcement.',
    status: 'stable',
    source: 'lib/shared-ui/src/AutonomyDial.tsx',
    props: [
      { name: 'value', type: 'AutonomyMode', required: true, description: 'Current autonomy mode', control: 'select', options: ['suggest', 'approve_each', 'approve_batch', 'auto_with_rollback', 'full_auto'], defaultValue: 'approve_each' },
      { name: 'onChange', type: '(mode: AutonomyMode) => void', required: false, description: 'Callback when dial value changes' },
      { name: 'policyCap', type: 'AutonomyMode', required: false, description: 'Maximum autonomy mode allowed by policy', control: 'select', options: ['suggest', 'approve_each', 'approve_batch', 'auto_with_rollback', 'full_auto'], defaultValue: 'auto_with_rollback' },
      { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false', description: 'Disables user interaction', control: 'boolean' },
      { name: 'compact', type: 'boolean', required: false, defaultValue: 'false', description: 'Renders a smaller variant', control: 'boolean' },
    ],
    usageExample: `import { AutonomyDial, type AutonomyMode } from '@szl-holdings/shared-ui';

const [mode, setMode] = useState<AutonomyMode>('approve_each');

<AutonomyDial
  value={mode}
  onChange={setMode}
  policyCap="auto_with_rollback"
/>`,
    livePreview: (vals) => {
      const modes = ['suggest', 'approve_each', 'approve_batch', 'auto_with_rollback', 'full_auto'] as const;
      type AM = typeof modes[number];
      const value = (modes.includes(vals.value as AM) ? vals.value : 'approve_each') as AM;
      const policyCap = (modes.includes(vals.policyCap as AM) ? vals.policyCap : 'auto_with_rollback') as AM;
      return (
        <div className="p-6 flex justify-center">
          <AutonomyDial
            value={value}
            policyCap={policyCap}
            disabled={vals.disabled === 'true'}
            compact={vals.compact === 'true'}
          />
        </div>
      );
    },
  },

  AdminAuditTrail: {
    category: 'Observability',
    description: 'Timeline-based audit log for system and human actions with filtering support.',
    status: 'stable',
    source: 'lib/shared-ui/src/admin-audit-trail.tsx',
    props: [
      { name: 'entries', type: 'AuditTrailEntry[]', required: true, description: 'Array of audit log entries' },
      { name: 'title', type: 'string', required: false, defaultValue: '"Audit Trail"', description: 'Panel heading', control: 'text' },
      { name: 'accentColor', type: 'string', required: false, description: 'Hex color for timeline accent', control: 'text' },
      { name: 'showFilters', type: 'boolean', required: false, defaultValue: 'true', description: 'Show filter bar', control: 'boolean' },
      { name: 'maxVisible', type: 'number', required: false, description: 'Cap visible entries before "show more"', control: 'number' },
    ],
    usageExample: `import { AdminAuditTrail } from '@szl-holdings/shared-ui';

<AdminAuditTrail
  entries={auditEntries}
  title="Agent Run Audit"
  accentColor="var(--gi-accent-blue)"
  showFilters
/>`,
  },

  AnimatedCounter: {
    category: 'Data Display',
    description: 'Animated numeric display that transitions smoothly from one value to another using an eased animation.',
    status: 'stable',
    source: 'lib/shared-ui/src/animated-counter.tsx',
    props: [
      { name: 'value', type: 'number', required: true, description: 'Target numeric value to animate to', control: 'number', defaultValue: '1234' },
      { name: 'duration', type: 'number', required: false, defaultValue: '1200', description: 'Animation duration in milliseconds', control: 'number' },
      { name: 'decimals', type: 'number', required: false, defaultValue: '0', description: 'Decimal places to display', control: 'number' },
      { name: 'prefix', type: 'string', required: false, description: 'String prepended to the value', control: 'text' },
      { name: 'suffix', type: 'string', required: false, description: 'String appended to the value', control: 'text' },
      { name: 'className', type: 'string', required: false, description: 'Additional Tailwind classes', control: 'text' },
    ],
    usageExample: `import { AnimatedCounter } from '@szl-holdings/shared-ui';

<AnimatedCounter
  value={1234}
  duration={1200}
  prefix="$"
  suffix="K"
/>`,
    livePreview: (vals) => (
      <div className="flex items-center justify-center py-8">
        <AnimatedCounter
          value={Number(vals.value) || 1234}
          duration={Number(vals.duration) || 1200}
          decimals={Number(vals.decimals) || 0}
          prefix={vals.prefix || ''}
          suffix={vals.suffix || ''}
          className="text-4xl font-mono font-bold text-nexus-cyan"
        />
      </div>
    ),
  },

  AlertCard: {
    category: 'Feedback',
    description: 'Structured alert block with severity-based color coding (info, success, warning, error, critical).',
    status: 'stable',
    source: 'lib/shared-ui/src/design-system/AlertCard.tsx',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Short alert heading', control: 'text', defaultValue: 'Guardian Policy Triggered' },
      { name: 'description', type: 'string', required: false, description: 'Alert body text', control: 'text', defaultValue: 'Autonomy cap reduced to 40% due to threshold breach.' },
      { name: 'severity', type: '"info" | "success" | "warning" | "error" | "critical"', required: false, defaultValue: 'warning', description: 'Determines color scheme and icon', control: 'select', options: ['info', 'success', 'warning', 'error', 'critical'] },
      { name: 'compact', type: 'boolean', required: false, defaultValue: 'false', description: 'Renders a smaller variant', control: 'boolean' },
    ],
    usageExample: `import { AlertCard } from '@szl-holdings/shared-ui';

<AlertCard
  title="Guardian Policy Triggered"
  description="Autonomy cap reduced to 40% due to threshold breach."
  severity="warning"
/>`,
    livePreview: (vals) => (
      <div className="p-4">
        <AlertCard
          title={vals.title || 'Guardian Policy Triggered'}
          description={vals.description || 'Autonomy cap reduced to 40% due to threshold breach.'}
          severity={(vals.severity as 'info' | 'success' | 'warning' | 'error' | 'critical') || 'warning'}
          compact={vals.compact === 'true'}
        />
      </div>
    ),
  },

  LoadingSkeleton: {
    category: 'Feedback',
    description: 'Animated placeholder skeleton for cards, lists, and text blocks during data loading.',
    status: 'stable',
    source: 'lib/shared-ui/src/design-system/LoadingSkeleton.tsx',
    props: [
      { name: 'variant', type: '"card" | "line" | "block" | "table" | "avatar" | "page"', required: false, description: 'Shape of skeleton to render', control: 'select', options: ['card', 'line', 'block', 'table', 'avatar', 'page'], defaultValue: 'card' },
      { name: 'lines', type: 'number', required: false, defaultValue: '3', description: 'Number of line skeletons (used with line variant)', control: 'number' },
      { name: 'rows', type: 'number', required: false, description: 'Number of rows (used with table variant)', control: 'number' },
      { name: 'className', type: 'string', required: false, description: 'Additional Tailwind classes', control: 'text' },
    ],
    usageExample: `import { LoadingSkeleton } from '@szl-holdings/shared-ui';

<LoadingSkeleton variant="card" />
<LoadingSkeleton variant="line" lines={4} />`,
    livePreview: (vals) => (
      <div className="p-4">
        <LoadingSkeleton
          variant={(vals.variant as 'card' | 'line' | 'block' | 'table' | 'avatar' | 'page') || 'card'}
          {...(vals.lines ? { lines: Number(vals.lines) } : {})}
        />
      </div>
    ),
  },

  AlloyDecisionCard: {
    category: 'AI Controls',
    description: 'Review card for AI-generated decisions with approve / deny / override actions.',
    status: 'stable',
    source: 'lib/shared-ui/src/alloy-decision-card.tsx',
    props: [
      { name: 'decision', type: 'AlloyDecision', required: true, description: 'Decision payload (id, summary, confidence, evidence)' },
      { name: 'onApprove', type: '(id: string) => void', required: false, description: 'Called when operator approves the decision' },
      { name: 'onDeny', type: '(id: string) => void', required: false, description: 'Called when operator denies the decision' },
      { name: 'onOverride', type: '(id: string, reason: string) => void', required: false, description: 'Called when operator overrides with a reason' },
    ],
    usageExample: `import { AlloyDecisionCard } from '@szl-holdings/shared-ui';

<AlloyDecisionCard
  decision={pendingDecision}
  onApprove={(id) => approveDecision(id)}
  onDeny={(id) => denyDecision(id)}
/>`,
  },

  ConstellationGraph: {
    category: 'Visualization',
    description: 'Force-directed graph for rendering entity relationships across domains.',
    status: 'beta',
    source: 'lib/shared-ui/src/constellation-graph.tsx',
    props: [
      { name: 'nodes', type: 'GraphNode[]', required: true, description: 'Array of graph nodes with id, label, type' },
      { name: 'edges', type: 'GraphEdge[]', required: true, description: 'Array of directed edges with source, target, weight' },
      { name: 'onNodeClick', type: '(node: GraphNode) => void', required: false, description: 'Callback when a node is clicked' },
      { name: 'layout', type: '"force" | "radial" | "tree"', required: false, defaultValue: '"force"', description: 'Graph layout algorithm', control: 'select', options: ['force', 'radial', 'tree'] },
    ],
    usageExample: `import { ConstellationGraph } from '@szl-holdings/shared-ui';

<ConstellationGraph
  nodes={entityNodes}
  edges={entityEdges}
  layout="force"
  onNodeClick={(n) => navigateTo(n.id)}
/>`,
  },

  SimulationCockpit: {
    category: 'AI Controls',
    description: 'What-if scenario runner with diff comparison between runs.',
    status: 'beta',
    source: 'lib/shared-ui/src/simulation-cockpit.tsx',
    props: [
      { name: 'scenarios', type: 'Scenario[]', required: true, description: 'Array of scenario definitions' },
      { name: 'onRun', type: '(scenarioId: string) => void', required: false, description: 'Callback to trigger a scenario run' },
      { name: 'activeScenarioId', type: 'string', required: false, description: 'Currently selected scenario', control: 'text' },
    ],
    usageExample: `import { SimulationCockpit } from '@szl-holdings/shared-ui';

<SimulationCockpit
  scenarios={whatIfScenarios}
  activeScenarioId={selected}
  onRun={(id) => runScenario(id)}
/>`,
  },

  DataTable: {
    category: 'Data Display',
    description: 'Full-featured data table with sortable columns, client-side filtering, and optional pagination.',
    status: 'stable',
    source: 'lib/shared-ui/src/design-system/',
    props: [
      { name: 'columns', type: 'ColumnDef[]', required: true, description: 'Column definitions with accessor, header, and optional cell renderer' },
      { name: 'data', type: 'unknown[]', required: true, description: 'Row data array' },
      { name: 'sortable', type: 'boolean', required: false, defaultValue: 'true', description: 'Enable column sorting', control: 'boolean' },
      { name: 'filterable', type: 'boolean', required: false, defaultValue: 'false', description: 'Show global search filter', control: 'boolean' },
      { name: 'pagination', type: 'boolean', required: false, defaultValue: 'false', description: 'Enable pagination', control: 'boolean' },
    ],
    usageExample: `import { DataTable } from '@szl-holdings/shared-ui';

<DataTable
  columns={[{ accessor: 'name', header: 'Name' }]}
  data={rows}
  sortable
  filterable
/>`,
  },

  DashboardShell: {
    category: 'Layout',
    description: 'Top-level layout wrapper providing sidebar, header slot, and scrollable main content area.',
    status: 'stable',
    source: 'lib/shared-ui/src/design-system/',
    props: [
      { name: 'sidebar', type: 'React.ReactNode', required: true, description: 'Left navigation sidebar content' },
      { name: 'header', type: 'React.ReactNode', required: true, description: 'Top header bar content' },
      { name: 'children', type: 'React.ReactNode', required: true, description: 'Main page content' },
      { name: 'theme', type: '"dark" | "light"', required: false, defaultValue: '"dark"', description: 'Color theme', control: 'select', options: ['dark', 'light'] },
    ],
    usageExample: `import { DashboardShell } from '@szl-holdings/shared-ui';

<DashboardShell
  sidebar={<SidebarNav items={navItems} />}
  header={<AppHeader />}
  theme="dark"
>
  <PageContent />
</DashboardShell>`,
  },

  PrivateAppGuard: {
    category: 'Auth',
    description: 'Permission-based gate for internal apps. Renders children only when the current user has all required permissions.',
    status: 'stable',
    source: 'lib/shared-ui/src/PrivateAppGuard.tsx',
    props: [
      { name: 'appId', type: 'string', required: true, description: 'Identifier of the protected app', control: 'text', defaultValue: 'nexus' },
      { name: 'permissions', type: 'string[]', required: true, description: 'Required permission strings (AND logic)' },
      { name: 'children', type: 'React.ReactNode', required: true, description: 'Protected content' },
    ],
    usageExample: `import { PrivateAppGuard } from '@szl-holdings/shared-ui';

<PrivateAppGuard
  appId="nexus"
  permissions={['nexus:read', 'nexus:evals:run']}
>
  <EvalConsole />
</PrivateAppGuard>`,
  },

  AgentInsightsWidget: {
    category: 'Observability',
    description: 'Displays AI agent execution history and knowledge retrieval stats.',
    status: 'stable',
    source: 'lib/shared-ui/src/agent-insights-widget.tsx',
    props: [
      { name: 'runs', type: 'AgentRun[]', required: true, description: 'Agent execution runs to display' },
      { name: 'knowledge', type: 'AgentKnowledgeEntry[]', required: true, description: 'Knowledge retrieval entries' },
      { name: 'onAction', type: '(action: string) => void', required: false, description: 'Callback for quick actions' },
    ],
    usageExample: `import { AgentInsightsWidget } from '@szl-holdings/shared-ui';

<AgentInsightsWidget
  runs={agentRuns}
  knowledge={knowledgeEntries}
  onAction={(a) => console.log(a)}
/>`,
  },

  DoctrineLayerBadge: {
    category: 'Identity',
    description: 'Badge indicating which doctrine layer (Cognitive, Sentient, Governed, Tactical) a component belongs to.',
    status: 'stable',
    source: 'lib/shared-ui/src/doctrine-layer-badge.tsx',
    props: [
      { name: 'appId', type: 'string', required: true, description: 'App identifier resolved to a doctrine layer', control: 'text', defaultValue: 'nexus' },
      { name: 'variant', type: '"compact" | "full" | "inline"', required: false, defaultValue: '"compact"', description: 'Visual variant', control: 'select', options: ['compact', 'full', 'inline'] },
      { name: 'showTooltip', type: 'boolean', required: false, defaultValue: 'false', description: 'Show tooltip with description', control: 'boolean' },
    ],
    usageExample: `import { DoctrineLayerBadge } from '@szl-holdings/shared-ui';

<DoctrineLayerBadge appId="nexus" variant="compact" />`,
    livePreview: (vals) => (
      <div className="p-6 flex justify-center">
        <DoctrineLayerBadge
          appId={vals.appId || 'nexus'}
          variant={(vals.variant as 'compact' | 'full' | 'inline') || 'compact'}
          showTooltip={vals.showTooltip === 'true'}
        />
      </div>
    ),
  },

  DataStateBadge: {
    category: 'Identity',
    description: 'Compact badge that surfaces the data provenance state (live, demo, simulated, stub, seeded, pilot).',
    status: 'stable',
    source: 'lib/shared-ui/src/data-state-badge.tsx',
    props: [
      { name: 'state', type: '"live" | "demo" | "simulated" | "stub" | "seeded" | "pilot"', required: true, description: 'Provenance state to display', control: 'select', options: ['live', 'demo', 'simulated', 'stub', 'seeded', 'pilot'], defaultValue: 'live' },
      { name: 'label', type: 'string', required: false, description: 'Override the default label text', control: 'text' },
      { name: 'size', type: '"xs" | "sm"', required: false, defaultValue: 'xs', description: 'Badge size variant', control: 'select', options: ['xs', 'sm'] },
      { name: 'pulse', type: 'boolean', required: false, defaultValue: 'false', description: 'Animate the status dot', control: 'boolean' },
    ],
    usageExample: `import { DataStateBadge } from '@szl-holdings/shared-ui';

<DataStateBadge state="live" pulse />`,
    livePreview: (vals) => (
      <div className="p-6 flex justify-center">
        <DataStateBadge
          state={(vals.state as 'live' | 'demo' | 'simulated' | 'stub' | 'seeded' | 'pilot') || 'live'}
          {...(vals.label ? { label: vals.label } : {})}
          size={(vals.size as 'xs' | 'sm') || 'xs'}
          pulse={vals.pulse === 'true'}
        />
      </div>
    ),
  },

  DigitalTwinCard: {
    category: 'Monitoring',
    description: 'Monitoring card showing predicted state, live metrics, and active alerts for a digital twin entity.',
    status: 'experimental',
    source: 'lib/shared-ui/src/digital-twin-card.tsx',
    props: [
      { name: 'id', type: 'string', required: true, description: 'Entity identifier', control: 'text' },
      { name: 'predictedState', type: 'Record<string, unknown>', required: true, description: 'Predicted state snapshot from simulation' },
      { name: 'alerts', type: 'Alert[]', required: true, description: 'Active alert list' },
      { name: 'metrics', type: 'MetricSnapshot[]', required: true, description: 'Live metric readings' },
    ],
    usageExample: `import { DigitalTwinCard } from '@szl-holdings/shared-ui';

<DigitalTwinCard
  id="vessel-imo-9876543"
  predictedState={snapshot}
  alerts={activeAlerts}
  metrics={liveMetrics}
/>`,
  },
};

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'Auth', label: 'Auth', icon: Shield },
  { id: 'Controls', label: 'Controls', icon: ToggleLeft },
  { id: 'AI Controls', label: 'AI Controls', icon: Brain },
  { id: 'APEX AI', label: 'APEX AI', icon: Brain },
  { id: 'Analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'Data Display', label: 'Data Display', icon: Table },
  { id: 'Design System', label: 'Design System', icon: Palette },
  { id: 'Forms & Drawers', label: 'Forms & Drawers', icon: BookOpen },
  { id: 'Layout', label: 'Layout', icon: LayoutDashboard },
  { id: 'Surfaces', label: 'Surfaces', icon: Layers },
  { id: 'Feedback', label: 'Feedback', icon: Bell },
  { id: 'Observability', label: 'Observability', icon: Activity },
  { id: 'Visualization', label: 'Visualization', icon: Network },
  { id: 'Monitoring', label: 'Monitoring', icon: Eye },
  { id: 'Identity', label: 'Identity', icon: Layers },
  { id: 'Pulse', label: 'Pulse', icon: Zap },
  { id: 'Document Engine', label: 'Document Engine', icon: BookOpen },
  { id: 'Onboarding', label: 'Onboarding', icon: Workflow },
  { id: 'Receipt Graph', label: 'Receipt Graph', icon: Database },
  { id: 'Operational Primitives', label: 'Operational', icon: Workflow },
  { id: 'Providers', label: 'Providers', icon: Cpu },
  { id: 'Utility', label: 'Utility', icon: Cpu },
  { id: 'Ambient', label: 'Ambient', icon: Zap },
  { id: 'Collaboration', label: 'Collaboration', icon: Network },
  { id: 'Other', label: 'Other', icon: Cpu },
];

const STATUS_CFG = {
  stable: { label: 'Stable', color: 'text-nexus-green border-nexus-green/30 bg-nexus-green/10' },
  beta: { label: 'Beta', color: 'text-nexus-amber border-nexus-amber/30 bg-nexus-amber/10' },
  experimental: { label: 'Experimental', color: 'text-nexus-red border-red-500/30 bg-red-500/10' },
};

interface CatalogEntry {
  name: string;
  meta: ComponentMetadata;
}

function buildCatalog(): CatalogEntry[] {
  const componentNames = sharedUiExports
    .filter((e) => e.isComponent)
    .map((e) => e.name);

  return componentNames.map((name) => {
    if (REGISTRY[name]) return { name, meta: REGISTRY[name] as ComponentMetadata };
    const gen = GENERATED_METADATA[name];
    if (gen) {
      const requiredProps = gen.props.filter((p) => p.required && p.name !== 'children');
      const sampleAttrs = requiredProps
        .slice(0, 3)
        .map((p) => `  ${p.name}={${defaultValueForType(p.type)}}`)
        .join('\n');
      const usage =
        sampleAttrs.length > 0
          ? `import { ${name} } from '@szl-holdings/shared-ui';\n\n<${name}\n${sampleAttrs}\n/>`
          : `import { ${name} } from '@szl-holdings/shared-ui';\n\n<${name} />`;
      return {
        name,
        meta: {
          category: gen.category,
          description: descriptionFor(name, gen.category),
          status: gen.status,
          source: gen.source,
          props: gen.props.map((p) => ({
            name: p.name,
            type: p.type,
            required: p.required,
            description: p.description || `${p.required ? 'Required' : 'Optional'} ${p.name} prop.`,
          })),
          usageExample: usage,
        } satisfies ComponentMetadata,
      };
    }
    return {
      name,
      meta: {
        category: 'Other',
        description: `Shared UI component from lib/shared-ui. See source for full props.`,
        status: 'stable' as const,
        source: `lib/shared-ui/src/index.ts`,
        props: [],
        usageExample: `import { ${name} } from '@szl-holdings/shared-ui';\n\n<${name} />`,
      },
    };
  });
}

function defaultValueForType(type: string): string {
  const t = type.trim();
  if (t.startsWith('"') || t.startsWith("'")) return t.split('|')[0]?.trim() ?? '"value"';
  if (/^(string)\b/.test(t)) return '"value"';
  if (/^(number)\b/.test(t)) return '0';
  if (/^(boolean)\b/.test(t)) return 'true';
  if (t.endsWith('[]') || t.startsWith('Array<')) return '[]';
  if (/=>/.test(t) || t.startsWith('(')) return '() => {}';
  if (t === 'ReactNode' || t === 'React.ReactNode') return 'null';
  if (t.startsWith('Record<')) return '{}';
  return '/* TODO */';
}

function descriptionFor(name: string, category: string): string {
  const map: Record<string, string> = {
    'Pulse': `${name} — Pulse module surface from lib/shared-ui/src/pulse. See source for full behavior.`,
    'Document Engine': `${name} — Document engine surface (templates, signing, batch PDF) from lib/shared-ui/src/document-engine.`,
    'Onboarding': `${name} — Onboarding flow primitive from lib/shared-ui/src/onboarding.`,
    'Receipt Graph': `${name} — Provenance / receipt-graph component used to surface evidence and trust signals.`,
    'Operational Primitives': `${name} — Standardized operational primitive shared across Counsel, Lyte, Terra, Aegis, and Vessels.`,
    'APEX AI': `${name} — APEX AI conversational/agent surface.`,
    'AI Controls': `${name} — Operator control for AI-driven decisions and simulations.`,
    'Visualization': `${name} — Data visualization component (graphs, distributions, diagrams).`,
    'Monitoring': `${name} — Monitoring widget showing live status, freshness, or health signals.`,
    'Observability': `${name} — Observability surface for audit, runs, evals, and provenance.`,
    'Feedback': `${name} — Feedback / notification surface used to communicate state changes to operators.`,
    'Auth': `${name} — Authentication / permission gate.`,
    'Identity': `${name} — Compact identity badge or pill.`,
    'Providers': `${name} — Context provider wrapping the app tree.`,
    'Utility': `${name} — Utility surface (settings, language, contact, etc.).`,
    'Surfaces': `${name} — Card / panel / drawer surface.`,
    'Layout': `${name} — Layout primitive (shell, nav, header, footer).`,
    'Ambient': `${name} — Ambient / energy field component used for atmospheric UI.`,
    'Collaboration': `${name} — Collaboration surface (presence, multiplayer, CRDT merge).`,
    'Analytics': `${name} — Analytics chart / dashboard surface.`,
    'Data Display': `${name} — Data display surface (tables, KPIs, metrics).`,
    'Design System': `${name} — Design-system primitive from lib/shared-ui/src/design-system.`,
    'Forms & Drawers': `${name} — Form, drawer, or export surface from the design system.`,
  };
  return map[category] ?? `Shared UI component from lib/shared-ui. See source for full props.`;
}

const CATALOG = buildCatalog();

class PreviewErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  override componentDidCatch(_err: Error, _info: ErrorInfo) {}
  override render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function PropControl({
  prop,
  value,
  onChange,
}: {
  prop: PropDef;
  value: string;
  onChange: (v: string) => void;
}) {
  if (prop.control === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="w-3 h-3 rounded border-nexus accent-nexus-cyan"
        />
        <span className="text-[11px] text-muted-foreground">{value === 'true' ? 'true' : 'false'}</span>
      </label>
    );
  }
  if (prop.control === 'select' && prop.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-nexus-bg border border-nexus rounded px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-nexus-cyan/40"
      >
        {prop.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (prop.control === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 bg-nexus-bg border border-nexus rounded px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-nexus-cyan/40"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 bg-nexus-bg border border-nexus rounded px-2 py-1 text-[11px] text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-nexus-cyan/40"
    />
  );
}

const PREVIEW_THEMES = {
  dark: {
    label: 'Dark',
    bg: '#060b12',
    surface: '#0d1520',
    border: '#1a2535',
    text: '#c8d8e8',
    muted: '#7c8ea4',
    cssVars: {
      '--background': '215 50% 4%',
      '--foreground': '210 40% 90%',
      '--card': '215 45% 8%',
      '--card-foreground': '210 40% 90%',
      '--popover': '215 45% 8%',
      '--popover-foreground': '210 40% 90%',
      '--muted': '215 35% 12%',
      '--muted-foreground': '210 20% 55%',
      '--border': '215 30% 15%',
      '--input': '215 30% 15%',
      '--primary': '195 100% 50%',
      '--primary-foreground': '215 50% 4%',
      '--accent': '215 35% 14%',
      '--accent-foreground': '210 40% 90%',
    } as Record<string, string>,
  },
  light: {
    label: 'Light',
    bg: '#f5f7fa',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    muted: '#64748b',
    cssVars: {
      '--background': '210 40% 98%',
      '--foreground': '215 30% 15%',
      '--card': '0 0% 100%',
      '--card-foreground': '215 30% 15%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '215 30% 15%',
      '--muted': '210 30% 94%',
      '--muted-foreground': '215 20% 40%',
      '--border': '215 20% 88%',
      '--input': '215 20% 88%',
      '--primary': '195 90% 40%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '210 30% 94%',
      '--accent-foreground': '215 30% 15%',
    } as Record<string, string>,
  },
} as const;

type PreviewTheme = keyof typeof PREVIEW_THEMES;

function PreviewSandbox({
  theme,
  children,
}: {
  theme: PreviewTheme;
  children: ReactNode;
}) {
  const cfg = PREVIEW_THEMES[theme];
  const sandboxStyle: CSSProperties = {
    ...(cfg.cssVars as CSSProperties),
    backgroundColor: cfg.bg,
    color: cfg.text,
    colorScheme: theme,
  };
  return (
    <div
      data-preview-sandbox
      data-theme={theme}
      className={theme === 'dark' ? 'dark' : ''}
      style={sandboxStyle}
    >
      {children}
    </div>
  );
}

function ComponentDetail({ entry }: { entry: CatalogEntry }) {
  const { name, meta } = entry;
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('dark');
  const [propValues, setPropValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of meta.props) {
      if (p.control) {
        init[p.name] = p.defaultValue ?? (p.control === 'boolean' ? 'false' : p.options?.[0] ?? '');
      }
    }
    return init;
  });

  const statusCfg = STATUS_CFG[meta.status];

  function updateProp(name: string, value: string) {
    setPropValues((prev) => ({ ...prev, [name]: value }));
  }

  function buildLiveCode() {
    const controlled = meta.props.filter((p) => p.control && propValues[p.name] !== undefined);
    if (controlled.length === 0) return meta.usageExample;
    const propLines = controlled
      .filter((p) => {
        const v = propValues[p.name];
        if (p.control === 'boolean' && v === 'false' && !p.required) return false;
        return true;
      })
      .map((p) => {
        const v = propValues[p.name];
        if (p.control === 'boolean') return `  ${p.name}={${v}}`;
        if (p.control === 'number') return `  ${p.name}={${v}}`;
        return `  ${p.name}="${v}"`;
      });
    if (propLines.length === 0) return `<${name} />`;
    return `<${name}\n${propLines.join('\n')}\n/>`;
  }

  const hasLivePreview = !!meta.livePreview;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-nexus bg-nexus-surface shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-base font-semibold font-mono text-nexus-cyan">{name}</h2>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-nexus bg-nexus-bg text-muted-foreground/60 uppercase">
                {meta.category}
              </span>
              {hasLivePreview && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-nexus-green/30 bg-nexus-green/10 text-nexus-green uppercase tracking-wider">
                  Live Preview
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">{meta.description}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/40 font-mono">
          <Code2 className="w-3 h-3" />
          {meta.source}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {hasLivePreview && meta.livePreview && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-nexus-green inline-block" />
                  Live Preview
                </div>
                <div
                  role="group"
                  aria-label="Preview theme"
                  className="flex items-center gap-0.5 bg-nexus-bg border border-nexus rounded p-0.5"
                >
                  {(Object.keys(PREVIEW_THEMES) as PreviewTheme[]).map((t) => {
                    const Icon = t === 'dark' ? Moon : Sun;
                    const active = previewTheme === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPreviewTheme(t)}
                        aria-pressed={active}
                        title={`${PREVIEW_THEMES[t].label} preview`}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                          active
                            ? 'bg-nexus-cyan/15 text-nexus-cyan'
                            : 'text-muted-foreground/60 hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {PREVIEW_THEMES[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-nexus-green/20 overflow-hidden">
                <PreviewErrorBoundary
                  fallback={
                    <div className="flex items-center gap-2 p-4 text-muted-foreground/50 text-xs bg-nexus-bg">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      Live preview unavailable — component requires runtime context.
                    </div>
                  }
                >
                  <PreviewSandbox theme={previewTheme}>
                    {meta.livePreview(propValues)}
                  </PreviewSandbox>
                </PreviewErrorBoundary>
              </div>
              <div className="mt-1.5 text-[9px] font-mono text-muted-foreground/40 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-nexus-green/60 inline-block" />
                Sandboxed preview · design tokens scoped · {PREVIEW_THEMES[previewTheme].label.toLowerCase()} theme
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2.5">
              {hasLivePreview ? 'Generated Code' : 'Usage'}
            </div>
            <pre className="bg-nexus-bg border border-nexus rounded-lg p-4 text-[11px] font-mono text-nexus-cyan/90 overflow-x-auto whitespace-pre leading-relaxed">
              {buildLiveCode()}
            </pre>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2.5">
              Full Example
            </div>
            <pre className="bg-nexus-bg border border-nexus rounded-lg p-4 text-[11px] font-mono text-muted-foreground/70 overflow-x-auto whitespace-pre leading-relaxed">
              {meta.usageExample}
            </pre>
          </div>
        </div>

        <div className="w-72 border-l border-nexus bg-nexus-surface overflow-y-auto shrink-0">
          <div className="p-4 border-b border-nexus">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
              Props ({meta.props.length})
            </div>
          </div>
          {meta.props.length === 0 ? (
            <div className="p-4 text-[11px] text-muted-foreground/50">
              No documented props — see source for full interface.
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {meta.props.map((prop) => (
                <div key={prop.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-semibold text-nexus-cyan">{prop.name}</span>
                      {prop.required && <span className="text-[8px] text-nexus-red font-mono uppercase">*</span>}
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/50 bg-nexus-bg border border-nexus px-1 py-0.5 rounded">
                      {prop.type.length > 20 ? `${prop.type.slice(0, 20)}…` : prop.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{prop.description}</p>
                  {prop.control && (
                    <div className="pt-0.5">
                      <PropControl
                        prop={prop}
                        value={propValues[prop.name] ?? prop.defaultValue ?? ''}
                        onChange={(v) => updateProp(prop.name, v)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatternAtlas() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CatalogEntry>(() => CATALOG[0] as CatalogEntry);

  const filtered = CATALOG.filter((c) => {
    const matchCat = category === 'all' || c.meta.category === category;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.meta.description.toLowerCase().includes(search.toLowerCase()) ||
      c.meta.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = {
    stable: CATALOG.filter((c) => c.meta.status === 'stable').length,
    beta: CATALOG.filter((c) => c.meta.status === 'beta').length,
    experimental: CATALOG.filter((c) => c.meta.status === 'experimental').length,
  };

  const activeCats = new Set(CATALOG.map((c) => c.meta.category));

  return (
    <div className="flex h-full overflow-hidden bg-nexus-bg">
      <div className="w-56 border-r border-nexus bg-nexus-surface flex flex-col shrink-0 overflow-hidden">
        <div className="p-3 border-b border-nexus shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-nexus-cyan" />
            <div>
              <div className="text-xs font-semibold font-mono">Pattern Atlas</div>
              <div className="text-[9px] text-muted-foreground/50">
                {CATALOG.length} components · sourced from lib/shared-ui
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components…"
              className="w-full bg-nexus-bg border border-nexus rounded pl-6 pr-2 py-1.5 text-[11px] text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-nexus-cyan/40"
            />
          </div>
          <div className="flex gap-2 mt-2.5 text-[9px] font-mono">
            <span className="text-nexus-green">{counts.stable} stable</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-nexus-amber">{counts.beta} beta</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-nexus-red">{counts.experimental} exp</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 p-1.5 border-b border-nexus shrink-0">
          {CATEGORIES.filter((cat) => cat.id === 'all' || activeCats.has(cat.id)).map((cat) => {
            const Icon = cat.icon;
            const count = cat.id === 'all' ? CATALOG.length : CATALOG.filter((c) => c.meta.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  category === cat.id
                    ? 'bg-nexus-cyan/10 text-nexus-cyan border border-nexus-cyan/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-nexus-bg border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="text-[11px] flex-1">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground/40 font-mono">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.map((c) => {
            const isSelected = selected?.name === c.name;
            const statusCfg = STATUS_CFG[c.meta.status];
            return (
              <button
                key={c.name}
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
                  isSelected
                    ? 'bg-nexus-cyan/10 border border-nexus-cyan/20 text-nexus-cyan'
                    : 'text-muted-foreground/80 hover:text-foreground hover:bg-nexus-bg border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-medium truncate">{c.name}</div>
                  <div className="text-[9px] text-muted-foreground/50 truncate">{c.meta.category}</div>
                </div>
                {c.meta.livePreview && (
                  <span className="text-[8px] text-nexus-green font-mono shrink-0">▶</span>
                )}
                <span className={`text-[8px] font-mono ${statusCfg.color} px-1 py-0.5 rounded border shrink-0`}>
                  {c.meta.status === 'stable' ? '●' : c.meta.status === 'beta' ? '◐' : '○'}
                </span>
                {isSelected && <ChevronRight className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40 text-xs">No components match</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ComponentDetail key={selected.name} entry={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/30">
            <div className="text-center">
              <Palette className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a component to explore</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
