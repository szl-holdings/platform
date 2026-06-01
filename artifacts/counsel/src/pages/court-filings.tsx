import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
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
  timeline?: Array<{
    id: number;
    eventType: string;
    description: string;
    occurredAt: string;
  }>;
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

const JURISDICTION_TEMPLATES: Record<string, { courtHeader: string; sealLine: string; certStyle: string }> = {
  'US-FEDERAL': {
    courtHeader: 'UNITED STATES DISTRICT COURT',
    sealLine: 'Filed Electronically via PACER CM/ECF',
    certStyle: 'I hereby certify that on the date indicated below, I electronically filed the foregoing with the Clerk of Court using the CM/ECF system, which will send notification of such filing to all counsel of record registered for electronic notice.',
  },
  NY: {
    courtHeader: 'SUPREME COURT OF THE STATE OF NEW YORK',
    sealLine: 'Filed via NYSCEF — New York State Courts Electronic Filing',
    certStyle: 'I certify that this document was filed and served electronically through the NYSCEF system on all parties who have consented to electronic service.',
  },
  CA: {
    courtHeader: 'SUPERIOR COURT OF THE STATE OF CALIFORNIA',
    sealLine: 'Filed Electronically via California eCourt',
    certStyle: 'I hereby certify under penalty of perjury that the foregoing document was filed electronically through the California Courts electronic filing system and served on all parties of record.',
  },
  TX: {
    courtHeader: 'DISTRICT COURT OF THE STATE OF TEXAS',
    sealLine: 'Filed via eFileTexas (Tyler eFSP)',
    certStyle: 'I certify that a true and correct copy of the foregoing was served on all parties through the electronic filing manager in compliance with the Texas Rules of Civil Procedure.',
  },
  IL: {
    courtHeader: 'CIRCUIT COURT OF THE STATE OF ILLINOIS',
    sealLine: 'Filed Electronically via Odyssey eFileIL',
    certStyle: 'Under penalties as provided by law, I certify that the statements set forth herein are true and correct and that this filing was served via the Illinois courts e-filing system.',
  },
};

function getJurisdictionTemplate(jurisdiction: string) {
  const key = jurisdiction.toUpperCase().split('-')[0];
  return JURISDICTION_TEMPLATES[jurisdiction.toUpperCase()] ?? JURISDICTION_TEMPLATES[key] ?? {
    courtHeader: `COURT — ${jurisdiction.toUpperCase()}`,
    sealLine: 'Filed for Manual Submission',
    certStyle: 'I hereby certify that the foregoing document has been prepared for filing and that copies have been served on all parties of record.',
  };
}

