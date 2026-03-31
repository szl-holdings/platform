import { motion } from "framer-motion";
import { Building2, Map, List } from "lucide-react";
import { properties } from "@/data/portfolio";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import PropertyMap from "@/components/property-map";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@workspace/shared-ui/utils";

const STATUS_COLORS: Record<string, string> = {
  performing: "#10b981",
  watch: "#f59e0b",
  critical: "#ef4444",
};

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function PropertyMapPage() {
  const { token, isLoading } = useMapboxToken();
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <div className="p-6 space-y-4 h-full flex flex-col overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-display font-bold text-terra-text">Property Map</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(200,160,96,0.5)" }}>
            {properties.length} properties · Geographic view · NYC & National
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { id: "map", icon: Map, label: "Map" },
            { id: "list", icon: List, label: "List" },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id as "map" | "list")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all")}
              style={{
                color: view === v.id ? "#c8a060" : "rgba(255,255,255,0.3)",
                borderColor: view === v.id ? "rgba(200,160,96,0.3)" : "rgba(255,255,255,0.06)",
                background: view === v.id ? "rgba(200,160,96,0.07)" : "transparent",
              }}
            >
              <v.icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 overflow-hidden">
        {view === "map" ? (
          isLoading ? (
            <div className="flex items-center justify-center h-full rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(200,160,96,0.2)", borderTopColor: "#c8a060" }} />
                <p className="text-[10px]" style={{ color: "rgba(200,160,96,0.5)" }}>Initializing map…</p>
              </div>
            </div>
          ) : token ? (
            <PropertyMap properties={properties} token={token} height="100%" showPanel />
          ) : (
            <div className="flex items-center justify-center h-full rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-center space-y-2">
                <Map className="w-8 h-8 mx-auto" style={{ color: "rgba(200,160,96,0.3)" }} />
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Mapbox token not configured</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Add MAPBOX_ACCESS_TOKEN to enable the property map</p>
              </div>
            </div>
          )
        ) : (
          <div className="overflow-auto h-full space-y-2 pr-1">
            {properties.map((prop, i) => {
              const color = STATUS_COLORS[prop.status] || "#666";
              return (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg" style={{ background: "rgba(200,160,96,0.08)", border: "1px solid rgba(200,160,96,0.15)" }}>
                    {prop.type === "multifamily" ? "🏢" : prop.type === "office" ? "🏗️" : prop.type === "retail" ? "🏪" : prop.type === "industrial" ? "🏭" : "🏙️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[11px] font-semibold text-white/80">{prop.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ color, background: `${color}10`, border: `1px solid ${color}20` }}>
                        {prop.status}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{prop.address}, {prop.city}, {prop.state}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-mono font-bold" style={{ color: "#c8a060" }}>{formatCurrency(prop.value)}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{prop.occupancy}% occ · {prop.capRate}% cap</p>
                  </div>
                  <Link href={`/property/${prop.id}`}>
                    <button className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all hover:bg-white/5" style={{ color: "#c8a060", borderColor: "rgba(200,160,96,0.2)" }}>
                      Detail
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
