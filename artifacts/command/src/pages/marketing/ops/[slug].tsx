import { MarketingNav } from "../../../components/marketing/MarketingNav";
  import { MarketingFooter } from "../../../components/marketing/MarketingFooter";
  import { motion } from "framer-motion";
  import { Button } from "@szl-holdings/shared-ui/ui/button";
  import { Link, useParams } from "wouter";
  import { CheckCircle2, ArrowRight } from "lucide-react";
  import { OPS_FEATURES, OPS_FEATURE_LIST } from "./data";
  export type { OpsFeature } from "./data";
  export { OPS_FEATURES, OPS_FEATURE_LIST };

  export function MarketingOpsFeaturePage() {
  const { slug } = useParams<{ slug: string }>();
  const feature = slug ? OPS_FEATURES[slug] : undefined;

  if (!feature) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Ops Feature Not Found</h1>
          <Link href="/marketing">
            <Button variant="outline" className="border-white/20 text-white">
              Return to Ecosystem
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;
  const accent = feature.accent;

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans">
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-40 pb-24 overflow-hidden border-b border-white/[0.04]">
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${feature.bgGradient} via-black to-black -z-10`}
        />
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
              style={{ color: accent }}
              data-testid={`badge-ops-${feature.slug}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              Ops Center · {feature.tagline}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]">
              {feature.name}
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-3 font-light leading-relaxed">
              {feature.description}
            </p>
            <p className="text-sm text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              {feature.longDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/marketing/signup">
                <Button
                  size="lg"
                  className="h-12 px-7 bg-white text-black hover:bg-white/90 font-medium w-full sm:w-auto"
                  data-testid={`button-ops-trial-${feature.slug}`}
                >
                  Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/marketing/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 border-white/20 text-white hover:bg-white/5 w-full sm:w-auto"
                >
                  See Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Core Capabilities</h2>
            <p className="text-white/50 text-lg font-light">Built on real platform data, not synthetic dashboards.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {feature.capabilities.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.03] transition-colors"
              >
                <CheckCircle2 className="w-6 h-6 mb-5" style={{ color: accent }} />
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{c.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* vs Competitors */}
      <section className="py-24 bg-zinc-950 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Versus the Status Quo</h2>
            <p className="text-white/50 font-light">Why teams replace point tools with the Command Ops Center.</p>
          </div>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  <th className="text-left p-4 pl-6 text-white/50 font-medium w-1/3">Compared To</th>
                  <th className="text-left p-4 font-semibold" style={{ color: accent }}>Command Ops</th>
                  <th className="text-left p-4 text-white/60 font-medium">Status Quo</th>
                </tr>
              </thead>
              <tbody>
                {feature.vsCompetitors.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-4 pl-6 text-white/70 font-medium">{row.name}</td>
                    <td className="p-4 text-white/85">{row.us}</td>
                    <td className="p-4 text-white/45">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Plan inclusion */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Included In</h2>
          <p className="text-white/50 mb-6 text-sm">Available on these Command plans.</p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {feature.includedIn.map((tier) => (
              <span
                key={tier}
                className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-sm text-white/80"
                data-testid={`tier-pill-${tier.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {tier}
              </span>
            ))}
          </div>
          <Link href="/marketing/pricing">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              View Pricing Detail
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