function FilingPackagePreview({ filing }: { filing: CourtFiling }) {
  const template = getJurisdictionTemplate(filing.jurisdiction);
  const now = new Date();
  const filedDate = filing.submittedAt ? new Date(filing.submittedAt) : now;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.02] p-5">
        <div className="text-[10px] uppercase tracking-widest text-violet-400/50 mb-3 flex items-center gap-1.5">
          <Scale className="w-3 h-3" />
          Cover Sheet — {filing.jurisdiction}
        </div>
        <div className="font-mono text-xs text-white/70 space-y-2">
          <div className="text-center space-y-1">
            <div className="font-semibold text-violet-300 text-sm">{template.courtHeader}</div>
            {filing.courtName && (
              <div className="text-white/40 text-[11px]">{filing.courtName}</div>
            )}
            <div className="border-t border-violet-500/10 my-2" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-white/40">Case Number:</span>
              <span className="text-violet-400 font-medium">{filing.caseNumber ?? 'To be assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Filing Type:</span>
              <span className="text-violet-400 capitalize font-medium">{filing.filingType}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-white/40">Document Title:</span>
              <span className="text-violet-400 font-medium truncate max-w-[280px]">{filing.documentTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Date Filed:</span>
              <span className="text-violet-400">{filedDate.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">EFS System:</span>
              <span className="text-violet-400">{filing.electronicFilingSystem?.toUpperCase() ?? 'MANUAL'}</span>
            </div>
          </div>
          <div className="text-center text-white/25 text-[10px] pt-2 border-t border-violet-500/10 mt-2">
            {template.sealLine}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.02] p-5">
        <div className="text-[10px] uppercase tracking-widest text-violet-400/50 mb-3 flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          Exhibit Index
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-violet-500/10">
              <th className="text-left pb-2 text-white/30 font-normal">Exhibit</th>
              <th className="text-left pb-2 text-white/30 font-normal">Description</th>
              <th className="text-right pb-2 text-white/30 font-normal">Pages</th>
            </tr>
          </thead>
          <tbody className="font-mono text-white/50">
            <tr className="border-b border-violet-500/5">
              <td className="py-1.5 text-violet-400">A</td>
              <td className="py-1.5">{filing.documentTitle}</td>
              <td className="py-1.5 text-right text-white/30">—</td>
            </tr>
            <tr className="border-b border-violet-500/5">
              <td className="py-1.5 text-violet-400">B</td>
              <td className="py-1.5">Supporting Documentation</td>
              <td className="py-1.5 text-right text-white/30">—</td>
            </tr>
            <tr>
              <td className="py-1.5 text-violet-400">C</td>
              <td className="py-1.5">Certificate of Service</td>
              <td className="py-1.5 text-right text-white/30">1</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.02] p-5">
        <div className="text-[10px] uppercase tracking-widest text-violet-400/50 mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" />
          Certificate of Service
        </div>
        <div className="font-mono text-[11px] text-white/50 leading-relaxed">
          {template.certStyle}
        </div>
        <div className="mt-4 pt-3 border-t border-violet-500/10 grid grid-cols-2 gap-4 text-[11px]">
          <div>
            <div className="text-white/30 mb-1">Date</div>
            <div className="text-violet-400">{filedDate.toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-white/30 mb-1">Electronic Filing System</div>
            <div className="text-violet-400">{filing.electronicFilingSystem?.toUpperCase() ?? 'N/A'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-white/30 mb-1">Signature</div>
            <div className="text-violet-400 italic">
              /s/ ________________________________
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      return apiFetch('/counsel/court-filings', {
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

function generateFilingPackageText(filing: CourtFiling): string {
  const template = getJurisdictionTemplate(filing.jurisdiction);
  const date = filing.submittedAt ? new Date(filing.submittedAt) : new Date();
  const divider = '═'.repeat(60);
  const thinDivider = '─'.repeat(60);

  return [
    divider,
    `  ${template.courtHeader}`,
    filing.courtName ? `  ${filing.courtName}` : '',
    divider,
    '',
    `  Case Number:    ${filing.caseNumber ?? 'To be assigned'}`,
    `  Filing Type:    ${filing.filingType.charAt(0).toUpperCase() + filing.filingType.slice(1)}`,
    `  Document:       ${filing.documentTitle}`,
    `  Date Filed:     ${date.toLocaleDateString()}`,
    `  EFS System:     ${filing.electronicFilingSystem?.toUpperCase() ?? 'MANUAL'}`,
    '',
    `  ${template.sealLine}`,
    '',
    thinDivider,
    '  EXHIBIT INDEX',
    thinDivider,
    '',
    `  Exhibit A     ${filing.documentTitle}`,
    '  Exhibit B     Supporting Documentation',
    '  Exhibit C     Certificate of Service',
    '',
    thinDivider,
    '  CERTIFICATE OF SERVICE',
    thinDivider,
    '',
    `  ${template.certStyle}`,
    '',
    `  Date: ${date.toLocaleDateString()}`,
    `  Electronic Filing System: ${filing.electronicFilingSystem?.toUpperCase() ?? 'N/A'}`,
    '',
    '  /s/ ________________________________',
    '',
    divider,
    `  Generated by Counsel Filing Automation — ${new Date().toISOString()}`,
    divider,
  ].filter(Boolean).join('\n');
}

export default function CourtFilingsPage() {
  const [showPrepareDialog, setShowPrepareDialog] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<CourtFiling | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: filingsData, isLoading } = useQuery<{ data: CourtFiling[] }>({
    queryKey: ['court-filings', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      return apiFetch<{ data: CourtFiling[] }>(`/counsel/court-filings?${params}`);
    },
  });

  const { data: jurisdictionsData } = useQuery<{ data: { jurisdictions: Jurisdiction[] } }>({
    queryKey: ['court-filings-jurisdictions'],
    queryFn: async () => {
      return apiFetch<{ data: { jurisdictions: Jurisdiction[] } }>('/counsel/court-filings/jurisdictions');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/counsel/court-filings/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ attestationAccepted: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-filings'] });
      setSelectedFiling(null);
    },
  });

  const filings = filingsData?.data ?? [];
  const jurisdictions = jurisdictionsData?.data?.jurisdictions ?? [];

  const downloadPackage = (filing: CourtFiling) => {
    const text = generateFilingPackageText(filing);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filing-package-${filing.id}-${filing.jurisdiction}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              Jurisdiction-aware filing packages with cover sheets, exhibits, and certificates of service
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

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {['', 'draft', 'submitted', 'accepted', 'filed', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors border ${
                statusFilter === s
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
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
              <Loader2 className="w-5 h-5 border-violet-400 animate-spin" />
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
                <div
                  key={filing.id}
                  className="px-5 py-4 hover:bg-zinc-800/20 transition-colors cursor-pointer"
                  onClick={() => setSelectedFiling(filing)}
                >
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPackage(filing); }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-violet-400 transition-colors border border-zinc-700/30 rounded"
                        title="Download filing package"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      {['draft', 'ready'].includes(filing.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); submitMutation.mutate(filing.id); }}
                          disabled={submitMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 border border-violet-500/30 rounded-lg text-xs transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Submit
                        </button>
                      )}
                    </div>
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

      {selectedFiling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f14] border border-violet-500/20 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-violet-500/10">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Filing Package — {selectedFiling.documentTitle}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[selectedFiling.status] ?? ''}`}>
                    {selectedFiling.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {selectedFiling.jurisdiction} · {selectedFiling.filingType}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedFiling(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <FilingPackagePreview filing={selectedFiling} />

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-violet-500/10">
                <button
                  onClick={() => downloadPackage(selectedFiling)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 rounded-lg transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export Package
                </button>
                {['draft', 'ready'].includes(selectedFiling.status) && (
                  <button
                    onClick={() => submitMutation.mutate(selectedFiling.id)}
                    disabled={submitMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Submit to Court
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
