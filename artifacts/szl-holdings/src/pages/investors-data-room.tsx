import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Lock,
  Globe,
  Layers,
  Monitor,
  Database,
  Code2,
  Shield,
  Rocket,
  Settings,
  BarChart2,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  X,
  Menu,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DocMeta {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  category: string;
}

const DOC_META: DocMeta[] = [
  {
    id: "system-overview",
    label: "System Overview",
    subtitle: "Platform summary for technical evaluators",
    icon: Globe,
    color: "#d4a054",
    category: "Platform",
  },
  {
    id: "architecture",
    label: "Architecture",
    subtitle: "Stack topology, service boundaries, data flows",
    icon: Layers,
    color: "#8b7ac8",
    category: "Platform",
  },
  {
    id: "product-surfaces",
    label: "Product Surfaces",
    subtitle: "All surfaces, their audiences, and feature sets",
    icon: Monitor,
    color: "#4a90b8",
    category: "Platform",
  },
  {
    id: "data-model",
    label: "Data Model",
    subtitle: "Schema domains, key tables, tenant isolation",
    icon: Database,
    color: "#6aaa72",
    category: "Engineering",
  },
  {
    id: "api-spec",
    label: "API Specification",
    subtitle: "Endpoints, auth flows, GraphQL schema",
    icon: Code2,
    color: "#7ab4d4",
    category: "Engineering",
  },
  {
    id: "access-control",
    label: "Access Control Matrix",
    subtitle: "Role definitions, permission boundaries, RBAC",
    icon: Shield,
    color: "#c878a8",
    category: "Security",
  },
  {
    id: "security-checklist",
    label: "Security Checklist",
    subtitle: "Hardening status, audit findings, compliance",
    icon: Lock,
    color: "#e07050",
    category: "Security",
  },
  {
    id: "deployment-guide",
    label: "Deployment Guide",
    subtitle: "Infrastructure, CI/CD, environment configuration",
    icon: Rocket,
    color: "#60b4a0",
    category: "Operations",
  },
  {
    id: "operations-runbook",
    label: "Operations Runbook",
    subtitle: "Incident response, alerting, on-call procedures",
    icon: Settings,
    color: "#a0a080",
    category: "Operations",
  },
  {
    id: "analytics-events",
    label: "Analytics Events",
    subtitle: "Event taxonomy, instrumentation, tracking plan",
    icon: BarChart2,
    color: "#9878d4",
    category: "Data",
  },
  {
    id: "known-gaps",
    label: "Known Gaps",
    subtitle: "Open risks, remediation status, sprint owners",
    icon: AlertTriangle,
    color: "#d4a030",
    category: "Data",
  },
];

