import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, ChevronRight, Upload, Send, Brain, CheckCircle2,
  AlertCircle, Building2, User, Target, Sparkles, TrendingUp,
  GraduationCap, Briefcase, Award, FileText,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { addSubmittedDeal } from "@/lib/dealSubmissions";

type SubmissionForm = {
  company: string;
  website: string;
  sector: string;
  stage: string;
  askSize: string;
  valuation: string;
  arr: string;
  growth: string;
  founderName: string;
  founderEmail: string;
  founderBackground: string;
  founderEducation: string;
  founderPriorExits: string;
  summary: string;
  deckUrl: string;
};

const SECTORS = [
  "Enterprise AI", "HealthTech", "Maritime Tech", "LegalTech / RegTech",
  "FinTech", "Climate Tech", "Defense / Dual-Use", "Autonomous Logistics",
  "DevTools / Infra", "Cybersecurity", "Other",
];

const STAGES = ["Pre-Seed", "Seed", "Seed+", "Series A", "Series B"];

const COMPARABLES: Record<string, { name: string; stage: string; valuation: string; outcome: string; multiple: string }[]> = {
  "Enterprise AI": [
    { name: "Glean", stage: "Series D", valuation: "$2.2B", outcome: "Active · 4x ARR multiple", multiple: "18.5x" },
    { name: "Hebbia", stage: "Series B", valuation: "$700M", outcome: "Active · LegalTech overlap", multiple: "22.0x" },
    { name: "Writer", stage: "Series C", valuation: "$1.9B", outcome: "Active · enterprise GTM", multiple: "19.2x" },
  ],
  "HealthTech": [
    { name: "Abridge", stage: "Series C", valuation: "$2.5B", outcome: "Active · clinical AI leader", multiple: "25.0x" },
    { name: "Suki AI", stage: "Series D", valuation: "$500M", outcome: "Active · ambient scribe", multiple: "14.0x" },
    { name: "Notable Health", stage: "Series B", valuation: "$200M", outcome: "Pre-revenue exit risk", multiple: "11.5x" },
  ],
  "Maritime Tech": [
    { name: "Sofar Ocean", stage: "Series C", valuation: "$240M", outcome: "Active · ocean intelligence", multiple: "9.8x" },
    { name: "Windward", stage: "Public", valuation: "£182M", outcome: "LSE listed · maritime AI", multiple: "7.2x" },
    { name: "Nautilus Labs", stage: "Series B", valuation: "$120M", outcome: "Active · voyage optimization", multiple: "12.4x" },
  ],
  "LegalTech / RegTech": [
    { name: "Harvey AI", stage: "Series C", valuation: "$3B", outcome: "Active · category leader", multiple: "28.0x" },
    { name: "Ironclad", stage: "Series E", valuation: "$3.2B", outcome: "Active · contract AI", multiple: "16.5x" },
    { name: "EvenUp", stage: "Series C", valuation: "$1B", outcome: "Active · regulatory niche", multiple: "20.0x" },
  ],
};

const DEFAULT_COMPS = [
  { name: "Sector match pending", stage: "—", valuation: "—", outcome: "Submit sector to view comps", multiple: "—" },
];

function scoreFounder(form: SubmissionForm) {
  let score = 50;
  const factors: { label: string; delta: number; reason: string; icon: typeof GraduationCap }[] = [];
  const exits = parseInt(form.founderPriorExits || "0", 10) || 0;
  if (exits >= 2) {
    score += 22; factors.push({ label: "Repeat founder", delta: 22, reason: `${exits} prior exits`, icon: Award });
  } else if (exits === 1) {
    score += 12; factors.push({ label: "Prior exit", delta: 12, reason: "1 prior exit", icon: Award });
  }
  const edu = form.founderEducation.toLowerCase();
  if (/(stanford|mit|harvard|berkeley|oxford|cambridge|ycombinator|y combinator)/.test(edu)) {
    score += 8; factors.push({ label: "Tier-1 credential", delta: 8, reason: "Top program", icon: GraduationCap });
  } else if (edu.length > 8) {
    score += 3; factors.push({ label: "Education noted", delta: 3, reason: "Verified profile", icon: GraduationCap });
  }
  const bg = form.founderBackground.toLowerCase();
  if (/(palantir|google|stripe|openai|anthropic|meta|nvidia|maersk|sec |fda)/.test(bg)) {
    score += 10; factors.push({ label: "Domain pedigree", delta: 10, reason: "Marquee operator background", icon: Briefcase });
  } else if (bg.length > 20) {
    score += 4; factors.push({ label: "Operator profile", delta: 4, reason: "Relevant experience", icon: Briefcase });
  }
  return { score: Math.min(99, score), factors };
}

