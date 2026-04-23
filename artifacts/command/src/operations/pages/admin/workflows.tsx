import {
  CheckCircle,
  Clock,
  GitBranch,
  Pause,
  Play,
  Plus,
  Workflow,
  Zap,
} from 'lucide-react';

const workflows = [
  {
    id: 'WF-001',
    name: 'Deploy Pipeline',
    trigger: 'Git Push',
    status: 'active' as const,
    lastRun: '5m ago',
    nextRun: 'On trigger',
    runs24h: 12,
    successRate: 98,
    steps: 6,
    category: 'Deployment',
  },
  {
    id: 'WF-002',
    name: 'Data Sync — All Apps',
    trigger: 'Schedule (1h)',
    status: 'active' as const,
    lastRun: '22m ago',
    nextRun: '38m',
    runs24h: 24,
    successRate: 100,
    steps: 4,
    category: 'Data',
  },
  {
    id: 'WF-003',
    name: 'Health Check Sweep',
    trigger: 'Schedule (5m)',
    status: 'active' as const,
    lastRun: '2m ago',
    nextRun: '3m',
    runs24h: 288,
    successRate: 99.6,
    steps: 3,
    category: 'Monitoring',
  },
  {
    id: 'WF-004',
    name: 'User Onboarding',
    trigger: 'API Webhook',
    status: 'active' as const,
    lastRun: '1h ago',
    nextRun: 'On trigger',
    runs24h: 3,
    successRate: 100,
    steps: 8,
    category: 'Users',
  },
  {
    id: 'WF-005',
    name: 'Log Rotation & Archive',
    trigger: 'Schedule (daily)',
    status: 'paused' as const,
    lastRun: '1d ago',
    nextRun: 'Paused',
    runs24h: 0,
    successRate: 95,
    steps: 5,
    category: 'Maintenance',
  },
  {
    id: 'WF-006',
    name: 'Compliance Report Gen',
    trigger: 'Schedule (weekly)',
    status: 'error' as const,
    lastRun: '2d ago',
    nextRun: 'Failed',
    runs24h: 0,
    successRate: 80,
    steps: 7,
    category: 'Compliance',
  },
];

const changeLog = [
  {
    id: 'CHG-041',
    type: 'config',
    description: 'Updated API rate limits for production',
    author: 'System',
    timestamp: '14:23',
    status: 'approved',
    impact: 'low',
  },
  {
    id: 'CHG-040',
    type: 'deploy',
    description: 'Deployed v2.4.1 to PARAGON',
    author: 'CI/CD',
    timestamp: '13:45',
    status: 'completed',
    impact: 'medium',
  },
  {
    id: 'CHG-039',
    type: 'schema',
    description: 'Database migration — added vessels metrics table',
    author: 'System',
    timestamp: '12:30',
    status: 'completed',
    impact: 'high',
  },
  {
    id: 'CHG-038',
    type: 'config',
    description: "Feature flag 'dark-mode-v2' enabled",
    author: 'Admin',
    timestamp: '11:15',
    status: 'approved',
    impact: 'low',
  },
  {
    id: 'CHG-037',
    type: 'security',
    description: 'SSL certificate rotated for all services',
    author: 'Automated',
    timestamp: '09:00',
    status: 'completed',
    impact: 'medium',
  },
];

const statusStyles = {
  active: 'bg-[#6b8f71]/10 text-[#6b8f71]',
  paused: 'bg-[#d4a054]/10 text-[#d4a054]',
  error: 'bg-[#c45a4a]/10 text-[#c45a4a]',
};
const impactColors = {
  low: 'bg-[#6b8f71]/10 text-[#6b8f71]',
  medium: 'bg-[#d4a054]/10 text-[#d4a054]',
  high: 'bg-[#c45a4a]/10 text-[#c45a4a]',
};

export default function WorkflowAutomation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            Workflow Automation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Automated workflows, change management, and system orchestration
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Workflows',
            value: workflows.filter((w) => w.status === 'active').length,
            icon: Play,
            color: 'text-[#6b8f71]',
          },
          {
            label: 'Runs (24h)',
            value: workflows.reduce((a, w) => a + w.runs24h, 0),
            icon: Zap,
            color: 'text-[#4a90b8]',
          },
          {
            label: 'Avg Success Rate',
            value: `${(workflows.reduce((a, w) => a + w.successRate, 0) / workflows.length).toFixed(1)}%`,
            icon: CheckCircle,
            color: 'text-violet-400',
          },
          {
            label: 'Changes Today',
            value: changeLog.length,
            icon: GitBranch,
            color: 'text-[#d4a054]',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <div className="text-xl font-bold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold text-sm">Workflow Registry</h2>
        </div>
        <div className="divide-y divide-border">
          {workflows.map((wf) => (
            <div key={wf.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{wf.id}</span>
                  <span className="text-sm font-semibold">{wf.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyles[wf.status]}`}
                  >
                    {wf.status}
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {wf.category}
                  </span>
                </div>
                <button className="p-1.5 rounded hover:bg-muted transition-colors">
                  {wf.status === 'active' ? (
                    <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">Trigger</span>
                  {wf.trigger}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">
                    Last Run
                  </span>
                  {wf.lastRun}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">
                    Next Run
                  </span>
                  {wf.nextRun}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">
                    Runs 24h
                  </span>
                  {wf.runs24h}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider mb-0.5">Success</span>
                  <span className={wf.successRate >= 95 ? 'text-[#6b8f71]' : 'text-[#d4a054]'}>
                    {wf.successRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#d4a054]" />
            Change Management Log
          </h2>
        </div>
        <div className="divide-y divide-border">
          {changeLog.map((ch) => (
            <div key={ch.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{ch.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase">
                    {ch.type}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${impactColors[ch.impact as keyof typeof impactColors]}`}
                  >
                    {ch.impact} impact
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {ch.timestamp} · {ch.status}
                </div>
              </div>
              <p className="text-sm">{ch.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">By {ch.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
