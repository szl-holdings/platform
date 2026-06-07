/**
 * policy_admin_ui.tsx — Vertical Policy Admin UI (R3)
 * React 18 + accessible (WCAG 2.1 AA) admin interface for /policy page.
 * Supports: policy list, lambda-score visualisation, hot-reload status,
 * inline policy CRUD, and Doctrine v6 digest verification.
 *
 * References
 * ----------
 * [1] WCAG 2.1 AA, https://www.w3.org/TR/WCAG21/
 * [2] React 18 docs: https://react.dev/
 * [3] ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
 * [4] Doctrine v6 §4 "Policy Evaluation Semantics"
 */

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useId,
  type FC,
  type KeyboardEvent,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types (mirrors doctrine_composer.ts — kept local to avoid
// cross-module import in a Next.js app-router client component)
// ─────────────────────────────────────────────────────────────────────────────

interface DoctrineLabelUI {
  namespace: string;
  key: string;
  value: string;
}

interface PolicyRow {
  id: string;
  version: 6;
  lambda: number;
  labels: DoctrineLabelUI[];
  cosignatureCount: number;
  digest: string;
  hotReloadStatus: "pending" | "active" | "error";
  lastUpdatedMs: number;
}

interface PolicyAdminState {
  policies: PolicyRow[];
  loading: boolean;
  error: string | null;
  busConnected: boolean;
  lastBusEventTs: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

/** Colours the Λ badge by severity per Doctrine v6 §4 [4] */
function lambdaColor(lambda: number): string {
  if (lambda >= 0.8) return "#15803d"; // green-700
  if (lambda >= 0.5) return "#b45309"; // amber-700
  return "#b91c1c";                    // red-700
}

function formatTs(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface LambdaBadgeProps { lambda: number }
const LambdaBadge: FC<LambdaBadgeProps> = ({ lambda }) => (
  <span
    role="status"
    aria-label={`Lambda score ${lambda.toFixed(3)}`}
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 12,
      fontFamily: "monospace",
      fontWeight: 700,
      fontSize: 13,
      color: "#fff",
      backgroundColor: lambdaColor(lambda),
    }}
  >
    Λ {lambda.toFixed(3)}
  </span>
);

interface DigestCellProps { digest: string }
const DigestCell: FC<DigestCellProps> = ({ digest }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [digest]);

  return (
    <span style={{ fontFamily: "monospace", fontSize: 11 }}>
      {digest.slice(0, 12)}…
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy full digest"}
        style={{ marginLeft: 4, cursor: "pointer", border: "none", background: "none", color: "#2563eb" }}
      >
        {copied ? "✓" : "copy"}
      </button>
    </span>
  );
};