function scoreTriage(form: SubmissionForm) {
  let score = 45;
  const signals: { label: string; delta: number; positive: boolean }[] = [];
  const arr = parseFloat((form.arr || "0").replace(/[^0-9.]/g, ""));
  const growth = parseFloat((form.growth || "0").replace(/[^0-9.]/g, ""));
  if (arr >= 1) { score += 14; signals.push({ label: `$${arr}M ARR threshold`, delta: 14, positive: true }); }
  else if (arr > 0) { score += 6; signals.push({ label: "Early revenue", delta: 6, positive: true }); }
  else { signals.push({ label: "Pre-revenue", delta: 0, positive: false }); }

  if (growth >= 15) { score += 14; signals.push({ label: `${growth}% MoM growth`, delta: 14, positive: true }); }
  else if (growth >= 8) { score += 7; signals.push({ label: "Healthy growth", delta: 7, positive: true }); }
  else if (growth > 0) { score += 2; signals.push({ label: "Modest growth", delta: 2, positive: false }); }

  const thesisSectors = ["Enterprise AI", "Maritime Tech", "LegalTech / RegTech", "Defense / Dual-Use", "HealthTech"];
  if (thesisSectors.includes(form.sector)) {
    score += 12; signals.push({ label: "Thesis sector match", delta: 12, positive: true });
  } else if (form.sector) {
    signals.push({ label: "Adjacent thesis", delta: 0, positive: false });
  }

  const ask = parseFloat((form.askSize || "0").replace(/[^0-9.]/g, ""));
  const val = parseFloat((form.valuation || "0").replace(/[^0-9.]/g, ""));
  if (val > 0 && ask > 0) {
    const dilution = (ask / val) * 100;
    if (dilution >= 10 && dilution <= 25) {
      score += 8; signals.push({ label: `Reasonable dilution (${dilution.toFixed(1)}%)`, delta: 8, positive: true });
    } else {
      signals.push({ label: `Dilution outlier (${dilution.toFixed(1)}%)`, delta: 0, positive: false });
    }
  }

  if (form.summary.length > 200) {
    score += 5; signals.push({ label: "Detailed thesis provided", delta: 5, positive: true });
  }
  return { score: Math.min(99, score), signals };
}

const EMPTY: SubmissionForm = {
  company: "", website: "", sector: "", stage: "", askSize: "", valuation: "",
  arr: "", growth: "", founderName: "", founderEmail: "", founderBackground: "",
  founderEducation: "", founderPriorExits: "", summary: "", deckUrl: "",
};

