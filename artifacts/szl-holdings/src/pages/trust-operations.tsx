import { Link } from "wouter";
import { Settings, ArrowRight, Activity, Server, AlertTriangle, Clock, Database, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const capabilities = [
  {
    icon: Activity,
    title: "Health monitoring",
    body: "Every service, connector, and workflow in the platform is continuously monitored. Health degradation is surfaced through the admin diagnostics layer before it affects end users.",
  },
  {
    icon: Server,
    title: "Service observability",
    body: "Request latency, error rates, queue depths, and connector health are tracked per tenant. Operators see real-time service health, not just uptime badges.",
  },
  {
    icon: AlertTriangle,
    title: "Incident management",
    body: "When a service degrades, the platform creates an incident record with root-cause context, affected tenants, and resolution timeline. Incidents are visible in the admin surface.",
  },
  {
    icon: Clock,
    title: "Retry and replay",
    body: "Failed ingestion jobs, webhook deliveries, and async workflows are retried with exponential backoff. Operators can replay specific events through the admin interface.",
  },
  {
    icon: Database,
    title: "Data isolation",
    body: "Every query, every export, and every AI inference is scoped to the requesting tenant. Cross-tenant data access is architecturally impossible through the query layer.",
  },
  {
    icon: ShieldCheck,
    title: "Runbook-backed operations",
    body: "Critical operational procedures — tenant onboarding, connector rotation, incident response — are documented in runbooks that operators follow. No undocumented manual procedures.",
  },
];

const metrics = [
  { label: "Ingestion uptime target", value: "99.9%" },
  { label: "Export audit retention", value: "7 years" },
  { label: "Incident response SLA", value: "< 4 hours" },
  { label: "Failed job replay window", value: "30 days" },
];

export default function TrustOperationsPage() {
  usePageMeta({
    title: "Operations — Trust Center — SZL Holdings",
    description: "How SZL operates the platform: monitoring, incident response, data isolation, and supportability.",
    canonical: "https://szlholdings.com/trust/operations",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/20 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
              <Settings className="h-3.5 w-3.5" />
              Operations
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Trust requires operational proof, not just architecture diagrams.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              A platform is only as trustworthy as its operations. SZL backs every trust claim with
              observable operations: health monitoring, incident records, retry policies, data isolation
              enforcement, and documented runbooks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trust" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Trust Center
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request operations review <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Operational capabilities</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <c.icon className="h-5 w-5 text-[#4a90b8]" />
                  <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Operating targets</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                  <div className="text-2xl font-bold text-[#4a90b8]">{m.value}</div>
                  <div className="mt-1 text-xs text-white/56">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
