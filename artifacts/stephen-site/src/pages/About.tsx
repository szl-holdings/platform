import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

export function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">About</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Stephen Lutar</h1>
          <p className="text-muted-foreground text-[15px]">Founder & CEO, SZL Holdings · London</p>
        </div>

        <div className="space-y-6 text-[14.5px] text-muted-foreground leading-[1.8] mb-12">
          <p>
            I build enterprise infrastructure, AI platforms, and domain-specific intelligence systems. My focus is on the category of software where the problem is genuinely hard — where domain depth, auditability, and decision-support quality matter more than feature count.
          </p>
          <p>
            I founded SZL Holdings in 2023 as a strategic holding structure for a portfolio of domain-specific platforms. The portfolio spans platform orchestration (Alloy), business observability (Lyte), maritime intelligence (Vessels), unified defense and intelligence (Aegis), real estate intelligence (Terra), and strategic advisory (Carlota Jo) — six platforms under one compounding architecture.
          </p>
          <p>
            My background is in enterprise software architecture, product design, and the infrastructure layer that sits between raw data and operational decisions. I'm particularly focused on the intersection of AI and accountability — building platforms where intelligence outputs are explainable, traceable, and defensible.
          </p>
          <p>
            I'm based in London and work across UK and European markets, with operations extending across the Atlantic for select portfolio companies. The SZL ecosystem is designed as a compounding intelligence network: every platform makes the others stronger.
          </p>
        </div>

        <div className="border-t border-white/5 pt-10 mb-12">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-6">Current focus</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { title: "Vessels Maritime", body: "Building the maritime intelligence layer for fleet operators — from AIS tracking to voyage economics to sanctions compliance." },
              { title: "Alloy Engine", body: "Building the execution fabric and predictive intelligence layer powering decision-making across the ecosystem." },
              { title: "SZL Portfolio", body: "Scaling the portfolio company model across complementary enterprise software domains." },
              { title: "Enterprise AI", body: "Writing and advising on the accountability and explainability requirements for AI in regulated operations." },
            ].map((item) => (
              <div key={item.title} className="border border-white/6 rounded-lg p-4">
                <h3 className="text-[13px] font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-muted-foreground text-[12.5px] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex items-center justify-between">
          <Link href="/contact" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            Get in touch →
          </Link>
          <Link href="/downloads" className="text-[13px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Download CV
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default About;
