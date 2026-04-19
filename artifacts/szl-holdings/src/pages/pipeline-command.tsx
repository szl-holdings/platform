import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Target, Mail, Linkedin, FileText, Handshake, ClipboardCheck,
  Plus, Trash2, ChevronDown, ChevronRight, Copy, CheckCircle2, AlertCircle,
  Briefcase, Anchor, ShieldCheck, Home, Scale, RefreshCw, History, Loader2,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

type Vertical = "Security" | "Maritime" | "Real Estate" | "Legal";
type Stage =
  | "Researched"
  | "Outreach Sent"
  | "Reply / Meeting Booked"
  | "Discovery Call"
  | "Demo Delivered"
  | "DPA Sent"
  | "Signed"
  | "Lost / No Fit";

const STAGES: Stage[] = [
  "Researched",
  "Outreach Sent",
  "Reply / Meeting Booked",
  "Discovery Call",
  "Demo Delivered",
  "DPA Sent",
  "Signed",
  "Lost / No Fit",
];

const STAGE_COLOR: Record<Stage, string> = {
  "Researched": "hsl(214,7%,55%)",
  "Outreach Sent": "hsl(214,80%,68%)",
  "Reply / Meeting Booked": "hsl(190,70%,60%)",
  "Discovery Call": "hsl(280,55%,68%)",
  "Demo Delivered": "hsl(45,80%,62%)",
  "DPA Sent": "hsl(28,85%,62%)",
  "Signed": "hsl(142,60%,55%)",
  "Lost / No Fit": "hsl(0,55%,60%)",
};

interface Deal {
  id: number;
  account: string;
  vertical: Vertical;
  champion: string;
  championTitle: string;
  stage: Stage;
  fitScore: number;
  nextStep: string;
  notes: string;
  updatedAt: string;
  createdAt?: string;
}

interface DealEvent {
  id: number;
  dealId: number;
  fromStage: Stage | null;
  toStage: Stage;
  actorUserId: number | null;
  actorEmail: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string;
}

interface TargetAccount {
  account: string;
  vertical: Vertical;
  product: "Aegis" | "Vessels" | "Terra" | "PRISM Counsel";
  why: string;
  whoToFind: string;
  hook: string;
  fitScore: number;
}

const VERTICAL_ICON: Record<Vertical, typeof Building2> = {
  "Security": ShieldCheck,
  "Maritime": Anchor,
  "Real Estate": Home,
  "Legal": Scale,
};

