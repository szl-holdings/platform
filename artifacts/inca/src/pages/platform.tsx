import { Eye, GitBranch, MessageSquare, Shield, ArrowRight, CheckCircle } from "lucide-react";

const capabilities = [
  {
    title: "Signal visibility",
    body: "Bring fragmented indicators into a cleaner, more structured interface designed to support review and prioritization.",
    icon: Eye,
  },
  {
    title: "Triage workflows",
    body: "Move from raw inputs to more organized action paths with workflows that support clarity, ownership, and follow-through.",
    icon: GitBranch,
  },
  {
    title: "Explainable outputs",
    body: "Support better decisions with outputs that are easier to understand, validate, and communicate.",
    icon: MessageSquare,
  },
  {
    title: "Traceable operations",
    body: "Build trust through audit-friendly workflows, historical views, and stronger visibility into what happened and why.",
    icon: Shield,
  },
];

const signalStrip = [
  "Signals surfaced with more context",
  "Findings organized for review",
  "Visibility designed for action",
  "Auditability built into the workflow",
];

const useCases = [
  "Investigations",
  "Risk review",
  "Signal monitoring",
  "Workflow triage",
  "Executive visibility",
  "Team-based coordination",
];

export default function Platform() {
  return (
    <div className="min-h-screen overflow-auto text-foreground" style={{ background: "var(--background)" }}>
      <section className="py-20 lg:py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono text-primary/60 uppercase tracking-[0.2em] mb-6 border border-primary/20 rounded-full px-4 py-1.5">
            INCA
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Intelligence with structure.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            INCA is built to turn signals, findings, and operational noise into clearer visibility, more structured triage, and more informed action.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-7 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors">
              Schedule a private walkthrough
            </button>
            <a href="/" className="px-7 py-3.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-semibold text-sm transition-all flex items-center gap-2">
              Review platform capabilities <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-border/30 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {signalStrip.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-primary/50 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-mono text-primary/50 uppercase tracking-[0.2em] mb-4 text-center">Capabilities</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-16">
            A clearer layer for visibility and response.
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="p-7 rounded-2xl border border-border/50 bg-card/30 hover:border-primary/20 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-5">
                    <Icon className="text-primary" size={18} />
                  </div>
                  <h3 className="font-bold text-foreground mb-3">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30 bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">Built for environments where trust matters.</h2>
          <p className="text-muted-foreground text-base max-w-2xl leading-relaxed mb-12">
            INCA is designed with a strong emphasis on permissions, visibility, and operational credibility. The goal is not to create noise, but to build a more secure and explainable layer for teams operating in complex environments.
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-6">Structured for real-world operating demands.</h3>
              <ul className="grid grid-cols-2 gap-3">
                {useCases.map((uc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/40">
              <h3 className="font-bold text-foreground mb-3">Less noise. Better visibility.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                INCA should feel calm, exact, and credible. It is built for teams that need signal without chaos and workflows that support action rather than confusion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Review the intelligence layer.</h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Schedule a private walkthrough to explore the platform direction, security model, and how INCA can support more structured visibility and decision-making.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-7 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors">
              Schedule a walkthrough
            </button>
            <button className="px-7 py-3.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-semibold text-sm transition-all">
              Request access
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
