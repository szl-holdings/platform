import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const insights = [
  { tag: "Research", title: "The accountability gap in enterprise AI decision-making", excerpt: "As AI systems take on more consequential decisions, the absence of structured explainability is becoming a material compliance risk — not just an ethical concern.", date: "March 2026" },
  { tag: "Intelligence", title: "Signal overload and the case for AI-assisted triage", excerpt: "Enterprise security and intelligence teams are drowning in signals. The solution isn't more analysts — it's structured prioritisation with machine assistance and human accountability.", date: "February 2026" },
  { tag: "Architecture", title: "Building intelligence workflows that survive post-incident review", excerpt: "When something goes wrong, the question isn't just 'what happened' — it's 'who decided, on what evidence, and when.' Most intelligence platforms can't answer that. INCA is built to.", date: "January 2026" },
  { tag: "Research", title: "Multi-tenant isolation in intelligence platforms — beyond data segregation", excerpt: "True multi-tenant isolation goes beyond storing data separately. It means separate compute, separate credential contexts, and separate audit chains. The bar is higher than most platforms meet.", date: "December 2025" },
];

export default function IncaInsightsPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Insights</p>
          <h1 className="text-3xl md:text-4xl font-bold text-violet-50 mb-4">Research & intelligence writing</h1>
          <p className="text-violet-300/40 text-[15px] leading-relaxed">
            Articles, research notes, and technical writing on enterprise intelligence, AI explainability, and security operations.
          </p>
        </div>

        <div className="space-y-px">
          {insights.map((insight, i) => (
            <div key={i} className="py-7 border-b border-violet-500/10 last:border-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {insight.tag}
                </span>
                <span className="text-[11px] text-violet-400/30">{insight.date}</span>
              </div>
              <h2 className="text-[16px] font-bold text-violet-100 mb-2 leading-snug">{insight.title}</h2>
              <p className="text-violet-300/40 text-[13.5px] leading-relaxed mb-4">{insight.excerpt}</p>
              <Link href="/request-access" className="text-[12px] font-medium text-violet-400 hover:text-violet-300 transition-colors">
                Read more →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
