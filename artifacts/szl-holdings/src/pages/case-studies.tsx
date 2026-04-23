import { Suspense, useEffect } from "react";
import { m } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { caseStudies } from "@/data/case-studies";
import { usePageMeta } from "@/hooks/usePageMeta";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.6)" }} />
    </div>
  );
}

const CASE_STUDIES_LD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Case Studies — SZL Holdings",
  "description": "Documented design partner scenarios from KORA, SEXTANT, FORGE, DOMAINE, and PARAGON. Each case follows the same structure: problem, context, constraints, system built, how it worked, outcome, and why it matters.",
  "url": "https://szlholdings.com/case-studies",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "SZL Holdings", "item": "https://szlholdings.com/" },
      { "@type": "ListItem", "position": 2, "name": "Case Studies", "item": "https://szlholdings.com/case-studies" }
    ]
  }
};

export default function CaseStudiesPage() {
  const __pageMeta = usePageMeta({
    title: "Case Studies — Design Partner Scenarios | SZL Holdings",
    description: "Documented design partner scenarios from KORA, SEXTANT, FORGE, DOMAINE, and PARAGON — structured case studies with documented problems, constraints, systems built, and proof.",
    canonical: "https://szlholdings.com/case-studies",
    ogImage: "https://szlholdings.com/opengraph.jpg",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "case-studies-ld";
    script.textContent = JSON.stringify(CASE_STUDIES_LD);
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("case-studies-ld");
      if (el) el.remove();
    };
  }, []);

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
        <SiteNav />
  
        <main id="main-content">
          <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-14"
            >
              <nav aria-label="Breadcrumb">
                <div className="flex items-center gap-2 mb-4">
                  <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">SZL Holdings</Link>
                  <ChevronRight className="w-3 h-3 text-white/20" aria-hidden="true" />
                  <span className="text-xs text-white/50" aria-current="page">Case Studies</span>
                </div>
              </nav>
  
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.2)" }}>
                  <BookOpen className="w-5 h-5" style={{ color: "#c9a96e" }} aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white leading-tight">Case Studies</h1>
                  <p className="text-base text-white/45 mt-2 max-w-2xl leading-relaxed">
                    Documented design partner scenarios from KORA, SEXTANT, FORGE, and DOMAINE. Each case follows the same structure: problem, context, constraints, system built, how it worked, outcome, and why it matters.
                  </p>
                </div>
              </div>
  
              <div className="mt-8 flex flex-wrap gap-3" role="list" aria-label="Filter by product">
                {[
                  { label: "All", count: caseStudies.length },
                  ...["KORA", "SEXTANT", "FORGE", "DOMAINE", "PARAGON", "Carlota Jo"].map(p => ({ label: p, count: caseStudies.filter(c => c.product === p).length })),
                ].filter(({ count }) => count > 0).map(({ label, count }) => (
                  <span key={label} role="listitem" className="text-xs px-3 py-1.5 rounded-full border text-white/50 border-white/10 bg-white/3">
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
        </main>
  
        <SiteFooter />
      </div>
        </>
  );
}
