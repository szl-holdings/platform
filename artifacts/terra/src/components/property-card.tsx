import { cn } from "@szl-holdings/shared-ui/utils";
import { motion } from "framer-motion";
import { Building2, MapPin, Users, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import type { Property } from "@/data/portfolio";
import { Link } from "wouter";

const typeIcons: Record<string, string> = {
  multifamily: "🏢",
  office: "🏛️",
  retail: "🏪",
  industrial: "🏭",
  "mixed-use": "🏗️",
};

const typeColors: Record<string, string> = {
  multifamily: "from-blue-500 to-cyan-400",
  office: "from-violet-500 to-purple-400",
  retail: "from-amber-500 to-yellow-400",
  industrial: "from-emerald-500 to-green-400",
  "mixed-use": "from-pink-500 to-rose-400",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  performing: { label: "Performing", color: "bg-terra-emerald/10 text-terra-emerald" },
  watch: { label: "Watch List", color: "bg-terra-amber/10 text-terra-amber" },
  critical: { label: "Critical", color: "bg-terra-rose/10 text-terra-rose" },
};

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

export function PropertyCard({ property, index }: { property: Property; index: number }) {
  const status = statusConfig[property.status];
  const typeColor = typeColors[property.type] || "from-gray-500 to-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/property/${property.id}`}>
        <div className="group relative rounded-xl border border-terra-border bg-terra-surface backdrop-blur-sm overflow-hidden hover:border-terra-border-hover hover:shadow-lg hover:shadow-terra-primary/5 transition-all duration-300 cursor-pointer">
          <div className={cn("h-1 w-full bg-gradient-to-r", typeColor)} />
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeIcons[property.type]}</span>
                <div>
                  <h3 className="font-display font-bold text-terra-text group-hover:text-terra-primary transition-colors">{property.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-terra-text-muted">
                    <MapPin className="w-3 h-3" />
                    {property.city}, {property.state}
                  </div>
                </div>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide", status.color)}>
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-terra-text-muted" />
                <div>
                  <p className="text-[10px] text-terra-text-muted">Occupancy</p>
                  <p className={cn("text-sm font-semibold", property.occupancy >= 90 ? "text-terra-emerald" : property.occupancy >= 80 ? "text-terra-amber" : "text-terra-rose")}>
                    {property.occupancy}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-terra-text-muted" />
                <div>
                  <p className="text-[10px] text-terra-text-muted">Monthly Rev</p>
                  <p className="text-sm font-semibold text-terra-text">{formatCurrency(property.monthlyRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-terra-text-muted" />
                <div>
                  <p className="text-[10px] text-terra-text-muted">Cap Rate</p>
                  <p className="text-sm font-semibold text-terra-text">{property.capRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-terra-text-muted" />
                <div>
                  <p className="text-[10px] text-terra-text-muted">Value</p>
                  <p className="text-sm font-semibold text-terra-text">{formatCurrency(property.value)}</p>
                </div>
              </div>
            </div>

            {property.status !== "performing" && (
              <div className={cn("mt-3 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg", property.status === "critical" ? "bg-terra-rose/5 text-terra-rose" : "bg-terra-amber/5 text-terra-amber")}>
                <AlertTriangle className="w-3 h-3" />
                {property.status === "critical" ? "Requires immediate attention" : "Under monitoring"}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-terra-border flex items-center justify-between text-[10px] text-terra-text-muted">
              <span>{property.units} units · {formatNumber(property.sqft)} sqft</span>
              <span className="capitalize">{property.type.replace("-", " ")}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
