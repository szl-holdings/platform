import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface FlowItem { from: string; to: string; type: string; color: string; intensity: number }

export function PulseFlowDiagram({ flows }: { flows: FlowItem[] }) {
  const [activeFlow, setActiveFlow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveFlow(prev => (prev + 1) % flows.length), 2500);
    return () => clearInterval(timer);
  }, [flows.length]);
  return (
    <div className="space-y-1.5">
      {flows.map((flow, i) => (
        <m.div key={`${flow.from}-${flow.to}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md"
          animate={{ background: i === activeFlow ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.01)", borderColor: i === activeFlow ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.025)" }}
          style={{ border: "1px solid rgba(255,255,255,0.025)" }} transition={{ duration: 0.5 }}>
          <div className="w-14 text-right"><span className="text-[11px] font-semibold" style={{ color: flow.color }}>{flow.from}</span></div>
          <div className="flex-1 h-[2px] relative overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
            {i === activeFlow && (
              <m.div className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${flow.color})`, width: "40%" }}
                animate={{ left: ["0%", "60%", "0%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
            )}
          </div>
          <ChevronRight className="w-3 h-3" style={{ color: i === activeFlow ? flow.color : "rgba(255,255,255,0.08)" }} />
          <div className="w-14"><span className="text-[11px] font-semibold" style={{ color: i === activeFlow ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)" }}>{flow.to}</span></div>
          <span className="text-[9px] hidden sm:block flex-1 truncate" style={{ color: "rgba(255,255,255,0.18)" }}>{flow.type}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="w-1 h-3 rounded-sm"
                style={{ background: j < flow.intensity ? flow.color : "rgba(255,255,255,0.04)", opacity: j < flow.intensity ? (i === activeFlow ? 0.8 : 0.3) : 1 }} />
            ))}
          </div>
        </m.div>
      ))}
    </div>
  );
}
