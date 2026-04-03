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

          <div className="flex items-start gap-8 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Stephen Lutar</h1>
              <p className="text-muted-foreground text-[15px]">Founder & CEO, SZL Holdings · London</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary/60 font-serif">SL</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-[15px] text-muted-foreground leading-[1.85] mb-14">
          <p>
            I started building enterprise software because I kept encountering the same problem: the systems that organisations depend on most are the ones that understand their operations least. The maritime operator who tracks a global fleet using spreadsheets and phone calls. The real estate team that builds an acquisition pipeline by sifting through listing portals. The security analyst switching between five tools to piece together what one incident actually means.
          </p>
          <p>
            These are not failures of effort. They are failures of tooling. The platforms available to operators in complex domains have almost always been built by generalists who understood software more than they understood the domain. The result is software that is technically competent and operationally shallow.
          </p>
          <p>
            I founded SZL Holdings in 2023 as a strategic holding structure for a portfolio of domain-specific platforms. The portfolio spans business observability (Lyte), maritime intelligence (Vessels), unified defense and security command (Aegis), real estate intelligence (Terra), and strategic advisory (Carlota Jo) — five platforms under one compounding architecture, powered by the Alloy execution engine.
          </p>
          <p>
            My background spans enterprise software architecture, product design, and the infrastructure layer between raw data and operational decisions. I've spent the last several years particularly focused on the intersection of AI and accountability — the question of how you build platforms where AI-assisted decisions are explainable, traceable, and defensible to a regulator, a board, or a post-incident review.
          </p>
          <p>
            The platforms I build are not dashboards that show you what's happening. They are command systems that help you decide what to do about it — and create the record that you did it. The distinction matters because visibility without control is not a product. It is expensive anxiety.
          </p>
          <p>
            I work from London and operate across UK, European, and transatlantic markets. The SZL portfolio is designed to be owner-operated at the architectural level: one founder, one engineering thesis, applied consistently across every platform in the network.
          </p>
        </div>

        <div className="border-t border-white/5 pt-10 mb-14">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-6">What drives the work</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                title: "Domain depth over feature breadth",
                body: "I build for operators who have spent years in their domain. The product has to meet them there — with terminology, logic, and data models that reflect how the domain actually works.",
              },
              {
                title: "Command over visibility",
                body: "A platform that shows you what's wrong and stops is incomplete. Every SZL platform is designed to close the loop from signal to decision to auditable action.",
              },
              {
                title: "Infrastructure as compound interest",
                body: "The shared foundation under the SZL portfolio — one codebase, one auth system, one execution engine — means each new platform compounds what the last one built.",
              },
              {
                title: "Building for the long conversation",
                body: "The enterprise relationships I want to build are measured in years, not cohorts. That requires building software that earns ongoing trust — through reliability, auditability, and operational depth.",
              },
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
          <Link href="/work" className="text-[13px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            See the work
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default About;