export default function DealScoringSubmitPage() {
  usePageMeta({
    title: "Submit a Deal — SZL Fund",
    description: "Inbound founder portal: submit your pitch and receive AI-driven triage and comparable analysis.",
  });

  const [form, setForm] = useState<SubmissionForm>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [pipelineId, setPipelineId] = useState<string>("");

  const triage = useMemo(() => scoreTriage(form), [form]);
  const founder = useMemo(() => scoreFounder(form), [form]);
  const comps = COMPARABLES[form.sector] ?? DEFAULT_COMPS;

  const compositeScore = Math.round(triage.score * 0.6 + founder.score * 0.4);
  const recommendation =
    compositeScore >= 78 ? { label: "Fast-track to partner review", color: "#6aaa72" } :
    compositeScore >= 62 ? { label: "Queue for analyst screening", color: "#d4a054" } :
    { label: "Below current thesis bar", color: "#c45a4a" };

  const update = <K extends keyof SubmissionForm>(k: K, v: SubmissionForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const canSubmit = form.company && form.sector && form.stage && form.founderName && form.founderEmail && form.summary;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const id = `DF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const teamScore = founder.score;
    const marketScore = form.sector === "Enterprise AI" || form.sector === "HealthTech" ? 85 : 70;
    const tractionScore = Math.min(95, 40 + Math.round(parseFloat((form.arr || "0").replace(/[^0-9.]/g, "")) * 10));
    addSubmittedDeal({
      id,
      company: form.company,
      sector: form.sector,
      stage: form.stage,
      askSize: form.askSize || "—",
      valuation: form.valuation || "—",
      convictionScore: compositeScore,
      scores: {
        team: teamScore,
        market: marketScore,
        product: triage.score,
        traction: tractionScore,
        competitive: Math.max(50, triage.score - 8),
        financials: Math.max(40, triage.score - 12),
      },
      status: compositeScore >= 78 ? "active" : compositeScore >= 62 ? "screening" : "passed",
      founder: form.founderName + (form.founderBackground ? ` (${form.founderBackground.slice(0, 60)}${form.founderBackground.length > 60 ? "…" : ""})` : ""),
      founderEmail: form.founderEmail,
      summary: form.summary,
      strengths: founder.factors.map(f => `${f.label}: ${f.reason}`),
      risks: triage.signals.filter(s => !s.positive).map(s => s.label),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      source: "inbound",
    });
    setPipelineId(id);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-6">
            <Link href="/fund/deal-scoring">
              <button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Deal Flow Pipeline
              </button>
            </Link>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className="text-[11px] text-white/60">Submit a Deal</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a054]/15">
              <Send className="h-[18px] w-[18px] text-[#d4a054]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Inbound Deal Submission Portal</h1>
              <p className="text-xs text-white/40">
                Founders · operators · scouts — submit a company. AI triage and comparable analysis run in real time.
              </p>
            </div>
          </div>

          {submitted ? (
            <SuccessPanel form={form} composite={compositeScore} recommendation={recommendation} pipelineId={pipelineId} onReset={() => { setForm(EMPTY); setSubmitted(false); setPipelineId(""); }} />
          ) : (
            <div className="grid grid-cols-12 gap-5 mt-8">
              <form onSubmit={handleSubmit} className="col-span-7 space-y-5">
                <Section icon={Building2} title="Company">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Company name *" value={form.company} onChange={v => update("company", v)} placeholder="Acme AI, Inc." />
                    <Field label="Website" value={form.website} onChange={v => update("website", v)} placeholder="acme.ai" />
                    <SelectField label="Sector *" value={form.sector} onChange={v => update("sector", v)} options={SECTORS} />
                    <SelectField label="Stage *" value={form.stage} onChange={v => update("stage", v)} options={STAGES} />
                    <Field label="Round size" value={form.askSize} onChange={v => update("askSize", v)} placeholder="$5M" />
                    <Field label="Pre-money valuation" value={form.valuation} onChange={v => update("valuation", v)} placeholder="$25M" />
                    <Field label="Current ARR ($M)" value={form.arr} onChange={v => update("arr", v)} placeholder="1.2" />
                    <Field label="MoM growth (%)" value={form.growth} onChange={v => update("growth", v)} placeholder="18" />
                  </div>
                </Section>

                <Section icon={User} title="Founder">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Lead founder name *" value={form.founderName} onChange={v => update("founderName", v)} placeholder="Jane Doe" />
                    <Field label="Email *" value={form.founderEmail} onChange={v => update("founderEmail", v)} placeholder="jane@acme.ai" />
                    <Field label="Education" value={form.founderEducation} onChange={v => update("founderEducation", v)} placeholder="Stanford MS CS" />
                    <Field label="Prior exits" value={form.founderPriorExits} onChange={v => update("founderPriorExits", v)} placeholder="1" />
                  </div>
                  <Field
                    label="Background (prior roles, domain expertise)"
                    value={form.founderBackground}
                    onChange={v => update("founderBackground", v)}
                    placeholder="ex-Palantir Forward Deployed Eng (5y), shipped data platform used by 30+ Fortune 500..."
                    multiline
                  />
                </Section>

                <Section icon={Target} title="Thesis & Materials">
                  <Field
                    label="One-paragraph summary *"
                    value={form.summary}
                    onChange={v => update("summary", v)}
                    placeholder="What you build, who you sell to, what's working, why now. Aim for 2–4 sentences."
                    multiline
                  />
                  <Field label="Deck URL" value={form.deckUrl} onChange={v => update("deckUrl", v)} placeholder="https://docsend.com/..." />
                </Section>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex items-center gap-2 rounded-xl bg-[#d4a054] px-5 py-2.5 text-xs font-semibold text-black hover:bg-[#d4a054]/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit to SZL Pipeline
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-white/60 hover:bg-white/[0.04]"
                  >
                    <Upload className="h-3.5 w-3.5" /> Attach Data Room
                  </button>
                  <span className="text-[10px] text-white/35">All submissions trigger autonomous triage within 60 seconds.</span>
                </div>
              </form>

              <aside className="col-span-5 space-y-4">
                <TriagePanel triage={triage} composite={compositeScore} recommendation={recommendation} />
                <FounderPanel founder={founder} name={form.founderName} />
                <ComparablesPanel sector={form.sector} comps={comps} />
              </aside>
            </div>
          )}
        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-3.5 w-3.5 text-[#d4a054]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls = "w-full rounded-xl border border-white/[0.08] bg-[#0c1018] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-[#d4a054]/40 focus:outline-none";
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.1em] text-white/40">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} mt-1 resize-none`} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${cls} mt-1`} />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.1em] text-white/40">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0c1018] px-3 py-2 text-xs text-white focus:border-[#d4a054]/40 focus:outline-none">
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function TriagePanel({ triage, composite, recommendation }: { triage: ReturnType<typeof scoreTriage>; composite: number; recommendation: { label: string; color: string } }) {
  return (
    <div className="rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-[#d4a054]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">AI Triage</span>
        </div>
        <span className="rounded-full bg-[#d4a054]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#d4a054]">Live</span>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-4xl font-bold" style={{ color: recommendation.color }}>{composite}</div>
          <div className="text-[10px] text-white/40">Composite score</div>
        </div>
        <div className="flex-1 pb-1">
          <div className="text-xs text-white/70">{recommendation.label}</div>
          <div className="text-[10px] text-white/35 mt-0.5">Triage {triage.score} · Founder weighting applied</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {triage.signals.length === 0 ? (
          <div className="text-[11px] text-white/35">Fill in company details to generate triage signals.</div>
        ) : triage.signals.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1.5">
            <div className="flex items-center gap-2 text-[11px] text-white/70">
              {s.positive ? <CheckCircle2 className="h-3 w-3 text-[#6aaa72]" /> : <AlertCircle className="h-3 w-3 text-[#c45a4a]" />}
              {s.label}
            </div>
            <span className="text-[10px] font-semibold text-white/50">{s.delta > 0 ? `+${s.delta}` : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FounderPanel({ founder, name }: { founder: ReturnType<typeof scoreFounder>; name: string }) {
  const color = founder.score >= 78 ? "#6aaa72" : founder.score >= 62 ? "#d4a054" : "#c45a4a";
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#8b7ac8]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">Founder Background</span>
        </div>
        <div className="text-2xl font-bold" style={{ color }}>{founder.score}</div>
      </div>
      <div className="text-[11px] text-white/50 mb-3">{name || "Awaiting founder info"}</div>
      <div className="space-y-1.5">
        {founder.factors.length === 0 ? (
          <div className="text-[11px] text-white/35">Add education, prior exits, or background to enrich scoring.</div>
        ) : founder.factors.map((f, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1.5">
            <div className="flex items-center gap-2 text-[11px] text-white/70">
              <f.icon className="h-3 w-3 text-[#8b7ac8]" />
              <span>{f.label}</span>
              <span className="text-white/30">· {f.reason}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#6aaa72]">+{f.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparablesPanel({ sector, comps }: { sector: string; comps: typeof DEFAULT_COMPS }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#4a90b8]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">Comparable Companies</span>
        </div>
        {sector ? <span className="text-[10px] text-white/40">{sector}</span> : null}
      </div>
      <div className="space-y-2">
        {comps.map((c, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-white">{c.name}</div>
              <span className="rounded-full bg-[#4a90b8]/15 px-2 py-0.5 text-[9px] font-semibold text-[#4a90b8]">{c.multiple} ARR mult</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/45">
              <span>{c.stage} · {c.valuation}</span>
              <span>{c.outcome}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessPanel({ form, composite, recommendation, pipelineId, onReset }: { form: SubmissionForm; composite: number; recommendation: { label: string; color: string }; pipelineId: string; onReset: () => void }) {
  return (
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl border border-[#6aaa72]/25 bg-[#6aaa72]/[0.05] p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6aaa72]/20">
          <CheckCircle2 className="h-5 w-5 text-[#6aaa72]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Submission received — {form.company}</h2>
          <p className="text-xs text-white/50">A confirmation has been sent to {form.founderEmail}. Your deal is now in the pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 my-6">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.1em] text-white/40">Composite</div>
          <div className="text-3xl font-bold mt-1" style={{ color: recommendation.color }}>{composite}</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.1em] text-white/40">Routing</div>
          <div className="text-sm font-semibold text-white mt-1">{recommendation.label}</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <div className="text-[10px] uppercase tracking-[0.1em] text-white/40">Pipeline ID</div>
          <div className="text-sm font-mono text-white mt-1">{pipelineId}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-3.5 w-3.5 text-white/50" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">Next steps</span>
        </div>
        <ul className="space-y-1.5 text-[11px] text-white/60">
          <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[#d4a054] flex-shrink-0" /> Analyst will review your submission within 5 business days.</li>
          <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[#d4a054] flex-shrink-0" /> Top-quartile submissions are auto-routed to a partner intro call.</li>
          <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-[#d4a054] flex-shrink-0" /> You'll receive a transparency note even if we pass.</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Link href="/fund/deal-scoring">
          <button className="rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90">View Pipeline</button>
        </Link>
        <button onClick={onReset} className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">
          Submit Another Deal
        </button>
      </div>
    </m.div>
  );
}
