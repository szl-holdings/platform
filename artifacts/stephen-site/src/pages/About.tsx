import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

const PORTFOLIO = [
  { name: "Lyte", role: "Business Observability", desc: "Narrative intelligence and operational signal detection for governed organizations." },
  { name: "Vessels", role: "Maritime Intelligence", desc: "Fleet command, AIS analytics, and compliance monitoring for global maritime operators." },
  { name: "Aegis", role: "Defense & Intelligence", desc: "Unified security operations command — threat correlation, SOC workflows, and incident governance." },
  { name: "Terra", role: "Real Estate Intelligence", desc: "Market intelligence, deal pipeline, and portfolio analytics for institutional real estate." },
  { name: "Carlota Jo", role: "Private Advisory", desc: "Operational management and strategic coordination for UHNW household environments." },
  { name: "Alloy", role: "Execution Engine", desc: "The shared fabric beneath every SZL platform — approval routing, audit trails, and governed automation." },
];

const PRINCIPLES = [
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
];

export function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">

        <div className="mb-16">
          <div className="flex items-start gap-6 mb-10 flex-wrap">
            <div
              className="shrink-0"
              style={{
                width: 72, height: 72,
                borderRadius: "0.875rem",
                background: "linear-gradient(135deg, #d4a054 0%, #c8953c 50%, #b8862c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 1px hsla(38,50%,52%,0.2), 0 8px 32px hsla(0,0%,0%,0.4), 0 0 60px hsla(38,50%,52%,0.06)",
              }}
            >
              <span style={{ color: "#070a10", fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>SZL</span>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-2">About</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1.5">Stephen Lutar</h1>
              <p className="text-muted-foreground text-[15px]">Founder & CEO, SZL Holdings</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { label: "X / Twitter", href: "https://x.com/szlholdings" },
              { label: "LinkedIn", href: "https://linkedin.com/in/stephenlutar" },
              { label: "Medium", href: "https://medium.com/@stephen_38454" },
              { label: "Substack", href: "https://szlholdings.substack.com" },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="text-[12px] text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-white/6 hover:border-primary/20 bg-white/[0.03]"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-6 text-[15px] text-muted-foreground leading-[1.85] mb-16">
          <p>
            I started building enterprise software because I kept encountering the same problem: the systems that organisations depend on most are the ones that understand their operations least. The maritime operator who tracks a global fleet using spreadsheets and phone calls. The real estate team that builds an acquisition pipeline by sifting through listing portals. The security analyst switching between five tools to piece together what one incident actually means.
          </p>
          <p>
            These are not failures of effort. They are failures of tooling. The platforms available to operators in complex domains have almost always been built by generalists who understood software more than they understood the domain. The result is software that is technically competent and operationally shallow.
          </p>
          <p>
            I founded SZL Holdings in 2023 as a strategic holding structure for a portfolio of domain-specific platforms — five vertical operating systems powered by one shared execution engine. The portfolio spans business observability, maritime intelligence, unified defense and security command, real estate intelligence, and strategic advisory.
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

        <div className="border-t border-white/5 pt-12 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5 mb-12">
            {[
              { val: "16", label: "Apps Live", sub: "8 web · 8 mobile" },
              { val: "446", label: "DB Tables", sub: "One shared schema" },
              { val: "1,618+", label: "API Endpoints", sub: "Full TypeScript" },
              { val: "1", label: "Architecture", sub: "One founder" },
            ].map(m => (
              <div key={m.label} className="bg-background p-5">
                <p className="text-2xl font-bold text-foreground mb-0.5">{m.val}</p>
                <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-wide">{m.label}</p>
                <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 mb-14">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-8">The Portfolio</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {PORTFOLIO.map(p => (
              <div key={p.name} className="border border-white/6 rounded-lg p-5 bg-white/[0.015]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[14px] font-semibold text-foreground">{p.name}</span>
                  <span className="text-[11px] text-primary/50 font-mono">·</span>
                  <span className="text-[11px] text-primary/50 font-mono">{p.role}</span>
                </div>
                <p className="text-muted-foreground text-[12.5px] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 mb-14">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-6">What drives the work</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="border border-white/6 rounded-lg p-5 bg-white/[0.015]">
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
