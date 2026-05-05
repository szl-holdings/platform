import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Inbox,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  type HitlState,
  type ResponseQueueItem,
  approveResponseQueueItem,
  getHitlControls,
  listResponseQueue,
  rejectResponseQueueItem,
  updateHitlControls,
} from '@/lib/sentra-api';

const RISK_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  auto_executed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  block: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  revoke: <XCircle className="w-3.5 h-3.5 text-orange-400" />,
  rotate: <RefreshCw className="w-3.5 h-3.5 text-blue-400" />,
  quarantine: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  tarpit: <Clock className="w-3.5 h-3.5 text-purple-400" />,
  poison_response: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
  counter_move: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
};

function QueueCard({ item, onApprove, onReject, working }: {
  item: ResponseQueueItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  working: boolean;
}) {
  const isPending = item.status === 'pending';
  return (
    <Card className="bg-[#1a1f2e] border border-white/10 hover:border-white/20 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {CATEGORY_ICONS[item.category] ?? <Zap className="w-3.5 h-3.5 text-white/40" />}
            <span className="text-sm font-medium text-white/90 truncate">{item.actionType}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs ${RISK_COLORS[item.riskLevel] ?? 'bg-white/10 text-white/60'}`}>
              {item.riskLevel}
            </Badge>
            <Badge className={`text-xs ${STATUS_COLORS[item.status] ?? 'bg-white/10 text-white/60'}`}>
              {item.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/40 w-14 flex-shrink-0">Target</span>
            <span className="text-white/80 font-mono truncate">{item.target}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 w-14 flex-shrink-0">Type</span>
            <span className="text-white/70">{item.targetType}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 w-14 flex-shrink-0">Reason</span>
            <span className="text-white/70 truncate">{item.reason}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 w-14 flex-shrink-0">Category</span>
            <span className="text-white/70 capitalize">{item.category.replace(/_/g, ' ')}</span>
          </div>
          {item.resolvedBy && (
            <div className="flex items-center gap-2">
              <span className="text-white/40 w-14 flex-shrink-0">By</span>
              <span className="text-white/70">{item.resolvedBy}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span>{new Date(item.requestedAt).toLocaleString()}</span>
          {item.resolvedAt && <span>→ {new Date(item.resolvedAt).toLocaleString()}</span>}
        </div>

        {isPending && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onApprove(item.id)}
              disabled={working}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(item.id)}
              disabled={working}
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HitlControlsPanel({ state, onUpdate }: {
  state: HitlState;
  onUpdate: () => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  const toggle = async (category: string, field: 'autoExecute' | 'enabled') => {
    const current = state.categories[category];
    if (!current) return;
    setToggling(`${category}:${field}`);
    try {
      await updateHitlControls({
        category,
        [field]: !current[field],
        updatedBy: 'operator',
      });
      onUpdate();
    } finally {
      setToggling(null);
    }
  };

  const toggleKillSwitch = async () => {
    setToggling('kill');
    try {
      await updateHitlControls({ globalKillSwitch: !state.globalKillSwitch, updatedBy: 'operator' });
      onUpdate();
    } finally {
      setToggling(null);
    }
  };

  return (
    <Card className="bg-[#1a1f2e] border border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white/80 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#c9b787]" />
            HITL Controls
          </CardTitle>
          <button
            onClick={toggleKillSwitch}
            disabled={toggling === 'kill'}
            className="flex items-center gap-2 text-xs"
          >
            {state.globalKillSwitch ? (
              <><ToggleRight className="w-5 h-5 text-red-400" /><span className="text-red-400">Kill Switch ACTIVE</span></>
            ) : (
              <><ToggleLeft className="w-5 h-5 text-white/40" /><span className="text-white/40">Kill Switch Off</span></>
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.values(state.categories).map((cat) => (
            <div key={cat.category} className="flex items-center gap-3 py-1.5">
              <span className="text-xs text-white/60 w-28 flex-shrink-0 capitalize">{cat.category.replace(/_/g, ' ')}</span>

              <button
                onClick={() => toggle(cat.category, 'enabled')}
                disabled={toggling === `${cat.category}:enabled`}
                className="flex items-center gap-1 text-xs"
              >
                {cat.enabled ? (
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-white/30" />
                )}
                <span className={cat.enabled ? 'text-emerald-400' : 'text-white/30'}>
                  {cat.enabled ? 'On' : 'Off'}
                </span>
              </button>

              <button
                onClick={() => toggle(cat.category, 'autoExecute')}
                disabled={!cat.enabled || toggling === `${cat.category}:autoExecute`}
                className="flex items-center gap-1 text-xs"
              >
                {cat.autoExecute ? (
                  <><ToggleRight className="w-4 h-4 text-amber-400" /><span className="text-amber-400">Auto</span></>
                ) : (
                  <><ToggleLeft className="w-4 h-4 text-white/30" /><span className="text-white/30">Manual</span></>
                )}
              </button>

              <span className="text-xs text-white/30 flex-1 truncate hidden md:block">{cat.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResponseQueuePage() {
  const [queue, setQueue] = useState<ResponseQueueItem[]>([]);
  const [hitl, setHitl] = useState<HitlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchAll = useCallback(async () => {
    try {
      const [queueData, hitlData] = await Promise.all([listResponseQueue(), getHitlControls()]);
      setQueue(queueData.queue as ResponseQueueItem[]);
      setHitl(hitlData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleApprove = async (id: string) => {
    setWorking(true);
    try {
      await approveResponseQueueItem(id, 'operator');
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async (id: string) => {
    setWorking(true);
    try {
      await rejectResponseQueueItem(id, 'operator');
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setWorking(false);
    }
  };

  const filtered = filterStatus === 'all' ? queue : queue.filter((q) => q.status === filterStatus);
  const pending = queue.filter((q) => q.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#c9b787]" />
            Response Queue
            {pending > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                {pending} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            HITL operator approval queue for defensive actions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          disabled={loading}
          className="border-white/20 text-white/70 hover:bg-white/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {hitl && <HitlControlsPanel state={hitl} onUpdate={fetchAll} />}

      <div className="flex items-center gap-2">
        {['all', 'pending', 'approved', 'rejected', 'auto_executed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              filterStatus === status
                ? 'bg-[#c9b787]/20 border-[#c9b787]/40 text-[#c9b787]'
                : 'border-white/10 text-white/50 hover:bg-white/5'
            }`}
          >
            {status.replace(/_/g, ' ')}
            {status === 'all' && ` (${queue.length})`}
            {status !== 'all' && ` (${queue.filter(q => q.status === status).length})`}
          </button>
        ))}
      </div>

      {loading && queue.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-40 rounded-lg bg-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#1a1f2e] border border-white/10">
          <CardContent className="py-12 text-center">
            <Inbox className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">
              {filterStatus === 'pending' ? 'No actions awaiting approval' : 'No items in this filter'}
            </p>
            <p className="text-white/30 text-xs mt-1">
              Actions are queued here when HITL approval is required
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              working={working}
            />
          ))}
        </div>
      )}
    </div>
  );
}
