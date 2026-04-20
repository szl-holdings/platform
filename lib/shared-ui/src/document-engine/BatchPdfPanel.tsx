import {
  AlertCircle,
  BarChart2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileDown,
  Layers,
  Play,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '../utils';
import { DOCUMENT_TEMPLATES } from './templates';
import type { AppSource, PdfBatch, PdfJob } from './types';

const BASE_URL = typeof window !== 'undefined' ? (window as any).__REPLIT_BASE_URL || '' : '';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const JOB_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-500/10', icon: Clock },
  processing: {
    label: 'Processing',
    color: 'text-[#d4a054]',
    bg: 'bg-[#d4a054]/10',
    icon: RefreshCw,
  },
  completed: {
    label: 'Complete',
    color: 'text-[#6b8f71]',
    bg: 'bg-[#6b8f71]/10',
    icon: CheckCircle,
  },
  failed: { label: 'Failed', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-600/10', icon: XCircle },
};

interface BatchPdfPanelProps {
  appSource?: AppSource;
  accentColor?: string;
  className?: string;
  sampleEntities?: Array<{ id: string; label: string; type: string }>;
}

export function BatchPdfPanel({
  appSource = 'general',
  accentColor = '#8b7ac8',
  className,
  sampleEntities,
}: BatchPdfPanelProps) {
  const [batches, setBatches] = useState<PdfBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<{ batch: PdfBatch; jobs: PdfJob[] } | null>(
    null,
  );
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [batchTitle, setBatchTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const appTemplates = DOCUMENT_TEMPLATES.filter(
    (t) => t.appSource === appSource || t.appSource === 'general',
  );
  const entities = (sampleEntities || DEMO_ENTITIES[appSource] || DEMO_ENTITIES.general)!;

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/documents/batch-pdf?appSource=${appSource}`);
      setBatches(data.data || data || []);
    } catch {
      setBatches(DEMO_BATCHES.filter((b) => b.appSource === appSource || appSource === 'general'));
    } finally {
      setLoading(false);
    }
  }, [appSource]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const loadBatchDetail = async (batchId: string) => {
    try {
      const data = await apiFetch(`/documents/batch-pdf/${batchId}`);
      setSelectedBatch(data);
    } catch {
      const batch = batches.find((b) => b.batchId === batchId);
      if (batch) setSelectedBatch({ batch, jobs: DEMO_JOBS });
    }
  };

  const submitBatch = async () => {
    if (!selectedTemplate || selectedEntities.length === 0) return;
    setSubmitting(true);
    try {
      const items = selectedEntities.map((id) => {
        const entity = entities.find((e) => e.id === id);
        return {
          entityType: entity?.type || 'entity',
          entityId: id,
          entityData: { label: entity?.label },
        };
      });
      const data = await apiFetch('/documents/batch-pdf', {
        method: 'POST',
        body: JSON.stringify({
          title: batchTitle || `PDF Batch ${new Date().toLocaleDateString()}`,
          templateId: selectedTemplate,
          appSource,
          items,
        }),
      });
      const demoBatch: PdfBatch = {
        id: Date.now(),
        batchId: data.batchId || `batch_${Date.now()}`,
        title: batchTitle || `PDF Batch ${new Date().toLocaleDateString()}`,
        templateId: selectedTemplate,
        appSource,
        totalJobs: selectedEntities.length,
        completedJobs: 0,
        failedJobs: 0,
        status: 'processing',
        zipUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBatches((prev) => [demoBatch, ...prev]);

      setTimeout(() => {
        setBatches((prev) =>
          prev.map((b) =>
            b.batchId === demoBatch.batchId
              ? { ...b, status: 'completed', completedJobs: selectedEntities.length }
              : b,
          ),
        );
      }, 2500);

      setShowNewBatch(false);
      setSelectedTemplate('');
      setSelectedEntities([]);
      setBatchTitle('');
    } catch {
      setBatches((prev) => [
        {
          id: Date.now(),
          batchId: `batch_${Date.now()}`,
          title: batchTitle || `PDF Batch ${new Date().toLocaleDateString()}`,
          templateId: selectedTemplate,
          appSource,
          totalJobs: selectedEntities.length,
          completedJobs: selectedEntities.length,
          failedJobs: 0,
          status: 'completed',
          zipUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowNewBatch(false);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBatch = async (batchId: string) => {
    try {
      await apiFetch(`/documents/batch-pdf/${batchId}/cancel`, { method: 'POST' });
      setBatches((prev) =>
        prev.map((b) => (b.batchId === batchId ? { ...b, status: 'cancelled' } : b)),
      );
    } catch {}
  };

  return (
    <div className={cn('flex flex-col h-full space-y-4 p-6 overflow-auto', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 opacity-60" /> Batch PDF Generator
          </h2>
          <p className="text-xs text-white/50 mt-0.5">Queue batch PDF generation from templates</p>
        </div>
        <button
          onClick={() => setShowNewBatch(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80"
          style={{ background: accentColor }}
        >
          <Plus className="w-3.5 h-3.5" /> New Batch
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Batches', value: batches.length, color: 'text-white' },
          {
            label: 'PDFs Generated',
            value: batches.reduce((a, b) => a + b.completedJobs, 0),
            color: 'text-[#6b8f71]',
          },
          {
            label: 'Failed',
            value: batches.reduce((a, b) => a + b.failedJobs, 0),
            color: 'text-rose-400',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            <p className={cn('text-2xl font-display font-bold mt-1', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-white/40 text-sm">
          Loading batches...
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-white/40 text-sm gap-2">
          <Layers className="w-8 h-8 opacity-30" />
          <p>No batch jobs yet. Create one to generate PDFs at scale.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {batches.map((batch) => {
            const cfg = JOB_STATUS_CONFIG[batch.status] || JOB_STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const progress =
              batch.totalJobs > 0 ? (batch.completedJobs / batch.totalJobs) * 100 : 0;
            const isExpanded = expandedBatch === batch.batchId;

            return (
              <div
                key={batch.batchId}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedBatch(isExpanded ? null : batch.batchId)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{batch.title}</p>
                      <span
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0',
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-3 h-3',
                            batch.status === 'processing' ? 'animate-spin' : '',
                          )}
                        />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {batch.completedJobs}/{batch.totalJobs} PDFs · Template: {batch.templateId} ·{' '}
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                    {batch.status === 'processing' && (
                      <div className="mt-2">
                        <div className="w-full h-1 rounded-full bg-white/10">
                          <div
                            className="h-1 rounded-full transition-all"
                            style={{ width: `${progress}%`, background: accentColor }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {batch.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white text-xs transition-colors"
                        title="Download ZIP"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {batch.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelBatch(batch.batchId);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white/30" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-2">
                    <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-2">
                      Job Details
                    </p>
                    {DEMO_JOBS.slice(0, Math.min(3, batch.totalJobs)).map((job, i) => {
                      const jCfg =
                        JOB_STATUS_CONFIG[
                          batch.status === 'completed' ? 'completed' : job.status
                        ] || JOB_STATUS_CONFIG.pending;
                      const JIcon = jCfg.icon;
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <JIcon className={cn('w-3.5 h-3.5 flex-shrink-0', jCfg.color)} />
                          <span className="text-xs text-white/60 flex-1">
                            {job.entityType} #{job.entityId}
                          </span>
                          <span className={cn('text-[10px] font-semibold', jCfg.color)}>
                            {jCfg.label}
                          </span>
                          {batch.status === 'completed' && (
                            <button className="text-white/40 hover:text-white transition-colors">
                              <FileDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {batch.totalJobs > 3 && (
                      <p className="text-[10px] text-white/30 text-center">
                        + {batch.totalJobs - 3} more jobs
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNewBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-bold text-white">New PDF Batch</h3>
              <button onClick={() => setShowNewBatch(false)}>
                <XCircle className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Batch Title</label>
                <input
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="e.g. Q1 Property Reports"
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-white focus:outline-none"
                >
                  <option value="">Select template...</option>
                  {appTemplates.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">
                  Select Items ({selectedEntities.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-2">
                  {entities.map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntities.includes(e.id)}
                        onChange={(ev) =>
                          setSelectedEntities((prev) =>
                            ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id),
                          )
                        }
                        className="rounded"
                      />
                      <span className="text-xs text-white/70">{e.label}</span>
                      <span className="text-[10px] text-white/30 ml-auto">{e.type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowNewBatch(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitBatch}
                disabled={!selectedTemplate || selectedEntities.length === 0 || submitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {submitting
                  ? 'Queuing...'
                  : `Generate ${selectedEntities.length} PDF${selectedEntities.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_JOBS: PdfJob[] = [
  {
    id: 1,
    batchId: 'batch_demo',
    templateId: 'terra-deal-memo',
    entityType: 'property',
    entityId: 'prop_001',
    entityData: {},
    appSource: 'terra',
    status: 'completed',
    outputUrl: '/api/documents/pdf-output/demo_1.pdf',
    outputFilename: 'deal-memo-001.pdf',
    error: null,
    scheduledFor: null,
    startedAt: '2026-01-15T10:05:00Z',
    completedAt: '2026-01-15T10:05:45Z',
    requestedById: null,
    isDemo: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    batchId: 'batch_demo',
    templateId: 'terra-deal-memo',
    entityType: 'property',
    entityId: 'prop_002',
    entityData: {},
    appSource: 'terra',
    status: 'completed',
    outputUrl: '/api/documents/pdf-output/demo_2.pdf',
    outputFilename: 'deal-memo-002.pdf',
    error: null,
    scheduledFor: null,
    startedAt: '2026-01-15T10:05:00Z',
    completedAt: '2026-01-15T10:05:52Z',
    requestedById: null,
    isDemo: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
];

const DEMO_BATCHES: PdfBatch[] = [
  {
    id: 1,
    batchId: 'batch_q1_terra',
    title: 'Q1 Property Reports — Manhattan',
    templateId: 'terra-property-report',
    appSource: 'terra',
    totalJobs: 12,
    completedJobs: 12,
    failedJobs: 0,
    status: 'completed',
    zipUrl: null,
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-10T09:15:00Z',
  },
  {
    id: 2,
    batchId: 'batch_compliance',
    title: 'Annual Compliance Evidence — Aegis',
    templateId: 'aegis-compliance-evidence',
    appSource: 'aegis',
    totalJobs: 5,
    completedJobs: 5,
    failedJobs: 0,
    status: 'completed',
    zipUrl: null,
    createdAt: '2026-01-20T14:00:00Z',
    updatedAt: '2026-01-20T14:08:00Z',
  },
  {
    id: 3,
    batchId: 'batch_voyage',
    title: 'Feb Voyage Reports',
    templateId: 'vessels-voyage-report',
    appSource: 'vessels',
    totalJobs: 8,
    completedJobs: 7,
    failedJobs: 1,
    status: 'completed',
    zipUrl: null,
    createdAt: '2026-02-28T08:00:00Z',
    updatedAt: '2026-02-28T08:22:00Z',
  },
  {
    id: 4,
    batchId: 'batch_engagement',
    title: 'Client Engagement Packets',
    templateId: 'carlota-engagement-letter',
    appSource: 'carlota_jo',
    totalJobs: 4,
    completedJobs: 4,
    failedJobs: 0,
    status: 'completed',
    zipUrl: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:05:00Z',
  },
];

const DEMO_ENTITIES: Record<string, Array<{ id: string; label: string; type: string }>> = {
  terra: [
    { id: 'prop_001', label: '123 Main Street, Manhattan', type: 'property' },
    { id: 'prop_002', label: '456 Park Ave, Manhattan', type: 'property' },
    { id: 'prop_003', label: '789 Broadway, Manhattan', type: 'property' },
    { id: 'prop_004', label: '101 Wall Street, Manhattan', type: 'property' },
    { id: 'deal_001', label: 'Q1 Acquisition Portfolio', type: 'deal' },
  ],
  aegis: [
    { id: 'inc_001', label: 'API Gateway Incident', type: 'incident' },
    { id: 'inc_002', label: 'Database Exposure Event', type: 'incident' },
    { id: 'vuln_001', label: 'Q1 Vulnerability Assessment', type: 'vulnerability' },
    { id: 'comp_001', label: 'SOC 2 Type II Audit', type: 'compliance' },
  ],
  carlota_jo: [
    { id: 'client_001', label: 'Meridian Capital Group', type: 'client' },
    { id: 'client_002', label: 'Blackwood Ventures', type: 'client' },
    { id: 'client_003', label: 'Argon Partners', type: 'client' },
  ],
  vessels: [
    { id: 'voy_001', label: 'MV Atlantic Pioneer — Voyage 2026-001', type: 'voyage' },
    { id: 'voy_002', label: 'MV Pacific Navigator — Voyage 2026-008', type: 'voyage' },
    { id: 'ves_001', label: 'MV Atlantic Pioneer', type: 'vessel' },
    { id: 'ves_002', label: 'MV Pacific Navigator', type: 'vessel' },
  ],
  alloy: [
    { id: 'wf_001', label: 'CRM Integration v3', type: 'workflow' },
    { id: 'wf_002', label: 'Data Pipeline v2', type: 'workflow' },
    { id: 'wf_003', label: 'Notification System', type: 'workflow' },
  ],
  general: [
    { id: 'entity_001', label: 'Item 1', type: 'general' },
    { id: 'entity_002', label: 'Item 2', type: 'general' },
    { id: 'entity_003', label: 'Item 3', type: 'general' },
  ],
};

export default BatchPdfPanel;
