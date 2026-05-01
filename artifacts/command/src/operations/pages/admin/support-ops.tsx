import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  GitMerge,
  Headphones,
  Inbox,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';

interface AnalyticsOverview {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  sla_response_breaches: number;
  sla_resolution_breaches: number;
  avg_csat: number | null;
  csat_count: number;
  avg_first_response_hrs: number | null;
  avg_resolution_hrs: number | null;
  slaComplianceRate: number;
}

interface ByCategory {
  category: string;
  total: number;
  open: number;
  avg_csat: number | null;
}

interface ByPriority {
  priority: string;
  total: number;
  breached: number;
}

interface AgentLeaderboard {
  agent: string;
  total: number;
  open: number;
  resolved: number;
  avg_csat: number | null;
  avg_response_hrs: number | null;
}

interface VolumeDay {
  day: string;
  count: number;
}

interface CsatDist {
  rating: number;
  count: number;
}

interface AnalyticsData {
  period: { days: number; from: string; to: string };
  overview: AnalyticsOverview;
  csatDistribution: CsatDist[];
  volumeByDay: VolumeDay[];
  byCategory: ByCategory[];
  byPriority: ByPriority[];
  agentLeaderboard: AgentLeaderboard[];
  deflectionStats: { total_deflections: number; articles: number };
}

interface Ticket {
  id: number;
  ticket_ref: string;
  subject: string;
  submitter_name: string;
  submitter_email: string;
  category: string;
  priority: string;
  status: string;
  assigned_to_name: string | null;
  created_at: string;
  sla_response_deadline: string | null;
  sla_resolution_deadline: string | null;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  first_response_at: string | null;
  csat_rating: number | null;
  sla_response_seconds_remaining: number | null;
  sla_resolution_seconds_remaining: number | null;
  escalation_count: number;
}