// Researched, ICP-fit accounts. NOT contacted. NOT pipeline.
const TARGETS: TargetAccount[] = [
  { account: "Recorded Future", vertical: "Security", product: "Aegis", why: "Threat-intel platform sells recommendations to SOC teams; analysts already wrestle with 'why did we act on this?' attribution gaps when feeds disagree.", whoToFind: "VP Customer Success, VP Product Security", hook: "Their analysts produce recommendations that downstream SOCs act on — the proof chain between intel → action is exactly the gap Aegis closes.", fitScore: 9 },
  { account: "Expel", vertical: "Security", product: "Aegis", why: "MDR provider selling outcomes (not alerts); under SOC 2 Type II pressure from their own customers; needs governed escalation trail.", whoToFind: "Director of Detection Engineering, VP SOC Operations", hook: "Expel sells transparency as a feature. Aegis lets them prove governance on every escalation, not just the post-mortems.", fitScore: 8 },
  { account: "Devo Technology", vertical: "Security", product: "Aegis", why: "SIEM with autonomous-response ambitions; faces customer pushback on 'AI takes action' without audit trail.", whoToFind: "VP Engineering, Chief Product Officer", hook: "Devo's autonomous SOC story breaks at the governance question. Aegis is the answer they currently don't have.", fitScore: 8 },
  { account: "Arctic Wolf", vertical: "Security", product: "Aegis", why: "Concierge-security model; 4,000+ customers means 4,000 audit trails to defend; growing enterprise base demands governance.", whoToFind: "VP Concierge Operations, Director of Security Services", hook: "Their concierge analysts make hundreds of decisions daily — Aegis is the proof layer they can show regulators and customers alike.", fitScore: 7 },
  { account: "Huntress", vertical: "Security", product: "Aegis", why: "MSP-channel MDR; compliance-conscious SMB and mid-market base needing audit-grade response evidence.", whoToFind: "VP Product, Director of ThreatOps", hook: "Their MSP partners sell on trust. Aegis-backed proof chain is a channel-enablement story.", fitScore: 7 },
  { account: "Maersk Tankers", vertical: "Maritime", product: "Vessels", why: "Operates ~150 product tankers; OFAC and EU sanctions screening is daily friction; pool-management decisions need defensible audit.", whoToFind: "Head of Compliance, VP Commercial Operations", hook: "Vessels turns the daily charter/sanctions decision into a governed, exportable trail — exactly what their compliance team needs at audit.", fitScore: 9 },
  { account: "Teekay Tankers", vertical: "Maritime", product: "Vessels", why: "Mid-cap tanker operator; SEC-listed (NYSE: TNK); board-level scrutiny of sanctions program; lean ops team.", whoToFind: "Chief Risk Officer, Head of Chartering", hook: "SEC disclosure pressure + lean ops = strong appetite for governed decision tooling that scales without headcount.", fitScore: 8 },
  { account: "d'Amico Tankers", vertical: "Maritime", product: "Vessels", why: "European-listed (Milan); EU sanctions complexity; family-led, fast decisions, good design-partner profile.", whoToFind: "Head of Operations, Compliance Officer", hook: "EU sanctions regime is more punitive than US; a governed decision trail is operational insurance.", fitScore: 8 },
  { account: "Pacific Basin Shipping", vertical: "Maritime", product: "Vessels", why: "Dry-bulk operator (~250 vessels); Asia-based; growing compliance overhead from Western charterers.", whoToFind: "Director of Chartering, Head of Risk", hook: "Western charterers increasingly demand sanctions evidence; Vessels gives operators a one-click defense.", fitScore: 7 },
  { account: "Hafnia Limited", vertical: "Maritime", product: "Vessels", why: "Singapore/Bermuda, NYSE-listed (HAFN); large product-tanker pool; pool partners increasingly demand decision transparency.", whoToFind: "VP Pool Operations, Compliance Director", hook: "Pool members are partners, not customers — Vessels' shared decision trail strengthens the pool itself.", fitScore: 8 },
  { account: "Tishman Speyer", vertical: "Real Estate", product: "Terra", why: "Global owner/operator; LP-reporting and acquisitions IC decisions need defensible analytical trail; ESG disclosure pressure.", whoToFind: "Head of Investments, Chief Data Officer", hook: "LP scrutiny of how investment decisions get made is at all-time high. Terra is the IC's defensible memory.", fitScore: 8 },
  { account: "Hines", vertical: "Real Estate", product: "Terra", why: "Global private real estate; 1,000+ assets; technology-forward ('Hines Living' tech bets); receptive to platform partnerships.", whoToFind: "Chief Innovation Officer, Head of Investment Strategy", hook: "They've publicly committed to data-driven IC. Terra is the missing governance layer.", fitScore: 8 },
  { account: "JLL Capital Markets", vertical: "Real Estate", product: "Terra", why: "Brokerage/advisory at scale; analytical consistency across teams is a known internal pain; willing to pilot platforms.", whoToFind: "Head of Capital Markets Analytics, Director of Research", hook: "Cross-team analytical consistency is their stated 2026 priority — Terra is the system of record.", fitScore: 7 },
  { account: "Greystar", vertical: "Real Estate", product: "Terra", why: "Largest US apartment owner/operator; massive acquisition volume; operational decisions at scale need traceability.", whoToFind: "Head of Acquisitions, VP Investment Management", hook: "Volume of acquisitions makes manual decision attribution impossible. Terra automates the trail.", fitScore: 7 },
  { account: "Stockbridge", vertical: "Real Estate", product: "Terra", why: "Mid-sized institutional manager (~$32B AUM); LP-driven governance demands; nimble enough for design-partner cadence.", whoToFind: "Chief Investment Officer, Head of Portfolio Management", hook: "Mid-sized managers feel LP governance pressure earliest — design-partner sweet spot.", fitScore: 8 },
  { account: "Axiom Law", vertical: "Legal", product: "PRISM Counsel", why: "Alt-legal at scale; matter-management consistency across distributed lawyers is a known pain.", whoToFind: "Chief Legal Operations Officer, Head of Practice Technology", hook: "Distributed-lawyer model lives or dies by consistent matter governance. PRISM Counsel is the standard.", fitScore: 7 },
  { account: "UnitedLex", vertical: "Legal", product: "PRISM Counsel", why: "Legal-services-as-platform; analytics-driven; tech-forward GC clients pulling them toward governed AI.", whoToFind: "Chief Strategy Officer, VP Legal Operations", hook: "Their GC clients are asking for governed AI evidence. PRISM Counsel is the answer they can resell.", fitScore: 7 },
  { account: "Elevate Services", vertical: "Legal", product: "PRISM Counsel", why: "Law company; managed services for in-house teams; matter-flow governance is core to their value.", whoToFind: "Chief Operating Officer, VP Managed Services", hook: "Matter-flow governance is what they sell. PRISM Counsel makes it provable.", fitScore: 7 },
];

const COLORS = {
  bg: "hsl(214,16%,4%)",
  surface: "hsl(214,16%,7%)",
  surfaceAlt: "hsl(214,16%,9%)",
  border: "hsla(0,0%,100%,0.07)",
  borderStrong: "hsla(0,0%,100%,0.14)",
  text: "hsl(38,8%,90%)",
  textMuted: "hsl(214,7%,55%)",
  textDim: "hsl(214,7%,42%)",
  accent: "hsl(38,90%,62%)",
};

const QUERY_KEY = ["admin", "pipeline-deals"] as const;

