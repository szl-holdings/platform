export default function S02Problem() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: "#070b10",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #0cc8d9, transparent)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 80%, rgba(245,166,35,0.05) 0%, transparent 50%)" }} />
      <div style={{ position: "absolute", inset: 0, padding: "6vh 7vw" }}>
        <div style={{ marginBottom: "1.5vh" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0cc8d9" }}>
            The Problem
          </span>
        </div>
        <h2 style={{ fontSize: "4.2vw", fontWeight: 800, letterSpacing: "-0.025em", color: "#f0ece6", lineHeight: 1.05, marginBottom: "5vh" }}>
          Enterprise AI has a
          <br />
          <span style={{ color: "#f5a623" }}>trust problem.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw", height: "42vh" }}>
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.8vw", padding: "3vh 2.5vw", background: "rgba(13,21,32,0.7)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#f5a623", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "1.5vh" }}>87%</div>
              <div style={{ width: "3vw", height: "0.2vh", background: "#f5a623", marginBottom: "2vh" }} />
              <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#f0ece6", marginBottom: "1.2vh", lineHeight: 1.2 }}>No Explainability</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.35vw", fontWeight: 400, color: "rgba(240,236,230,0.5)", lineHeight: 1.5 }}>
                of enterprise AI incidents involve outputs with no reasoning trail or source attribution
              </div>
            </div>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.8vw", padding: "3vh 2.5vw", background: "rgba(13,21,32,0.7)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#f5a623", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "1.5vh" }}>Zero</div>
              <div style={{ width: "3vw", height: "0.2vh", background: "#f5a623", marginBottom: "2vh" }} />
              <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#f0ece6", marginBottom: "1.2vh", lineHeight: 1.2 }}>Audit Trail</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.35vw", fontWeight: 400, color: "rgba(240,236,230,0.5)", lineHeight: 1.5 }}>
                Existing tools produce recommendations but record no immutable proof of what was decided, by whom, and why
              </div>
            </div>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.8vw", padding: "3vh 2.5vw", background: "rgba(13,21,32,0.7)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#f5a623", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "1.5vh" }}>Bolted On</div>
              <div style={{ width: "3vw", height: "0.2vh", background: "#f5a623", marginBottom: "2vh" }} />
              <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#f0ece6", marginBottom: "1.2vh", lineHeight: 1.2 }}>Governance as Afterthought</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.35vw", fontWeight: 400, color: "rgba(240,236,230,0.5)", lineHeight: 1.5 }}>
                Compliance layers are added post-deployment — not embedded in the architecture from day one
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "3vh", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "2vh" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.5vw", fontWeight: 400, color: "rgba(240,236,230,0.35)", fontStyle: "italic" }}>
            High-consequence domains — security, maritime, legal, real estate — cannot operate on AI they cannot verify.
          </p>
        </div>
      </div>
    </div>
  );
}
