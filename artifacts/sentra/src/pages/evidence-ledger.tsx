import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookLock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Hash,
  Link as LinkIcon,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { type LedgerEntry, listEvidenceLedger, verifyLedgerIntegrity } from '@/lib/sentra-api';

const ENTRY_TYPE_COLORS: Record<string, string> = {
  detection: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  response: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  counter_move: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  approval: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  scope_violation: 'bg-red-500/20 text-red-400 border-red-500/30',
  canary_trigger: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  sentinel_action: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const OUTCOME_ICONS: Record<string, React.ReactNode> = {
  executed: <CheckCircle className="w-3 h-3 text-emerald-400" />,
  approved: <CheckCircle className="w-3 h-3 text-blue-400" />,
  rejected: <XCircle className="w-3 h-3 text-red-400" />,
  blocked: <XCircle className="w-3 h-3 text-red-400" />,
  pending: <div className="w-3 h-3 rounded-full border border-amber-400" />,
};

function shortenHash(hash: string | null | undefined): string {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

function LedgerRow({ entry, expanded, onToggle }: {
  entry: LedgerEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors">
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <span className="text-xs font-mono text-white/30 w-10 flex-shrink-0">#{entry.sequenceNumber}</span>

        <Badge className={`text-xs flex-shrink-0 ${ENTRY_TYPE_COLORS[entry.entryType] ?? 'bg-white/10 text-white/60'}`}>
          {entry.entryType.replace(/_/g, ' ')}
        </Badge>

        <div className="flex-1 min-w-0">
          <span className="text-sm text-white/90 truncate block">{entry.action}</span>
          {entry.targetId && (
            <span className="text-xs text-white/40 truncate block">{entry.targetType}: {entry.targetId}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {OUTCOME_ICONS[entry.outcome]}
          <span className="text-xs text-white/50 hidden sm:block">
            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 p-3 bg-black/20 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/40">Actor:</span>
              <span className="text-white/80 font-mono">{entry.actorType}{entry.actorId ? ` (${entry.actorId})` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40">Outcome:</span>
              <span className="text-white/80 font-mono">{entry.outcome}</span>
            </div>
            {entry.linkedEventId && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-3 h-3 text-white/30" />
                <span className="text-white/40">Event:</span>
                <span className="text-white/60 font-mono truncate">{entry.linkedEventId}</span>
              </div>
            )}
            {entry.linkedIncidentId && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-3 h-3 text-white/30" />
                <span className="text-white/40">Incident:</span>
                <span className="text-white/60 font-mono truncate">{entry.linkedIncidentId}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Hash className="w-3 h-3 text-white/30" />
              <span className="text-white/40">Hash:</span>
              <span className="text-white/60 font-mono">{shortenHash(entry.entryHash)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Hash className="w-3 h-3 text-white/20" />
              <span className="text-white/30">Prev:</span>
              <span className="text-white/40 font-mono">{shortenHash(entry.previousHash)}</span>
            </div>
          </div>

          {Object.keys(entry.details).length > 0 && (
            <pre className="text-xs text-white/50 bg-black/30 rounded p-2 overflow-auto max-h-32">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvidenceLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; brokenAt?: number; checkedEntries: number } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const data = await listEvidenceLedger(100);
      setEntries(data.entries as LedgerEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 10000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyLedgerIntegrity();
      setVerifyResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const byType = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.entryType] = (acc[e.entryType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookLock className="w-5 h-5 text-[#c9b787]" />
            Evidence Ledger — Chain of Custody
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            Append-only, SHA-256 hash-chained audit record of every defense action
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEntries}
            disabled={loading}
            className="border-white/20 text-white/70 hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={verifying}
            className="bg-[#c9b787] text-black hover:bg-[#d4c79a]"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            {verifying ? 'Verifying…' : 'Verify Integrity'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {verifyResult && (
        <Card className={`border ${verifyResult.valid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="p-4 flex items-center gap-4">
            {verifyResult.valid ? (
              <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${verifyResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                {verifyResult.valid ? 'Chain Integrity Verified' : 'Chain Integrity BROKEN'}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {verifyResult.checkedEntries} entries checked
                {verifyResult.brokenAt !== undefined && ` · Broken at sequence #${verifyResult.brokenAt}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(byType).slice(0, 4).map(([type, count]) => (
          <Card key={type} className="bg-[#1a1f2e] border border-white/10">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold font-mono ${
                ENTRY_TYPE_COLORS[type]?.replace('bg-', '').replace('/20', '').replace('text-', '') ?? ''
              } text-white`}>{count}</div>
              <div className="text-xs text-white/50 mt-0.5">{type.replace(/_/g, ' ')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white/70">Ledger Entries — Newest First</h2>
          <span className="text-xs text-white/40">{entries.length} entries</span>
        </div>

        {loading && entries.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card className="bg-[#1a1f2e] border border-white/10">
            <CardContent className="py-12 text-center">
              <BookLock className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">No ledger entries yet</p>
              <p className="text-white/30 text-xs mt-1">
                Ledger entries appear when detections fire, actions execute, or operators approve
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <LedgerRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
