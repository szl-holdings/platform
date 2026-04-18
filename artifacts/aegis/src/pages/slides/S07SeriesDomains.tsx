export default function S07SeriesDomains() {
  const domains = [
    {
      name: "Aegis",
      subtitle: "Defense & Security",
      score: "8/10",
      desc: "SOC command + 8 advanced intelligence modules: OT/ICS, OSINT, Dark Web, SIGINT, Behavioral, Counterintelligence, Quantum, AI Threat Hunter",
      color: "#0cc8d9",
    },
    {
      name: "Vessels",
      subtitle: "Maritime Intelligence",
      score: "8/10",
      desc: "Fleet command + commercial modules: S&P tracking, Demurrage, Freight benchmarking, Voyage P&L, Marine insurance",
      color: "#0cc8d9",
    },
    {
      name: "Terra",
      subtitle: "Real Estate Intelligence",
      score: "7/10",
      desc: "NYC distress pipeline + AI property analysis + ownership graph. Live NYC Open Data feed — closest domain to production live data",
      color: "#0cc8d9",
    },
    {
      name: "Carlota Jo",
      subtitle: "Premium Advisory",
      score: "7/10",
      desc: "Client portal, booking, document delivery, billing. Full-service consulting workflow with governance primitives",
      color: "#f5a623",
    },
    {
      name: "Command",
      subtitle: "Unified Operations",
      score: "8/10",
      desc: "Cross-domain ops hub — real-time SSE, composite health scoring, Cmd+K command palette, executive briefing view",
      color: "#f5a623",
    },
    {
      name: "SZL Holdings",
      subtitle: "Corporate Platform",
      score: "9/10",
      desc: "Portfolio command, investor relations, trust center, data room — the corporate presence built on its own governance infrastructure",
      color: "#f5a623",
    },
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
          backgroundImage: "radial-gradient(ellipse 60% 50% at 20% 80%, rgba(12,200,217,0.05) 0%, transparent 50%)",
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
          Domain Breadth
        </div>
        <div
          style={{
            fontSize: "3.5vw",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "#f0ece6",
            marginBottom: "0.8vh",
          }}
        >
          Six Verticals. One Governance Loop.
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.2vw",
            color: "rgba(240,236,230,0.4)",
            marginBottom: "3.5vh",
          }}
        >
          The same nine-step architecture governs decisions across defense, maritime, real estate, advisory, operations, and corporate management.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1.5vw",
          }}
        >
          {domains.map((d, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(145deg, rgba(13,21,32,0.9), rgba(7,11,16,0.8))",
                border: `1px solid ${d.color === "#0cc8d9" ? "rgba(12,200,217,0.2)" : "rgba(245,166,35,0.2)"}`,
                borderRadius: "0.7vw",
                padding: "2.5vh 2vw",
                borderTop: `0.2vw solid ${d.color}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8vh" }}>
                <div>
                  <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#f0ece6", lineHeight: 1.1 }}>{d.name}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9vw", color: d.color, marginTop: "0.3vh" }}>{d.subtitle}</div>
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85vw",
                    fontWeight: 700,
                    color: d.color,
                    background: d.color === "#0cc8d9" ? "rgba(12,200,217,0.1)" : "rgba(245,166,35,0.1)",
                    padding: "0.3vh 0.6vw",
                    borderRadius: "0.3vw",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.score}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1vw",
                  color: "rgba(240,236,230,0.45)",
                  lineHeight: 1.45,
                  flex: 1,
                }}
              >
                {d.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
