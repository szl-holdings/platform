import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Plus,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface CourtFiling {
  id: number;
  filingType: string;
  jurisdiction: string;
  courtName?: string;
  caseNumber?: string;
  documentTitle: string;
  status: string;
  electronicFilingSystem: string;
  electronicallySupportedJurisdiction: boolean;
  dueDate?: string;
  submittedAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

interface Jurisdiction {
  key: string;
  system: string;
  name: string;
  supported: boolean;
  notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  ready: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  pending_review: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  filed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  failed: 'bg-red-600/10 text-red-500 border-red-600/20',
};

const FILING_TYPES = ['complaint', 'motion', 'answer', 'brief', 'notice', 'order', 'stipulation', 'subpoena', 'other'];

function PrepareDialog({
  jurisdictions,
  onClose,
  onPrepared,
}: {
  jurisdictions: Jurisdiction[];
  onClose: () => void;
  onPrepared: () => void;
}) {
  const [filingType, setFilingType] = useState<string>('motion');
  const [jurisdiction, setJurisdiction] = useState('US-FEDERAL');
  const [courtName, setCourtName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [dueDate, setDueDate] = useState('');

  const selectedJurisdiction = jurisdictions.find((j) => j.key === jurisdiction);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/counsel/court-filings', {
        method: 'POST',
        body: JSON.stringify({
          filingType,
          jurisdiction,
          courtName: courtName || undefined,
          caseNumber: caseNumber || undefined,
          documentTitle,
          documentUrl: documentUrl || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to prepare filing');
      return res.json();
    },
    onSuccess: () => {
      onPrepared();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f14] border border-violet-500/20 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-violet-500/10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Prepare Court Filing</h2>
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
              placeholder="e.g. Motion for Summary Judgment"
              className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Filing Type</label>
              <select
                value={filingType}
                onChange={(e) => setFilingType(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                {FILING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Jurisdiction</label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                {jurisdictions.filter((j) => j.key !== 'DEFAULT').map((j) => (
                  <option key={j.key} value={j.key}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedJurisdiction && (
            <div
              className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                selectedJurisdiction.supported
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {selectedJurisdiction.supported ? (
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              )}
              <span>{selectedJurisdiction.notes}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Court Name</label>
              <input
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                placeholder="Optional"
                className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Case Number</label>
              <input
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="Optional"
                className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
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
            <label className="block text-xs text-zinc-400 mb-1">Filing Due Date (optional)</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-400">Failed to prepare filing. Please try again.</p>
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
            disabled={!documentTitle.trim() || mutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {mutation.isPending ? 'Preparing...' : 'Prepare Filing'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourtFilingsPage() {
  const [showPrepareDialog, setShowPrepareDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: filingsData, isLoading } = useQuery<{ data: CourtFiling[] }>({
    queryKey: ['court-filings'],
    queryFn: async () => {
      const res = await apiFetch('/counsel/court-filings?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: jurisdictionsData } = useQuery<{ data: { jurisdictions: Jurisdiction[] } }>({
    queryKey: ['court-filings-jurisdictions'],
    queryFn: async () => {
      const res = await apiFetch('/counsel/court-filings/jurisdictions');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/counsel/court-filings/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ attestationAccepted: true }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['court-filings'] }),
  });

  const filings = filingsData?.data ?? [];
  const jurisdictions = jurisdictionsData?.data?.jurisdictions ?? [];

  return (
    <div className="min-h-screen bg-[#09090d] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-6 h-6 text-violet-400" />
              <h1 className="text-xl font-semibold">Court Filing Automation</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Prepare and submit electronic filings. Supports PACER, NYSCEF, CA eCourt, Tyler eFSP.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['court-filings'] })}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowPrepareDialog(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Prepare Filing
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Filings', value: filings.length, color: 'text-white' },
            { label: 'Electronic', value: filings.filter((f) => f.electronicallySupportedJurisdiction).length, color: 'text-emerald-400' },
            { label: 'Submitted', value: filings.filter((f) => ['submitted', 'accepted', 'filed'].includes(f.status)).length, color: 'text-blue-400' },
            { label: 'Pending', value: filings.filter((f) => ['draft', 'ready', 'pending_review'].includes(f.status)).length, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900/40 border border-zinc-700/30 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-zinc-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-700/30">
            <h2 className="text-sm font-medium text-zinc-200">Filings</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
            </div>
          ) : filings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No court filings yet</p>
              <p className="text-xs text-zinc-600 mt-1">Prepare a filing to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/20">
              {filings.map((filing) => (
                <div key={filing.id} className="px-5 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-white">{filing.documentTitle}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[filing.status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {filing.status.replace(/_/g, ' ')}
                        </span>
                        {filing.electronicallySupportedJurisdiction ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Globe className="w-3 h-3" /> Electronic
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                        <span>{filing.filingType.charAt(0).toUpperCase() + filing.filingType.slice(1)}</span>
                        <span>·</span>
                        <span>{filing.jurisdiction}</span>
                        {filing.courtName && <><span>·</span><span>{filing.courtName}</span></>}
                        {filing.caseNumber && <><span>·</span><span>Case #{filing.caseNumber}</span></>}
                        <span>·</span>
                        <span>{filing.electronicFilingSystem}</span>
                        <span>·</span>
                        <span>{new Date(filing.createdAt).toLocaleDateString()}</span>
                        {filing.dueDate && (
                          <>
                            <span>·</span>
                            <span className={`flex items-center gap-1 ${new Date(filing.dueDate) < new Date() ? 'text-red-400' : 'text-amber-400'}`}>
                              <Clock className="w-3 h-3" />
                              Due {new Date(filing.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {['draft', 'ready'].includes(filing.status) && (
                      <button
                        onClick={() => submitMutation.mutate(filing.id)}
                        disabled={submitMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 border border-violet-500/30 rounded-lg text-xs transition-colors shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPrepareDialog && (
        <PrepareDialog
          jurisdictions={jurisdictions}
          onClose={() => setShowPrepareDialog(false)}
          onPrepared={() => queryClient.invalidateQueries({ queryKey: ['court-filings'] })}
        />
      )}
    </div>
  );
}