interface HotReloadBadgeProps { status: PolicyRow["hotReloadStatus"] }
const HotReloadBadge: FC<HotReloadBadgeProps> = ({ status }) => {
  const colors: Record<PolicyRow["hotReloadStatus"], string> = {
    active: "#15803d",
    pending: "#d97706",
    error: "#b91c1c",
  };
  return (
    <span
      role="status"
      aria-label={`Hot-reload status: ${status}`}
      style={{
        display: "inline-block",
        width: 10, height: 10,
        borderRadius: "50%",
        backgroundColor: colors[status],
        marginRight: 6,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Policy edit modal (ARIA dialog pattern [3])
// ─────────────────────────────────────────────────────────────────────────────

interface EditModalProps {
  policy: PolicyRow | null;
  onClose: () => void;
  onSave: (id: string, policyJson: string) => Promise<void>;
}

const EditModal: FC<EditModalProps> = ({ policy, onClose, onSave }) => {
  const titleId = useId();
  const [json, setJson] = useState(() => policy ? JSON.stringify(policy, null, 2) : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave(policy?.id ?? "new", json);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [json, onSave, onClose, policy?.id]);

  if (!policy) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 8, padding: 24,
          width: "min(640px, 90vw)", maxHeight: "80vh",
          overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <h2 id={titleId} style={{ marginTop: 0 }}>Edit Policy: {policy.id}</h2>
        <label htmlFor="policy-json-editor" style={{ fontWeight: 600 }}>
          Doctrine v6 JSON
        </label>
        <textarea
          id="policy-json-editor"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={16}
          style={{
            width: "100%", fontFamily: "monospace", fontSize: 12,
            padding: 8, borderRadius: 4, border: "1px solid #d1d5db",
            boxSizing: "border-box", marginTop: 4,
          }}
          aria-label="Policy JSON editor"
        />
        {err && (
          <p role="alert" style={{ color: "#b91c1c", margin: "8px 0" }}>{err}</p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} disabled={saving}
            style={{ padding: "8px 16px", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ padding: "8px 16px", borderRadius: 4, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main PolicyAdminUI component
// ─────────────────────────────────────────────────────────────────────────────

interface PolicyAdminUIProps {
  /** REST endpoint for policy CRUD */
  apiBase: string;
}

export const PolicyAdminUI: FC<PolicyAdminUIProps> = ({ apiBase }) => {
  const [state, setState] = useState<PolicyAdminState>({
    policies: [],
    loading: true,
    error: null,
    busConnected: false,
    lastBusEventTs: null,
  });
  const [editTarget, setEditTarget] = useState<PolicyRow | null>(null);
  const [sortField, setSortField] = useState<"id" | "lambda" | "lastUpdatedMs">("lambda");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  // ── Fetch policies ──────────────────────────────────────────────────────────
  const fetchPolicies = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${apiBase}/policies`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as PolicyRow[];
      setState((s) => ({ ...s, policies: data, loading: false }));
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message, loading: false }));
    }
  }, [apiBase]);

  useEffect(() => { void fetchPolicies(); }, [fetchPolicies]);

  // ── SSE hot-reload stream ───────────────────────────────────────────────────
  useEffect(() => {
    const es = new EventSource(`${apiBase}/policies/events`);
    es.onopen = () => setState((s) => ({ ...s, busConnected: true }));
    es.onerror = () => setState((s) => ({ ...s, busConnected: false }));
    es.addEventListener("policy_update", (ev: MessageEvent<string>) => {
      const event = JSON.parse(ev.data) as { policyId: string; type: string };
      setState((s) => ({ ...s, lastBusEventTs: Date.now() }));
      if (event.type === "delete") {
        setState((s) => ({ ...s, policies: s.policies.filter((p) => p.id !== event.policyId) }));
      } else {
        void fetchPolicies();
      }
    });
    return () => es.close();
  }, [apiBase, fetchPolicies]);

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (id: string, policyJson: string) => {
    const parsed = JSON.parse(policyJson) as PolicyRow; // throws on bad JSON
    const res = await fetch(`${apiBase}/policies/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);
    await fetchPolicies();
  }, [apiBase, fetchPolicies]);

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm(`Delete policy ${id}?`)) return;
    const res = await fetch(`${apiBase}/policies/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
    await fetchPolicies();
  }, [apiBase, fetchPolicies]);

  // ── Sort + filter ───────────────────────────────────────────────────────────
  const displayed = [...state.policies]
    .filter((p) =>
      p.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.digest.startsWith(filterQuery)
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "id") cmp = a.id.localeCompare(b.id);
      else if (sortField === "lambda") cmp = a.lambda - b.lambda;
      else cmp = a.lastUpdatedMs - b.lastUpdatedMs;
      return sortAsc ? cmp : -cmp;
    });

  const handleSortClick = (field: typeof sortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(false); }
  };

  const sortIndicator = (field: typeof sortField) =>
    sortField === field ? (sortAsc ? " ▲" : " ▼") : "";

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main
      aria-label="Policy Administration"
      style={{ fontFamily: "system-ui, sans-serif", padding: "24px", maxWidth: 1200, margin: "0 auto" }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Doctrine v6 Policy Administration
      </h1>

      {/* Bus status bar */}
      <div role="status" aria-live="polite" style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <span>
          <HotReloadBadge status={state.busConnected ? "active" : "error"} />
          NATS bus: {state.busConnected ? "connected" : "disconnected"}
        </span>
        {state.lastBusEventTs && (
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            Last event: {formatTs(state.lastBusEventTs)}
          </span>
        )}
        <button type="button" onClick={() => void fetchPolicies()}
          style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="policy-filter" style={{ fontWeight: 600, marginRight: 8 }}>Filter:</label>
        <input
          id="policy-filter"
          type="search"
          placeholder="Policy ID or digest prefix…"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #d1d5db", width: 280 }}
          aria-label="Filter policies by ID or digest"
        />
        <span style={{ marginLeft: 12, color: "#6b7280", fontSize: 13 }}>
          {displayed.length} of {state.policies.length} policies
        </span>
      </div>

      {/* Error */}
      {state.error && (
        <div role="alert" style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, color: "#b91c1c", marginBottom: 12 }}>
          Error: {state.error}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          aria-label="Policy list"
          aria-busy={state.loading}
        >
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              {(["id", "lambda", "lastUpdatedMs"] as const).map((field) => (
                <th key={field}
                  onClick={() => handleSortClick(field)}
                  onKeyDown={(e) => e.key === "Enter" && handleSortClick(field)}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={sortField === field ? (sortAsc ? "ascending" : "descending") : "none"}
                  style={{ padding: "8px 12px", borderBottom: "2px solid #e5e7eb", cursor: "pointer", userSelect: "none", fontWeight: 600 }}
                >
                  {{ id: "Policy ID", lambda: "Λ Score", lastUpdatedMs: "Last Updated" }[field]}
                  {sortIndicator(field)}
                </th>
              ))}
              <th style={{ padding: "8px 12px", borderBottom: "2px solid #e5e7eb" }}>Status</th>
              <th style={{ padding: "8px 12px", borderBottom: "2px solid #e5e7eb" }}>Digest</th>
              <th style={{ padding: "8px 12px", borderBottom: "2px solid #e5e7eb" }}>Labels</th>
              <th style={{ padding: "8px 12px", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.loading && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                  Loading policies…
                </td>
              </tr>
            )}
            {!state.loading && displayed.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                  No policies found.
                </td>
              </tr>
            )}
            {!state.loading && displayed.map((policy) => (
              <tr key={policy.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600 }}>{policy.id}</td>
                <td style={{ padding: "8px 12px" }}><LambdaBadge lambda={policy.lambda} /></td>
                <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{formatTs(policy.lastUpdatedMs)}</td>
                <td style={{ padding: "8px 12px" }}>
                  <HotReloadBadge status={policy.hotReloadStatus} />
                  {policy.hotReloadStatus}
                </td>
                <td style={{ padding: "8px 12px" }}><DigestCell digest={policy.digest} /></td>
                <td style={{ padding: "8px 12px", fontSize: 12, color: "#374151" }}>
                  {policy.labels.slice(0, 3).map((l) => (
                    <span key={`${l.namespace}/${l.key}`}
                      style={{ display: "inline-block", background: "#e0f2fe", color: "#0369a1", borderRadius: 10, padding: "1px 6px", marginRight: 3, marginBottom: 2 }}>
                      {l.key}={l.value}
                    </span>
                  ))}
                  {policy.labels.length > 3 && <span style={{ color: "#9ca3af" }}>+{policy.labels.length - 3}</span>}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <button type="button"
                    onClick={() => setEditTarget(policy)}
                    aria-label={`Edit policy ${policy.id}`}
                    style={{ marginRight: 6, padding: "4px 10px", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button type="button"
                    onClick={() => void handleDelete(policy.id)}
                    aria-label={`Delete policy ${policy.id}`}
                    style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      <EditModal
        policy={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />
    </main>
  );
};

export default PolicyAdminUI;
