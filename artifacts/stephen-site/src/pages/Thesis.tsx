import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

export function Thesis() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Thesis</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How I think about building</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl">
            A working set of beliefs about enterprise software, AI infrastructure, and what makes a platform worth building.
          </p>
        </div>

        <div className="space-y-10">
          {[
            {
              number: "01",
              title: "Enterprise software is still mostly broken",
              body: "The dominant pattern in enterprise software is a thick client that aggregates data from ten other systems — and calls it a platform. The real opportunity is infrastructure that handles complexity so teams can think strategically again. Most B2B SaaS is still adding features to a fundamentally broken workflow.",
            },
            {
              number: "02",
              title: "AI without explainability isn't enterprise-ready",
              body: "Confidence scores and recommendations are not enough in operations where the decision matters and someone is accountable for it. The next generation of enterprise AI has to show its work — not just output an answer. This is why explainability is core to INCA, not a feature layer.",
            },
            {
              number: "03",
              title: "Vertical intelligence beats horizontal tooling",
              body: "General-purpose AI tools optimise for breadth. But the most durable enterprise platforms are built for a specific operational domain — where the data model, the exception logic, and the decision context are deeply understood. Maritime intelligence means nothing without understanding charter economics. AI research tooling means nothing without understanding the model lifecycle.",
            },
            {
              number: "04",
              title: "The command interface is underbuilt",
              body: "Most enterprise platforms optimise for data visibility. What they underinvest in is the interface for acting on that data under time pressure. The dashboard that tells you something is wrong is less valuable than the one that tells you what to do about it in the next ten minutes.",
            },
            {
              number: "05",
              title: "Multi-tenant isolation is a design decision, not a config",
              body: "True isolation — separate compute, separate credential context, separate audit chains — requires architectural decisions made at the beginning, not compliance bolted on afterwards. Security is a building material, not a feature.",
            },
          ].map((point) => (
            <div key={point.number} className="border-t border-white/5 pt-8 grid md:grid-cols-12 gap-6">
              <div className="md:col-span-1">
                <span className="font-mono text-[12px] text-white/20">{point.number}</span>
              </div>
              <div className="md:col-span-11">
                <h2 className="text-[17px] font-semibold text-foreground mb-3">{point.title}</h2>
                <p className="text-muted-foreground text-[14px] leading-relaxed">{point.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-white/5 pt-10">
          <p className="text-muted-foreground text-[13px] mb-4">
            This is a living document. These beliefs inform every design decision across the SZL portfolio.
          </p>
          <Link href="/writing" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            Read more in Writing →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Thesis;
