export default function S13DividerVerdict() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #070b10 0%, #0c1420 50%, #070b10 100%)",
        fontFamily: "'Sora', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 50% 50%, rgba(245,166,35,0.08) 0%, transparent 60%)" }} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "7vw",
          right: "7vw",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)",
          transform: "translateY(-50%)",
        }}
      />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#f5a623", marginBottom: "2vh" }}>
          Part Three
        </div>
        <h2 style={{ fontSize: "8vw", fontWeight: 800, letterSpacing: "-0.04em", color: "#f0ece6", lineHeight: 0.95 }}>
          The
          <br />
          <span style={{ color: "#f5a623" }}>Verdict.</span>
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.6vw", color: "rgba(240,236,230,0.35)", marginTop: "3vh", fontWeight: 300 }}>
          Commercial path · The ask · What we offer
        </p>
      </div>
    </div>
  );
}
