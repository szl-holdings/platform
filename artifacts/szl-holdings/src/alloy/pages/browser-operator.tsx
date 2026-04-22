import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  Code2,
  Download,
  Eye,
  FileText,
  Globe,
  Loader2,
  Lock,
  MousePointer,
  Navigation,
  Pause,
  Play,
  Plus,
  Settings,
  Shield,
  Square,
  Trash2,
  Type,
  Zap,
} from 'lucide-react';
import * as React from 'react';

type TaskStatus = 'idle' | 'dry-run' | 'running' | 'paused' | 'completed' | 'failed';

interface BrowserAction {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'extract' | 'screenshot' | 'submit';
  target?: string;
  value?: string;
  url?: string;
  timestamp: string;
  durationMs?: number;
  screenshotBefore?: string;
  screenshotAfter?: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  extractedData?: Record<string, unknown>;
}

interface BrowserTask {
  id: string;
  name: string;
  startUrl: string;
  objective: string;
  status: TaskStatus;
  actions: BrowserAction[];
  plannedActions?: PlannedAction[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
  durationMs?: number;
  tenantId?: string;
}

interface PlannedAction {
  step: number;
  type: string;
  description: string;
  target?: string;
  value?: string;
  requiresApproval: boolean;
}

interface AllowlistEntry {
  id: string;
  pattern: string;
  scope: 'read' | 'form' | 'download';
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  navigate: Navigation,
  click: MousePointer,
  type: Type,
  extract: FileText,
  screenshot: Camera,
  submit: Zap,
};

const DEMO_ALLOWLIST: AllowlistEntry[] = [];

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full h-24 rounded-lg flex flex-col items-center justify-center text-slate-600 border border-white/6"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <Camera className="w-4 h-4 mb-1" />
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

export default function BrowserOperator() {
  const [tasks, setTasks] = React.useState<BrowserTask[]>([]);
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newUrl, setNewUrl] = React.useState('');
  const [newObjective, setNewObjective] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [isDryRun, setIsDryRun] = React.useState(false);
  const [showAllowlist, setShowAllowlist] = React.useState(false);
  const [allowlist, setAllowlist] = React.useState<AllowlistEntry[]>(DEMO_ALLOWLIST);
  const [newAllowPattern, setNewAllowPattern] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);
  const [simulationStep, setSimulationStep] = React.useState(0);
  const [_isSimulating, setIsSimulating] = React.useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const launchTask = async (dryRun: boolean) => {
    if (!newUrl.trim() || !newObjective.trim()) return;
    const id = `task-${Date.now()}`;

    const plannedActions: PlannedAction[] = [
      {
        step: 1,
        type: 'navigate',
        description: `Navigate to ${newUrl}`,
        target: newUrl,
        requiresApproval: false,
      },
      {
        step: 2,
        type: 'screenshot',
        description: 'Capture initial page state',
        requiresApproval: false,
      },
      {
        step: 3,
        type: 'extract',
        description: 'Extract page structure and relevant data',
        target: 'body',
        requiresApproval: false,
      },
      {
        step: 4,
        type: 'navigate',
        description: 'Follow relevant internal links',
        requiresApproval: false,
      },
      {
        step: 5,
        type: 'extract',
        description: 'Extract target data based on objective',
        requiresApproval: false,
      },
      {
        step: 6,
        type: 'screenshot',
        description: 'Capture final page state',
        requiresApproval: false,
      },
    ];

    const newTask: BrowserTask = {
      id,
      name: newName || newObjective.slice(0, 40),
      startUrl: newUrl,
      objective: newObjective,
      status: dryRun ? 'dry-run' : 'running',
      actions: [],
      plannedActions,
      startedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setActiveTaskId(id);
    setIsCreating(false);
    setNewUrl('');
    setNewObjective('');
    setNewName('');
    setIsDryRun(false);

    if (!dryRun) {
      setIsSimulating(true);
      for (let i = 0; i < plannedActions.length; i++) {
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
        setSimulationStep(i + 1);
        const action: BrowserAction = {
          id: `a-${id}-${i}`,
          type: plannedActions[i]?.type as BrowserAction['type'],
          target: plannedActions[i]?.target,
          url: plannedActions[i]?.type === 'navigate' ? plannedActions[i]?.target : undefined,
          timestamp: new Date().toISOString(),
          durationMs: Math.round(500 + Math.random() * 1000),
          status: 'done',
          screenshotAfter: plannedActions[i]?.type === 'screenshot' ? `capture-${i}` : undefined,
        };
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, actions: [...t.actions, action] } : t)),
        );
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t,
        ),
      );
      setIsSimulating(false);
      setSimulationStep(0);
    }
  };

  const pauseTask = () => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId && t.status === 'running' ? { ...t, status: 'paused' } : t,
      ),
    );
  };

  const resumeTask = () => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId && t.status === 'paused' ? { ...t, status: 'running' } : t,
      ),
    );
  };

  const cancelTask = () => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId && ['running', 'paused'].includes(t.status)
          ? { ...t, status: 'failed', error: 'Cancelled by user' }
          : t,
      ),
    );
    setIsSimulating(false);
  };

  const statusColors: Record<TaskStatus, string> = {
    idle: 'text-slate-400',
    'dry-run': 'text-purple-400',
    running: 'text-blue-400',
    paused: 'text-amber-400',
    completed: 'text-emerald-400',
    failed: 'text-rose-400',
  };

  const statusBg: Record<TaskStatus, string> = {
    idle: 'border-slate-500/20',
    'dry-run': 'border-purple-500/20',
    running: 'border-blue-500/20',
    paused: 'border-amber-500/20',
    completed: 'border-emerald-500/20',
    failed: 'border-rose-500/20',
  };

  return (
    <div className="flex h-full">
      <aside
        className="w-60 shrink-0 border-r flex flex-col"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,10,16,0.6)' }}
      >
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Browser Operator
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${activeTaskId === task.id ? 'text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={{ background: activeTaskId === task.id ? 'rgba(75,139,219,0.08)' : undefined }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Globe className="w-3 h-3 shrink-0" />
                <span className="font-medium truncate">{task.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] capitalize ${statusColors[task.status]}`}>
                  {task.status.replace('-', ' ')}
                </span>
                <span className="text-[10px] text-slate-600">{task.actions.length} actions</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowAllowlist(!showAllowlist)}
            className="w-full text-[10px] px-2 py-1.5 rounded border border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3 h-3" />
            <span>URL Allowlist ({allowlist.length})</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showAllowlist ? (
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> URL Allowlist
                </h2>
                <button
                  onClick={() => setShowAllowlist(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-3 mb-4 border border-amber-500/15 bg-amber-500/5 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80">
                  Browser tasks can only access URLs matching allowlist patterns. Credentials are
                  never stored in the browser context.
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  value={newAllowPattern}
                  onChange={(e) => setNewAllowPattern(e.target.value)}
                  placeholder="*.example.com or https://api.service.com/*"
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
                />
                <button
                  onClick={() => {
                    if (newAllowPattern.trim()) {
                      setAllowlist((prev) => [
                        ...prev,
                        {
                          id: `al-${Date.now()}`,
                          pattern: newAllowPattern.trim(),
                          scope: 'read',
                          createdAt: new Date().toISOString(),
                        },
                      ]);
                      setNewAllowPattern('');
                    }
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {allowlist.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border border-white/8 bg-[#0d1117] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <code className="text-xs text-white font-mono">{entry.pattern}</code>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Scope: {entry.scope} · Added{' '}
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAllowlist((prev) => prev.filter((e) => e.id !== entry.id))}
                      className="text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 border border-white/6 bg-white/2 rounded-lg space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Max task duration: 5 minutes
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> No access to internal
                  infrastructure
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Credentials never stored in
                  browser context
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> All actions logged with
                  timestamp and screenshot
                </div>
              </div>
            </div>
          </div>
        ) : isCreating ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" /> New Browser Task
              </h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Task Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Competitor pricing scrape"
                    className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Start URL</label>
                  <input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Objective</label>
                  <textarea
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Describe what data to extract or what actions to perform..."
                    className="w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 resize-none h-20"
                  />
                </div>
              </div>

              <div className="p-3 mb-4 border border-white/8 bg-white/2 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400 font-medium">Execution Options</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="accent-blue-400"
                  />
                  <span className="text-xs text-slate-400">
                    Dry-run mode — preview planned actions without executing
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => launchTask(isDryRun)}
                  disabled={!newUrl.trim() || !newObjective.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 transition-colors text-sm"
                >
                  {isDryRun ? (
                    <>
                      <Eye className="w-4 h-4" /> Dry Run
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Launch Task
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : activeTask ? (
          <>
            <div
              className="shrink-0 border-b px-5 py-2 flex items-center justify-between gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border capitalize shrink-0 ${statusBg[activeTask.status]} ${statusColors[activeTask.status]}`}
                >
                  {activeTask.status === 'running' && (
                    <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" />
                  )}
                  {activeTask.status.replace('-', ' ')}
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">{activeTask.name}</h2>
                  <p className="text-[10px] text-slate-600 truncate">{activeTask.startUrl}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeTask.status === 'running' && (
                  <>
                    <button
                      onClick={pauseTask}
                      className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                    <button
                      onClick={cancelTask}
                      className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Square className="w-3 h-3" /> Cancel
                    </button>
                  </>
                )}
                {activeTask.status === 'paused' && (
                  <button
                    onClick={resumeTask}
                    className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    <Play className="w-3 h-3" /> Resume
                  </button>
                )}
                {activeTask.status === 'completed' && (
                  <button className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                    <Download className="w-3 h-3" /> Export Data
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border border-white/8 bg-[#0d1117] rounded-xl">
                    <div className="text-[10px] text-slate-600 mb-0.5">Actions</div>
                    <div className="text-lg font-bold text-white">{activeTask.actions.length}</div>
                    <div className="text-[10px] text-slate-500">executed</div>
                  </div>
                  <div className="p-3 border border-white/8 bg-[#0d1117] rounded-xl">
                    <div className="text-[10px] text-slate-600 mb-0.5">Duration</div>
                    <div className="text-lg font-bold text-white">
                      {activeTask.durationMs
                        ? `${Math.round(activeTask.durationMs / 1000)}s`
                        : activeTask.startedAt
                          ? `${Math.round((Date.now() - new Date(activeTask.startedAt).getTime()) / 1000)}s`
                          : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">elapsed</div>
                  </div>
                  <div className="p-3 border border-white/8 bg-[#0d1117] rounded-xl">
                    <div className="text-[10px] text-slate-600 mb-0.5">Screenshots</div>
                    <div className="text-lg font-bold text-white">
                      {activeTask.actions.filter((a) => a.screenshotAfter).length}
                    </div>
                    <div className="text-[10px] text-slate-500">captured</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">
                    {activeTask.status === 'dry-run'
                      ? 'Planned Action Sequence (Dry Run)'
                      : 'Action Replay Timeline'}
                  </div>

                  {activeTask.status === 'dry-run' && activeTask.plannedActions && (
                    <div className="space-y-2">
                      <div className="p-3 mb-3 border border-purple-500/15 bg-purple-500/5 rounded-lg text-xs text-purple-300/80 flex items-start gap-2">
                        <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          Dry-run mode: showing planned actions without execution. Review and
                          approve to run.
                        </span>
                      </div>
                      {activeTask.plannedActions.map((action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 border border-white/8 bg-[#0d1117] rounded-lg"
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
                          >
                            {action.step}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white capitalize">
                                {action.type}
                              </span>
                              {action.requiresApproval && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 text-amber-400">
                                  Needs Approval
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => launchTask(false)}
                        className="w-full py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Execute Task
                      </button>
                    </div>
                  )}

                  {activeTask.status !== 'dry-run' && (
                    <div className="space-y-2">
                      {activeTask.actions.length === 0 && activeTask.status === 'running' && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Launching browser sandbox…</span>
                        </div>
                      )}
                      {activeTask.actions.map((action, i) => {
                        const ActionIcon = ACTION_ICONS[action.type] || Globe;
                        const isSelected = selectedAction === action.id;
                        return (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <div
                              className={`border rounded-xl overflow-hidden transition-all cursor-pointer ${isSelected ? 'border-blue-400/20' : 'border-white/8 bg-[#0d1117] hover:border-white/12'}`}
                              onClick={() => setSelectedAction(isSelected ? null : action.id)}
                            >
                              <div className="flex items-center gap-3 px-4 py-2.5">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: 'rgba(75,139,219,0.12)', color: '#4B8BDB' }}
                                >
                                  <ActionIcon className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-white capitalize">
                                      {action.type}
                                    </span>
                                    {action.url && (
                                      <span className="text-[10px] text-slate-500 truncate max-w-xs">
                                        {action.url}
                                      </span>
                                    )}
                                    {action.target && !action.url && (
                                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                                        {action.target}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {action.screenshotAfter && (
                                    <Camera className="w-3 h-3 text-slate-600" />
                                  )}
                                  {action.extractedData && (
                                    <Code2 className="w-3 h-3 text-emerald-500/50" />
                                  )}
                                  <span className="text-[10px] text-slate-600">
                                    {action.durationMs}ms
                                  </span>
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                </div>
                              </div>

                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-3 pt-1 border-t"
                                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                                  >
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-[10px] text-slate-600 mb-1.5">
                                          Screenshot
                                        </p>
                                        <ScreenshotPlaceholder label={`Action ${i + 1} capture`} />
                                      </div>
                                      {action.extractedData && (
                                        <div>
                                          <p className="text-[10px] text-slate-600 mb-1.5">
                                            Extracted Data
                                          </p>
                                          <div className="p-2 rounded-lg border border-white/8 bg-white/2 font-mono text-[10px] text-emerald-400 max-h-24 overflow-y-auto">
                                            {JSON.stringify(action.extractedData, null, 2)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                                      <span>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {new Date(action.timestamp).toLocaleTimeString()}
                                      </span>
                                      <span>Duration: {action.durationMs}ms</span>
                                      <span className="capitalize">
                                        Status:{' '}
                                        <span className="text-emerald-400">{action.status}</span>
                                      </span>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}

                      {activeTask.status === 'running' && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          <span>Executing action {simulationStep}…</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {activeTask.objective && (
                  <div className="p-3 border border-white/8 bg-[#0d1117] rounded-lg">
                    <p className="text-[10px] text-slate-600 mb-1">Objective</p>
                    <p className="text-xs text-slate-300">{activeTask.objective}</p>
                  </div>
                )}

                {activeTask.error && (
                  <div className="p-3 border border-rose-500/20 bg-rose-500/5 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-rose-400 font-medium mb-0.5">Task Failed</p>
                      <p className="text-xs text-slate-400">{activeTask.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Select a task or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
