import type {
  ExecutiveTrustSummary,
  ReceiptSummary,
  TrustReceipt,
  TrustReceiptGraph,
} from '@szl-holdings/receipt-graph';
import { useState } from 'react';

function confidenceColor(score: number): string {
  if (score >= 0.8) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 0.6) return 'text-amber-600 dark:text-amber-400';
  if (score >= 0.4) return 'text-orange-600 dark:text-orange-400';
  return 'text-rose-600 dark:text-rose-400';
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'rejected':
    case 'retracted':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    case 'pending_review':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }
}

function policyBadgeClass(policy: string): string {
  switch (policy) {
    case 'auto_approve':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'blocked':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    case 'require_executive':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'require_dual_sign':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }
}

export interface ReceiptDrawerProps {
  receipt: TrustReceipt | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptDrawer({ receipt, open, onClose }: ReceiptDrawerProps) {
  if (!receipt || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
              RECEIPT GRAPH
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trust Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Content
              </div>
              <div className="text-sm font-mono text-slate-800 dark:text-slate-200 truncate">
                {receipt.contentType}:{receipt.contentId}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Receipt Class
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {receipt.receiptClass}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Status
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass(receipt.status)}`}
              >
                {receipt.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Policy Class
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${policyBadgeClass(receipt.policyClass)}`}
              >
                {receipt.policyClass.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Confidence
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`text-3xl font-bold tabular-nums ${confidenceColor(receipt.confidenceScore)}`}
              >
                {(receipt.confidenceScore * 100).toFixed(0)}%
              </div>
              <div>
                <div
                  className={`text-sm font-semibold capitalize ${confidenceColor(receipt.confidenceScore)}`}
                >
                  {receipt.confidenceTier}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Confidence tier</div>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${receipt.confidenceScore >= 0.8 ? 'bg-emerald-500' : receipt.confidenceScore >= 0.6 ? 'bg-amber-500' : receipt.confidenceScore >= 0.4 ? 'bg-orange-500' : 'bg-rose-500'}`}
                style={{ width: `${receipt.confidenceScore * 100}%` }}
              />
            </div>
          </div>

          {receipt.modelId && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Model Attribution
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Model:</span>{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {receipt.modelId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Provider:</span>{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {receipt.modelProvider ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Lane:</span>{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {receipt.modelLane ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Prompt hash:</span>{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {receipt.promptHash ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {receipt.whatWasSeen.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                What Was Seen
              </div>
              <div className="space-y-1">
                {receipt.whatWasSeen.map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-slate-400 dark:text-slate-600 text-xs font-mono">
                      {src.type}
                    </span>
                    <span>{src.label ?? src.id}</span>
                    {src.relevanceScore != null && (
                      <span className="ml-auto text-xs text-slate-500">
                        {(src.relevanceScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {receipt.whatWasUsed.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                What Was Used
              </div>
              <div className="space-y-1">
                {receipt.whatWasUsed.map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-slate-400 dark:text-slate-600 text-xs font-mono">
                      {src.type}
                    </span>
                    <span>{src.label ?? src.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {receipt.whatWasIgnored.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                What Was Ignored
              </div>
              <div className="space-y-1">
                {receipt.whatWasIgnored.map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-1 border-b border-slate-100 dark:border-slate-800 opacity-60"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                    <span className="text-xs font-mono">{src.type}</span>
                    <span>{src.label ?? src.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {receipt.assumptions.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Assumptions
              </div>
              <div className="space-y-2">
                {receipt.assumptions.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3 text-sm"
                  >
                    <div className="font-medium text-amber-900 dark:text-amber-200">
                      {a.statement}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">{a.basis}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Confidence impact: {a.confidenceImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {receipt.postExecutionDeltas.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Post-Execution Deltas
              </div>
              <div className="space-y-2">
                {receipt.postExecutionDeltas.map((d, i) => (
                  <div
                    key={i}
                    className="text-sm font-mono bg-slate-50 dark:bg-slate-800 rounded p-3 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {d.field}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-slate-500">before:</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        {JSON.stringify(d.before)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500">after:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {JSON.stringify(d.after)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {d.changedAt instanceof Date
                        ? d.changedAt.toISOString()
                        : String(d.changedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono space-y-1 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div>Receipt ID: {receipt.id}</div>
            {receipt.correlationId && <div>Correlation: {receipt.correlationId}</div>}
            {receipt.traceId && <div>Trace: {receipt.traceId}</div>}
            <div>
              Created:{' '}
              {receipt.createdAt instanceof Date
                ? receipt.createdAt.toISOString()
                : String(receipt.createdAt)}
            </div>
            <div>
              Export safe:{' '}
              <span className={receipt.exportSafe ? 'text-emerald-500' : 'text-rose-500'}>
                {receipt.exportSafe ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ProvenanceBadgeProps {
  receiptSummary?: ReceiptSummary | null;
  onClick?: () => void;
  compact?: boolean;
}

export function ProvenanceBadge({
  receiptSummary,
  onClick,
  compact = false,
}: ProvenanceBadgeProps) {
  if (!receiptSummary) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        No provenance
      </span>
    );
  }

  const conf = receiptSummary.confidenceScore;
  const exportSafe = receiptSummary.exportSafe;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors hover:opacity-80 cursor-pointer ${
        exportSafe
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      }`}
      title={`Receipt: ${receiptSummary.id}\nClass: ${receiptSummary.receiptClass}\nPolicy: ${receiptSummary.policyClass}\nConfidence: ${(conf * 100).toFixed(0)}%`}
    >
      <span>{exportSafe ? '✓' : '⚠'}</span>
      {!compact && <span>RECEIPT</span>}
      <span>{(conf * 100).toFixed(0)}%</span>
    </button>
  );
}

