
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  Plug,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { type DiligenceTask, propertyTwins } from '@/data/property-twin';

const ACCENT = '#40856a';

const STAGES = [
  { id: 'pre_diligence', label: 'Pre-Diligence' },
  { id: 'title_review', label: 'Title Review' },
  { id: 'environmental', label: 'Environmental' },
  { id: 'financial_audit', label: 'Financial Audit' },
  { id: 'legal_review', label: 'Legal Review' },
  { id: 'final_approval', label: 'IC Sign-Off' },
] as const;

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return `In ${Math.ceil(Math.abs(diff) / 86400000)}d`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  complete: { color: '#40856a', bg: '#40856a20', label: 'Complete' },
  in_progress: { color: '#4a7dc8', bg: '#4a7dc820', label: 'In Progress' },
  not_started: {
    color: 'rgba(255,255,255,0.3)',
    bg: 'rgba(255,255,255,0.04)',
    label: 'Not Started',
  },
  blocked: { color: '#c04a2a', bg: '#c04a2a20', label: 'Blocked' },
  waived: { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)', label: 'Waived' },
};

function StageTimeline({
  stages,
  currentStage,
  tasks,
}: {
  stages: typeof STAGES;
  currentStage: string;
  tasks: DiligenceTask[];
}) {
  const stageIds = stages.map((s) => s.id);
  const currentIdx = stageIds.indexOf(currentStage as (typeof stageIds)[number]);

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {stages.map((s, i) => {
        const stageTasks = tasks.filter((t) => t.stage === s.id);
        const allDone =
          stageTasks.length > 0 &&
          stageTasks.every((t) => t.status === 'complete' || t.status === 'waived');
        const isCurrent = s.id === currentStage;
        const isPast = i < currentIdx;
        const color = allDone
          ? '#40856a'
          : isCurrent
            ? '#4a7dc8'
            : isPast
              ? '#c08a2c'
              : 'rgba(255,255,255,0.15)';
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                style={{
                  borderColor: color,
                  background: allDone ? `${color}20` : 'transparent',
                }}
              >
                {allDone ? (
                  <CheckCircle size={14} style={{ color }} />
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                )}
              </div>
              <div
                className="text-xs mt-1 whitespace-nowrap"
                style={{ color: isCurrent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}
              >
                {s.label}
              </div>
              {stageTasks.length > 0 && (
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {
                    stageTasks.filter((t) => t.status === 'complete' || t.status === 'waived')
                      .length
                  }
                  /{stageTasks.length}
                </div>
              )}
            </div>
            {i < stages.length - 1 && (
              <div
                className="h-px w-8 mt-[-16px]"
                style={{ background: isPast || allDone ? color : 'rgba(255,255,255,0.08)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: DiligenceTask;
  onStatusChange?: (id: string, s: string) => void;
}) {
  const ss = STATUS_STYLE[task.status];
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200"
      style={{
        background: task.status === 'blocked' ? '#c04a2a06' : 'rgba(255,255,255,0.02)',
        borderColor: task.status === 'blocked' ? '#c04a2a25' : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ss.color }} />
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {task.label}
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: ss.bg, color: ss.color }}
        >
          {ss.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {task.assignedTo && (
          <span className="flex items-center gap-1">
            <User size={10} />
            {task.assignedTo}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {relTime(task.dueDate)}
          </span>
        )}
        {task.completedAt && (
          <span className="flex items-center gap-1">
            <CheckCircle size={10} />
            Done {relTime(task.completedAt)}
          </span>
        )}
      </div>
      {task.blockerReason && (
        <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: '#c04a2a' }}>
          <AlertTriangle size={10} />
          {task.blockerReason}
        </div>
      )}
      {task.notes && (
        <div className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {task.notes}
        </div>
      )}
    </div>
  );
}

export default function DiligencePrep() {
  const [selectedId, setSelectedId] = useState(propertyTwins[0]?.id ?? null);
  const twin = propertyTwins.find((t) => t.id === selectedId) ?? propertyTwins[0];

  const tasksByStage = STAGES.reduce(
    (acc, s) => {
      acc[s.id] = twin?.diligenceTasks.filter((t) => t.stage === s.id) ?? [];
      return acc;
    },
    {} as Record<string, DiligenceTask[]>,
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Diligence Prep
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Structured due diligence workflow — stage-gated progress, tasks, and document
            requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          {propertyTwins.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: selectedId === t.id ? `${ACCENT}20` : 'rgba(255,255,255,0.04)',
                color: selectedId === t.id ? ACCENT : 'rgba(255,255,255,0.4)',
                border: `1px solid ${selectedId === t.id ? `${ACCENT}40` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {twin && (
        <>
          <div
            className="rounded-xl border p-5 mb-6"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} style={{ color: ACCENT }} />
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {twin.name}
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                · {twin.city}, {twin.state} · {twin.propertyType}
              </span>
            </div>
            <StageTimeline
              stages={[...STAGES]}
              currentStage={twin.diligenceStage}
              tasks={twin.diligenceTasks}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Overall Progress
              </div>
              <div className="text-2xl font-bold" style={{ color: ACCENT }}>
                {twin.diligenceCompletionPct}%
              </div>
              <div
                className="mt-2 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${twin.diligenceCompletionPct}%`, background: ACCENT }}
                />
              </div>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tasks Complete
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {twin.diligenceTasks.filter((t) => t.status === 'complete').length}/
                {twin.diligenceTasks.length}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {twin.diligenceTasks.filter((t) => t.status === 'blocked').length} blocked
              </div>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Documents
              </div>
              <div className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {
                  twin.documents.filter((d) => d.status === 'approved' || d.status === 'reviewed')
                    .length
                }
                /{twin.documents.length}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                reviewed or approved
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {STAGES.map((s) => {
              const tasks = tasksByStage[s.id] ?? [];
              const isCurrent = s.id === twin.diligenceStage;
              if (tasks.length === 0 && !isCurrent) return null;
              return (
                <div key={s.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3
                      className="text-sm font-semibold"
                      style={{
                        color: isCurrent ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {s.label}
                    </h3>
                    {isCurrent && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#4a7dc820', color: '#4a7dc8' }}
                      >
                        Current Stage
                      </span>
                    )}
                  </div>
                  {tasks.length === 0 ? (
                    <div
                      className="rounded-xl border p-4 text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.01)',
                        borderColor: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.25)',
                      }}
                    >
                      No tasks defined for this stage.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {tasks.map((t) => (
                        <TaskCard key={t.id} task={t} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="mt-8 rounded-xl border p-5"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Plug size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                External Data Sources
              </h3>
            </div>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              These sources would enrich diligence with live zoning, permit, flood, and comp data.
              Connect credentials to enable.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {twin.externalDataConnectors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {c.name}
                    </div>
                    <div className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {c.type.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    Connect to enable
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
