import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { RefreshCw, Mail, Building2, User, Calendar, CheckCircle2, XCircle, Clock, Archive, Filter } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type BookingStatus = "pending" | "confirmed" | "declined" | "completed";

interface BookingRequest {
  id: number;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  type: string;
  message: string;
  preferredDate: string | null;
  status: BookingStatus;
  createdAt: string;
}

const STATUS_META: Record<BookingStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "hsl(45,80%,62%)", bg: "hsla(45,80%,52%,0.12)", icon: Clock },
  confirmed: { label: "Accepted", color: "hsl(142,60%,55%)", bg: "hsla(142,60%,45%,0.14)", icon: CheckCircle2 },
  declined: { label: "Declined", color: "hsl(0,72%,62%)", bg: "hsla(0,72%,55%,0.14)", icon: XCircle },
  completed: { label: "Completed", color: "hsl(214,30%,70%)", bg: "hsla(214,30%,55%,0.14)", icon: Archive },
};

const STATUS_FILTERS: Array<BookingStatus | "all"> = ["all", "pending", "confirmed", "declined", "completed"];

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function parseStructuredMessage(raw: string): { product?: string; useCase?: string; role?: string; body: string } {
  const out: { product?: string; useCase?: string; role?: string; body: string } = { body: raw };
  const lines = raw.split("\n");
  const bodyStart: string[] = [];
  let inBody = false;
  for (const line of lines) {
    if (inBody) { bodyStart.push(line); continue; }
    if (line.startsWith("Product interest: ")) { out.product = line.slice("Product interest: ".length).trim(); continue; }
    if (line.startsWith("Workflow to instrument: ")) { out.useCase = line.slice("Workflow to instrument: ".length).trim(); continue; }
    if (line.startsWith("Role: ")) { out.role = line.slice("Role: ".length).trim(); continue; }
    if (line.trim() === "") { inBody = true; continue; }
    inBody = true;
    bodyStart.push(line);
  }
  out.body = bodyStart.join("\n").trim() || raw;
  return out;
}