export interface ExecutiveTrustSummaryPanelProps {
  summary: ExecutiveTrustSummary;
}

export function ExecutiveTrustSummaryPanel({ summary }: ExecutiveTrustSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6">
      <div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
          RECEIPT GRAPH
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Executive Trust Summary
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {summary.totalReceipts} receipts in last {Math.round(summary.windowMs / 3_600_000)}h
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.totalReceipts}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Receipts</div>
        </div>
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {summary.exportSafeCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Export Safe</div>
        </div>
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4 text-center">
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {summary.exportBlockedCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Export Blocked</div>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {summary.pendingApprovalCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending Review</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Average Confidence
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`text-3xl font-bold tabular-nums ${confidenceColor(summary.averageConfidence)}`}
          >
            {(summary.averageConfidence * 100).toFixed(1)}%
          </div>
          <div className="flex-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${summary.averageConfidence >= 0.8 ? 'bg-emerald-500' : summary.averageConfidence >= 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${summary.averageConfidence * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{summary.highConfidenceCount} high</span>
              <span>{summary.lowConfidenceCount} low/uncertain</span>
            </div>
          </div>
        </div>
      </div>

      {summary.recentReceipts.length > 0 && (
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Recent Receipts
          </div>
          <div className="space-y-1">
            {summary.recentReceipts.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 text-sm"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${r.exportSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                />
                <span className="text-slate-600 dark:text-slate-400 capitalize text-xs">
                  {r.receiptClass}
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 truncate flex-1">
                  {r.contentType}:{r.contentId}
                </span>
                <span className={`text-xs font-semibold ${confidenceColor(r.confidenceScore)}`}>
                  {(r.confidenceScore * 100).toFixed(0)}%
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${statusBadgeClass(r.status)}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface ProvenanceViewerProps {
  graph: TrustReceiptGraph;
  onSelectReceipt?: (receiptId: string) => void;
}

export function ProvenanceViewer({ graph, onSelectReceipt }: ProvenanceViewerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
    onSelectReceipt?.(id);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
      <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
        RECEIPT GRAPH
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Provenance Graph</h3>
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {graph.receipts.length} receipts · {graph.edges.length} edges · depth {graph.depth}
      </div>

      <div className="space-y-2">
        {graph.receipts.map((receipt) => {
          const childEdges = graph.edges.filter((e) => e.parentId === receipt.id);
          const parentEdges = graph.edges.filter((e) => e.childId === receipt.id);
          const isRoot = receipt.id === graph.rootReceiptId;
          const isSelected = receipt.id === selectedId;

          return (
            <button
              key={receipt.id}
              onClick={() => handleSelect(receipt.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isRoot
                    ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRoot && (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      ROOT
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {receipt.receiptClass}
                  </span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {receipt.id.slice(0, 8)}…
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${confidenceColor(receipt.confidenceScore)}`}
                  >
                    {(receipt.confidenceScore * 100).toFixed(0)}%
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${statusBadgeClass(receipt.status)}`}
                  >
                    {receipt.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {(childEdges.length > 0 || parentEdges.length > 0) && (
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {parentEdges.length > 0 && <span>↑ {parentEdges.length} parent(s) · </span>}
                  {childEdges.length > 0 && <span>↓ {childEdges.length} child(ren)</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {graph.edges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Relationships
          </div>
          <div className="space-y-1">
            {graph.edges.map((edge, i) => (
              <div key={i} className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {edge.parentId.slice(0, 8)} →
                <span className="text-slate-400 dark:text-slate-500 italic mx-1">
                  {edge.relationship}
                </span>
                → {edge.childId.slice(0, 8)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
