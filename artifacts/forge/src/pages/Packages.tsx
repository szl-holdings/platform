import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Package, CheckCircle2, X, Anchor, Building2, Scale, Shield,
  Zap, Clock, Users, ArrowRight, Star, Layers
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi, type IntelligencePackage } from "@/lib/api";
import { cn } from "@/lib/utils";

const DOMAIN_ICONS: Record<string, typeof Anchor> = {
  vessels: Anchor,
  terra: Building2,
  legal: Scale,
  security: Shield,
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
  legal: "var(--color-forge-legal)",
  security: "var(--color-forge-security)",
};

const TIER_COLORS: Record<string, string> = {
  starter: "var(--color-forge-text-muted)",
  professional: "var(--color-forge-primary)",
  enterprise: "var(--color-forge-gold)",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

export default function Packages() {
  const queryClient = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<IntelligencePackage | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  const { data, isLoading } = useQuery({
    queryKey: ["forge-portal", "packages"],
    queryFn: () => portalApi.getPackages(),
    retry: 1,
  });

  const subscribeMutation = useMutation({
    mutationFn: (params: { id: string; cycle: "monthly" | "annual" }) =>
      portalApi.subscribeToPackage(params.id, params.cycle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forge-portal", "packages"] });
      setSelectedPkg(null);
    },
  });

  const packages = data?.packages ?? [];

  return (
    <AppShell title="Intelligence Packages" subtitle="Subscribe to domain-specific intelligence bundles">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-forge-text-muted)" }}>
            <Package className="w-4 h-4" />
            <span>{packages.length} packages available</span>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)" }}>
            {(["monthly", "annual"] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn("px-3 py-1.5 rounded text-xs font-600 capitalize transition-all")}
                style={{
                  background: billingCycle === cycle ? "var(--color-forge-primary)" : "transparent",
                  color: billingCycle === cycle ? "#fff" : "var(--color-forge-text-muted)",
                }}
              >
                {cycle} {cycle === "annual" && <span className="text-[0.6rem] opacity-80">Save 10%</span>}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "var(--color-forge-primary)" }} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map((pkg, idx) => {
            const price = billingCycle === "annual" ? pkg.pricing.annual / 12 : pkg.pricing.monthly;
            const tierColor = TIER_COLORS[pkg.tier] ?? "var(--color-forge-primary)";
            return (
              <div
                key={pkg.id}
                className="forge-card-elevated p-5 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {pkg.domains.map(d => {
                      const Icon = DOMAIN_ICONS[d] ?? Package;
                      return (
                        <div key={d} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${DOMAIN_COLORS[d] ?? "gray"} 12%, transparent)` }}>
                          <Icon className="w-4 h-4" style={{ color: DOMAIN_COLORS[d] }} />
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[0.625rem] font-700 uppercase px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${tierColor} 12%, transparent)`, color: tierColor }}>{pkg.tier}</span>
                </div>

                <h3 className="text-base font-700 mb-1" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{pkg.name}</h3>
                <p className="text-xs mb-4 flex-1" style={{ color: "var(--color-forge-text-muted)" }}>{pkg.description}</p>

                <div className="mb-4">
                  <span className="text-2xl font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>{fmt(price)}</span>
                  <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>/mo</span>
                  {billingCycle === "annual" && (
                    <span className="text-xs ml-2" style={{ color: "var(--color-forge-success)" }}>{fmt(pkg.pricing.annual)}/yr</span>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  {pkg.features.slice(0, 5).map((feat, fi) => (
                    <div key={fi} className="flex items-start gap-2">
                      {feat.included ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-forge-success)" }} />
                      ) : (
                        <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-forge-text-faint)" }} />
                      )}
                      <span className={cn("text-xs", !feat.included && "line-through")} style={{ color: feat.included ? "var(--color-forge-text)" : "var(--color-forge-text-faint)" }}>
                        {feat.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-4 text-[0.625rem]" style={{ color: "var(--color-forge-text-muted)" }}>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.deliverables.length} deliverables</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{pkg.agentWorkflows.length} AI agents</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{pkg.subscriberCount} clients</span>
                </div>

                <button
                  onClick={() => setSelectedPkg(pkg)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-600 transition-colors"
                  style={{ background: "var(--color-forge-primary)", color: "#fff" }}
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {selectedPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-6" style={{ background: "var(--color-forge-bg)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{selectedPkg.name}</h2>
                  <p className="text-sm mt-1" style={{ color: "var(--color-forge-text-muted)" }}>{selectedPkg.description}</p>
                </div>
                <button onClick={() => setSelectedPkg(null)}><X className="w-5 h-5" style={{ color: "var(--color-forge-text-muted)" }} /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="forge-eyebrow mb-2">Features</h4>
                  <div className="space-y-2">
                    {selectedPkg.features.map((feat, fi) => (
                      <div key={fi} className="flex items-start gap-2">
                        {feat.included ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-forge-success)" }} /> : <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-forge-text-faint)" }} />}
                        <div>
                          <div className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{feat.name}</div>
                          <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{feat.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="forge-eyebrow mb-2">Deliverables</h4>
                  <div className="space-y-2 mb-4">
                    {selectedPkg.deliverables.map((del, di) => (
                      <div key={di} className="flex items-center justify-between p-2 rounded" style={{ background: "var(--color-forge-bg-secondary)" }}>
                        <span className="text-sm" style={{ color: "var(--color-forge-text)" }}>{del.name}</span>
                        <span className="text-xs" style={{ color: "var(--color-forge-primary)" }}>{del.frequency}</span>
                      </div>
                    ))}
                  </div>
                  <h4 className="forge-eyebrow mb-2">Usage Limits</h4>
                  <div className="space-y-1.5">
                    {selectedPkg.usageLimits.map((limit, li) => (
                      <div key={li} className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--color-forge-text-muted)" }}>{limit.metric}</span>
                        <span className="font-mono font-600" style={{ color: "var(--color-forge-text)" }}>{limit.limit.toLocaleString()} {limit.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-forge-primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-primary) 20%, transparent)" }}>
                <div>
                  <div className="text-2xl font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>
                    {fmt(billingCycle === "annual" ? selectedPkg.pricing.annual / 12 : selectedPkg.pricing.monthly)}<span className="text-sm font-400" style={{ color: "var(--color-forge-text-muted)" }}>/mo</span>
                  </div>
                  {billingCycle === "annual" && <div className="text-xs" style={{ color: "var(--color-forge-success)" }}>Billed annually at {fmt(selectedPkg.pricing.annual)}</div>}
                </div>
                <button
                  onClick={() => subscribeMutation.mutate({ id: selectedPkg.id, cycle: billingCycle })}
                  disabled={subscribeMutation.isPending}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-600 text-white"
                  style={{ background: "var(--color-forge-primary)" }}
                >
                  <Star className="w-4 h-4" /> {subscribeMutation.isPending ? "Subscribing..." : "Subscribe Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
