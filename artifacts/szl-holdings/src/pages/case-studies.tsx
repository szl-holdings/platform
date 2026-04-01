import { Suspense, useEffect } from "react";
import { m } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { caseStudies } from "@/data/case-studies";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.6)" }} />
    </div>
  );
}

export default function CaseStudiesPage() {
  useEffect(() => {
    document.title = "Case Studies | SZL Holdings";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Real outcomes from Lyte, Vessels, Alloy, and Terra — structured case studies with documented problems, constraints, systems built, and proof.");
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-20">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">SZL Holdings</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-xs text-white/50">Case Studies</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.2)" }}>
              <BookOpen className="w-5 h-5" style={{ color: "#c9a96e" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">Case Studies</h1>
              <p className="text-base text-white/45 mt-2 max-w-2xl leading-relaxed">
                Documented outcomes from Lyte, Vessels, Alloy, and Terra. Each case follows the same structure: problem, context, constraints, system built, how it worked, outcome, and why it matters.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: "All", count: caseStudies.length },
              ...["Lyte", "Vessels", "Alloy", "Terra", "Aegis", "Carlota Jo"].map(p => ({ label: p, count: caseStudies.filter(c => c.product === p).length })),
            ].map(({ label, count }) => (
              <span key={label} className="text-xs px-3 py-1.5 rounded-full border text-white/50 border-white/10 bg-white/3">
                {label} <span className="text-white/25 ml-1">{count}</span>
              </span>
            ))}
          </div>
        </m.div>

        <Suspense fallback={<PageLoader />}>
          <div className="space-y-8">
            {caseStudies.map((study, i) => (
              <CaseStudyCard key={study.id} study={study} index={i} />
            ))}
          </div>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
