import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NoiseGrain } from "@szl-holdings/shared-ui";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface AcquisitionData {
  platform: { name: string; founder: string; founded: string; stage: string; type: string };
  scale: { webApps: number; mobileApps: number; totalApps: number; databaseTables: number; apiEndpoints: number; industries: number; founders: number };
  webApps: Array<{ name: string; slug: string; domain: string; industry: string; status: string }>;
  mobileApps: Array<{ name: string; platform: string; status: string }>;
  techStack: Record<string, string[]>;
  defensibility: { score: number; factors: Array<{ name: string; score: number; detail: string }> };
  acquisitionReadiness: { overallScore: number; categories: Array<{ name: string; score: number; status: string; detail: string }> };
  valuationDrivers: { strengths: string[]; opportunities: string[] };
  industries: Array<{ name: string; tam: string; products: string[] }>;
  generatedAt: string;
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-3">{label}</div>
        <div className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{value}</div>
        {sub && <div className="text-xs text-white/30 mt-2">{sub}</div>}
      </div>
    </div>
  );
}

function ScoreBar({ label, score, detail }: { label: string; score: number; detail?: string }) {
  const color = score >= 90 ? "bg-white" : score >= 80 ? "bg-white/80" : score >= 70 ? "bg-white/60" : "bg-white/40";
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">{label}</span>
        <span className="text-sm font-bold text-white tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      {detail && <div className="text-xs text-white/30 mt-1.5">{detail}</div>}
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{title}</h2>
      {subtitle && <p className="text-sm text-white/40 mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#080b12] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-white/[0.04] rounded-xl w-96" />
          <div className="h-6 bg-white/[0.04] rounded-lg w-64" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white/[0.04] rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Investor() {
  const { data, isLoading, error } = useQuery<AcquisitionData>({
    queryKey: ["acquisition-metrics"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/stephen/acquisition-metrics`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingSkeleton />;

  const d = data ?? {
    platform: { name: "SZL Holdings", founder: "Stephen Lutar", founded: "2024", stage: "Pre-Revenue", type: "AI-Native Platform" },
    scale: { webApps: 8, mobileApps: 7, totalApps: 15, databaseTables: 375, apiEndpoints: 1618, industries: 5, founders: 1 },
    webApps: [],
    mobileApps: [],
    techStack: {},
    defensibility: { score: 92, factors: [] },
    acquisitionReadiness: { overallScore: 88, categories: [] },
    valuationDrivers: { strengths: [], opportunities: [] },
    industries: [],
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-white selection:bg-indigo-500/30 selection:text-white relative">
      <NoiseGrain opacity={0.02} />
      <Navbar />

      <main className="relative">
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/[0.06] to-transparent rounded-full blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium tracking-[0.15em] uppercase text-white/50 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              Investor Due Diligence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {d.platform.name}
              <span className="block text-white/30 text-3xl md:text-4xl mt-3 font-normal">{d.platform.type}</span>
            </h1>
            <div className="flex flex-wrap gap-6 mt-8 text-sm text-white/40">
              <span>Founded {d.platform.founded}</span>
              <span className="text-white/10">|</span>
              <span>Founder: {d.platform.founder}</span>
              <span className="text-white/10">|</span>
              <span>Stage: {d.platform.stage}</span>
            </div>
            {error && <div className="mt-4 text-sm text-white/50 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2 inline-block">API offline — showing static baseline data</div>}
          </div>
        </section>

        {/* Platform Scale */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Platform Scale" subtitle="Full-stack TypeScript ecosystem built by a single founder — 15 production applications across 5 industries" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Web Applications" value={d.scale.webApps} sub="React + Vite — production" />
              <MetricCard label="Mobile Applications" value={d.scale.mobileApps} sub="Expo — iOS & Android" />
              <MetricCard label="Database Tables" value={`${d.scale.databaseTables}+`} sub="PostgreSQL — typed schema" />
              <MetricCard label="API Endpoints" value={`${d.scale.apiEndpoints.toLocaleString()}+`} sub="RESTful — Express 5" />
              <MetricCard label="Industries Served" value={d.scale.industries} sub="From single codebase" />
              <MetricCard label="Founders" value={d.scale.founders} sub="Full IP concentration" />
              <MetricCard label="Architecture" value="Monorepo" sub="pnpm workspace — shared libs" />
              <MetricCard label="Type Safety" value="100%" sub="End-to-end TypeScript" />
            </div>
          </div>
        </section>

        {/* Defensibility */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Defensibility Analysis" subtitle="Proprietary IP moat assessment across five dimensions of competitive advantage" />
            <div className="grid md:grid-cols-[280px_1fr] gap-10">
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-6xl font-bold tracking-tight text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{d.defensibility.score}</div>
                <div className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mt-3">Overall Score</div>
                <div className="text-xs text-white/20 mt-1">out of 100</div>
              </div>
              <div className="space-y-5">
                {d.defensibility.factors.map((f) => (
                  <ScoreBar key={f.name} label={f.name} score={f.score} detail={f.detail} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Acquisition Readiness */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Acquisition Readiness" subtitle="Category-level maturity assessment for institutional due diligence" />
            <div className="grid md:grid-cols-[280px_1fr] gap-10">
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-6xl font-bold tracking-tight text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{d.acquisitionReadiness.overallScore}</div>
                <div className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mt-3">Readiness Score</div>
                <div className="text-xs text-white/20 mt-1">out of 100</div>
              </div>
              <div className="space-y-5">
                {d.acquisitionReadiness.categories.map((c) => (
                  <ScoreBar key={c.name} label={c.name} score={c.score} detail={c.detail} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industry TAM */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Total Addressable Market" subtitle="Five-industry horizontal play from a single shared architecture" />
            <div className="grid md:grid-cols-5 gap-4">
              {d.industries.map((ind) => (
                <div key={ind.name} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                  <div className="text-sm font-semibold text-white mb-1">{ind.name}</div>
                  <div className="text-lg font-bold text-white/80 mb-3">{ind.tam}</div>
                  <div className="space-y-1">
                    {ind.products.map((p) => (
                      <div key={p} className="text-xs text-white/30">{p}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Web Apps */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Production Applications" subtitle="8 web applications and 7 mobile applications deployed and operational" />
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {d.webApps.map((app) => (
                <div key={app.slug} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.10] transition-all">
                  <div className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{app.name}</div>
                    <div className="text-xs text-white/30 truncate">{app.domain}</div>
                  </div>
                  <div className="text-xs font-medium tracking-wider uppercase text-white/20">{app.industry}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
              {d.mobileApps.map((app) => (
                <div key={app.name} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-white/70">{app.name}</div>
                    <div className="text-xs text-white/20">{app.platform}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Technology Stack" subtitle="Modern, auditable, enterprise-grade — full TypeScript from client to database" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(d.techStack).map(([category, items]) => (
                <div key={category} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-4">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span key={item} className="inline-block px-2.5 py-1 rounded-md bg-white/[0.04] text-xs text-white/60 border border-white/[0.04]">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Valuation Drivers */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading title="Valuation Drivers" subtitle="Key strengths and near-term catalysts for value creation" />
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-5">Core Strengths</div>
                <div className="space-y-3">
                  {d.valuationDrivers.strengths.map((s, i) => (
                    <div key={i} className="flex gap-3 text-sm text-white/60">
                      <span className="text-white/20 shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-5">Growth Catalysts</div>
                <div className="space-y-3">
                  {d.valuationDrivers.opportunities.map((o, i) => (
                    <div key={i} className="flex gap-3 text-sm text-white/60">
                      <span className="text-white/20 shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Interested in acquiring SZL Holdings?</h2>
            <p className="text-sm text-white/40 mb-8 max-w-xl mx-auto">
              Schedule a confidential conversation about the platform, architecture, and growth trajectory.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:stephenlutar2@gmail.com?subject=SZL Holdings Acquisition Inquiry"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#080b12] text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Contact Founder
              </a>
              <a
                href="https://x.com/szlholdings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.10] text-white/70 text-sm font-medium hover:border-white/[0.20] hover:text-white transition-all"
              >
                Follow on X
              </a>
            </div>
            <div className="mt-12 text-xs text-white/15">
              {d.generatedAt && d.generatedAt !== new Date().toISOString()
                ? `Database metrics queried ${new Date(d.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — scores assessed by founder`
                : "Scores assessed by founder — database metrics queried live when API is available"}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
