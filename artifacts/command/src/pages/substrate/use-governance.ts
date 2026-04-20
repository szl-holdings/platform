/**
 * Hooks for the ACR Governed Approval Interrupts and Run Ledger API.
 *
 * These talk to:
 *   GET  /api/v1/approvals
 *   GET  /api/v1/approvals/:id
 *   POST /api/v1/approvals/:id/decide
 *   GET  /api/v1/runs/:id/ledger
 *   GET  /api/v1/runs?traceId=...
 */
import { useCallback, useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';
import type {
  ApprovalDecision,
  ApprovalRequest,
  QualityGateResult,
  RunLedgerEntry,
} from './governance-types';

// ─── Governed approvals ───────────────────────────────────────────────────────

export interface UseGovernedApprovalsResult {
  approvals: ApprovalRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGovernedApprovals(
  status?: 'pending' | 'approved' | 'denied' | 'escalated' | 'timed_out',
): UseGovernedApprovalsResult {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    setError(null);
    const url = apiUrl(`/v1/approvals${status ? `?status=${status}` : ''}`);
    fetchJson<ApprovalRequest[] | { data: ApprovalRequest[] }>(url)
      .then((res) => {
        const items = Array.isArray(res) ? res : ((res as { data: ApprovalRequest[] }).data ?? []);
        setApprovals(items);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { approvals, loading, error, refetch: fetch_ };
}

export interface DecideApprovalPayload {
  verdict: 'approve' | 'deny' | 'escalate';
  actor: string;
  reason: string;
}

export interface DecideApprovalResult {
  decision: ApprovalDecision;
  request: ApprovalRequest;
  governanceMemory: unknown;
}

export async function decideGovernedApproval(
  requestId: string,
  payload: DecideApprovalPayload,
): Promise<DecideApprovalResult> {
  const url = apiUrl(`/v1/approvals/${requestId}/decide`);
  return fetchJson<DecideApprovalResult>(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Run Ledger ───────────────────────────────────────────────────────────────

export interface UseRunLedgerResult {
  entry: RunLedgerEntry | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRunLedger(runId: string | null): UseRunLedgerResult {
  const [entry, setEntry] = useState<RunLedgerEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    fetchJson<RunLedgerEntry>(apiUrl(`/v1/runs/${runId}/ledger`))
      .then(setEntry)
      .catch((err: Error) => {
        if ((err as Error & { httpStatus?: number }).httpStatus === 404) {
          setEntry(null);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [runId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { entry, loading, error, refetch: fetch_ };
}

export interface UseRunLedgerListResult {
  entries: RunLedgerEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRunLedgerList(opts?: {
  traceId?: string;
  gateStatus?: RunLedgerEntry['gateStatus'];
}): UseRunLedgerListResult {
  const [entries, setEntries] = useState<RunLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (opts?.traceId) params.set('traceId', opts.traceId);
    if (opts?.gateStatus) params.set('gateStatus', opts.gateStatus);
    const qs = params.toString();
    fetchJson<RunLedgerEntry[] | { data: RunLedgerEntry[] }>(
      apiUrl(`/v1/runs${qs ? `?${qs}` : ''}`),
    )
      .then((res) => {
        const items = Array.isArray(res) ? res : ((res as { data: RunLedgerEntry[] }).data ?? []);
        setEntries(items);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [opts?.traceId, opts?.gateStatus]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { entries, loading, error, refetch: fetch_ };
}
