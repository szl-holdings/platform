/**
 * ROSIE Mobile Command — HITL approvals + live receipt chain.
 *
 * Operator surface for the Governed Decision Fabric. Surfaces:
 *   1. Pending solve queue from /api/rosie/solve/queue with one-tap
 *      Approve / Reject buttons (POSTs to the requireAnyAuth-gated
 *      /approve and /reject routes). Without a session the calls will
 *      401; the surface still exercises the live HITL endpoints.
 *   2. The hash-chained receipt stream from /api/rosie/receipts with a
 *      chain-verify action that re-walks every link via /receipts/verify.
 *   3. Live ingest pills (GitHub / arXiv / HuggingFace) wired to
 *      /api/rosie/ingest/status.
 *
 * Uses raw fetch — no workspace clients — so the screen ships standalone.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const API_ROOT = (() => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : '/api';
})();
const API_BASE = `${API_ROOT}/rosie`;

type AnyReceipt = {
  receiptId: string;
  kind: 'solve' | 'ingest' | 'narration';
  createdAt: string;
  prevHash: string;
  receiptHash: string;
  templateName?: string;
  energy?: number;
  source?: string;
  itemCount?: number;
  errorCount?: number;
  provider?: string;
  model?: string;
  narrative?: string;
};

type QueueEntry = {
  id: string;
  templateId: string;
  seed: number;
  sweeps: number;
  proposedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
  rejectionReason?: string;
  receiptId?: string;
};

type IngestStatus = {
  github?: { lastRun: string | null; repoCount: number; errorCount: number };
  arxiv?: { lastRun: string | null; paperCount: number; errorCount: number };
  huggingface?: { lastRun: string | null; modelCount: number; errorCount: number };
  cadenceMs?: number;
};

type ResearchDigest = {
  generatedAt: string;
  repos: Array<{ repo: string; stars: number; openIssues: number; digest: string; releases: Array<{ tag: string; name: string; publishedAt: string }> }>;
  recentPapers: Array<{ id: string; title: string; published: string }>;
  recentModels: Array<{ id: string; downloads: number; likes: number }>;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = (await r.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return body.data as T;
}

async function apiRoot<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = (await r.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return body.data as T;
}

type GenericApproval = {
  id: number;
  status: string;
  topic?: string;
  summary?: string;
  requestedAt?: string;
  requestedBy?: string;
};

export default function RosieCommand() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [receipts, setReceipts] = useState<AnyReceipt[]>([]);
  const [ingest, setIngest] = useState<IngestStatus>({});
  const [digest, setDigest] = useState<ResearchDigest | null>(null);
  const [approvals, setApprovals] = useState<GenericApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, r, ig, dg, ap] = await Promise.all([
        api<QueueEntry[]>('/solve/queue'),
        api<AnyReceipt[]>('/receipts?kind=all'),
        api<IngestStatus>('/ingest/status'),
        api<ResearchDigest>('/research/digest').catch(() => null),
        apiRoot<GenericApproval[]>('/approvals?status=pending').catch(() => [] as GenericApproval[]),
      ]);
      setQueue(q);
      setReceipts(r);
      setIngest(ig);
      if (dg) setDigest(dg);
      setApprovals(ap);
    } catch (err) {
      console.warn('[rosie-mobile] load failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 12_000);
    return () => clearInterval(t);
  }, [load]);

  const pending = useMemo(() => queue.filter((q) => q.status === 'pending'), [queue]);

  const decideApproval = useCallback(
    async (id: number, decision: 'approved' | 'rejected') => {
      const busyKey = `approval:${id}`;
      setBusyId(busyKey);
      try {
        await apiRoot(`/approvals/${id}/review`, {
          method: 'POST',
          body: JSON.stringify({ decision, note: `${decision} from rosie mobile command` }),
        });
        await load();
      } catch (err) {
        Alert.alert(`${decision} failed`, String((err as Error).message));
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const approve = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await api(`/solve/queue/${id}/approve`, { method: 'POST' });
        await load();
      } catch (err) {
        Alert.alert('Approve failed', String((err as Error).message));
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const reject = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await api(`/solve/queue/${id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason: 'rejected from mobile command' }),
        });
        await load();
      } catch (err) {
        Alert.alert('Reject failed', String((err as Error).message));
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const verifyChain = useCallback(async () => {
    setVerifyMsg('verifying…');
    try {
      const v = await api<{ verified: boolean; chainLength: number; brokenAt?: string }>(
        '/receipts/verify',
        { method: 'POST', body: '{}' },
      );
      setVerifyMsg(
        v.verified
          ? `chain ok — ${v.chainLength} link(s)`
          : `BROKEN at ${v.brokenAt ?? 'unknown'}`,
      );
    } catch (err) {
      setVerifyMsg(`verify failed: ${(err as Error).message}`);
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#7dd3fc" />
        <Text style={styles.muted}>connecting to ROSIE…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 64 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7dd3fc" />}
    >
      <Text style={styles.h1}>ROSIE</Text>
      <Text style={styles.subtitle}>Governed Decision Fabric — Mobile Command</Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Generic Approval Queue</Text>
        <Text style={styles.muted}>{approvals.length} cross-artifact items pending</Text>
        {approvals.length === 0 ? (
          <Text style={[styles.muted, { marginTop: 8 }]}>no generic approvals pending.</Text>
        ) : (
          approvals.slice(0, 8).map((a) => {
            const key = `approval:${a.id}`;
            return (
              <View key={a.id} style={styles.queueRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueTitle}>#{a.id} · {a.topic ?? 'approval'}</Text>
                  <Text style={styles.muted} numberOfLines={2}>
                    {a.summary ?? a.status}
                    {a.requestedBy ? ` · ${a.requestedBy}` : ''}
                  </Text>
                </View>
                <Pressable
                  style={[styles.btn, styles.btnApprove, busyId === key && styles.btnBusy]}
                  onPress={() => decideApproval(a.id, 'approved')}
                  disabled={busyId === key}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnReject, busyId === key && styles.btnBusy]}
                  onPress={() => decideApproval(a.id, 'rejected')}
                  disabled={busyId === key}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>ROSIE Solve Queue</Text>
        <Text style={styles.muted}>{pending.length} awaiting operator decision</Text>
        {pending.length === 0 ? (
          <Text style={[styles.muted, { marginTop: 8 }]}>queue clear — no pending solves.</Text>
        ) : (
          pending.map((q) => (
            <View key={q.id} style={styles.queueRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueTitle}>{q.templateId}</Text>
                <Text style={styles.muted}>
                  seed {q.seed} · {q.sweeps} sweeps · proposed {new Date(q.proposedAt).toLocaleTimeString()}
                </Text>
              </View>
              <Pressable
                style={[styles.btn, styles.btnApprove, busyId === q.id && styles.btnBusy]}
                onPress={() => approve(q.id)}
                disabled={busyId === q.id}
              >
                <Text style={styles.btnText}>Approve</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnReject, busyId === q.id && styles.btnBusy]}
                onPress={() => reject(q.id)}
                disabled={busyId === q.id}
              >
                <Text style={styles.btnText}>Reject</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.h2}>Covenant Proof Chain</Text>
          <Pressable style={[styles.btn, styles.btnVerify]} onPress={verifyChain}>
            <Text style={styles.btnText}>Verify Chain</Text>
          </Pressable>
        </View>
        {verifyMsg ? <Text style={styles.muted}>{verifyMsg}</Text> : null}
        <Text style={styles.muted}>{receipts.length} receipts</Text>
        {receipts.slice(0, 12).map((r) => (
          <View key={r.receiptId} style={styles.receiptRow}>
            <Text style={[styles.kind, kindStyle(r.kind)]}>{r.kind}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.receiptTitle}>{receiptLabel(r)}</Text>
              <Text style={styles.hash}>{r.receiptHash.slice(0, 24)}…</Text>
            </View>
          </View>
        ))}
      </View>

      {digest && (
        <View style={styles.card}>
          <Text style={styles.h2}>Research Digest</Text>
          <Text style={styles.muted}>
            generated {new Date(digest.generatedAt).toLocaleTimeString()} · narrator-only
          </Text>
          {digest.repos.slice(0, 4).map((r) => (
            <View key={r.repo} style={styles.receiptRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptTitle}>{r.repo}</Text>
                <Text style={styles.muted}>{r.digest}</Text>
                {r.releases[0] ? (
                  <Text style={styles.hash}>last release: {r.releases[0].tag}</Text>
                ) : null}
              </View>
            </View>
          ))}
          {digest.recentPapers.slice(0, 3).map((p) => (
            <View key={p.id} style={styles.receiptRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptTitle} numberOfLines={2}>{p.title}</Text>
                <Text style={styles.hash}>{p.id} · {p.published.slice(0, 10)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.h2}>Live Ingest</Text>
        <View style={styles.pillRow}>
          <Pill label="GitHub" count={ingest.github?.repoCount ?? 0} errors={ingest.github?.errorCount ?? 0} />
          <Pill label="arXiv" count={ingest.arxiv?.paperCount ?? 0} errors={ingest.arxiv?.errorCount ?? 0} />
          <Pill label="HuggingFace" count={ingest.huggingface?.modelCount ?? 0} errors={ingest.huggingface?.errorCount ?? 0} />
        </View>
      </View>
    </ScrollView>
  );
}

function Pill({ label, count, errors }: { label: string; count: number; errors: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillCount}>{count}</Text>
      {errors > 0 ? <Text style={styles.pillErr}>{errors} err</Text> : null}
    </View>
  );
}

function receiptLabel(r: AnyReceipt): string {
  if (r.kind === 'solve') return `${r.templateName ?? 'solve'} · E=${r.energy?.toFixed(3) ?? '–'}`;
  if (r.kind === 'ingest') return `${r.source ?? 'ingest'} · ${r.itemCount ?? 0} items`;
  if (r.kind === 'narration') return `${r.provider}/${r.model}`;
  return r.kind;
}

function kindStyle(kind: AnyReceipt['kind']) {
  if (kind === 'solve') return { backgroundColor: '#1e3a8a', color: '#bfdbfe' };
  if (kind === 'ingest') return { backgroundColor: '#064e3b', color: '#a7f3d0' };
  return { backgroundColor: '#4c1d95', color: '#ddd6fe' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1120' },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { color: '#f8fafc', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h2: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#94a3b8', marginBottom: 16 },
  muted: { color: '#94a3b8', fontSize: 12 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderColor: '#1e293b',
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopColor: '#1e293b',
    borderTopWidth: 1,
    gap: 6,
  },
  queueTitle: { color: '#e2e8f0', fontWeight: '600', marginBottom: 2 },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopColor: '#1e293b',
    borderTopWidth: 1,
    gap: 8,
  },
  receiptTitle: { color: '#e2e8f0', fontWeight: '600' },
  hash: { color: '#64748b', fontFamily: 'monospace', fontSize: 11 },
  kind: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 6,
  },
  btnApprove: { backgroundColor: '#16a34a' },
  btnReject: { backgroundColor: '#dc2626' },
  btnVerify: { backgroundColor: '#0284c7' },
  btnBusy: { opacity: 0.4 },
  btnText: { color: '#f8fafc', fontWeight: '700', fontSize: 12 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  pill: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 92,
  },
  pillLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillCount: { color: '#f8fafc', fontSize: 22, fontWeight: '800' },
  pillErr: { color: '#fca5a5', fontSize: 10 },
});
