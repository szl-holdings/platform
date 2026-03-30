import { m } from "framer-motion";

const proofs = [
  {
    platform: "Lyte",
    view: "Command View",
    desc: "Signals surfaced, owners identified, value at risk quantified across business operations.",
    accent: "hsl(190,90%,55%)",
    href: "/lyte-command-center/",
    status: "Live",
  },
  {
    platform: "Vessels",
    view: "Fleet Command",
    desc: "10 vessels tracked. Route visibility, voyage economics, and exceptions in one operational layer.",
    accent: "hsl(205,85%,55%)",
    href: "/vessels/",
    status: "Live",
  },
  {
    platform: "Alloy",
    view: "Architecture",
    desc: "6-layer pipeline: Inputs → Normalization → Reasoning → Orchestration → Outputs → Governance.",
    accent: "hsl(214,80%,65%)",
    href: "/alloy/",
    status: "Live",
  },
  {
    platform: "Lyte",
    view: "Readiness",
    desc: "Project Readiness absorbed into Lyte as a first-class module for execution tracking.",
    accent: "hsl(190,90%,55%)",
    href: "/lyte-command-center/",
    status: "Live",
  },
];

export function ProofGrid() {
  return (
    <section
      style={{
        padding: "6rem 0",
        background: "hsl(210,12%,5%)",
        borderTop: "1px solid hsla(0,0%,100%,0.04)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
            Proof of Execution
          </p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: "1.1" }}>
            Built. Running. Delivering.
          </h2>
        </m.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {proofs.map((p, i) => (
            <m.a
              key={`${p.platform}-${p.view}`}
              href={p.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.48, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "block",
                textDecoration: "none",
                padding: "1.5rem",
                borderRadius: "0.875rem",
                background: "hsla(0,0%,100%,0.025)",
                border: "1px solid hsla(0,0%,100%,0.06)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = `${p.accent}30`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.accent, display: "inline-block" }} />
                <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: p.accent }}>
                  {p.platform}
                </span>
                <span style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginLeft: "auto", letterSpacing: "0.04em" }}>
                  {p.status}
                </span>
              </div>
              <p style={{ fontSize: "13.5px", fontWeight: "600", color: "hsl(38,12%,88%)", marginBottom: "0.5rem", letterSpacing: "-0.005em" }}>
                {p.view}
              </p>
              <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "hsl(210,5%,54%)" }}>
                {p.desc}
              </p>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}
