export default function S04Product() {
  const steps = [
    { n: "01", label: "Signal", desc: "Detect" },
    { n: "02", label: "Context", desc: "Enrich" },
    { n: "03", label: "Recommend", desc: "Analyze" },
    { n: "04", label: "Simulate", desc: "Monte Carlo" },
    { n: "05", label: "Policy", desc: "Gate" },
    { n: "06", label: "Execute", desc: "Act" },
    { n: "07", label: "Proof", desc: "Record" },
    { n: "08", label: "Outcome", desc: "Measure" },
    { n: "09", label: "Learning", desc: "Calibrate" },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: "#070b10",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(12,200,217,0.06) 0%, transparent 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "5.5vh 6vw",
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.9vw",
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#0cc8d9",
            marginBottom: "1.5vh",
          }}
        >
          Product
        </div>
        <div
          style={{
            fontSize: "3.6vw",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "#f0ece6",
            marginBottom: "0.8vh",
          }}
        >
          The Nine-Step Governance Loop
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.3vw",
            color: "rgba(240,236,230,0.45)",
            marginBottom: "4vh",
          }}
        >
          Every competitor closes part of the loop. SZL closes all of it.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(9, 1fr)",
            gap: "0.8vw",
            marginBottom: "3.5vh",
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                background: i === 3 || i === 4
                  ? "linear-gradient(145deg, rgba(245,166,35,0.12), rgba(245,166,35,0.05))"
                  : "linear-gradient(145deg, rgba(12,200,217,0.08), rgba(12,200,217,0.03))",
                border: `1px solid ${i === 3 || i === 4 ? "rgba(245,166,35,0.25)" : "rgba(12,200,217,0.18)"}`,
                borderRadius: "0.6vw",
                padding: "2.5vh 0.8vw",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "0.75vw",
                  fontWeight: 700,
                  color: i === 3 || i === 4 ? "#f5a623" : "#0cc8d9",
                  letterSpacing: "0.08em",
                  marginBottom: "1.2vh",
                }}
              >
                {step.n}
              </div>
              <div
                style={{
                  fontSize: "1.05vw",
                  fontWeight: 700,
                  color: "#f0ece6",
                  lineHeight: 1.15,
                  marginBottom: "0.6vh",
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82vw",
                  color: "rgba(240,236,230,0.35)",
                }}
              >
                {step.desc}
              </div>
              {i < 8 && (
                <div
                  style={{
                    position: "absolute",
                    right: "-0.5vw",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(12,200,217,0.4)",
                    fontSize: "1vw",
                    fontWeight: 700,
                    zIndex: 2,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "2vw",
          }}
        >
          <div
            style={{
              background: "rgba(12,200,217,0.05)",
              border: "1px solid rgba(12,200,217,0.12)",
              borderRadius: "0.6vw",
              padding: "2vh 2vw",
              borderLeft: "0.2vw solid #0cc8d9",
            }}
          >
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#f0ece6", marginBottom: "0.6vh" }}>Risk Simulation Inline</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", color: "rgba(240,236,230,0.4)" }}>Monte Carlo integrated at the point of decision — not post-hoc analysis</div>
          </div>
          <div
            style={{
              background: "rgba(245,166,35,0.05)",
              border: "1px solid rgba(245,166,35,0.12)",
              borderRadius: "0.6vw",
              padding: "2vh 2vw",
              borderLeft: "0.2vw solid #f5a623",
            }}
          >
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#f0ece6", marginBottom: "0.6vh" }}>Policy-Gated Execution</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", color: "rgba(240,236,230,0.4)" }}>Human approval required before action — governed autonomy, not blind automation</div>
          </div>
          <div
            style={{
              background: "rgba(12,200,217,0.05)",
              border: "1px solid rgba(12,200,217,0.12)",
              borderRadius: "0.6vw",
              padding: "2vh 2vw",
              borderLeft: "0.2vw solid #0cc8d9",
            }}
          >
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#f0ece6", marginBottom: "0.6vh" }}>Closed-Loop Learning</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", color: "rgba(240,236,230,0.4)" }}>Outcomes feed back into AI confidence. The system gets measurably better over time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
