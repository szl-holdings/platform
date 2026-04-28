import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Circle, Download, Loader2, Mail, MessageSquare, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { API, adminFetch, Badge, EmptyState, SearchInput, SectionHeader } from './shared';
import type { BadgeVariant, EmailLogEntry, ReplyModal, SupportReply, SupportTicket, TicketStatus } from './types';

const TICKET_STATUSES: TicketStatus[] = ['new', 'contacted', 'qualified', 'closed', 'lost'];
const statusConfig: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: 'New', variant: 'blue' },
  contacted: { label: 'Contacted', variant: 'amber' },
  qualified: { label: 'Qualified', variant: 'violet' },
  closed: { label: 'Closed', variant: 'green' },
  lost: { label: 'Lost', variant: 'red' },
};

function TicketEmailLog({ ticketId }: { ticketId: number }) {
  const { data, isLoading } = useStandardQuery<{ logs: EmailLogEntry[] }>({
    queryKey: ['ticket-email-log', ticketId],
    queryFn: () => adminFetch(`/admin/support-queue/${ticketId}/email-log`),
    refetchInterval: 30000,
  });
  const logs = data?.logs ?? [];
  if (isLoading) return <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground py-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading email log…</div>;
  if (logs.length === 0) return <p className="text-[10px] text-muted-foreground/60 italic">No emails logged yet.</p>;
  const failedCount = logs.filter((l) => l.deliveryStatus === 'failed').length;
  return (
    <div className="flex flex-col gap-1.5">
      {failedCount > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-[10px] font-semibold text-red-500">{failedCount} failed deliver{failedCount === 1 ? 'y' : 'ies'} — manual follow-up may be needed</span>
        </div>
      )}
      {logs.map((l) => {
        const isFailed = l.deliveryStatus === 'failed';
        const templateLabel = l.template === 'status_change' ? 'Status Change' : l.template === 'agent_reply' ? 'Agent Reply' : l.template;
        return (
          <div key={l.id} className={cn('border rounded-lg px-3 py-2 space-y-0.5', isFailed ? 'bg-red-500/5 border-red-500/20' : 'bg-primary/5 border-primary/15')}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {isFailed ? <XCircle className="w-3 h-3 text-red-500 shrink-0" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                <span className={cn('text-[10px] font-semibold truncate', isFailed ? 'text-red-500' : 'text-primary/80')}>{l.subject}</span>
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">{new Date(l.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-muted/50 font-medium">{templateLabel}</span>
              {l.previousStatus && l.newStatus && <span>{l.previousStatus} → {l.newStatus}</span>}
              {l.provider && <span>via {l.provider}</span>}
              <span>to {l.recipient}</span>
            </div>
            {isFailed && l.error && <div className="text-[9px] text-red-400 bg-red-500/5 rounded px-2 py-1 mt-1 font-mono break-all">{l.error}</div>}
          </div>
        );
      })}
    </div>
  );
}

