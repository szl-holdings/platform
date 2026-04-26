import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSignature,
  PenLine,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface Signatory {
  email: string;
  name: string;
  role?: string;
  order?: number;
}

interface EsignatureRequest {
  id: number;
  documentTitle: string;
  status: string;
  provider: string;
  providerEnvelopeId?: string;
  signatories: Signatory[];
  expiresAt?: string;
  completedAt?: string;
  createdAt: string;
  matterId?: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  partially_signed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  declined: 'bg-red-500/10 text-red-400 border-red-500/20',
  voided: 'bg-zinc-600/10 text-zinc-500 border-zinc-600/20',
  expired: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <PenLine className="w-3 h-3" />,
  sent: <Send className="w-3 h-3" />,
  delivered: <Clock className="w-3 h-3" />,
  partially_signed: <Users className="w-3 h-3" />,
  completed: <CheckCircle2 className="w-3 h-3" />,
  declined: <X className="w-3 h-3" />,
  voided: <Trash2 className="w-3 h-3" />,
  expired: <AlertTriangle className="w-3 h-3" />,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}
    >
      {STATUS_ICONS[status]}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SendDialog({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [signatories, setSignatories] = useState<Signatory[]>([{ email: '', name: '' }]);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/counsel/esignature/send', {
        method: 'POST',
        body: JSON.stringify({
          documentTitle,
          documentUrl: documentUrl || undefined,
          signatories: signatories.filter((s) => s.email && s.name),
          message: message || undefined,
          expiresInDays,
        }),
      });
      if (!res.ok) throw new Error('Failed to send document');
      return res.json();
    },
    onSuccess: () => {
      onSent();
      onClose();
    },
  });

  const addSignatory = () => setSignatories((prev) => [...prev, { email: '', name: '' }]);
  const removeSignatory = (i: number) =>
    setSignatories((prev) => prev.filter((_, idx) => idx !== i));
  const updateSignatory = (i: number, field: keyof Signatory, value: string) =>
    setSignatories((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const validSignatories = signatories.filter((s) => s.email && s.name);
  const canSubmit = documentTitle.trim() && validSignatories.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f14] border border-violet-500/20 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-violet-500/10">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Send for Signature</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Document Title</label>
            <input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g. Engagement Letter — Acme Corp"
              className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Document URL (optional)</label>
            <input
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400">Signatories</label>
              <button
                onClick={addSignatory}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {signatories.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={s.name}
                    onChange={(e) => updateSignatory(i, 'name', e.target.value)}
                    placeholder="Full name"
                    className="flex-1 bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                  />
                  <input
                    value={s.email}
                    onChange={(e) => updateSignatory(i, 'email', e.target.value)}
                    placeholder="Email"
                    className="flex-1 bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                  />
                  {signatories.length > 1 && (
                    <button
                      onClick={() => removeSignatory(i)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-400 mb-1">Expires in (days)</label>
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
                min={1}
                max={365}
                className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Message to signatories (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Please review and sign..."
              className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-400">Failed to send. Please try again.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-violet-500/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {mutation.isPending ? 'Sending...' : 'Send for Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EsignaturePage() {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ data: EsignatureRequest[] }>({
    queryKey: ['esignature-requests'],
    queryFn: async () => {
      const res = await apiFetch('/api/counsel/esignature/requests?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const voidMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/counsel/esignature/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to void');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esignature-requests'] }),
  });

  const requests = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#09090d] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileSignature className="w-6 h-6 text-violet-400" />
              <h1 className="text-xl font-semibold">E-Signature</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Send contracts for signature via DocuSign. Track status in the matter timeline.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowSendDialog(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Send Document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: requests.length, color: 'text-white' },
            {
              label: 'Completed',
              value: requests.filter((r) => r.status === 'completed').length,
              color: 'text-emerald-400',
            },
            {
              label: 'Pending',
              value: requests.filter((r) => ['sent', 'delivered', 'partially_signed'].includes(r.status)).length,
              color: 'text-amber-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900/40 border border-zinc-700/30 rounded-xl p-4"
            >
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-zinc-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-700/30">
            <h2 className="text-sm font-medium text-zinc-200">Signature Requests</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSignature className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No signature requests yet</p>
              <p className="text-xs text-zinc-600 mt-1">
                Send a contract for signature to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/20">
              {requests.map((req) => (
                <div key={req.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {req.documentTitle}
                      </p>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {Array.isArray(req.signatories) ? req.signatories.length : 0} signatories
                      </span>
                      <span>·</span>
                      <span>
                        {req.providerEnvelopeId ? `Envelope: ${req.providerEnvelopeId}` : req.provider}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.expiresAt && (
                        <>
                          <span>·</span>
                          <span className={new Date(req.expiresAt) < new Date() ? 'text-red-400' : ''}>
                            Expires {new Date(req.expiresAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {['sent', 'delivered', 'partially_signed', 'draft'].includes(req.status) && (
                    <button
                      onClick={() => voidMutation.mutate(req.id)}
                      disabled={voidMutation.isPending}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Void
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSendDialog && (
        <SendDialog
          onClose={() => setShowSendDialog(false)}
          onSent={() => queryClient.invalidateQueries({ queryKey: ['esignature-requests'] })}
        />
      )}
    </div>
  );
}
