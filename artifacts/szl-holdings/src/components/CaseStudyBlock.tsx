import { m } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseStudy {
  title: string;
  problem: string;
  solution: string;
  result: string;
  client?: string;
}

interface CaseStudyBlockProps {
  studies: CaseStudy[];
  accentColor?: string;
  className?: string;
}

export function CaseStudyBlock({ studies, accentColor = "#2563eb", className }: CaseStudyBlockProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {studies.map((study, i) => (
        <m.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="rounded-2xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-start gap-3 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <h4 className="font-[var(--font-display)] text-sm font-bold text-szl-text">{study.title}</h4>
              {study.client && (
                <p className="text-[11px] text-szl-text-muted mt-0.5">{study.client}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Challenge</p>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{study.problem}</p>
            </div>
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Approach</p>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{study.solution}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Outcome</p>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{study.result}</p>
            </div>
          </div>
        </m.div>
      ))}
    </div>
  );
}