async function apiJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": getCsrfToken(),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (parsed && typeof parsed === "object" && "error" in parsed)
      ? String((parsed as { error: string }).error)
      : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return parsed;
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 36 }}>
      {eyebrow && (
        <p style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.textDim, margin: "0 0 6px" }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 14px", color: COLORS.text }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          // ignore
        }
      }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 10px",
        background: done ? "hsla(142,60%,45%,0.14)" : "hsla(0,0%,100%,0.05)",
        border: `1px solid ${done ? "hsla(142,60%,55%,0.3)" : COLORS.border}`,
        borderRadius: 5,
        color: done ? "hsl(142,60%,68%)" : COLORS.text,
        fontSize: 11.5,
        cursor: "pointer",
      }}
    >
      {done ? <CheckCircle2 size={11} /> : <Copy size={11} />} {done ? "Copied" : label}
    </button>
  );
}

function CollapsibleCard({
  icon: Icon, title, subtitle, defaultOpen = false, children,
}: {
  icon: typeof Mail; title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "14px 16px",
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, textAlign: "left",
          color: COLORS.text,
        }}
      >
        <Icon size={15} color={COLORS.textMuted} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {open ? <ChevronDown size={14} color={COLORS.textMuted} /> : <ChevronRight size={14} color={COLORS.textMuted} />}
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px 16px", borderTop: `1px solid ${COLORS.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

const EMAIL_TEMPLATES: Array<{ vertical: Vertical; subject: string; body: string }> = [
  { vertical: "Security", subject: "Proof chain for [Company]'s SOC decisions — design partner slot", body: `[First name],\n\nMost security tools today add recommendation volume. Almost none give your SOC a defensible record of *why* a given action was taken — what signal, what policy, who approved.\n\nWhen the regulator, the customer, or the board asks "show me the decision trail for incident X," your team reconstructs it from logs, Slack, and memory. That gap is the accountability gap, and it's getting more expensive every quarter.\n\nWe built Aegis to close it: every SOC decision is signal → context → recommendation → simulation → policy → execution → proof. Exportable, immutable, audit-grade.\n\nWe're opening 6 design partner slots in Q2 (50% off Year 1, founder access, roadmap input). [Company] looks like a strong fit because [specific reason — e.g. "Expel sells transparency as a feature"].\n\n20 minutes next week to walk you through the proof chain on a [Company]-shaped decision?\n\n[Your name]\nSZL Holdings` },
  { vertical: "Maritime", subject: "Sanctions decision trail for [Company]'s charters — design partner slot", body: `[First name],\n\nEvery charter and pool decision your team makes carries OFAC, EU, and IMO exposure. When a regulator or auditor asks "walk me through how this charter cleared sanctions on [date]," the answer today is usually email threads, Excel, and the analyst's memory.\n\nWe built Vessels to make that decision exportable: signal (sanctions hit, vessel history, beneficial owner) → context → recommendation → policy gate → approver → proof. One click for any audit window.\n\nWe're opening 6 design partner slots in Q2 (50% off Year 1, direct founder access). [Company] is a strong fit because [specific reason — e.g. "SEC disclosure obligations on TNK make decision evidence existential"].\n\n20 minutes next week to walk through it on a [Company]-shaped charter?\n\n[Your name]\nSZL Holdings` },
  { vertical: "Real Estate", subject: "IC decision trail for [Company] — design partner slot", body: `[First name],\n\nYour investment committee makes high-consequence decisions weekly. When an LP, an auditor, or your own future IC asks "what did we know when we approved deal X, and who approved it under what assumptions," the answer today is a deck, an email chain, and someone's memory.\n\nTerra is the IC's defensible memory: signal (deal, market, comp) → context → recommendation → simulation → policy gate (LP covenants, mandate constraints) → approver → proof. Exportable for LP reports, audits, and post-mortems.\n\nWe're opening 6 design partner slots in Q2 (50% off Year 1, founder access, roadmap input). [Company] looks like a fit because [specific reason — e.g. "your LP base is increasingly asking for decision-process disclosure"].\n\n20 minutes next week to walk through it on a [Company]-shaped acquisition?\n\n[Your name]\nSZL Holdings` },
  { vertical: "Legal", subject: "Matter-decision proof for [Company] — design partner slot", body: `[First name],\n\nYour matter teams make high-consequence calls every day — staffing, strategy, settlement, advice. The trail of *why* a particular call was made lives in email, in matter notes, and in the lawyer's head. When a regulator, the client, or your own QA team asks for that trail, reconstructing it is hours of work.\n\nPRISM Counsel makes the matter-decision trail first-class: signal (matter event, deadline, conflict) → context → recommendation → policy gate (ethical walls, conflicts) → approver → proof.\n\nWe're opening 6 design partner slots in Q2 (50% off Year 1, founder access). [Company] is a fit because [specific reason — e.g. "your distributed-lawyer model makes consistent governance a strategic moat"].\n\n20 minutes next week?\n\n[Your name]\nSZL Holdings` },
];