function TicketReplyHistory({ ticketId }: { ticketId: number }) {
  const { data, isLoading } = useStandardQuery<{ replies: SupportReply[] }>({
    queryKey: ['ticket-replies', ticketId],
    queryFn: () => adminFetch(`/admin/support-queue/${ticketId}/replies`),
    refetchInterval: 30000,
  });
  const replies = data?.replies ?? [];
  if (isLoading) return <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground py-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading reply history…</div>;
  if (replies.length === 0) return <p className="text-[10px] text-muted-foreground/60 italic">No replies sent yet.</p>;
  return (
    <div className="flex flex-col gap-2">
      {replies.map((r) => (
        <div key={r.id} className={cn('border rounded-lg px-3 py-2 space-y-1', r.emailSuccess ? 'bg-primary/5 border-primary/15' : 'bg-red-500/5 border-red-500/20')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-primary/80 truncate">{r.subject}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{new Date(r.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-[11px] text-foreground/80 whitespace-pre-wrap leading-relaxed">{r.body}</p>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-[9px] text-muted-foreground">Sent by {r.sentBy}</p>
            {r.emailSuccess ? <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-600"><CheckCircle2 className="w-2.5 h-2.5" /> Delivered</span> : <span className="flex items-center gap-1 text-[9px] font-medium text-red-500"><XCircle className="w-2.5 h-2.5" /> Delivery failed</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assignInputs, setAssignInputs] = useState<Record<number, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [replyModal, setReplyModal] = useState<ReplyModal | null>(null);
  const [replySending, setReplySending] = useState(false);
  const [replyResult, setReplyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [recentlyNotified, setRecentlyNotified] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [notifEmail, setNotifEmail] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifResult, setNotifResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data, isLoading, refetch } = useStandardQuery<{ tickets: SupportTicket[]; total: number; openTotal: number }>({
    queryKey: ['admin-support', showResolved],
    queryFn: () => adminFetch(`/admin/support-queue${showResolved ? '?includeResolved=true' : ''}`),
    refetchInterval: 60000,
  });

  const { data: notifSettings } = useStandardQuery<{ notification_email?: string }>({
    queryKey: ['admin-notification-settings'],
    queryFn: () => adminFetch<{ notification_email?: string }>('/admin/notification-settings'),
  });

  useEffect(() => {
    if (notifSettings?.notification_email) setNotifEmail(notifSettings.notification_email);
  }, [notifSettings?.notification_email]);

  function markNotified(id: number) {
    setRecentlyNotified((prev) => new Set([...prev, id]));
    setTimeout(() => setRecentlyNotified((prev) => { const next = new Set(prev); next.delete(id); return next; }), 60000);
  }

  const statusMutation = useStandardMutation({
    mutationFn: ({ id, status, ownerUserId }: { id: number; status: string; ownerUserId?: number }) =>
      adminFetch<{ notificationQueued?: boolean }>(`/admin/support-queue/${id}/status`, { method: 'POST', body: JSON.stringify({ status, ownerUserId }) }),
    onSuccess: (data: { notificationQueued?: boolean } | undefined, { id }: { id: number }) => {
      qc.invalidateQueries({ queryKey: ['admin-support'] });
      if (data?.notificationQueued) markNotified(id);
    },
  });

  const assignMutation = useStandardMutation({
    mutationFn: ({ id, ownerUserId }: { id: number; ownerUserId: number }) =>
      adminFetch<{ notificationQueued?: boolean }>(`/admin/support-queue/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'contacted', ownerUserId }) }),
    onSuccess: (data: { notificationQueued?: boolean } | undefined, { id }: { id: number }) => {
      qc.invalidateQueries({ queryKey: ['admin-support'] });
      setAssignInputs((p) => { const next = { ...p }; delete next[id]; return next; });
      if (data?.notificationQueued) markNotified(id);
    },
  });

  const noteMutation = useStandardMutation({
    mutationFn: ({ id, notes, status }: { id: number; notes: string; status: string }) =>
      adminFetch<{ notificationQueued?: boolean }>(`/admin/support-queue/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
    onSuccess: (data: { notificationQueued?: boolean } | undefined, { id }: { id: number }) => {
      qc.invalidateQueries({ queryKey: ['admin-support'] });
      setNoteInputs((p) => { const next = { ...p }; delete next[id]; return next; });
      if (data?.notificationQueued) markNotified(id);
    },
  });

  const resolveMutation = useStandardMutation({
    mutationFn: ({ id }: { id: number }) => adminFetch(`/admin/support-queue/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support'] }),
  });

  const reopenMutation = useStandardMutation({
    mutationFn: ({ id }: { id: number }) => adminFetch(`/admin/support-queue/${id}/reopen`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support'] }),
  });

  const optOutMutation = useStandardMutation({
    mutationFn: ({ id, optOut }: { id: number; optOut: boolean }) =>
      adminFetch(`/admin/support-queue/${id}/opt-out`, { method: 'POST', body: JSON.stringify({ optOut }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support'] }),
  });

  const handleSendReply = async () => {
    if (!replyModal) return;
    setReplySending(true);
    setReplyResult(null);
    try {
      const result = await adminFetch<{ success: boolean; sent: boolean; error?: string }>(`/admin/support-queue/${replyModal.ticketId}/reply`, { method: 'POST', body: JSON.stringify({ subject: replyModal.subject, body: replyModal.body }) });
      if (result.sent) {
        setReplyResult({ success: true, message: 'Reply sent successfully.' });
        setTimeout(() => { setReplyModal(null); setReplyResult(null); }, 1500);
      } else {
        setReplyResult({ success: false, message: result.error ?? 'Email delivery unavailable — no provider configured.' });
      }
    } catch {
      setReplyResult({ success: false, message: 'Failed to send reply. Please try again.' });
    } finally {
      setReplySending(false);
    }
  };

  const tickets = (data?.tickets ?? []).filter((t) => {
    const s = t.status ?? 'new';
    return (statusFilter === 'all' || s === statusFilter) && (!search || t.fullName.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()) || t.formKey.includes(search));
  });

  const formKeyLabel: Record<string, { label: string; variant: 'blue' | 'green' | 'amber' | 'neutral' }> = {
    szl_contact: { label: 'General', variant: 'blue' },
    vessels_demo: { label: 'Vessels Demo', variant: 'green' },
    prism_counsel_access: { label: 'Counsel Access', variant: 'amber' },
    carlota_private_inquiry: { label: 'Carlota Jo', variant: 'neutral' },
    stephen_contact: { label: 'Stephen', variant: 'neutral' },
  };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    setExportSuccess(false);
    const csvParams = new URLSearchParams();
    if (showResolved) csvParams.set('includeResolved', 'true');
    if (search) csvParams.set('search', search);
    if (statusFilter && statusFilter !== 'all') csvParams.set('status', statusFilter);
    csvParams.set('format', 'csv');
    try {
      const res = await fetch(`${API}/admin/support-queue?${csvParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'support-queue.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const rows = [['ID', 'Name', 'Email', 'Form', 'Company', 'Status', 'Message', 'Date']];
      tickets.forEach((t) => rows.push([String(t.id), t.fullName, t.email, t.formKey, t.company ?? '', t.status ?? 'new', (t.message ?? '').replace(/\n/g, ' '), new Date(t.createdAt).toLocaleDateString()]));
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'support-queue.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { if (!replySending) { setReplyModal(null); setReplyResult(null); } }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div><p className="text-sm font-semibold text-foreground">Reply to {replyModal.name}</p><p className="text-xs text-muted-foreground">{replyModal.email}</p></div>
              <button onClick={() => { setReplyModal(null); setReplyResult(null); }} disabled={replySending} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                <input type="text" value={replyModal.subject} onChange={(e) => setReplyModal((m) => (m ? { ...m, subject: e.target.value } : m))} className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" disabled={replySending} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
                <textarea rows={7} value={replyModal.body} onChange={(e) => setReplyModal((m) => (m ? { ...m, body: e.target.value } : m))} placeholder="Write your reply…" className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" disabled={replySending} />
              </div>
              {replyResult && <div className={cn('text-xs px-3 py-2 rounded-lg', replyResult.success ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20')}>{replyResult.message}</div>}
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button onClick={() => { setReplyModal(null); setReplyResult(null); }} disabled={replySending} className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40">Cancel</button>
              <button onClick={handleSendReply} disabled={replySending || !replyModal.subject.trim() || !replyModal.body.trim()} className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                {replySending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : <><Mail className="w-3.5 h-3.5" /> Send Reply</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Support Queue" subtitle={showResolved ? `${data?.total ?? 0} total submissions` : `${data?.openTotal ?? 0} open · ${data?.total ?? 0} total`} onRefresh={() => refetch()} loading={isLoading} />

      <div className="flex gap-2">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or form..." /></div>
        <button onClick={() => setShowResolved((v) => !v)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors', showResolved ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted')}>
          <CheckCircle2 className="w-3.5 h-3.5" /> {showResolved ? 'Hiding resolved' : 'Show resolved'}
        </button>
        <div className="flex items-center gap-2">
          {exportSuccess && <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Downloaded</span>}
          <button onClick={exportCsv} disabled={exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
            {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</> : <><Download className="w-3.5 h-3.5" /> Export CSV</>}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ id: 'all', label: 'All' }, ...TICKET_STATUSES.map((s) => ({ id: s, label: statusConfig[s].label }))].map((opt) => (
          <button key={opt.id} onClick={() => setStatusFilter(opt.id)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', statusFilter === opt.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : tickets.length === 0 ? (
        <EmptyState message={search ? 'No tickets match your search.' : 'No support tickets yet.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {tickets.map((t) => {
            const fk = formKeyLabel[t.formKey] ?? { label: t.formKey, variant: 'neutral' as const };
            const isExpanded = expanded === t.id;
            const currentStatus = (t.status ?? 'new') as TicketStatus;
            const sc = statusConfig[currentStatus] ?? statusConfig.new;
            return (
              <div key={t.id} className="transition-colors hover:bg-muted/10">
                <button onClick={() => setExpanded(isExpanded ? null : t.id)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.email}{t.company ? ` · ${t.company}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.submissionStatus === 'resolved' && <Badge label="Resolved" variant="green" />}
                    {(t.notificationSentAt || recentlyNotified.has(t.id)) && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20"><Mail className="w-2.5 h-2.5" /> Email sent</span>}
                    {t.emailOptOut && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">No email</span>}
                    <Badge label={sc.label} variant={sc.variant} />
                    <Badge label={fk.label} variant={fk.variant} />
                    <span className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-2 bg-muted/10 border-t border-border/30 space-y-3">
                        {t.message ? <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{t.message}</p> : <p className="text-xs italic text-muted-foreground/60">No message provided.</p>}
                        {t.notes && <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2"><p className="text-[10px] font-semibold text-amber-600 mb-0.5">Notes</p><p className="text-xs text-foreground">{t.notes}</p></div>}
                        <p className="text-[10px] text-muted-foreground/60">
                          Submitted {new Date(t.createdAt).toLocaleString()}{t.resolvedAt ? ` · Resolved ${new Date(t.resolvedAt).toLocaleString()}` : ''}{t.notificationSentAt ? ` · Email sent ${new Date(t.notificationSentAt).toLocaleString()}` : recentlyNotified.has(t.id) ? ' · Email notification queued' : ''}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setReplyModal({ ticketId: t.id, email: t.email, name: t.fullName, subject: 'Re: Your inquiry', body: '' })} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"><Mail className="w-3 h-3" /> Reply</button>
                          {t.submissionStatus === 'resolved' ? (
                            <button onClick={() => reopenMutation.mutate({ id: t.id })} disabled={reopenMutation.isPending} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-40">
                              <Circle className="w-3 h-3" /> {reopenMutation.isPending ? 'Reopening…' : 'Reopen'}
                            </button>
                          ) : (
                            <button onClick={() => resolveMutation.mutate({ id: t.id })} disabled={resolveMutation.isPending} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-40">
                              <CheckCircle2 className="w-3 h-3" /> {resolveMutation.isPending ? 'Resolving…' : 'Resolve'}
                            </button>
                          )}
                          <button onClick={() => optOutMutation.mutate({ id: t.id, optOut: !t.emailOptOut })} disabled={optOutMutation.isPending} className={cn('flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border transition-colors disabled:opacity-40', t.emailOptOut ? 'border-sky-500/30 text-sky-500 hover:bg-sky-500/10' : 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10')}>
                            <Mail className="w-3 h-3" /> {t.emailOptOut ? 'Re-enable emails' : 'Opt out emails'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-muted-foreground font-medium mr-1">Update status:</span>
                          {TICKET_STATUSES.filter((s) => s !== currentStatus).map((s) => (
                            <button key={s} onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: t.id, status: s }); }} disabled={statusMutation.isPending} className={cn('text-[10px] px-2 py-1 rounded-md font-medium border transition-colors', s === 'closed' ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10' : s === 'lost' ? 'border-red-500/30 text-red-500 hover:bg-red-500/10' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted')}>
                              {statusConfig[s].label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          {t.ownerUserId ? <span className="text-[10px] text-muted-foreground">Assigned to user <span className="font-mono text-foreground">#{t.ownerUserId}</span></span> : <span className="text-[10px] text-muted-foreground">Unassigned</span>}
                          <span className="text-muted-foreground/40">·</span>
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="User ID" value={assignInputs[t.id] ?? ''} onChange={(e) => setAssignInputs((p) => ({ ...p, [t.id]: e.target.value }))} className="w-20 px-2 py-0.5 bg-background border border-border rounded text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                            <button onClick={() => { const uid = parseInt(assignInputs[t.id] ?? '', 10); if (!Number.isNaN(uid) && uid > 0) assignMutation.mutate({ id: t.id, ownerUserId: uid }); }} disabled={!assignInputs[t.id] || assignMutation.isPending} className="text-[10px] px-2 py-0.5 rounded font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                              {assignMutation.isPending ? 'Saving…' : 'Assign'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><MessageSquare className="w-3 h-3" /> Reply History</div>
                          <TicketReplyHistory ticketId={t.id} />
                        </div>

                        <div className="pt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><Mail className="w-3 h-3" /> Email Audit Log</div>
                          <TicketEmailLog ticketId={t.id} />
                        </div>

                        <div className="pt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[10px] font-semibold text-muted-foreground">Internal Notes</div>
                          <textarea rows={3} value={noteInputs[t.id] ?? t.notes ?? ''} onChange={(e) => setNoteInputs((p) => ({ ...p, [t.id]: e.target.value }))} placeholder="Add an internal note or reply…" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
                          <div className="flex justify-end">
                            <button onClick={() => { const note = noteInputs[t.id]; if (note !== undefined && note !== t.notes) noteMutation.mutate({ id: t.id, notes: note, status: t.status ?? 'new' }); }} disabled={noteInputs[t.id] === undefined || noteInputs[t.id] === t.notes || noteMutation.isPending} className="text-[10px] px-3 py-1 rounded font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors">
                              {noteMutation.isPending ? 'Saving…' : 'Save Note'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><h3 className="text-sm font-semibold text-foreground">Notification Email Settings</h3></div>
        <p className="text-xs text-muted-foreground">Configure the reply-to address used in support notification emails. Currently set to: <span className="font-medium text-foreground">{notifSettings?.notification_email ?? '—'}</span></p>
        <div className="flex gap-2">
          <input type="email" value={notifEmail} onChange={(e) => { setNotifEmail(e.target.value); setNotifResult(null); }} placeholder="support@yourcompany.com" className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
          <button disabled={notifSaving || !notifEmail} onClick={async () => {
            setNotifSaving(true);
            setNotifResult(null);
            try {
              await adminFetch('/admin/notification-settings', { method: 'PUT', body: JSON.stringify({ notificationEmail: notifEmail }) });
              setNotifResult({ ok: true, msg: 'Notification email updated.' });
            } catch {
              setNotifResult({ ok: false, msg: 'Failed to update notification email.' });
            } finally { setNotifSaving(false); }
          }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-colors disabled:opacity-40">
            {notifSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {notifResult && <p className={`text-xs font-medium ${notifResult.ok ? 'text-emerald-500' : 'text-rose-500'}`}>{notifResult.msg}</p>}
      </div>
    </div>
  );
}
