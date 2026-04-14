import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowUpCircle, CheckCircle2, Package, Users, Bot,
  ChevronRight, Plus, Minus, Sparkles, Zap, Crown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi } from "@/lib/api";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

export default function Upgrades() {
  const queryClient = useQueryClient();
  const [seatCount, setSeatCount] = useState(3);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["forge-portal", "upgrades"],
    queryFn: () => portalApi.getUpgrades(),
    retry: 1,
  });

  const upgradeMutation = useMutation({
    mutationFn: (params: { upgradeId: string; type: string; details?: Record<string, unknown> }) =>
      portalApi.requestUpgrade(params.upgradeId, params.type, params.details),
    onSuccess: (result) => {
      setSuccessMsg(result.message);
      queryClient.invalidateQueries({ queryKey: ["forge-portal", "upgrades"] });
      setTimeout(() => setSuccessMsg(null), 5000);
    },
  });

  const upgrades = data?.availableUpgrades ?? [];
  const seats = data?.seatManagement;
  const agents = data?.customAgentDeployment;

  return (
    <AppShell title="Upgrades & Expansion" subtitle="Expand your intelligence capabilities">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {successMsg && (
          <div className="p-3 rounded-lg flex items-center gap-2 animate-fade-in-up" style={{ background: "color-mix(in srgb, var(--color-forge-success) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-success) 25%, transparent)" }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-forge-success)" }} />
            <span className="text-sm" style={{ color: "var(--color-forge-success)" }}>{successMsg}</span>
          </div>
        )}

        {data?.currentPackages && data.currentPackages.length > 0 && (
          <div className="forge-card-elevated p-5">
            <h3 className="forge-eyebrow mb-3">Current Subscriptions</h3>
            <div className="flex flex-wrap gap-3">
              {data.currentPackages.map(pkg => (
                <div key={pkg.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-forge-success) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-success) 20%, transparent)" }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-forge-success)" }} />
                  <span className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{pkg.name}</span>
                  <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>since {pkg.since}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-forge-gold) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-gold) 20%, transparent)" }}>
                <Crown className="w-4 h-4" style={{ color: "var(--color-forge-gold)" }} />
                <span className="text-sm font-600 capitalize" style={{ color: "var(--color-forge-text)" }}>{data.currentTier} Tier</span>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "var(--color-forge-primary)" }} />
          </div>
        )}

        <div>
          <h3 className="text-base font-600 mb-3" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Available Upgrades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upgrades.map((upgrade, idx) => (
              <div
                key={upgrade.id}
                className="forge-card-elevated p-5 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-forge-primary) 12%, transparent)" }}>
                    <Package className="w-5 h-5" style={{ color: "var(--color-forge-primary)" }} />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>+{fmt(upgrade.incrementalCost)}</div>
                    <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>per month</div>
                  </div>
                </div>
                <h4 className="text-sm font-600 mb-1" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{upgrade.name}</h4>
                <p className="text-xs mb-3 flex-1" style={{ color: "var(--color-forge-text-muted)" }}>{upgrade.description}</p>
                <div className="space-y-1 mb-4">
                  {upgrade.benefits.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2">
                      <Zap className="w-3 h-3 flex-shrink-0" style={{ color: "var(--color-forge-primary)" }} />
                      <span className="text-xs" style={{ color: "var(--color-forge-text)" }}>{b}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => upgradeMutation.mutate({ upgradeId: upgrade.id, type: "package" })}
                  disabled={upgradeMutation.isPending}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-600 text-white transition-colors"
                  style={{ background: "var(--color-forge-primary)" }}
                >
                  <ArrowUpCircle className="w-4 h-4" /> Upgrade
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {seats && (
            <div className="forge-card-elevated p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" style={{ color: "var(--color-forge-primary)" }} />
                <h3 className="text-sm font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Seat Management</h3>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>Current seats</span>
                <span className="text-sm font-600" style={{ color: "var(--color-forge-text)" }}>{seats.currentSeats} / {seats.maxSeats}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-forge-bg-secondary)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(seats.currentSeats / seats.maxSeats) * 100}%`, background: "var(--color-forge-primary)" }} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>Add seats</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSeatCount(Math.max(seats.currentSeats, seatCount - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-forge-bg-secondary)" }}>
                    <Minus className="w-3.5 h-3.5" style={{ color: "var(--color-forge-text-muted)" }} />
                  </button>
                  <span className="text-lg font-700 w-8 text-center" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>{seatCount}</span>
                  <button onClick={() => setSeatCount(Math.min(seats.maxSeats, seatCount + 1))} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-forge-bg-secondary)" }}>
                    <Plus className="w-3.5 h-3.5" style={{ color: "var(--color-forge-text-muted)" }} />
                  </button>
                </div>
              </div>
              {seatCount > seats.currentSeats && (
                <div className="p-3 rounded-lg mb-3" style={{ background: "var(--color-forge-bg-secondary)" }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-forge-text-muted)" }}>{seatCount - seats.currentSeats} additional seats</span>
                    <span className="font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>+{fmt((seatCount - seats.currentSeats) * seats.pricePerSeat)}/mo</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => upgradeMutation.mutate({ upgradeId: "seat-expansion", type: "seats", details: { seats: seatCount } })}
                disabled={seatCount <= seats.currentSeats || upgradeMutation.isPending}
                className="w-full py-2 rounded-lg text-sm font-600 text-white disabled:opacity-40 transition-colors"
                style={{ background: "var(--color-forge-primary)" }}
              >
                Update Seats
              </button>
            </div>
          )}

          {agents && (
            <div className="forge-card-elevated p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5" style={{ color: "var(--color-forge-gold)" }} />
                <h3 className="text-sm font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Custom AI Agent Deployment</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--color-forge-text-muted)" }}>{agents.description}</p>
              <div className="text-2xl font-700 mb-4" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>
                From {fmt(agents.basePrice)}<span className="text-sm font-400" style={{ color: "var(--color-forge-text-muted)" }}>/mo</span>
              </div>
              <div className="space-y-2 mb-4">
                {agents.examples.map((ex, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: "var(--color-forge-gold)" }} />
                    <span className="text-xs" style={{ color: "var(--color-forge-text)" }}>{ex}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => upgradeMutation.mutate({ upgradeId: "custom-agent", type: "agent" })}
                disabled={upgradeMutation.isPending}
                className="w-full py-2 rounded-lg text-sm font-600 transition-colors"
                style={{ background: "color-mix(in srgb, var(--color-forge-gold) 15%, transparent)", color: "var(--color-forge-gold)", border: "1px solid color-mix(in srgb, var(--color-forge-gold) 30%, transparent)" }}
              >
                Request Agent Deployment
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