const LINKEDIN_DM = `Hi [First name] — running a small design-partner cohort for SZL Holdings (governed decision infrastructure for [their domain]). Six slots, 50% off Year 1, founder access, roadmap input. [Company] looks like a strong fit because [specific reason]. Worth 20 minutes next week to show you the decision trail on a [Company]-shaped scenario?`;
const FOLLOWUP_2 = `[First name] — circling back on this. No pressure if the timing is wrong. The reason I'm reaching out specifically is [one-sentence specific reason]. If it's a no, a one-line "not now" is a gift. If you'd like me to send the design partner program one-pager instead of a meeting, happy to.`;
const FOLLOWUP_3 = `[First name] — last note from me on this. Closing out my outreach pass. If the accountability/audit gap I described isn't a 2026 priority, totally fine — I'd rather hear that than chase. If it *is* a priority and the timing just isn't right, send me a date in Q3 and I'll re-surface then.`;
const DPA_PREVIEW = `DESIGN PARTNER AGREEMENT (TEMPLATE — see DESIGN_PARTNER_AGREEMENT.md for full)\n\nBetween SZL Holdings and [Partner Legal Name].\n\n1.  Term: 12 months from Kickoff Date.\n2.  Pricing: 50% of list (Year 1 platform + packs); 25% off list Year 2; list + 7% Year 3+.\n3.  Scope: [Domain pack(s) — Aegis / Vessels / Terra / PRISM Counsel].\n4.  Success Metric: [co-defined, written, measurable] — measured at Day 90.\n5.  Partner Commitments: production deployment, quarterly feedback, up to 4 reference calls/yr, 1 case study/yr (anonymized OK), 1 public reference event/yr.\n6.  SZL Commitments: monthly founder working session, quarterly product input session, prioritized roadmap consideration, pricing lock through Year 1.\n7.  Data: per Data Processing Agreement, separate exhibit.\n8.  Confidentiality: mutual, 3 yr survival.\n9.  Termination: either party at end of pilot (Day 90) or end of term, no claw-back of pilot pricing; 90-day data export window.\n10. Governing law: [State].\n\nSignatures:\nSZL Holdings: _______________________  Date: __________\n[Partner]:    _______________________  Date: __________`;
const KICKOFF_AGENDA = `DESIGN PARTNER KICKOFF — 60 min\n\n00:00–00:05  Welcome, intros, ground rules\n00:05–00:15  Confirm success metric (written, measurable, Day-90 review)\n00:15–00:25  Partner walks SZL through the decision they want to govern first\n00:25–00:35  SZL walks partner through provisioning + integration plan\n00:35–00:45  Identity setup (OIDC/SCIM) + signal sources scoping\n00:45–00:55  Cadence: weekly check-ins (wks 1–4), biweekly (wks 5–12), monthly founder\n00:55–01:00  Action items, owners, dates\n\nPre-read sent 48h before:\n  - DESIGN_PARTNER_PROGRAM.md\n  - PILOT_PLAYBOOK.md\n  - SECURITY_QUESTIONNAIRE.md (architecture overview)\n\nDecisions captured in writing, signed by champion + SZL CSM, archived in deal record.`;
const DISCOVERY_SCRIPT = `DISCOVERY CALL — 25 min (after they accept the meeting)\n\n00:00–00:03  Set the frame: "I'd like to spend 20 minutes understanding how decisions get made and recorded today. Then 5 minutes on whether what we built fits."\n\n00:03–00:18  The six questions (let them talk):\n  1. How do you currently track which decisions were made, who made them, and based on what information?\n  2. When a regulatory body or legal team asks to reconstruct a decision chain, how do you respond?\n  3. How do you govern AI recommendations before they become actions?\n  4. Who in your organization is accountable when an AI-assisted action goes wrong?\n  5. What does your compliance posture look like for high-consequence operational decisions?\n  6. What does your team spend on managing decision fallout — audits, investigations, remediation?\n\n00:18–00:23  Mirror back what you heard. Name the accountability gap in their words.\n\n00:23–00:25  Next step: "Based on this, the right next step is [demo / no fit / different product]. Would [date] work for a 30-min walkthrough on a [their-shaped] decision?"\n\nIf they don't have the gap: end the call honestly. They are not a fit. Save the time on both sides.`;

