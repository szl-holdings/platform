import { m } from "framer-motion";
import { ArrowRight, TrendingUp, Layers, Shield, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const laneProducts = [
  {
    layer: "Observe",
    accent: "hsl(208,65%,48%)",
    products: [
      { name: "Vessels", tagline: "Real-time fleet and voyage intelligence for operators who cannot afford to be wrong." },
      { name: "Rosie", tagline: "SOC-grade threat and incident command, designed to work at the speed of an actual incident." },
      { name: "Beacon", tagline: "Operational telemetry that connects infrastructure signals to business outcomes." },
    ],
  },
  {
    layer: "Understand",
    accent: "hsl(246,50%,60%)",
    products: [
      { name: "INCA", tagline: "The intelligence layer where AI outputs become traceable, versioned, and accountable decisions." },
      { name: "Alloy", tagline: "Execution fabric and predictive intelligence engine — the platform backbone that Lyte, Vessels, and every SZL subsidiary runs on." },
    ],
  },
  {
    layer: "Execute",
    accent: "hsl(200,65%,46%)",
    products: [
      { name: "Alloy", tagline: "The execution fabric that turns intelligence into confirmed, accountable action." },
    ],
  },
  {
    layer: "Advise",
    accent: "hsl(32,55%,55%)",
    products: [
      { name: "Carlota Jo", tagline: "Advisory at the intersection of brand, operations, and platform intelligence." },
    ],
  },
];

const defensibility = [
  {
    title: "Shared design system",
    body: "Every product shares a design language, component library, and interaction model. New products reach production quality faster. Users who know one platform are partially oriented on all of them.",
    accent: "hsl(208,65%,48%)",
  },
  {
    title: "Shared event model",
    body: "Signals across the ecosystem conform to a common schema. This is the prerequisite for cross-domain intelligence. It took investment to build; it cannot be replicated quickly.",
    accent: "hsl(246,50%,60%)",
  },
  {
    title: "Agent network and orchestration",
    body: "Alloy's agent coordination layer is the connective tissue of the platform. Agents are coordinated under a governance framework that maintains accountability across the network.",
    accent: "hsl(200,65%,46%)",
  },
  {
    title: "Entity graph",
    body: "The platform maintains a traceable entity model connecting vessels, incidents, signals, recommendations, actions, and actors. Causality is structured into the data model.",
    accent: "hsl(32,55%,55%)",
  },
  {
    title: "Explainability architecture",
    body: "Advisory agents cannot execute consequential actions without human confirmation — enforced at the workflow level. Enterprises buying AI-assisted operations need this assurance by design, not by policy.",
    accent: "hsl(152,50%,42%)",
  },
  {
    title: "Multi-lane applicability",
    body: "The four-layer architecture applies across verticals. The platform does not need to be rebuilt for each market — it needs a domain-specific Observe layer. The structural investment compounds across every expansion.",
    accent: "hsl(280,50%,60%)",
  },
];

export default function InvestorStory() {
  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        paddingTop: "clamp(7rem,12vw,10rem)",
        paddingBottom: "clamp(4rem,7vw,6rem)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: "40rem" }}
          >
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "6px",
              background: "hsla(0,0%,100%,0.04)",
              border: "1px solid hsla(0,0%,100%,0.08)",
              color: "hsl(210,5%,52%)",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}>
              <TrendingUp size={10} />
              Investor & Executive Narrative
            </span>

            <h1 style={{
              fontSize: "clamp(2rem,4.5vw,3.25rem)",
              fontWeight: "700",
              letterSpacing: "-0.028em",
              lineHeight: "1.08",
              color: "hsl(38,12%,94%)",
              marginBottom: "1.5rem",
            }}>
              One platform architecture.
              <br />
              <span style={{
                background: "linear-gradient(135deg, hsl(210,10%,72%), hsl(32,40%,66%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                A new category.
              </span>
            </h1>

            <p style={{
              fontSize: "1.0625rem",
              color: "hsl(210,5%,60%)",
              lineHeight: "1.65",
            }}>
              SZL Holdings is building the infrastructure layer for Business Observability — the capability to see across an operational system, understand signal and causality, and act with confidence. This is the strategic narrative behind the platform, the category, and the defensibility.
            </p>
          </m.div>
        </div>
      </section>

      {/* The Problem */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <span style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "hsl(210,5%,46%)",
              marginBottom: "1.25rem",
            }}>The Problem</span>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
              <div>
                <h2 style={{
                  fontSize: "clamp(1.625rem,3vw,2.125rem)",
                  fontWeight: "700",
                  letterSpacing: "-0.022em",
                  lineHeight: "1.12",
                  color: "hsl(38,12%,94%)",
                  marginBottom: "1.25rem",
                }}>Too many systems. Too few connections.</h2>
                <p style={{ fontSize: "1rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", marginBottom: "1rem" }}>
                  Organisations operating at any meaningful scale face the same structural difficulty. Monitoring tools see infrastructure but not business impact. Analytics platforms surface trends but not causes. Workflow tools execute tasks but don't understand the signals that triggered them.
                </p>
                <p style={{ fontSize: "1rem", color: "hsl(210,5%,60%)", lineHeight: "1.65" }}>
                  The result is permanent reactive management. Problems are identified after they compound. The people responsible for outcomes spend most of their time synthesising fragmented signals manually — skilled, expensive, exhausting work that produces answers too slowly to be fully useful.
                </p>
              </div>
              <div style={{
                background: "hsla(0,0%,100%,0.02)",
                border: "1px solid hsla(0,0%,100%,0.06)",
                borderRadius: "12px",
                padding: "2rem",
              }}>
                <p style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "hsl(210,5%,40%)",
                  marginBottom: "1.25rem",
                }}>What organisations have</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { problem: "Observability tools", gap: "See infrastructure, not business impact" },
                    { problem: "Analytics platforms", gap: "Surface trends, not root cause" },
                    { problem: "Workflow automation", gap: "Execute tasks, not understand triggers" },
                    { problem: "Advisory relationships", gap: "Disconnected from operational reality" },
                  ].map((item) => (
                    <div key={item.problem} style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.875rem",
                    }}>
                      <div style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "hsl(0,60%,52%)",
                        flexShrink: 0,
                        marginTop: "6px",
                      }} />
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "hsl(38,12%,88%)", marginBottom: "2px" }}>{item.problem}</p>
                        <p style={{ fontSize: "0.8125rem", color: "hsl(210,5%,52%)" }}>{item.gap}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* The Category */}
      <section style={{
        paddingTop: "clamp(4rem,7vw,6rem)",
        paddingBottom: "clamp(4rem,7vw,6rem)",
        background: "hsla(0,0%,100%,0.015)",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <span style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "hsl(210,5%,46%)",
              marginBottom: "1.25rem",
            }}>The Category</span>
            <h2 style={{
              fontSize: "clamp(1.625rem,3vw,2.125rem)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
              lineHeight: "1.12",
              color: "hsl(38,12%,94%)",
              marginBottom: "1.25rem",
            }}>Business Observability</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "42rem", marginBottom: "2.5rem" }}>
              Business Observability is the emerging category at the intersection of operational intelligence, AI-assisted reasoning, and structured action. It is the capability to see across a system — not just into a component of it — and understand signal, causality, and recommended action in a single, traceable workflow.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1px",
              background: "hsla(0,0%,100%,0.05)",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              {[
                { label: "Business Intelligence", note: "Answers 'what happened?'", vs: "Business Observability answers 'what is happening, why, and what should we do?'" },
                { label: "AIOps / MLOps", note: "Optimises specific technical systems", vs: "Business Observability spans the full operational layer: commercial, logistics, security, and people." },
                { label: "ERP / Workflow platforms", note: "Executes processes", vs: "Business Observability surfaces the signals that should inform whether and how those processes run." },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: "1.75rem",
                  background: "hsl(210,12%,5%)",
                }}>
                  <p style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "hsl(210,5%,52%)",
                    marginBottom: "0.5rem",
                    textDecoration: "line-through",
                  }}>{item.label}</p>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(210,5%,44%)", marginBottom: "0.875rem" }}>{item.note}</p>
                  <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,64%)", lineHeight: "1.6" }}>{item.vs}</p>
                </div>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      {/* The Platform */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "3rem" }}
          >
            <span style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "hsl(210,5%,46%)",
              marginBottom: "1.25rem",
            }}>The Platform</span>
            <h2 style={{
              fontSize: "clamp(1.625rem,3vw,2.125rem)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
              lineHeight: "1.12",
              color: "hsl(38,12%,94%)",
              marginBottom: "1rem",
            }}>Four layers. Eight products. One architecture.</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "40rem" }}>
              Each layer has a defined function. Each product has a defined thesis. Every product makes the others stronger.
            </p>
          </m.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {laneProducts.map((lane, li) => (
              <m.div
                key={lane.layer}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.52, delay: li * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: "2rem",
                  alignItems: "start",
                  padding: "1.75rem",
                  background: "hsla(0,0%,100%,0.02)",
                  border: "1px solid hsla(0,0%,100%,0.06)",
                  borderLeft: `3px solid ${lane.accent}`,
                  borderRadius: "10px",
                }}
              >
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "hsl(210,5%,38%)",
                    marginBottom: "0.375rem",
                    fontFamily: "monospace",
                  }}>Layer</span>
                  <span style={{
                    fontSize: "0.9375rem",
                    fontWeight: "700",
                    color: lane.accent,
                    letterSpacing: "-0.008em",
                  }}>{lane.layer}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {lane.products.map((p) => (
                    <div key={p.name}>
                      <span style={{
                        fontSize: "0.9375rem",
                        fontWeight: "600",
                        color: "hsl(38,12%,90%)",
                        marginRight: "0.75rem",
                      }}>{p.name}</span>
                      <span style={{ fontSize: "0.9rem", color: "hsl(210,5%,56%)", lineHeight: "1.58" }}>{p.tagline}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expansion Logic */}
      <section style={{
        paddingTop: "clamp(4rem,7vw,6rem)",
        paddingBottom: "clamp(4rem,7vw,6rem)",
        background: "hsla(0,0%,100%,0.015)",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <span style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "hsl(210,5%,46%)",
              marginBottom: "1.25rem",
            }}>Expansion Logic</span>
            <h2 style={{
              fontSize: "clamp(1.625rem,3vw,2.125rem)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
              lineHeight: "1.12",
              color: "hsl(38,12%,94%)",
              marginBottom: "1rem",
            }}>Not a portfolio. A system that compounds.</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "40rem" }}>
              The SZL platform was designed as a system where every product makes the others stronger. Expansion follows a defined architecture, not a collection of independent bets.
            </p>
          </m.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "hsla(0,0%,100%,0.05)", borderRadius: "12px", overflow: "hidden" }}>
            {[
              {
                phase: "Phase 1",
                label: "Core Engine",
                status: "Achieved",
                body: "Build the Observe-Understand-Execute architecture and prove it in high-stakes verticals. Maritime (Vessels) and Security (Rosie) were selected because the cost of poor observability is quantifiable and the buyers are sophisticated.",
              },
              {
                phase: "Phase 2",
                label: "Cross-domain intelligence",
                status: "In progress",
                body: "Connect the entity model and event schema across the platform so signals in one domain inform reasoning in another. A vessel delay that creates cargo exposure should surface as a commercial risk signal.",
              },
              {
                phase: "Phase 3",
                label: "Premium advisory",
                status: "Underway",
                body: "The Carlota Jo advisory capability demonstrates the model that every SZL vertical eventually supports: a domain expert with platform-grade intelligence, delivering advisory that was previously impossible without the underlying infrastructure.",
              },
              {
                phase: "Phase 4",
                label: "Platform generalisation",
                status: "Roadmap",
                body: "The four-layer model is generalisable. The same architecture that serves maritime logistics can serve logistics at large, healthcare operations, financial services risk, or government infrastructure. Each vertical gets a domain-specific Observe layer; the rest of the stack is shared.",
              },
            ].map((item) => (
              <div key={item.phase} style={{
                padding: "1.75rem 2rem",
                background: "hsl(210,12%,5%)",
                display: "grid",
                gridTemplateColumns: "100px 1fr auto",
                gap: "1.5rem",
                alignItems: "start",
              }}>
                <span style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "hsl(210,5%,38%)",
                  fontFamily: "monospace",
                  paddingTop: "3px",
                }}>{item.phase}</span>
                <div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "hsl(38,12%,90%)", marginBottom: "0.5rem" }}>{item.label}</h3>
                  <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.62" }}>{item.body}</p>
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: item.status === "Achieved" ? "hsla(152,50%,42%,0.12)" : "hsla(0,0%,100%,0.04)",
                  color: item.status === "Achieved" ? "hsl(152,50%,52%)" : "hsl(210,5%,44%)",
                  border: `1px solid ${item.status === "Achieved" ? "hsla(152,50%,42%,0.25)" : "hsla(0,0%,100%,0.07)"}`,
                  whiteSpace: "nowrap",
                  alignSelf: "flex-start",
                }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Defensibility */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <span style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "hsl(210,5%,46%)",
              marginBottom: "1.25rem",
            }}>Defensibility</span>
            <h2 style={{
              fontSize: "clamp(1.625rem,3vw,2.125rem)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
              lineHeight: "1.12",
              color: "hsl(38,12%,94%)",
              marginBottom: "1rem",
            }}>Six structural advantages.</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "40rem" }}>
              SZL Holdings is not building features. It is building infrastructure. The defensibility of the platform comes from structural advantages that compound over time.
            </p>
          </m.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {defensibility.map((item, i) => (
              <m.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "hsla(0,0%,100%,0.02)",
                  border: "1px solid hsla(0,0%,100%,0.06)",
                  borderTop: `3px solid ${item.accent}`,
                  borderRadius: "10px",
                  padding: "1.5rem",
                }}
              >
                <h3 style={{
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  color: "hsl(38,12%,92%)",
                  marginBottom: "0.625rem",
                }}>{item.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.62" }}>{item.body}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing thesis */}
      <section style={{
        paddingTop: "clamp(4rem,7vw,6rem)",
        paddingBottom: "clamp(4rem,7vw,6rem)",
        background: "hsla(0,0%,100%,0.015)",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: "44rem" }}
          >
            <blockquote style={{
              borderLeft: "2px solid hsla(210,10%,72%,0.25)",
              paddingLeft: "1.5rem",
              marginBottom: "2.5rem",
            }}>
              <p style={{
                fontSize: "1.1875rem",
                color: "hsl(210,5%,72%)",
                lineHeight: "1.65",
                fontWeight: "300",
                fontStyle: "italic",
                marginBottom: "1rem",
              }}>
                "The enterprises that will win the next decade are not the ones with the most data. They are the ones that can reason across their data, connect operational signal to strategic decision, and act with confidence — faster than their competitors, and with more accountability than their regulators require."
              </p>
              <footer style={{
                fontSize: "11px",
                color: "hsl(210,5%,40%)",
                fontWeight: "500",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                SZL Holdings — Strategic Thesis
              </footer>
            </blockquote>

            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", marginBottom: "2rem" }}>
              SZL Holdings is building the platform infrastructure for that outcome. Not as a single product, but as a layered ecosystem where every product makes the others stronger, every data signal compounds across domains, and every AI recommendation is traceable, explainable, and confirmed by a human who understood it.
            </p>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65" }}>
              The category is Business Observability. The architecture is explicit. The compounding has started.
            </p>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