const CATEGORIES = ["Platform", "Engineering", "Security", "Operations", "Data"];

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (res.status === 403) {
      const body = await res.json().catch(() => ({})) as { code?: string };
      if (body.code === "NDA_REQUIRED") throw new Error("NDA_REQUIRED");
      throw new Error("FORBIDDEN");
    }
    throw new Error(`API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function checkNdaStatus(): Promise<boolean> {
  try {
    const data = await apiFetch<{ data: { accepted: boolean } }>("/api/investors/nda/status");
    return data.data.accepted;
  } catch {
    return false;
  }
}

async function recordNdaAcceptance(): Promise<void> {
  await apiFetch("/api/investors/nda/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

async function fetchDoc(id: string): Promise<string> {
  const data = await apiFetch<{ data: { content: string } }>(`/api/investors/docs/${id}`);
  return data.data.content;
}

function NdaGate({ onAccept, accepting }: { onAccept: () => void; accepting?: boolean }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c1018] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4a054]/30 bg-[#d4a054]/10">
            <Lock className="h-5 w-5 text-[#d4a054]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
              Data Room — NDA Confirmation
            </p>
            <p className="text-sm font-semibold text-white">SZL Holdings — Technical Diligence</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-white leading-tight mb-4">
          Confidential materials for qualified investors.
        </h2>

        <p className="text-sm leading-7 text-white/60 mb-6">
          The documents in this data room — including architecture specifications, data models, API
          definitions, security assessments, and operational runbooks — are proprietary and
          confidential to SZL Holdings Ltd.
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 mb-6 space-y-2">
          {[
            "These materials are provided solely for investment evaluation purposes",
            "You agree not to share, reproduce, or distribute any content",
            "This access does not constitute an offer or solicitation of any security",
            "Materials are provided as-is and may be updated without notice",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#5a9a8a]" />
              <p className="text-xs leading-5 text-white/55">{item}</p>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <div
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20 bg-black/30 transition"
            onClick={() => setChecked((v) => !v)}
            style={checked ? { background: "#5a9a8a", borderColor: "#5a9a8a" } : {}}
          >
            {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
          </div>
          <p className="text-sm text-white/70 select-none" onClick={() => setChecked((v) => !v)}>
            I confirm I am a qualified investor or advisor, and I agree to keep these materials
            confidential.
          </p>
        </label>

        <button
          disabled={!checked || accepting}
          onClick={onAccept}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {accepting ? "Recording acceptance…" : "Accept & Enter Data Room"}
        </button>

        <p className="mt-4 text-center text-xs text-white/30">
          Questions?{" "}
          <a href="mailto:investors@szlholdings.com" className="text-white/50 hover:text-white/70 transition">
            investors@szlholdings.com
          </a>
        </p>
      </div>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-6 mt-0 leading-tight font-['Space_Grotesk']">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold tracking-tight text-white mt-10 mb-4 pb-3 border-b border-white/[0.07] font-['Space_Grotesk']">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-white/90 mt-7 mb-3 font-['Space_Grotesk']">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-white/80 mt-5 mb-2 uppercase tracking-[0.12em]">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-7 text-white/65 mb-4">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-[#6aaa72] hover:text-[#7aba82] underline underline-offset-2 transition"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white/90">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-white/60">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block font-['JetBrains_Mono'] text-xs leading-6 text-[#7aba82] whitespace-pre-wrap">
                {children}
              </code>
            );
          }
          return (
            <code className="font-['JetBrains_Mono'] text-xs text-[#7aba82] bg-white/[0.06] rounded px-1.5 py-0.5">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="rounded-xl border border-white/[0.06] bg-[#080c12] px-5 py-4 mb-5 overflow-x-auto">
            {children}
          </pre>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 space-y-1.5 pl-1 list-none">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 space-y-1.5 pl-5 list-decimal marker:text-white/30">{children}</ol>
        ),
        li: ({ children, ...props }) => {
          const isOrdered = (props as { ordered?: boolean }).ordered;
          return isOrdered ? (
            <li className="text-sm leading-6 text-white/60 pl-1">{children}</li>
          ) : (
            <li className="text-sm leading-6 text-white/60 flex gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
              <span className="flex-1">{children}</span>
            </li>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#d4a054]/40 pl-4 mb-4 italic text-white/50 text-sm leading-7">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-8 border-white/[0.06]" />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-6 rounded-xl border border-white/[0.07]">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/[0.04]">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-4 py-3 text-left font-semibold text-white/60 uppercase tracking-[0.1em] text-[11px]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-white/55 leading-5">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function InvestorsDataRoomPage() {
  const [ndaLoading, setNdaLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [activeDocId, setActiveDocId] = useState(DOC_META[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  usePageMeta({
    title: "Data Room — Investor Relations — SZL Holdings",
    description:
      "Technical diligence data room for qualified SZL Holdings investors — architecture, data model, security, and operational documentation.",
    canonical: "https://szlholdings.com/investors/data-room",
  });

  useEffect(() => {
    checkNdaStatus().then((accepted) => {
      setAccepted(accepted);
      setNdaLoading(false);
    });
  }, []);

  const loadDoc = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const text = await fetchDoc(id);
      setContent(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "UNAUTHORIZED") {
        setError("Your session has expired. Please sign in again.");
      } else if (msg === "NDA_REQUIRED") {
        setAccepted(false);
        setError(null);
      } else if (msg === "FORBIDDEN") {
        setError("You do not have permission to access this document.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accepted) {
      loadDoc(activeDocId);
    }
  }, [accepted, activeDocId, loadDoc]);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    try {
      await recordNdaAcceptance();
      setAccepted(true);
    } catch {
      setAccepted(true);
    } finally {
      setAccepting(false);
    }
  }, []);

  const activeDoc = DOC_META.find((d) => d.id === activeDocId) ?? DOC_META[0];

  if (ndaLoading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <NdaGate onAccept={handleAccept} accepting={accepting} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white flex flex-col">
      <SiteNav />

      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#070a10] sticky top-0 z-30">
        <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center gap-3">
          <button
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white/80 transition"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#d4a054]" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
              Data Room
            </p>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <p className="text-xs font-semibold text-white/70">{activeDoc.label}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#5a9a8a]/20 bg-[#5a9a8a]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5a9a8a]">
              <CheckCircle2 className="h-3 w-3" />
              NDA Active
            </span>
            <a
              href={`${BASE}/investors`}
              className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition"
            >
              <X className="h-3 w-3" />
              Exit
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-1 mx-auto w-full max-w-screen-2xl">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-20 w-72 overflow-y-auto border-r border-white/[0.06] bg-[#070a10] pt-16 pb-8 transition-transform lg:static lg:translate-x-0 lg:pt-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="px-4 py-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/30">
              {DOC_META.length} Documents · Confidential
            </p>

            {CATEGORIES.map((cat) => {
              const catDocs = DOC_META.filter((d) => d.category === cat);
              if (!catDocs.length) return null;
              return (
                <div key={cat} className="mb-5">
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
                    {cat}
                  </p>
                  <div className="space-y-0.5">
                    {catDocs.map((doc) => {
                      const Icon = doc.icon;
                      const isActive = doc.id === activeDocId;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setActiveDocId(doc.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            isActive
                              ? "bg-white/[0.06] text-white"
                              : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                          }`}
                        >
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]"
                            style={
                              isActive
                                ? { background: `${doc.color}18`, borderColor: `${doc.color}30`, color: doc.color }
                                : { color: doc.color + "88" }
                            }
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-white/60"}`}>
                              {doc.label}
                            </p>
                          </div>
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-2">
                Full Diligence Package
              </p>
              <p className="text-xs leading-5 text-white/40 mb-3">
                Request the complete financial model, cap table, and legal documents with NDA countersignature.
              </p>
              <a
                href="mailto:investors@szlholdings.com?subject=Full%20Diligence%20Package%20Request"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d4a054] hover:text-[#e4b064] transition"
              >
                <FileText className="h-3.5 w-3.5" />
                Request package
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Doc header */}
          <div className="border-b border-white/[0.05] px-6 py-6 lg:px-10">
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  background: `${activeDoc.color}15`,
                  borderColor: `${activeDoc.color}25`,
                  color: activeDoc.color,
                }}
              >
                <activeDoc.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    {activeDoc.category}
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="text-[11px] text-white/25">Confidential</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-white font-['Space_Grotesk']">
                  {activeDoc.label}
                </h1>
                <p className="text-sm text-white/45 mt-0.5">{activeDoc.subtitle}</p>
              </div>
            </div>

            {/* Doc navigation pills */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {DOC_META.map((doc, i) => {
                const isActive = doc.id === activeDocId;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      isActive
                        ? "border-white/20 bg-white/[0.07] text-white"
                        : "border-white/[0.06] bg-transparent text-white/35 hover:text-white/60 hover:border-white/10"
                    }`}
                  >
                    <span className="text-white/25">{String(i + 1).padStart(2, "0")}</span>
                    {doc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document content */}
          <div className="px-6 py-10 lg:px-10 lg:py-12 max-w-4xl">
            {loading && (
              <div className="flex items-center gap-3 text-white/40 py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Loading document…</p>
              </div>
            )}
            {error && !loading && (
              <div className="flex items-start gap-3 rounded-xl border border-[#e07050]/20 bg-[#e07050]/10 p-5">
                <AlertCircle className="h-5 w-5 text-[#e07050] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Failed to load document</p>
                  <p className="text-sm text-white/55 mt-1">{error}</p>
                  <button
                    onClick={() => loadDoc(activeDocId)}
                    className="mt-3 text-xs font-semibold text-[#e07050] hover:text-[#f08060] transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {content && !loading && !error && (
              <MarkdownRenderer content={content} />
            )}
          </div>

          {/* Doc navigation footer */}
          <div className="border-t border-white/[0.05] px-6 py-6 lg:px-10">
            <div className="flex items-center justify-between">
              {(() => {
                const idx = DOC_META.findIndex((d) => d.id === activeDocId);
                const prev = DOC_META[idx - 1];
                const next = DOC_META[idx + 1];
                return (
                  <>
                    {prev ? (
                      <button
                        onClick={() => setActiveDocId(prev.id)}
                        className="flex items-center gap-2 text-sm text-white/45 hover:text-white/80 transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <div className="text-left">
                          <p className="text-[11px] text-white/25 uppercase tracking-[0.1em]">Previous</p>
                          <p className="font-semibold">{prev.label}</p>
                        </div>
                      </button>
                    ) : (
                      <div />
                    )}
                    {next ? (
                      <button
                        onClick={() => setActiveDocId(next.id)}
                        className="flex items-center gap-2 text-sm text-white/45 hover:text-white/80 transition text-right"
                      >
                        <div>
                          <p className="text-[11px] text-white/25 uppercase tracking-[0.1em]">Next</p>
                          <p className="font-semibold">{next.label}</p>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <div />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