function DealAuditTrail({ dealId }: { dealId: number }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "pipeline-deal-events", dealId],
    queryFn: async () => (await apiJson(`${API}/admin/pipeline-deals/${dealId}/events`)) as DealEvent[],
  });
  if (isLoading) {
    return <div style={{ fontSize: 11.5, color: COLORS.textMuted, padding: "8px 0", display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={11} className="animate-spin" /> Loading audit trail…</div>;
  }
  if (isError) {
    return <div style={{ fontSize: 11.5, color: "hsl(0,72%,68%)", padding: "8px 0" }}>Audit trail unavailable: {error instanceof Error ? error.message : "unknown error"}</div>;
  }
  if (!data || data.length === 0) {
    return <div style={{ fontSize: 11.5, color: COLORS.textMuted, padding: "8px 0" }}>No stage transitions recorded yet.</div>;
  }
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 4 }}>
      {data.map((ev) => {
        const who = ev.actorName ?? ev.actorEmail ?? (ev.actorUserId != null ? `user #${ev.actorUserId}` : "unknown actor");
        const when = new Date(ev.createdAt).toLocaleString();
        const transition = ev.fromStage ? `${ev.fromStage} → ${ev.toStage}` : `created at ${ev.toStage}`;
        return (
          <li key={ev.id} style={{ fontSize: 11.5, color: COLORS.textMuted, lineHeight: 1.5 }}>
            <span style={{ color: COLORS.text }}>{transition}</span>
            <span style={{ marginLeft: 6 }}>· {who} · {when}</span>
            {ev.note && <span style={{ marginLeft: 6, fontStyle: "italic" }}>— {ev.note}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default function PipelineCommandPage() {
  usePageMeta({ title: "Pipeline Command — Sales Execution" });
  const queryClient = useQueryClient();

  const [verticalFilter, setVerticalFilter] = useState<Vertical | "All">("All");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Partial<Deal>>({});
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [auditOpenFor, setAuditOpenFor] = useState<number | null>(null);

  const dealsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await apiJson(`${API}/admin/pipeline-deals`)) as Deal[],
  });

  const deals: Deal[] = dealsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (input: Omit<Deal, "id" | "updatedAt" | "createdAt">) => {
      return (await apiJson(`${API}/admin/pipeline-deals`, {
        method: "POST",
        body: JSON.stringify(input),
      })) as Deal;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Deal[]>(QUERY_KEY);
      const optimistic: Deal = {
        ...input,
        id: -Math.floor(Math.random() * 1_000_000),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Deal[]>(QUERY_KEY, (curr) => [optimistic, ...(curr ?? [])]);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { id: number; patch: Partial<Deal> }) => {
      return (await apiJson(`${API}/admin/pipeline-deals/${args.id}`, {
        method: "PATCH",
        body: JSON.stringify(args.patch),
      })) as Deal;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Deal[]>(QUERY_KEY);
      queryClient.setQueryData<Deal[]>(QUERY_KEY, (curr) =>
        (curr ?? []).map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)),
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (vars?.id) queryClient.invalidateQueries({ queryKey: ["admin", "pipeline-deal-events", vars.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiJson(`${API}/admin/pipeline-deals/${id}`, { method: "DELETE" });
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Deal[]>(QUERY_KEY);
      queryClient.setQueryData<Deal[]>(QUERY_KEY, (curr) => (curr ?? []).filter((d) => d.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const counts = useMemo(() => {
    const c: Record<Stage, number> = {
      "Researched": 0, "Outreach Sent": 0, "Reply / Meeting Booked": 0,
      "Discovery Call": 0, "Demo Delivered": 0, "DPA Sent": 0, "Signed": 0, "Lost / No Fit": 0,
    };
    for (const d of deals) c[d.stage] += 1;
    return c;
  }, [deals]);

  const activePipeline = deals.filter(
    (d) => d.stage !== "Researched" && d.stage !== "Signed" && d.stage !== "Lost / No Fit",
  ).length;
  const researchedDealCount = counts["Researched"];
  const signed = counts["Signed"];

  const visibleTargets = useMemo(() => {
    return verticalFilter === "All" ? TARGETS : TARGETS.filter((t) => t.vertical === verticalFilter);
  }, [verticalFilter]);

  function addDeal() {
    if (!draft.account || !draft.vertical) return;
    createMutation.mutate({
      account: draft.account,
      vertical: draft.vertical,
      champion: draft.champion ?? "",
      championTitle: draft.championTitle ?? "",
      stage: (draft.stage as Stage) ?? "Researched",
      fitScore: draft.fitScore ?? 7,
      nextStep: draft.nextStep ?? "",
      notes: draft.notes ?? "",
    });
    setDraft({});
    setShowAdd(false);
  }

  function updateStage(id: number, stage: Stage) {
    setPendingId(id);
    updateMutation.mutate({ id, patch: { stage } }, { onSettled: () => setPendingId(null) });
  }

  function removeDeal(id: number) {
    if (typeof window !== "undefined" && !window.confirm("Delete this deal? Audit history is retained.")) return;
    deleteMutation.mutate(id);
  }

  function promoteTarget(t: TargetAccount) {
    const exists = deals.some((d) => d.account.toLowerCase() === t.account.toLowerCase());
    if (exists) return;
    createMutation.mutate({
      account: t.account,
      vertical: t.vertical,
      champion: "",
      championTitle: t.whoToFind,
      stage: "Researched",
      fitScore: t.fitScore,
      nextStep: `Find ${t.whoToFind.split(",")[0]} on LinkedIn`,
      notes: `${t.why}\n\nHook: ${t.hook}`,
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, padding: "32px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        <header style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.textDim, margin: "0 0 8px" }}>
            Founder · Outbound Sales Execution
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.015em", margin: 0 }}>
            Pipeline Command
          </h1>
          <p style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 13.5, maxWidth: 760, lineHeight: 1.55 }}>
            Operational console for activating the design-partner motion. Researched ICP-fit accounts (not contacted),
            an honest pipeline shared across the team, and the outreach, DPA, and kickoff kits to move a deal from cold to signed.
            Pipeline state is persisted server-side and visible to every admin in your organization, with an audit trail of stage transitions.
          </p>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => dealsQuery.refetch()}
              disabled={dealsQuery.isFetching}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", background: "transparent",
                border: `1px solid ${COLORS.border}`, borderRadius: 5,
                color: COLORS.textMuted, fontSize: 11.5, cursor: dealsQuery.isFetching ? "wait" : "pointer",
              }}
            >
              <RefreshCw size={11} className={dealsQuery.isFetching ? "animate-spin" : undefined} /> Refresh
            </button>
            {dealsQuery.isError && (
              <span style={{ fontSize: 11.5, color: "hsl(0,72%,68%)" }}>
                Failed to load: {dealsQuery.error instanceof Error ? dealsQuery.error.message : "unknown error"}
              </span>
            )}
          </div>
        </header>

        {/* Honest scoreboard */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10, marginBottom: 8,
        }}>
          {[
            { label: "Signed Design Partners", value: signed, accent: signed > 0 ? "hsl(142,60%,55%)" : COLORS.textMuted },
            { label: "Active Pipeline (contacted)", value: activePipeline, accent: activePipeline > 0 ? COLORS.accent : COLORS.textMuted },
            { label: "In Research Queue", value: researchedDealCount, accent: COLORS.textMuted },
            { label: "Researched Target Bank", value: TARGETS.length, accent: COLORS.text },
            { label: "Cohort 1 Slots Open", value: Math.max(0, 6 - signed), accent: COLORS.text },
          ].map((s) => (
            <div key={s.label} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.textDim }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.accent, marginTop: 4 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        {!dealsQuery.isLoading && signed === 0 && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "10px 14px", marginTop: 6,
            background: "hsla(45,80%,52%,0.07)", border: "1px solid hsla(45,80%,55%,0.18)", borderRadius: 6,
            color: "hsl(45,80%,80%)", fontSize: 12.5, lineHeight: 1.5,
          }}>
            <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              <strong>Honest status:</strong> zero design partners signed. Zero deals in pipeline.
              The platform, the program, the kit, and the targets are ready — execution (real outreach to real humans) is the gating step.
              Until a human signs a real DPA, do not log fabricated entries here.
            </span>
          </div>
        )}

        {/* Pipeline */}
        <Section title="Live Pipeline" eyebrow="Real deals only · Shared across team">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STAGES.map((s) => (
                <div key={s} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px",
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 999,
                  fontSize: 11, color: COLORS.textMuted,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: STAGE_COLOR[s] }} />
                  {s} <span style={{ color: COLORS.text, fontWeight: 600 }}>{counts[s]}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "7px 14px", background: COLORS.accent, color: "#1a1206",
                border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus size={13} /> Log a real deal
            </button>
          </div>

          {showAdd && (
            <div style={{
              background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderStrong}`,
              borderRadius: 8, padding: 14, marginBottom: 12,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                <input placeholder="Account name" value={draft.account ?? ""} onChange={(e) => setDraft({ ...draft, account: e.target.value })} style={inputStyle} />
                <select value={draft.vertical ?? ""} onChange={(e) => setDraft({ ...draft, vertical: e.target.value as Vertical })} style={inputStyle}>
                  <option value="">Vertical…</option>
                  {(["Security", "Maritime", "Real Estate", "Legal"] as Vertical[]).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <input placeholder="Champion name" value={draft.champion ?? ""} onChange={(e) => setDraft({ ...draft, champion: e.target.value })} style={inputStyle} />
                <input placeholder="Champion title" value={draft.championTitle ?? ""} onChange={(e) => setDraft({ ...draft, championTitle: e.target.value })} style={inputStyle} />
                <select value={draft.stage ?? "Researched"} onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })} style={inputStyle}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" min={1} max={10} placeholder="Fit score 1–10" value={draft.fitScore ?? ""} onChange={(e) => setDraft({ ...draft, fitScore: Number(e.target.value) })} style={inputStyle} />
                <input placeholder="Next step" value={draft.nextStep ?? ""} onChange={(e) => setDraft({ ...draft, nextStep: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1" }} />
                <textarea placeholder="Notes" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 60, fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={addDeal} disabled={!draft.account || !draft.vertical || createMutation.isPending} style={{ ...primaryBtn, opacity: (!draft.account || !draft.vertical) ? 0.5 : 1 }}>
                  {createMutation.isPending ? "Adding…" : "Add deal"}
                </button>
                <button onClick={() => { setShowAdd(false); setDraft({}); }} style={ghostBtn}>Cancel</button>
              </div>
            </div>
          )}

          {dealsQuery.isLoading && (
            <div style={{ padding: 36, textAlign: "center", color: COLORS.textMuted, fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 8 }}>
              Loading shared pipeline…
            </div>
          )}

          {!dealsQuery.isLoading && deals.length === 0 && (
            <div style={{ padding: 36, textAlign: "center", color: COLORS.textMuted, fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 8 }}>
              No deals logged yet. When you actually contact a target, log it here. Until then, the scoreboard stays honest.
            </div>
          )}

          {deals.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deals.map((d) => {
                const VIcon = VERTICAL_ICON[d.vertical];
                const isPending = pendingId === d.id;
                const auditOpen = auditOpenFor === d.id;
                return (
                  <div key={d.id} style={{
                    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, padding: 14,
                    display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start",
                    opacity: d.id < 0 ? 0.6 : 1,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <VIcon size={14} color={COLORS.textMuted} />
                        <strong style={{ fontSize: 14.5 }}>{d.account}</strong>
                        <span style={{ fontSize: 10.5, color: COLORS.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>{d.vertical}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "hsla(0,0%,100%,0.04)", color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
                          fit {d.fitScore}/10
                        </span>
                      </div>
                      {(d.champion || d.championTitle) && (
                        <div style={{ marginTop: 4, fontSize: 12.5, color: COLORS.textMuted }}>
                          {d.champion}{d.champion && d.championTitle ? " · " : ""}{d.championTitle}
                        </div>
                      )}
                      {d.nextStep && (
                        <div style={{ marginTop: 6, fontSize: 12.5, color: COLORS.text }}>
                          <span style={{ color: COLORS.textDim }}>Next: </span>{d.nextStep}
                        </div>
                      )}
                      {d.notes && (
                        <div style={{ marginTop: 6, fontSize: 12, color: COLORS.textMuted, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {d.notes}
                        </div>
                      )}
                      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STAGES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStage(d.id, s)}
                            disabled={isPending || d.id < 0}
                            style={{
                              padding: "3px 9px", borderRadius: 999, fontSize: 10.5, cursor: isPending ? "wait" : "pointer",
                              border: `1px solid ${d.stage === s ? STAGE_COLOR[s] : COLORS.border}`,
                              background: d.stage === s ? `${STAGE_COLOR[s]}22` : "transparent",
                              color: d.stage === s ? STAGE_COLOR[s] : COLORS.textMuted,
                              fontWeight: d.stage === s ? 600 : 400,
                            }}
                          >{s}</button>
                        ))}
                      </div>
                      {d.id > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            onClick={() => setAuditOpenFor(auditOpen ? null : d.id)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "3px 8px", background: "transparent",
                              border: `1px solid ${COLORS.border}`, borderRadius: 5,
                              color: COLORS.textMuted, fontSize: 11, cursor: "pointer",
                            }}
                          >
                            <History size={11} /> {auditOpen ? "Hide" : "Show"} audit trail
                          </button>
                          {auditOpen && <DealAuditTrail dealId={d.id} />}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeDeal(d.id)}
                      title="Remove"
                      disabled={d.id < 0}
                      style={{ background: "transparent", border: "none", color: COLORS.textDim, cursor: "pointer", padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Researched Targets */}
        <Section title="Researched Target Accounts" eyebrow="ICP-fit · Not contacted">
          <p style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: -8, marginBottom: 14, lineHeight: 1.55, maxWidth: 800 }}>
            {TARGETS.length} public companies that match the firmographic, regulatory, and persona profile in the Sales Handoff Guide.
            Research starting points — validate, enrich (recent news, intros, exec changes) before contacting. Promote to pipeline when you decide to actually pursue.
          </p>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {(["All", "Security", "Maritime", "Real Estate", "Legal"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVerticalFilter(v)}
                style={{
                  padding: "5px 12px", borderRadius: 999, fontSize: 11.5, cursor: "pointer",
                  border: `1px solid ${verticalFilter === v ? COLORS.borderStrong : COLORS.border}`,
                  background: verticalFilter === v ? "hsla(0,0%,100%,0.08)" : "transparent",
                  color: verticalFilter === v ? COLORS.text : COLORS.textMuted,
                  fontWeight: verticalFilter === v ? 600 : 400,
                }}
              >{v}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {visibleTargets.map((t) => {
              const VIcon = VERTICAL_ICON[t.vertical];
              const inPipeline = deals.some((d) => d.account.toLowerCase() === t.account.toLowerCase());
              return (
                <div key={t.account} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: 14, display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <VIcon size={13} color={COLORS.textMuted} />
                    <strong style={{ fontSize: 13.5 }}>{t.account}</strong>
                    <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "hsla(0,0%,100%,0.04)", color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
                      {t.product} · fit {t.fitScore}/10
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.55, marginTop: 4 }}>
                    {t.why}
                  </div>
                  <div style={{ fontSize: 11.5, color: COLORS.text, marginTop: 8, lineHeight: 1.5 }}>
                    <span style={{ color: COLORS.textDim }}>Find: </span>{t.whoToFind}
                  </div>
                  <div style={{ fontSize: 11.5, color: COLORS.text, marginTop: 4, lineHeight: 1.5 }}>
                    <span style={{ color: COLORS.textDim }}>Hook: </span>{t.hook}
                  </div>
                  <button
                    onClick={() => promoteTarget(t)}
                    disabled={inPipeline || createMutation.isPending}
                    style={{
                      marginTop: 12,
                      padding: "6px 12px",
                      background: inPipeline ? "hsla(142,60%,45%,0.10)" : "hsla(0,0%,100%,0.05)",
                      color: inPipeline ? "hsl(142,60%,68%)" : COLORS.text,
                      border: `1px solid ${inPipeline ? "hsla(142,60%,55%,0.25)" : COLORS.border}`,
                      borderRadius: 5, fontSize: 11.5, fontWeight: 600,
                      cursor: inPipeline ? "default" : "pointer",
                      display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center",
                    }}
                  >
                    {inPipeline ? <><CheckCircle2 size={12} /> In pipeline</> : <><Target size={12} /> Promote to pipeline</>}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Outreach Kit */}
        <Section title="Outreach Kit" eyebrow="Copy, personalize, send">
          {EMAIL_TEMPLATES.map((t) => {
            const VIcon = VERTICAL_ICON[t.vertical];
            return (
              <CollapsibleCard key={t.vertical} icon={Mail} title={`Email · ${t.vertical}`} subtitle={t.subject}>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <VIcon size={12} color={COLORS.textMuted} />
                    <span style={{ fontSize: 11, color: COLORS.textDim }}>Subject:</span>
                    <span style={{ fontSize: 12.5, color: COLORS.text }}>{t.subject}</span>
                    <div style={{ marginLeft: "auto" }}><CopyButton text={`Subject: ${t.subject}\n\n${t.body}`} label="Copy email" /></div>
                  </div>
                  <pre style={preStyle}>{t.body}</pre>
                </div>
              </CollapsibleCard>
            );
          })}
          <CollapsibleCard icon={Linkedin} title="LinkedIn DM (universal)" subtitle="120-word warm intro">
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyButton text={LINKEDIN_DM} /></div>
              <pre style={preStyle}>{LINKEDIN_DM}</pre>
            </div>
          </CollapsibleCard>
          <CollapsibleCard icon={Mail} title="Follow-up #2 (T+5 days)" subtitle="Permission to bow out gracefully">
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyButton text={FOLLOWUP_2} /></div>
              <pre style={preStyle}>{FOLLOWUP_2}</pre>
            </div>
          </CollapsibleCard>
          <CollapsibleCard icon={Mail} title="Follow-up #3 / Break-up (T+12 days)" subtitle="Last note — re-surface request">
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyButton text={FOLLOWUP_3} /></div>
              <pre style={preStyle}>{FOLLOWUP_3}</pre>
            </div>
          </CollapsibleCard>
        </Section>

        {/* Discovery + Demo + DPA + Kickoff */}
        <Section title="Deal Execution Kit" eyebrow="From first reply to signed DPA">
          <CollapsibleCard icon={ClipboardCheck} title="Discovery Call Script (25 min)" subtitle="The 6 questions, in order">
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyButton text={DISCOVERY_SCRIPT} /></div>
              <pre style={preStyle}>{DISCOVERY_SCRIPT}</pre>
            </div>
          </CollapsibleCard>
          <CollapsibleCard icon={FileText} title="Design Partner Agreement (preview)" subtitle="Full template at DESIGN_PARTNER_AGREEMENT.md">
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyButton text={DPA_PREVIEW} label="Copy template" /></div>
              <pre style={preStyle}>{DPA_PREVIEW}</pre>
            </div>
          </CollapsibleCard>
          <CollapsibleCard icon={Handshake} title="Kickoff Agenda (60 min)" subtitle="Use within 14 days of DPA signature">
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><CopyButton text={KICKOFF_AGENDA} /></div>
              <pre style={preStyle}>{KICKOFF_AGENDA}</pre>
            </div>
          </CollapsibleCard>
        </Section>

        {/* Companion docs */}
        <Section title="Companion Docs" eyebrow="Read before scaling outreach">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {[
              { title: "TARGET_ACCOUNTS.md", desc: "Full researched account list with rationale and hooks." },
              { title: "OUTREACH_SEQUENCES.md", desc: "Email + LinkedIn sequences per vertical and persona." },
              { title: "DESIGN_PARTNER_AGREEMENT.md", desc: "Fillable DPA — all clauses, ready to send." },
              { title: "FIRST_MEETING_KIT.md", desc: "Discovery script, demo flow, follow-up library." },
              { title: "SALES_EXECUTION_STATUS.md", desc: "Honest current state and what only a human can do." },
              { title: "SALES_HANDOFF_GUIDE.md", desc: "Existing motion + qualification (already in repo)." },
              { title: "DESIGN_PARTNER_PROGRAM.md", desc: "Existing program structure + pricing (already in repo)." },
              { title: "DEMO_STRATEGY.md", desc: "Existing demo scripts by audience (already in repo)." },
            ].map((d) => (
              <div key={d.title} style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, padding: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Briefcase size={12} color={COLORS.textMuted} />
                  <code style={{ fontSize: 12, color: COLORS.text }}>{d.title}</code>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 6, lineHeight: 1.5 }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  background: "hsla(0,0%,0%,0.4)",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 5,
  color: COLORS.text,
  fontSize: 12.5,
  fontFamily: "inherit",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  padding: "7px 14px", background: COLORS.accent, color: "#1a1206",
  border: "none", borderRadius: 5, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  padding: "7px 14px", background: "transparent", color: COLORS.text,
  border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 12.5, cursor: "pointer",
};

const preStyle: React.CSSProperties = {
  margin: 0, padding: 12,
  background: "hsla(0,0%,0%,0.35)",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  color: "hsl(38,8%,82%)",
  fontSize: 12,
  lineHeight: 1.6,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  whiteSpace: "pre-wrap",
  overflowX: "auto",
};
