import { type ElementType, useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { useAnalytics } from "@szl-holdings/shared-ui/analytics-provider";
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
  BookOpen,
  ExternalLink,
  Ship,
  ShieldCheck,
  Home,
  BriefcaseBusiness,
  Target,
  Send,
  Calendar,
  ArrowRight,
  Download,
  Printer,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Special panel IDs (not fetched from API)
const SPECIAL_IDS = ["executive-brief", "request-demo", "access-inquiry"] as const;
type SpecialId = (typeof SPECIAL_IDS)[number];
function isSpecialId(id: string): id is SpecialId {
  return (SPECIAL_IDS as readonly string[]).includes(id);
}

interface DocMeta {
  id: string;
  label: string;
  subtitle: string;
  icon: ElementType;
  color: string;
  category: string;
}

const DOC_META: DocMeta[] = [
  {
    id: "platform-overview",
    label: "Platform Overview",
    subtitle: "What SZL Holdings builds and why the architecture is different",
    icon: Globe,
    color: "#d4a054",
    category: "Overview",
  },
  {
    id: "product-matrix",
    label: "Product Matrix",
    subtitle: "All domain platforms, audiences, and strategic roles",
    icon: Layers,
    color: "#4a90b8",
    category: "Overview",
  },
  {
    id: "founder-summary",
    label: "Founder Summary",
    subtitle: "Founder narrative, thesis, and Series A rationale",
    icon: BookOpen,
    color: "#8b7ac8",
    category: "Overview",
  },
  {
    id: "launch-readiness",
    label: "Operational Readiness",
    subtitle: "Scored readiness across 8 dimensions — before and after",
    icon: CheckCircle2,
    color: "#5a9a8a",
    category: "Overview",
  },
  {
    id: "system-overview",
    label: "System Overview",
    subtitle: "Platform summary for technical evaluators",
    icon: Monitor,
    color: "#d4a054",
    category: "Architecture",
  },
  {
    id: "architecture",
    label: "Architecture Specs",
    subtitle: "Stack topology, service boundaries, data flows",
    icon: Database,
    color: "#8b7ac8",
    category: "Architecture",
  },
  {
    id: "product-surfaces",
    label: "Product Surfaces",
    subtitle: "All surfaces, their audiences, and feature sets",
    icon: Monitor,
    color: "#4a90b8",
    category: "Architecture",
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
    category: "Security Posture",
  },
  {
    id: "security-checklist",
    label: "Security Checklist",
    subtitle: "Hardening status, audit findings, compliance",
    icon: Lock,
    color: "#e07050",
    category: "Security Posture",
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

const CATEGORIES = ["Overview", "Architecture", "Security Posture", "Engineering", "Operations", "Data"];

const DOWNLOADABLE_DOCS: Array<{ id: string; label: string; hint: string }> = [
  {
    id: "technical-due-diligence",
    label: "Technical Due Diligence Packet",
    hint: "Full architecture, security, and engineering assessment",
  },
  {
    id: "launch-readiness",
    label: "Launch Readiness Scorecard",
    hint: "Scored readiness across 8 operational dimensions",
  },
];

const DOMAIN_PRODUCTS = [
  {
    icon: Target,
    name: "PRISM Counsel",
    tagline: "Legal matter observability",
    color: "#d4a054",
    href: `${BASE}/solutions/prism-counsel`,
  },
  {
    icon: Ship,
    name: "Vessels",
    tagline: "Maritime intelligence",
    color: "#4a90b8",
    href: `${BASE}/solutions/vessels`,
  },
  {
    icon: ShieldCheck,
    name: "Aegis",
    tagline: "Security & defense observability",
    color: "#c45a4a",
    href: `${BASE}/solutions/aegis`,
  },
  {
    icon: Home,
    name: "Terra",
    tagline: "Real estate intelligence",
    color: "#c8953c",
    href: `${BASE}/solutions/terra`,
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    tagline: "Advisory & consulting intelligence",
    color: "#8b7ac8",
    href: `${BASE}/carlota-jo-public`,
  },
];

function getCsrfTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : "";
}

async function ensureCsrfToken(): Promise<string> {
  let token = getCsrfTokenFromCookie();
  if (token) return token;
  try {
    await fetch(`${BASE}/api/csrf-token`, { credentials: "include" });
  } catch {
    /* non-fatal — request will surface the missing-token error if needed */
  }
  token = getCsrfTokenFromCookie();
  return token;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const needsCsrf = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  const csrfToken = needsCsrf ? await ensureCsrfToken() : "";
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(needsCsrf && csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...options?.headers,
    },
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

function ExecutiveBriefPanel() {
  const analytics = useAnalytics();
  const { user } = useAuth();
  const PULSE_URL = "/pulse/";
  const highlights = [
    "Platform architecture & 9-stage decision loop",
    "Five domain verticals and go-to-market sequencing",
    "Wedge + platform logic — one engine, multiple domains",
    "Competitive moat: signal-to-action governance layer",
    "Investment thesis, milestones, and honest status",
  ];

  return (
    <div className="max-w-3xl print-area">
      {/* Print-only branded header (hidden on screen) */}
      <div className="print-only mb-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em]">
            SZL Holdings — Investor Data Room
          </p>
          <p className="text-xs uppercase tracking-[0.18em]">Confidential</p>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-black/60 mb-1">
          Executive Brief
        </p>
        <h1 className="text-2xl font-bold leading-tight mb-1">SZL Holdings — Executive Brief</h1>
        <p className="text-sm text-black/70">
          Full platform narrative, investment thesis, and domain product depth
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-6 no-print">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d4a054]/25 bg-[#d4a054]/10">
            <BookOpen className="h-6 w-6 text-[#d4a054]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-1">
              Executive Brief · Confidential
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-['Space_Grotesk']">
              SZL Holdings — Executive Brief
            </h1>
            <p className="text-sm text-white/45 mt-0.5">
              Full platform narrative, investment thesis, and domain product depth
            </p>
          </div>
        </div>

        <p className="text-sm leading-7 text-white/60 mb-6">
          The SZL Holdings executive brief covers the full platform depth — market positioning,
          architectural overview, vertical expansion strategy, and the core investment thesis.
          Designed for investors, partners, and evaluators who need structured context before
          a deeper diligence conversation.
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-3">
            What this brief covers
          </p>
          <div className="space-y-2">
            {highlights.map((h) => (
              <div key={h} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#5a9a8a]" />
                <p className="text-sm leading-6 text-white/60">{h}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 no-print">
          <a
            href={PULSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition"
          >
            <BookOpen className="h-4 w-4" />
            Open Executive Briefing
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
          <a
            href={`${BASE}/szl-holdings-executive-brief.pdf`}
            download="SZL-Holdings-Executive-Brief.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              analytics.track("data_room_executive_brief_pdf_downloaded", {
                userEmail: user?.email ?? null,
                userId: user?.id ?? null,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4a054]/40 bg-[#d4a054]/10 px-5 py-2.5 text-sm font-semibold text-[#d4a054] hover:bg-[#d4a054]/15 hover:border-[#d4a054]/60 transition"
            title="Download the SZL Holdings Executive Brief as a PDF"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition"
            title="Print this page (uses your browser's print dialog)"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.05] pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-4">
          Domain Products — Quick Links
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOMAIN_PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] hover:border-white/10 transition group"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{ background: `${p.color}14`, borderColor: `${p.color}28`, color: p.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 group-hover:text-white transition truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-white/35 truncate">{p.tagline}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DemoFormState {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
}

function RequestDemoPanel() {
  const analytics = useAnalytics();
  const { user } = useAuth();
  const [form, setForm] = useState<DemoFormState>({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch("/api/investors/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      analytics.track("data_room_demo_request_submitted", {
        userEmail: user?.email ?? null,
        userId: user?.id ?? null,
        requesterEmail: form.email.trim() || null,
        company: form.company.trim() || null,
        role: form.role.trim() || null,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "ERROR";
      const friendly =
        code === "UNAUTHORIZED"
          ? "Your session has expired. Please refresh the page and try again."
          : code === "FORBIDDEN" || code === "NDA_REQUIRED"
          ? "Access required. Please re-accept the NDA and try again."
          : "We couldn't submit your request. Please try again, or email investors@szlholdings.com directly.";
      setSubmitError(friendly);
      analytics.track("data_room_demo_request_failed", {
        userEmail: user?.email ?? null,
        userId: user?.id ?? null,
        errorCode: code,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.name.trim() && form.email.trim() && form.company.trim();

  if (submitted) {
    return (
      <div className="max-w-xl">
        <div className="rounded-2xl border border-[#5a9a8a]/20 bg-[#5a9a8a]/08 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#5a9a8a]/30 bg-[#5a9a8a]/15 mx-auto mb-5">
            <CheckCircle2 className="h-7 w-7 text-[#5a9a8a]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 font-['Space_Grotesk']">
            Request received.
          </h2>
          <p className="text-sm leading-7 text-white/55 mb-6">
            We'll be in touch at <span className="text-white/75">{form.email}</span> within one
            business day to schedule a session that fits your evaluation timeline.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: "", email: "", company: "", role: "", message: "" }); }}
            className="text-xs font-semibold text-white/40 hover:text-white/70 transition"
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-4 mb-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#22d3ee]/25 bg-[#22d3ee]/10">
          <Calendar className="h-6 w-6 text-[#22d3ee]" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-1">
            Demo Request
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-['Space_Grotesk']">
            Schedule a live walkthrough
          </h1>
          <p className="text-sm text-white/45 mt-0.5">
            Every investor conversation starts with the live product, not a slide deck.
          </p>
        </div>
      </div>

      <p className="text-sm leading-7 text-white/60 mb-8">
        The SZL Holdings demo covers the full decision workflow — from signal detection through
        recommendation, approval, execution, and audit trail. We'll walk through a live vertical
        (PRISM Counsel, Vessels, or Aegis) and show the shared Alloy execution layer.
        Sessions are 30–45 minutes.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Full Name <span className="text-[#e07050]">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your name"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Email <span className="text-[#e07050]">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@firm.com"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Company / Fund <span className="text-[#e07050]">*</span>
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              placeholder="Organization name"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Role / Title
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c1018] px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-white/20 transition"
            >
              <option value="">Select a role…</option>
              <option value="General Partner">General Partner</option>
              <option value="Managing Director">Managing Director</option>
              <option value="Principal / Associate">Principal / Associate</option>
              <option value="Angel Investor">Angel Investor</option>
              <option value="Strategic Partner">Strategic Partner</option>
              <option value="Corporate Development">Corporate Development</option>
              <option value="Advisor">Advisor</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
            Context / Notes
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder="What are you most interested in exploring? Any specific vertical or use case you'd like to focus on?"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Request Demo
              </>
            )}
          </button>
          <p className="text-xs text-white/30">
            Or email directly:{" "}
            <a
              href="mailto:investors@szlholdings.com"
              className="text-white/50 hover:text-white/70 transition"
            >
              investors@szlholdings.com
            </a>
          </p>
        </div>
        {submitError && (
          <div
            role="alert"
            className="mt-2 rounded-xl border border-[#e07050]/30 bg-[#e07050]/10 px-4 py-3 text-sm text-[#f6b8a4]"
          >
            {submitError}
          </div>
        )}
      </form>

      <div className="mt-10 border-t border-white/[0.05] pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-4">
          What to expect
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: "01", label: "Live product walk", body: "No decks — we start with the running platform." },
            { step: "02", label: "Your questions", body: "Architecture, governance, sequencing — whatever matters to you." },
            { step: "03", label: "Next steps", body: "Full diligence package, reference calls, or follow-on access." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
              <p className="font-['JetBrains_Mono'] text-[11px] font-semibold text-white/25 mb-1">{s.step}</p>
              <p className="text-sm font-semibold text-white/80 mb-1">{s.label}</p>
              <p className="text-xs leading-5 text-white/40">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface InquiryFormState {
  name: string;
  email: string;
  company: string;
  role: string;
  materialsRequested: string[];
  context: string;
}

const DEEPER_MATERIALS = [
  "Cap table",
  "Financial model",
  "Legal documents",
  "Revenue projections",
  "Reference calls",
  "Technical architecture deep-dive",
];

function AccessInquiryPanel({ onBack }: { onBack?: () => void }) {
  const [form, setForm] = useState<InquiryFormState>({
    name: "",
    email: "",
    company: "",
    role: "",
    materialsRequested: [],
    context: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleMaterial = (material: string) => {
    setForm((prev) => ({
      ...prev,
      materialsRequested: prev.materialsRequested.includes(material)
        ? prev.materialsRequested.filter((m) => m !== material)
        : [...prev.materialsRequested, material],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/investors/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      const subject = encodeURIComponent("Deeper Access Request — SZL Holdings Data Room");
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\nRole: ${form.role}\nMaterials: ${form.materialsRequested.join(", ")}\n\n${form.context}`
      );
      window.location.href = `mailto:investors@szlholdings.com?subject=${subject}&body=${body}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.name.trim() && form.email.trim() && form.company.trim() && form.materialsRequested.length > 0;

  if (submitted) {
    return (
      <div className="max-w-xl">
        <div className="rounded-2xl border border-[#5a9a8a]/20 bg-[#5a9a8a]/08 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#5a9a8a]/30 bg-[#5a9a8a]/15 mx-auto mb-5">
            <CheckCircle2 className="h-7 w-7 text-[#5a9a8a]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 font-['Space_Grotesk']">
            Access request received.
          </h2>
          <p className="text-sm leading-7 text-white/55 mb-6">
            We'll review your request and reach out at <span className="text-white/75">{form.email}</span> within
            one business day to coordinate the next steps.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-semibold text-white/40 hover:text-white/70 transition"
            >
              ← Back to data room
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-4 mb-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d4a054]/25 bg-[#d4a054]/10">
          <FileText className="h-6 w-6 text-[#d4a054]" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-1">
            Deeper Access Request
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-['Space_Grotesk']">
            Request confidential materials
          </h1>
          <p className="text-sm text-white/45 mt-0.5">
            Cap table, financials, and legal documents for qualified investors.
          </p>
        </div>
      </div>

      <p className="text-sm leading-7 text-white/60 mb-6">
        The data room contains our technical and operational documentation. The next tier of materials —
        including the full financial model, cap table, and legal diligence documents — is available
        to qualified investors after a brief verification. Select what you need below and we'll
        follow up within one business day.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Full Name <span className="text-[#e07050]">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your name"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Email <span className="text-[#e07050]">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@firm.com"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Company / Fund <span className="text-[#e07050]">*</span>
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              placeholder="Organization name"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Role / Title
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c1018] px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-white/20 transition"
            >
              <option value="">Select a role…</option>
              <option value="General Partner">General Partner</option>
              <option value="Managing Director">Managing Director</option>
              <option value="Principal / Associate">Principal / Associate</option>
              <option value="Angel Investor">Angel Investor</option>
              <option value="Strategic Partner">Strategic Partner</option>
              <option value="Corporate Development">Corporate Development</option>
              <option value="Advisor">Advisor</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-2">
            Materials Requested <span className="text-[#e07050]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEEPER_MATERIALS.map((material) => {
              const selected = form.materialsRequested.includes(material);
              return (
                <button
                  key={material}
                  type="button"
                  onClick={() => toggleMaterial(material)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    selected
                      ? "border-[#d4a054]/40 bg-[#d4a054]/10 text-[#d4a054]"
                      : "border-white/[0.07] bg-white/[0.02] text-white/45 hover:text-white/70 hover:border-white/10"
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition ${
                      selected ? "bg-[#d4a054] border-[#d4a054]" : "border-white/20 bg-transparent"
                    }`}
                  >
                    {selected && <CheckCircle2 className="h-2.5 w-2.5 text-black" />}
                  </div>
                  {material}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/40 mb-1.5">
            Context
          </label>
          <textarea
            name="context"
            value={form.context}
            onChange={handleChange}
            rows={3}
            placeholder="Where are you in your diligence process? Any specific questions or timeline?"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Request
              </>
            )}
          </button>
          <p className="text-xs text-white/30">
            Or email:{" "}
            <a href="mailto:investors@szlholdings.com" className="text-white/50 hover:text-white/70 transition">
              investors@szlholdings.com
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function InvestorsDataRoomPage() {
  const [ndaLoading, setNdaLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string>("platform-overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const analytics = useAnalytics();
  const { user } = useAuth();
  const investorProps = useCallback(
    (extra?: Record<string, unknown>) => ({
      userEmail: user?.email ?? null,
      userId: user?.id ?? null,
      ...(extra ?? {}),
    }),
    [user?.email, user?.id],
  );
  const docOpenedRef = useRef<Set<string>>(new Set());
  const briefViewedRef = useRef(false);
  const pageViewFiredRef = useRef(false);

  const __pageMeta = usePageMeta({
    title: "Data Room — Investor Relations — SZL Holdings",
    description:
      "Technical diligence data room for qualified SZL Holdings investors — executive brief, architecture, data model, security, and operational documentation.",
    canonical: "https://szlholdings.com/investors/data-room",
  });

  useEffect(() => {
    checkNdaStatus().then((accepted) => {
      setAccepted(accepted);
      setNdaLoading(false);
    });
  }, []);

  // Page view — once per mount, after NDA is confirmed accepted.
  useEffect(() => {
    if (!accepted || pageViewFiredRef.current) return;
    pageViewFiredRef.current = true;
    analytics.page("investors_data_room", investorProps());
  }, [accepted, analytics, investorProps]);

  // Document / brief open events.
  useEffect(() => {
    if (!accepted || !activeDocId) return;
    if (activeDocId === "executive-brief") {
      if (!briefViewedRef.current) {
        briefViewedRef.current = true;
        analytics.track("data_room_executive_brief_viewed", investorProps());
      }
    } else if (!isSpecialId(activeDocId)) {
      if (!docOpenedRef.current.has(activeDocId)) {
        docOpenedRef.current.add(activeDocId);
        const doc = DOC_META.find((d) => d.id === activeDocId);
        analytics.track(
          "data_room_document_opened",
          investorProps({
            docId: activeDocId,
            docTitle: doc?.title ?? null,
            docCategory: doc?.category ?? null,
          }),
        );
      }
    }
  }, [accepted, activeDocId, analytics, investorProps]);

  const loadDoc = useCallback(async (id: string) => {
    if (isSpecialId(id)) return;
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
      analytics.track("data_room_nda_accepted", investorProps());
    } catch {
      setAccepted(true);
      analytics.track(
        "data_room_nda_accepted",
        investorProps({ recordFailed: true }),
      );
    } finally {
      setAccepting(false);
    }
  }, [analytics, investorProps]);

  const activeDoc = DOC_META.find((d) => d.id === activeDocId);

  if (ndaLoading) {
    return (
    <>
      {__pageMeta}
        <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
          </>
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

  const activeLabel =
    activeDocId === "executive-brief"
      ? "Executive Brief"
      : activeDocId === "request-demo"
      ? "Request Demo"
      : activeDocId === "access-inquiry"
      ? "Request Deeper Access"
      : activeDoc?.label ?? activeDocId;

  return (
    <div className="min-h-screen bg-[#070a10] text-white flex flex-col">
      <style>{`
        .print-only { display: none; }
        .print-footer { display: none; }
        @media print {
          @page { size: Letter; margin: 0.6in 0.6in 0.9in 0.6in; }
          html, body { background: #ffffff !important; color: #000000 !important; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: none !important; padding: 0 !important; margin: 0 !important; color: #000000 !important; background: #ffffff !important; }
          .print-area * { color: #000000 !important; background: transparent !important; border-color: #cccccc !important; }
          .print-area h1, .print-area h2, .print-area h3, .print-area h4, .print-area strong { color: #000000 !important; }
          .print-area a { color: #1a4a8a !important; text-decoration: underline !important; }
          .print-area code, .print-area pre { background: #f4f4f4 !important; color: #1a1a1a !important; border: 1px solid #dddddd !important; }
          .print-area pre { page-break-inside: avoid; white-space: pre-wrap !important; word-wrap: break-word !important; }
          /* Neutralize the on-screen horizontal scroll wrapper around tables so
             wide tables can shrink to page width instead of being clipped at the
             paper edge. */
          .print-area .overflow-x-auto { overflow: visible !important; max-width: 100% !important; }
          .print-area table { border-collapse: collapse !important; width: 100% !important; max-width: 100% !important; table-layout: fixed !important; font-size: 9px !important; page-break-inside: auto; }
          .print-area thead { background: #eeeeee !important; }
          .print-area th, .print-area td { border: 1px solid #cccccc !important; padding: 4px 6px !important; word-break: break-word !important; overflow-wrap: anywhere !important; white-space: normal !important; vertical-align: top !important; }
          .print-area tr { page-break-inside: avoid; page-break-after: auto; }
          .print-area img, .print-area svg { max-width: 100% !important; }
          .print-only { display: block !important; visibility: visible !important; }
          .no-print { display: none !important; }
          /* Per-page confidentiality footer.
             Chromium (Chrome/Edge) repeats position:fixed elements on every
             printed page, giving us a per-page footer without relying on
             @page margin boxes (which Chromium support is unreliable).
             Firefox/Safari may render this only once at the bottom of the
             first page — that is the graceful fallback. */
          .print-footer {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            padding: 6px 0.6in 0 0.6in !important;
            border-top: 1px solid #cccccc !important;
            font-size: 9px !important;
            color: #444444 !important;
            background: #ffffff !important;
            text-align: center !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif !important;
          }
        }
      `}</style>
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
            <p className="text-xs font-semibold text-white/70">{activeLabel}</p>
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

            {/* Executive Brief — top CTA */}
            <div className="mb-5">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
                Quick Access
              </p>
              <button
                onClick={() => { setActiveDocId("executive-brief"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  activeDocId === "executive-brief"
                    ? "bg-white/[0.06] text-white"
                    : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]"
                  style={
                    activeDocId === "executive-brief"
                      ? { background: "#d4a05418", borderColor: "#d4a05430", color: "#d4a054" }
                      : { color: "#d4a05488" }
                  }
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${activeDocId === "executive-brief" ? "text-white" : "text-white/60"}`}>
                    Executive Brief
                  </p>
                  <p className="text-[11px] text-white/30 truncate">Platform narrative & thesis</p>
                </div>
                {activeDocId === "executive-brief" && <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />}
              </button>

              <button
                onClick={() => { setActiveDocId("request-demo"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition mt-0.5 ${
                  activeDocId === "request-demo"
                    ? "bg-white/[0.06] text-white"
                    : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]"
                  style={
                    activeDocId === "request-demo"
                      ? { background: "#22d3ee18", borderColor: "#22d3ee30", color: "#22d3ee" }
                      : { color: "#22d3ee88" }
                  }
                >
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${activeDocId === "request-demo" ? "text-white" : "text-white/60"}`}>
                    Request a Demo
                  </p>
                  <p className="text-[11px] text-white/30 truncate">Schedule a live walkthrough</p>
                </div>
                {activeDocId === "request-demo" && <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />}
              </button>

              <button
                onClick={() => { setActiveDocId("access-inquiry"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition mt-0.5 ${
                  activeDocId === "access-inquiry"
                    ? "bg-white/[0.06] text-white"
                    : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]"
                  style={
                    activeDocId === "access-inquiry"
                      ? { background: "#d4a05418", borderColor: "#d4a05430", color: "#d4a054" }
                      : { color: "#d4a05488" }
                  }
                >
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${activeDocId === "access-inquiry" ? "text-white" : "text-white/60"}`}>
                    Request Deeper Access
                  </p>
                  <p className="text-[11px] text-white/30 truncate">Cap table, financials & legal</p>
                </div>
                {activeDocId === "access-inquiry" && <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />}
              </button>
            </div>

            {/* Technical Documents */}
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
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

            {/* Domain Products */}
            <div className="mt-4 mb-5">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
                Domain Products
              </p>
              <div className="space-y-0.5">
                {DOMAIN_PRODUCTS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <a
                      key={p.name}
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition text-white/50 hover:bg-white/[0.03] hover:text-white/80 group"
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]"
                        style={{ color: p.color + "88" }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-white/60 group-hover:text-white/80 transition">
                          {p.name}
                        </p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-white/20 group-hover:text-white/40 transition shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Downloads */}
            <div className="mt-4 mb-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-2">
                Downloads
              </p>
              <div className="flex flex-col gap-2">
                {DOWNLOADABLE_DOCS.map((doc) => (
                  <a
                    key={doc.id}
                    href={`${BASE}/api/investors/docs/${doc.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 group"
                  >
                    <Download className="h-3.5 w-3.5 text-[#5a9a8a] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-white/60 group-hover:text-white/90 transition leading-4">
                        {doc.label}
                      </p>
                      <p className="text-[10px] text-white/25 leading-4">{doc.hint}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Full Diligence Package */}
            <div className="mt-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-2">
                Deeper Access
              </p>
              <p className="text-xs leading-5 text-white/40 mb-3">
                Request the cap table, financial model, and legal diligence documents.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveDocId("access-inquiry"); setSidebarOpen(false); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d4a054] hover:text-[#e4b064] transition"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Request access
                </button>
                <button
                  onClick={() => { setActiveDocId("request-demo"); setSidebarOpen(false); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22d3ee] hover:text-[#32e3fe] transition"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Schedule a demo
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Special panels — no doc header or nav pills */}
          {isSpecialId(activeDocId) ? (
            <div className="px-6 py-10 lg:px-10 lg:py-12">
              {activeDocId === "executive-brief" && <ExecutiveBriefPanel />}
              {activeDocId === "request-demo" && <RequestDemoPanel />}
              {activeDocId === "access-inquiry" && (
                <AccessInquiryPanel onBack={() => setActiveDocId("executive-brief")} />
              )}
            </div>
          ) : (
            <>
              {/* Doc header */}
              {activeDoc && (
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
                    <div className="flex-1">
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
                    <div className="shrink-0 flex items-center gap-2 no-print">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={!content || loading || !!error}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/60 hover:text-white/90 hover:border-white/15 transition disabled:cursor-not-allowed disabled:opacity-40"
                        title="Export this document as PDF (uses your browser's print dialog)"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Export PDF
                      </button>
                      {(() => {
                        const dlDoc = DOWNLOADABLE_DOCS.find((d) => d.id === activeDocId);
                        if (!dlDoc) return null;
                        return (
                          <a
                            href={`${BASE}/api/investors/docs/${activeDocId}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/60 hover:text-white/90 hover:border-white/15 transition"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        );
                      })()}
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
              )}

              {/* Document content */}
              <div className="px-6 py-10 lg:px-10 lg:py-12 max-w-4xl print-area">
                {/* Print-only branded header (hidden on screen) */}
                {activeDoc && (
                  <div className="print-only mb-6">
                    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.22em]">
                        SZL Holdings — Investor Data Room
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em]">Confidential</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-black/60 mb-1">
                      {activeDoc.category}
                    </p>
                    <h1 className="text-2xl font-bold leading-tight mb-1">{activeDoc.label}</h1>
                    <p className="text-sm text-black/70">{activeDoc.subtitle}</p>
                  </div>
                )}
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
                {/* Per-page confidentiality footer for printed PDFs.
                    Hidden on screen via .print-footer base style; in @media print
                    it becomes position:fixed at the bottom and Chromium repeats
                    it on every printed page. */}
                <div className="print-footer" aria-hidden="true">
                  Confidential — SZL Holdings Ltd. · Provided under NDA for evaluation only · Do not redistribute.
                </div>
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
            </>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