interface CannedResponse {
  id: number;
  title: string;
  category: string;
  body: string;
  tags: string[];
  usage_count: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#c45a4a',
  high: '#d4a054',
  medium: '#4a90b8',
  low: '#6b8f71',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#4a90b8',
  in_progress: '#d4a054',
  waiting_on_customer: '#8b7ac8',
  resolved: '#6b8f71',
  closed: '#5e5e5e',
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = '#8a8a8a',
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#8a8a8a' }}>
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold font-mono" style={{ color: '#f5f5f5' }}>
          {value}
        </span>
        {trend && (
          <span
            className="text-xs mb-0.5"
            style={{ color: trend === 'up' ? '#6b8f71' : trend === 'down' ? '#c45a4a' : '#8a8a8a' }}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3 inline" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-3 h-3 inline" />
            ) : null}
          </span>
        )}
      </div>
      {sub && (
        <span className="text-xs" style={{ color: '#5e5e5e' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating)
    return (
      <span className="text-xs" style={{ color: '#5e5e5e' }}>
        No rating
      </span>
    );
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3 h-3"
          fill={s <= rating ? '#d4a054' : 'none'}
          style={{ color: '#d4a054' }}
        />
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function CannedResponsesPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', category: 'general', body: '', tags: '' });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['canned-responses'],
    queryFn: () => apiFetch('/admin/support/canned-responses'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: object) =>
      apiFetch('/admin/support/canned-responses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canned-responses'] });
      setShowForm(false);
      setForm({ title: '', category: 'general', body: '', tags: '' });
      toast.success('Canned response created');
    },
    onError: () => toast.error('Failed to create canned response'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/support/canned-responses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canned-responses'] });
      toast.success('Response deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const responses: CannedResponse[] = data?.responses ?? [];
  const filtered = search
    ? responses.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.category.toLowerCase().includes(search.toLowerCase()),
      )
    : responses;

  const handleCopy = useCallback((r: CannedResponse) => {
    navigator.clipboard.writeText(r.body).then(() => {
      setCopiedId(r.id);
      apiFetch(`/admin/support/canned-responses/${r.id}/use`, { method: 'POST' }).catch(() => {});
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleCreate = () => {
    if (!form.title || !form.body) return toast.error('Title and body are required');
    createMutation.mutate({
      title: form.title,
      category: form.category,
      body: form.body,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: '#8b7ac8' }} />
          <span className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>
            Canned Responses
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8a8a8a' }}
          >
            {responses.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(139,122,200,0.15)', color: '#8b7ac8' }}
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {showForm && (
        <div
          className="rounded-lg border p-3 space-y-2"
          style={{ background: 'rgba(139,122,200,0.06)', borderColor: 'rgba(139,122,200,0.2)' }}
        >
          <div className="flex gap-2">
            <input
              className="flex-1 text-xs bg-transparent border rounded px-2 py-1 focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="w-32 text-xs bg-transparent border rounded px-2 py-1 focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <textarea
            className="w-full text-xs bg-transparent border rounded px-2 py-1 focus:outline-none resize-none"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5', minHeight: 80 }}
            placeholder="Body (the response text) *"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <input
            className="w-full text-xs bg-transparent border rounded px-2 py-1 focus:outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: '#8b7ac8', color: '#fff' }}
            >
              {createMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8a8a8a' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: '#5e5e5e' }}
        />
        <input
          className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
            color: '#f5f5f5',
          }}
          placeholder="Search responses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div
            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgba(139,122,200,0.3)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: '#5e5e5e' }}>
          {responses.length === 0 ? 'No canned responses yet' : 'No results'}
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border p-2.5 group"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: '#f5f5f5' }}>
                      {r.title}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#8a8a8a' }}
                    >
                      {r.category}
                    </span>
                    {r.usage_count > 0 && (
                      <span className="text-[10px]" style={{ color: '#5e5e5e' }}>
                        ×{r.usage_count}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] line-clamp-2" style={{ color: '#6a6a6a' }}>
                    {r.body}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(r)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: copiedId === r.id ? '#6b8f71' : '#8a8a8a',
                    }}
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(r.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(196,90,74,0.1)', color: '#c45a4a' }}
                    title="Delete"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketMergePanel() {
  const [sourceRef, setSourceRef] = useState('');
  const [targetRef, setTargetRef] = useState('');
  const [reason, setReason] = useState('');
  const [merging, setMerging] = useState(false);

  const handleMerge = async () => {
    if (!sourceRef || !targetRef) return toast.error('Both ticket refs required');

    const sourceNum = parseInt(sourceRef.replace(/[^0-9]/g, ''), 10);
    const targetNum = parseInt(targetRef.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(sourceNum) || Number.isNaN(targetNum)) {
      return toast.error('Invalid ticket IDs');
    }
    if (sourceNum === targetNum) return toast.error('Cannot merge a ticket into itself');

    setMerging(true);
    try {
      const result = await apiFetch(`/admin/support/tickets/${sourceNum}/merge`, {
        method: 'POST',
        body: JSON.stringify({ targetId: targetNum, reason }),
      });
      if (result?.success) {
        toast.success(`Merged ${result.sourceRef} into ${result.targetRef}`);
        setSourceRef('');
        setTargetRef('');
        setReason('');
      } else {
        toast.error('Merge failed');
      }
    } catch {
      toast.error('Merge failed');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2">
        <GitMerge className="w-4 h-4" style={{ color: '#4a90b8' }} />
        <span className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>
          Merge Duplicate Tickets
        </span>
      </div>
      <p className="text-xs" style={{ color: '#6a6a6a' }}>
        Close a duplicate ticket and redirect its history into the canonical ticket.
      </p>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label
              className="text-[10px] uppercase tracking-wider mb-1 block"
              style={{ color: '#5e5e5e' }}
            >
              Duplicate (Source ID)
            </label>
            <input
              className="w-full text-xs bg-transparent border rounded px-2 py-1.5 focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
              placeholder="e.g. 42"
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label
              className="text-[10px] uppercase tracking-wider mb-1 block"
              style={{ color: '#5e5e5e' }}
            >
              Keep (Target ID)
            </label>
            <input
              className="w-full text-xs bg-transparent border rounded px-2 py-1.5 focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
              placeholder="e.g. 38"
              value={targetRef}
              onChange={(e) => setTargetRef(e.target.value)}
            />
          </div>
        </div>
        <input
          className="w-full text-xs bg-transparent border rounded px-2 py-1.5 focus:outline-none"
          style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          onClick={handleMerge}
          disabled={merging || !sourceRef || !targetRef}
          className="w-full text-xs py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
          style={{ background: 'rgba(74,144,184,0.2)', color: '#4a90b8' }}
        >
          {merging ? 'Merging…' : 'Merge Tickets'}
        </button>
      </div>
    </div>
  );
}

function SlaTimerBadge({ seconds }: { seconds: number | null }) {
  if (seconds === null) return null;
  const breached = seconds < 0;
  const warning = !breached && seconds < 3600;
  const color = breached ? '#c45a4a' : warning ? '#d4a054' : '#6b8f71';
  const bg = breached
    ? 'rgba(196,90,74,0.12)'
    : warning
      ? 'rgba(212,160,84,0.12)'
      : 'rgba(107,143,113,0.12)';

  const absSeconds = Math.abs(seconds);
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const label = breached ? `-${h}h ${m}m` : `${h}h ${m}m`;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono"
      style={{ background: bg, color }}
    >
      <Clock className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function CannedResponsePicker({ onInsert }: { onInsert: (body: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['canned-responses'],
    queryFn: () => apiFetch('/admin/support/canned-responses'),
  });
  const responses: CannedResponse[] = data?.responses ?? [];
  const filtered = pickerSearch
    ? responses.filter(
        (r) =>
          r.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          r.category.toLowerCase().includes(pickerSearch.toLowerCase()),
      )
    : responses;

  const handleSelect = (r: CannedResponse) => {
    onInsert(r.body);
    apiFetch(`/admin/support/canned-responses/${r.id}/use`, { method: 'POST' }).catch(() => {});
    setOpen(false);
    setPickerSearch('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors"
        style={{
          background: open ? 'rgba(139,122,200,0.15)' : 'rgba(255,255,255,0.04)',
          borderColor: open ? 'rgba(139,122,200,0.35)' : 'rgba(255,255,255,0.08)',
          color: open ? '#8b7ac8' : '#8a8a8a',
        }}
        title="Insert canned response"
        type="button"
      >
        <MessageSquare className="w-3 h-3" />
        Canned
      </button>
      {open && (
        <div
          className="absolute bottom-full mb-1 left-0 z-50 w-72 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input
              className="w-full text-xs bg-transparent border rounded px-2 py-1 focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f5f5' }}
              placeholder="Search responses…"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-center py-4" style={{ color: '#5e5e5e' }}>
                No responses found
              </p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2 hover:bg-white/[0.04] transition-colors"
                  type="button"
                >
                  <div className="text-xs font-medium truncate" style={{ color: '#e5e5e5' }}>
                    {r.title}
                  </div>
                  <div className="text-[11px] line-clamp-1 mt-0.5" style={{ color: '#5e5e5e' }}>
                    {r.body}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TicketComposer({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/support/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim(), isInternal }),
      });
      toast.success('Reply sent');
      setBody('');
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      onClose();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="mt-2 rounded-lg border p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <textarea
        className="w-full text-xs bg-transparent resize-none focus:outline-none"
        style={{ color: '#e5e5e5', minHeight: 72 }}
        placeholder="Type a reply… or pick a canned response below"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CannedResponsePicker
            onInsert={(text) => setBody((prev) => (prev ? `${prev}\n${text}` : text))}
          />
          <label
            className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none"
            style={{ color: '#6a6a6a' }}
          >
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            Internal note
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="text-[11px] px-2.5 py-1 rounded-lg border"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#6a6a6a' }}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="text-[11px] px-3 py-1 rounded-lg font-medium transition-opacity disabled:opacity-40"
            style={{ background: 'rgba(107,143,113,0.25)', color: '#6b8f71' }}
            type="button"
          >
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketQueuePanel() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [slaBreached, setSlaBreached] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (priorityFilter) params.set('priority', priorityFilter);
  if (search) params.set('search', search);
  if (slaBreached) params.set('slaBreached', 'true');
  params.set('limit', '50');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-support-tickets', statusFilter, priorityFilter, search, slaBreached],
    queryFn: () => apiFetch(`/admin/support/tickets?${params.toString()}`),
    refetchInterval: 60000,
  });

  const tickets: Ticket[] = data?.tickets ?? [];

  return (
    <div
      className="rounded-xl border"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" style={{ color: '#d4a054' }} />
            <span className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>
              Ticket Queue
            </span>
            {data?.total !== undefined && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#8a8a8a' }}
              >
                {data.total} total
              </span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8a8a8a' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-32">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3"
              style={{ color: '#5e5e5e' }}
            />
            <input
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: '#f5f5f5',
              }}
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border px-2 py-1.5 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#f5f5f5',
            }}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_on_customer">Waiting on Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-lg border px-2 py-1.5 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#f5f5f5',
            }}
          >
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => setSlaBreached((v) => !v)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${slaBreached ? 'border-red-500/40' : ''}`}
            style={{
              background: slaBreached ? 'rgba(196,90,74,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor: slaBreached ? 'rgba(196,90,74,0.4)' : 'rgba(255,255,255,0.08)',
              color: slaBreached ? '#c45a4a' : '#8a8a8a',
            }}
          >
            <Shield className="w-3 h-3 inline mr-1" />
            SLA Breached
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgba(212,160,84,0.3)', borderTopColor: '#d4a054' }}
          />
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-xs text-center py-8" style={{ color: '#5e5e5e' }}>
          No tickets match your filters
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {tickets.map((t) => (
            <div key={t.id}>
              <div
                className="px-4 py-3 hover:bg-white/[0.015] transition-colors cursor-pointer"
                onClick={() => setExpandedId((prev) => (prev === t.id ? null : t.id))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <code className="text-[10px] font-mono" style={{ color: '#5e5e5e' }}>
                        {t.ticket_ref}
                      </code>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${PRIORITY_COLORS[t.priority]}20`,
                          color: PRIORITY_COLORS[t.priority],
                        }}
                      >
                        {t.priority}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${STATUS_COLORS[t.status]}18`,
                          color: STATUS_COLORS[t.status],
                        }}
                      >
                        {t.status.replace(/_/g, ' ')}
                      </span>
                      {t.escalation_count > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(196,90,74,0.1)', color: '#c45a4a' }}
                        >
                          ↑ escalated ×{t.escalation_count}
                        </span>
                      )}
                      {t.csat_rating !== null && <StarRating rating={t.csat_rating} />}
                    </div>
                    <p className="text-xs font-medium truncate mb-1" style={{ color: '#e5e5e5' }}>
                      {t.subject}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px]" style={{ color: '#6a6a6a' }}>
                        {t.submitter_name}
                      </span>
                      {t.assigned_to_name && (
                        <span className="text-[11px]" style={{ color: '#5e5e5e' }}>
                          → {t.assigned_to_name}
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: '#5e5e5e' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {!t.first_response_at && t.sla_response_seconds_remaining !== null && (
                      <SlaTimerBadge seconds={t.sla_response_seconds_remaining} />
                    )}
                    {t.sla_resolution_seconds_remaining !== null && (
                      <SlaTimerBadge seconds={t.sla_resolution_seconds_remaining} />
                    )}
                    {(t.sla_response_breached || t.sla_resolution_breached) && (
                      <span className="text-[10px]" style={{ color: '#c45a4a' }}>
                        SLA BREACHED
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {expandedId === t.id && (
                <div className="px-4 pb-3">
                  <TicketComposer ticketId={t.id} onClose={() => setExpandedId(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CsatDistributionChart({ dist }: { dist: CsatDist[] }) {
  const max = Math.max(...dist.map((d) => d.count), 1);
  const total = dist.reduce((s, d) => s + d.count, 0);
  const STAR_COLORS = ['#c45a4a', '#d4a054', '#d4a054', '#6b8f71', '#6b8f71'];

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const item = dist.find((d) => d.rating === rating);
        const count = item?.count ?? 0;
        return (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 w-20 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3 h-3"
                  fill={s <= rating ? STAR_COLORS[rating - 1] : 'none'}
                  style={{ color: STAR_COLORS[rating - 1] }}
                />
              ))}
            </div>
            <div className="flex-1">
              <ProgressBar value={count} max={max} color={STAR_COLORS[rating - 1]} />
            </div>
            <span className="text-xs font-mono w-8 text-right" style={{ color: '#8a8a8a' }}>
              {count}
            </span>
            <span className="text-[10px] w-10 text-right" style={{ color: '#5e5e5e' }}>
              {total > 0 ? `${Math.round((count / total) * 100)}%` : '0%'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function SupportOps() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'canned' | 'merge'>(
    'overview',
  );

  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['support-ops-analytics', days],
    queryFn: () => apiFetch(`/admin/support/analytics?days=${days}`),
    refetchInterval: 120000,
  });

  const overview = data?.overview;

  const SLA_POLICIES = [
    { priority: 'urgent', label: 'Urgent', response: '1 hr', resolution: '4 hr', color: '#c45a4a' },
    { priority: 'high', label: 'High', response: '4 hr', resolution: '24 hr', color: '#d4a054' },
    {
      priority: 'medium',
      label: 'Medium',
      response: '8 hr',
      resolution: '48 hr',
      color: '#4a90b8',
    },
    { priority: 'low', label: 'Low', response: '24 hr', resolution: '72 hr', color: '#6b8f71' },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'tickets' as const, label: 'Ticket Queue', icon: Inbox },
    { id: 'canned' as const, label: 'Canned Responses', icon: MessageSquare },
    { id: 'merge' as const, label: 'Merge', icon: GitMerge },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#f5f5f5' }}>
            <Headphones className="w-5 h-5" style={{ color: '#d4a054' }} />
            Support Operations
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#6a6a6a' }}>
            SLA tracking, CSAT analytics, agent performance, and ticket management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs rounded-lg border px-2 py-1.5 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#f5f5f5',
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8a8a8a' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderBottomColor: activeTab === tab.id ? '#d4a054' : 'transparent',
              color: activeTab === tab.id ? '#d4a054' : '#8a8a8a',
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          {error ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#d4a054' }} />
              <p className="text-sm" style={{ color: '#8a8a8a' }}>
                Failed to load analytics — API connection required
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Open Tickets"
                  value={isLoading ? '—' : (overview?.open_tickets ?? 0)}
                  icon={Inbox}
                  color="#4a90b8"
                  sub={`${overview?.total_tickets ?? '—'} total`}
                />
                <StatCard
                  label="SLA Compliance"
                  value={isLoading ? '—' : `${overview?.slaComplianceRate ?? 0}%`}
                  icon={Shield}
                  color={
                    (overview?.slaComplianceRate ?? 100) >= 90
                      ? '#6b8f71'
                      : (overview?.slaComplianceRate ?? 100) >= 75
                        ? '#d4a054'
                        : '#c45a4a'
                  }
                  sub={`${overview?.sla_response_breaches ?? 0} response · ${overview?.sla_resolution_breaches ?? 0} resolution breached`}
                />
                <StatCard
                  label="Avg CSAT"
                  value={
                    isLoading
                      ? '—'
                      : overview?.avg_csat != null
                        ? `${Number(overview.avg_csat).toFixed(1)} / 5`
                        : 'N/A'
                  }
                  icon={Star}
                  color="#d4a054"
                  sub={`${overview?.csat_count ?? 0} responses`}
                />
                <StatCard
                  label="Avg Resolution"
                  value={
                    isLoading
                      ? '—'
                      : overview?.avg_resolution_hrs != null
                        ? `${Number(overview.avg_resolution_hrs).toFixed(1)}h`
                        : 'N/A'
                  }
                  icon={Clock}
                  color="#8b7ac8"
                  sub={`${overview?.avg_first_response_hrs != null ? Number(overview.avg_first_response_hrs).toFixed(1) + 'h' : 'N/A'} first response`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  className="rounded-xl border p-4"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <h3
                    className="text-xs font-semibold mb-3 flex items-center gap-2"
                    style={{ color: '#f5f5f5' }}
                  >
                    <BarChart3 className="w-3.5 h-3.5" style={{ color: '#4a90b8' }} />
                    Volume by Category
                  </h3>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-7 rounded animate-pulse"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(data?.byCategory ?? []).map((c) => (
                        <div key={c.category}>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: '#c9c9c9' }}>
                              {c.category.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono" style={{ color: '#8a8a8a' }}>
                              {c.total} ({c.open} open)
                            </span>
                          </div>
                          <ProgressBar
                            value={c.total}
                            max={Math.max(...(data?.byCategory ?? []).map((x) => x.total), 1)}
                            color="#4a90b8"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl border p-4"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <h3
                    className="text-xs font-semibold mb-3 flex items-center gap-2"
                    style={{ color: '#f5f5f5' }}
                  >
                    <Star className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
                    CSAT Distribution
                  </h3>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-5 rounded animate-pulse"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        />
                      ))}
                    </div>
                  ) : (data?.csatDistribution ?? []).length === 0 ? (
                    <p className="text-xs" style={{ color: '#5e5e5e' }}>
                      No CSAT responses in this period
                    </p>
                  ) : (
                    <CsatDistributionChart dist={data?.csatDistribution ?? []} />
                  )}
                </div>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <h3
                  className="text-xs font-semibold mb-3 flex items-center gap-2"
                  style={{ color: '#f5f5f5' }}
                >
                  <Trophy className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
                  Agent Leaderboard
                </h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 rounded animate-pulse"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      />
                    ))}
                  </div>
                ) : (data?.agentLeaderboard ?? []).length === 0 ? (
                  <p className="text-xs" style={{ color: '#5e5e5e' }}>
                    No agent data in this period
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Agent', 'Resolved', 'Open', 'Avg CSAT', 'Avg Response'].map((h) => (
                            <th
                              key={h}
                              className="text-left pb-2 pr-3 font-medium"
                              style={{ color: '#5e5e5e' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.agentLeaderboard ?? []).map((a, i) => (
                          <tr
                            key={a.agent}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          >
                            <td className="py-2 pr-3" style={{ color: '#e5e5e5' }}>
                              <div className="flex items-center gap-1.5">
                                {i === 0 && (
                                  <Trophy className="w-3 h-3" style={{ color: '#d4a054' }} />
                                )}
                                {a.agent}
                              </div>
                            </td>
                            <td className="py-2 pr-3 font-mono" style={{ color: '#6b8f71' }}>
                              {a.resolved}
                            </td>
                            <td className="py-2 pr-3 font-mono" style={{ color: '#4a90b8' }}>
                              {a.open}
                            </td>
                            <td className="py-2 pr-3">
                              {a.avg_csat != null ? (
                                <span className="font-mono" style={{ color: '#d4a054' }}>
                                  {Number(a.avg_csat).toFixed(1)} ★
                                </span>
                              ) : (
                                <span style={{ color: '#5e5e5e' }}>—</span>
                              )}
                            </td>
                            <td className="py-2 font-mono" style={{ color: '#8b7ac8' }}>
                              {a.avg_response_hrs != null
                                ? `${Number(a.avg_response_hrs).toFixed(1)}h`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <h3
                  className="text-xs font-semibold mb-3 flex items-center gap-2"
                  style={{ color: '#f5f5f5' }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
                  SLA Policy Reference
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SLA_POLICIES.map((p) => (
                    <div
                      key={p.priority}
                      className="rounded-lg p-2.5"
                      style={{ background: `${p.color}10`, border: `1px solid ${p.color}25` }}
                    >
                      <div className="text-xs font-semibold mb-1.5" style={{ color: p.color }}>
                        {p.label}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[11px]" style={{ color: '#8a8a8a' }}>
                          Response: <span style={{ color: '#e5e5e5' }}>{p.response}</span>
                        </div>
                        <div className="text-[11px]" style={{ color: '#8a8a8a' }}>
                          Resolution: <span style={{ color: '#e5e5e5' }}>{p.resolution}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {data?.deflectionStats && (
                  <div
                    className="mt-3 flex items-center gap-2 text-xs"
                    style={{ color: '#6a6a6a' }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#6b8f71' }} />
                    <span>
                      AI deflection:{' '}
                      <strong style={{ color: '#6b8f71' }}>
                        {data.deflectionStats.total_deflections}
                      </strong>{' '}
                      tickets deflected via{' '}
                      <strong style={{ color: '#e5e5e5' }}>{data.deflectionStats.articles}</strong>{' '}
                      KB articles
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'tickets' && <TicketQueuePanel />}

      {activeTab === 'canned' && <CannedResponsesPanel />}

      {activeTab === 'merge' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TicketMergePanel />
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f5f5f5' }}>
              How Merge Works
            </h3>
            <ul className="space-y-2 text-xs" style={{ color: '#8a8a8a' }}>
              <li className="flex gap-2">
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: '#6b8f71' }}
                />
                The source (duplicate) ticket is closed and marked as merged
              </li>
              <li className="flex gap-2">
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: '#6b8f71' }}
                />
                An internal note is added to the source ticket linking it to the target
              </li>
              <li className="flex gap-2">
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: '#6b8f71' }}
                />
                The target ticket continues tracking SLA and CSAT normally
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: '#d4a054' }}
                />
                Merges are permanent and cannot be undone
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
