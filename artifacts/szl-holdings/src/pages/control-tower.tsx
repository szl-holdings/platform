import { useState } from "react";
import { m } from "framer-motion";
import { Radio, Globe, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { LAYER_CONFIG, type LayerTab } from "@/control-tower/constants";
import { ControlTowerStatusBar } from "@/control-tower/components";
import { SenseLayer } from "@/control-tower/SenseLayer";
import { DecideLayer } from "@/control-tower/DecideLayer";
import { ActLayer } from "@/control-tower/ActLayer";
import { GovernLayer } from "@/control-tower/GovernLayer";
import { SearchLayer } from "@/control-tower/SearchLayer";
import { EvolveLayer } from "@/control-tower/EvolveLayer";

export default function ControlTowerPage() {
  const [activeTab, setActiveTab] = useState<LayerTab>("sense");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/command-center" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-xs">Command Center</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">AI Control Tower</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-sky-400" />
                </div>
                AI Control Tower
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Unified intelligence operating system — Sense → Decide → Act → Govern across the entire agent mesh
              </p>
            </div>
            <Link
              href="/nuro-forge"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Model Lab
            </Link>
          </div>
        </div>

        <ControlTowerStatusBar />

        <div className="flex items-center gap-1 mb-6 bg-card border border-border rounded-xl p-1">
          {(Object.entries(LAYER_CONFIG) as [LayerTab, typeof LAYER_CONFIG[LayerTab]][]).map(([tab, config]) => (
            <button
              key={tab}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                activeTab === tab
                  ? cn("bg-muted/60 text-foreground shadow-sm", config.color)
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
              onClick={() => setActiveTab(tab)}
            >
              <config.icon className={cn("w-3.5 h-3.5", activeTab === tab ? config.color : "")} />
              <span>{config.label}</span>
            </button>
          ))}
        </div>

        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground">{LAYER_CONFIG[activeTab].description}</p>
          </div>

          {activeTab === "sense" && <SenseLayer />}
          {activeTab === "decide" && <DecideLayer />}
          {activeTab === "act" && <ActLayer />}
          {activeTab === "govern" && <GovernLayer />}
          {activeTab === "search" && <SearchLayer />}
          {activeTab === "evolve" && <EvolveLayer />}
        </m.div>
      </div>
    </div>
  );
}