export default function AdminDesignPartnersPage() {
  const __pageMeta = usePageMeta({ title: "Design Partners — Admin" });
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useStandardQuery({
    queryKey: ["admin-design-partners", "partnership"],
    queryFn: async () => {
      const res = await fetch(`${API}/stephen/booking-requests?type=partnership`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<BookingRequest[]>;
    },
  });

  const updateStatus = useStandardMutation({
    mutationFn: async (args: { id: number; status: BookingStatus }) => {
      setUpdatingId(args.id);
      const res = await fetch(`${API}/stephen/booking-requests/${args.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ status: args.status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, args) => {
      toast.success(`Marked as ${STATUS_META[args.status].label.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["admin-design-partners", "partnership"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    },
    onSettled: () => setUpdatingId(null),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data;
    return data.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  const counts = useMemo(() => {
    const base: Record<BookingStatus | "all", number> = { all: 0, pending: 0, confirmed: 0, declined: 0, completed: 0 };
    if (!data) return base;
    base.all = data.length;
    for (const r of data) base[r.status] += 1;
    return base;
  }, [data]);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,90%)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(214,7%,45%)", margin: "0 0 8px" }}>
                Founder · Pipeline
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
                Design Partner Applications
              </h1>
              <p style={{ marginTop: 8, color: "hsl(214,7%,55%)", fontSize: 13.5, maxWidth: 640 }}>
                Inbound from <code style={{ color: "hsl(38,8%,75%)" }}>/founder/design-partner</code>. Triage, accept, and respond without leaving the dashboard.
                Status changes notify the applicant by email.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px",
                background: "hsla(0,0%,100%,0.06)",
                border: "1px solid hsla(0,0%,100%,0.12)",
                borderRadius: 6,
                color: "hsl(38,8%,85%)",
                fontSize: 12.5,
                cursor: isFetching ? "wait" : "pointer",
              }}
            >
              <RefreshCw size={13} style={{ animation: isFetching ? "spin 1s linear infinite" : undefined }} />
              Refresh
            </button>
          </header>
  
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <Filter size={13} color="hsl(214,7%,45%)" />
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(214,7%,45%)", marginRight: 6 }}>
              Status
            </span>
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s;
              const label = s === "all" ? "All" : STATUS_META[s].label;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: `1px solid ${active ? "hsla(0,0%,100%,0.25)" : "hsla(0,0%,100%,0.08)"}`,
                    background: active ? "hsla(0,0%,100%,0.10)" : "transparent",
                    color: active ? "hsl(38,8%,92%)" : "hsl(214,7%,60%)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label} <span style={{ opacity: 0.55, marginLeft: 4 }}>{counts[s]}</span>
                </button>
              );
            })}
          </div>
  
          {isLoading && (
            <div style={{ padding: 40, textAlign: "center", color: "hsl(214,7%,50%)", fontSize: 13 }}>
              Loading applications…
            </div>
          )}
  
          {isError && (
            <div style={{ padding: 20, background: "hsla(0,72%,55%,0.08)", border: "1px solid hsla(0,72%,55%,0.2)", borderRadius: 8, color: "hsl(0,72%,75%)", fontSize: 13 }}>
              Failed to load applications: {(error as Error)?.message ?? "Unknown error"}
            </div>
          )}
  
          {!isLoading && !isError && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "hsl(214,7%,50%)", fontSize: 13, border: "1px dashed hsla(0,0%,100%,0.08)", borderRadius: 8 }}>
              No applications {statusFilter === "all" ? "yet." : `with status "${STATUS_META[statusFilter as BookingStatus].label.toLowerCase()}".`}
            </div>
          )}
  
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              const isExpanded = expandedId === r.id;
              const parsed = parseStructuredMessage(r.message);
              const isUpdating = updatingId === r.id;
              return (
                <article
                  key={r.id}
                  style={{
                    background: "hsl(214,16%,7%)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                    borderRadius: 10,
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <Building2 size={14} color="hsl(214,7%,55%)" />
                        <strong style={{ fontSize: 15, color: "hsl(38,8%,92%)" }}>
                          {r.company ?? "—"}
                        </strong>
                        <span
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 9px", borderRadius: 999,
                            background: meta.bg, color: meta.color,
                            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                          }}
                        >
                          <Icon size={11} /> {meta.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 18, marginTop: 8, flexWrap: "wrap", fontSize: 12.5, color: "hsl(214,7%,62%)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <User size={12} /> {r.name}
                          {(r.role || parsed.role) ? <span style={{ opacity: 0.65 }}>· {r.role || parsed.role}</span> : null}
                        </span>
                        <a
                          href={`mailto:${r.email}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "hsl(214,80%,72%)", textDecoration: "none" }}
                        >
                          <Mail size={12} /> {r.email}
                        </a>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Calendar size={12} /> {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {(parsed.product || parsed.useCase) && (
                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {parsed.product && (
                            <span style={{ padding: "3px 10px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 4, fontSize: 11.5, color: "hsl(38,8%,80%)" }}>
                              Product: <strong>{parsed.product}</strong>
                            </span>
                          )}
                          {parsed.useCase && (
                            <span style={{ padding: "3px 10px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 4, fontSize: 11.5, color: "hsl(38,8%,80%)" }}>
                              Use case: <strong>{parsed.useCase}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      style={{
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid hsla(0,0%,100%,0.12)",
                        borderRadius: 6,
                        color: "hsl(38,8%,75%)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {isExpanded ? "Hide" : "View"} message
                    </button>
                  </div>
  
                  {isExpanded && (
                    <div style={{ marginTop: 14, padding: 14, background: "hsla(0,0%,0%,0.3)", borderRadius: 6, border: "1px solid hsla(0,0%,100%,0.05)" }}>
                      <p style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(214,7%,45%)", margin: "0 0 8px" }}>
                        Message
                      </p>
                      <p style={{ margin: 0, color: "hsl(38,8%,85%)", fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                        {parsed.body}
                      </p>
                    </div>
                  )}
  
                  <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["confirmed", "declined", "completed", "pending"] as BookingStatus[]).map((s) => {
                      const isCurrent = r.status === s;
                      const sm = STATUS_META[s];
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus.mutate({ id: r.id, status: s })}
                          disabled={isCurrent || isUpdating}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: `1px solid ${isCurrent ? sm.color : "hsla(0,0%,100%,0.10)"}`,
                            background: isCurrent ? sm.bg : "transparent",
                            color: isCurrent ? sm.color : "hsl(38,8%,75%)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: isCurrent || isUpdating ? "not-allowed" : "pointer",
                            opacity: isUpdating && !isCurrent ? 0.5 : 1,
                          }}
                        >
                          {isCurrent ? `✓ ${sm.label}` : `Mark ${sm.label.toLowerCase()}`}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
        </>
  );
}
