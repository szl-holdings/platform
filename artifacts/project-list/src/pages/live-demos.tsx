import { useState } from "react";
import { Play, ExternalLink, Monitor, Shield, Brain, Zap, Ship, Building, Palette, Activity, Globe, Eye } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { usePageMeta } from "@/hooks/usePageMeta";

const demos = [
  { id: "firestorm", name: "Firestorm", subtitle: "Security Operations", icon: Shield, color: "from-red-500/20 to-orange-500/20", borderColor: "border-red-500/20", path: "/firestorm/", highlights: ["Live threat map with animated indicators", "SOC dashboard with real-time metrics", "MITRE ATT&CK framework matrix", "Incident timeline and response tracking"] },
  { id: "inca", name: "INCA", subtitle: "AI Research Command", icon: Brain, color: "from-violet-500/20 to-purple-500/20", borderColor: "border-violet-500/20", path: "/inca/", highlights: ["Predictions dashboard with confidence tracking", "Model registry with versioning", "Ensemble studio for model combinations", "Anomaly timeline visualization"] },
  { id: "terra", name: "Beacon", subtitle: "Business Telemetry · OBSERVE", icon: Building, color: "from-sky-500/20 to-blue-500/20", borderColor: "border-sky-500/20", path: "/terra/", highlights: ["KPI drift detection and telemetry", "Market anomaly signals", "Portfolio observability dashboard", "Business health scoring and analytics"] },
  { id: "vessels", name: "Vessels", subtitle: "Maritime Intelligence", icon: Ship, color: "from-cyan-500/20 to-blue-500/20", borderColor: "border-cyan-500/20", path: "/vessels/", highlights: ["Real-time vessel tracking", "Port performance analytics", "Route optimization engine", "Maritime risk assessment"] },
  { id: "lyte", name: "Lyte", subtitle: "Command Center", icon: Zap, color: "from-blue-500/20 to-indigo-500/20", borderColor: "border-blue-500/20", path: "/lyte-command-center/", highlights: ["Signal feed with pattern detection", "Incident management workflow", "Operational playbooks library", "AI-powered operations center"] },
  { id: "alloy", name: "Alloy", subtitle: "Execution Fabric · ENGINE", icon: Palette, color: "from-indigo-500/20 to-violet-500/20", borderColor: "border-indigo-500/20", path: "/alloy/", highlights: ["Scenario modeling and what-if analysis", "Confidence scoring and uncertainty tracking", "Agent coordination and DAG execution", "Cross-ecosystem signal synthesis"] },
];

export function LiveDemos() {
  usePageMeta({
    title: "SZL Holdings | Live Application Demos",
    description: "Try live demos of SZL Holdings enterprise applications: Firestorm security simulation, INCA AI research, Beacon business telemetry, Alloy execution fabric, and more.",
    canonical: "https://szlholdings.com/demos",
  });
  const [hoveredDemo, setHoveredDemo] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Play className="w-6 h-6 text-primary" />
          Live Demos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Live-rendered previews of each portfolio application running against demo data</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {demos.map(demo => {
          const DemoIcon = demo.icon;
          const isHovered = hoveredDemo === demo.id;
          return (
            <div key={demo.id}
              onMouseEnter={() => setHoveredDemo(demo.id)}
              onMouseLeave={() => setHoveredDemo(null)}
              className={cn("bg-card border rounded-xl overflow-hidden transition-all duration-300", demo.borderColor, isHovered && "shadow-lg scale-[1.01]")}>
              <div className={cn("aspect-[2/1] bg-gradient-to-br flex items-center justify-center relative", demo.color)}>
                <div className="text-center">
                  <DemoIcon className="w-12 h-12 text-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground/50">{demo.name}</p>
                  <p className="text-xs text-foreground/30">{demo.subtitle}</p>
                </div>
                {isHovered && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all">
                    <a href={demo.path} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors">
                      <Play className="w-4 h-4" /> Launch Demo
                    </a>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{demo.name}</h3>
                    <p className="text-xs text-muted-foreground">{demo.subtitle}</p>
                  </div>
                  <a href={demo.path} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
                <div className="space-y-1.5">
                  {demo.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3 text-primary/60 shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
