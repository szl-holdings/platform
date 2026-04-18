export default function S10Evidence() {
  const stats = [
    { val: "700+", label: "Database Tables", note: "116 schema files" },
    { val: "40+", label: "Shared Packages", note: "pnpm monorepo" },
    { val: "12", label: "AI Agents", note: "Schema-validated" },
    { val: "9", label: "Decision Stages", note: "Canonical loop" },
    { val: "11", label: "RBAC Roles", note: "Tenant isolation" },
    { val: "6", label: "Domain Packs", note: "All inherit primitives" },
    { val: "4", label: "API Layers", note: "REST, GraphQL, MCP, SSE" },
    { val: "6", label: "Core Primitives", note: "Shared governance" },
  ];
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#070b10", fontFamily: "'Sora', sans-serif" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #f5a623, transparent)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 50% 100%, rgba(245,166,35,0.06) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", inset: 0, padding: "5vh 7vw" }}>
        <div style={{ marginBottom: "1vh" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1vw", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#f5a623" }}>
            Build Evidence
          </span>
        </div>
        <h2 style={{ fontSize: "3.5vw", fontWeight: 800, letterSpacing: "-0.025em", color: "#f0ece6", lineHeight: 1.05, marginBottom: "4.5vh" }}>
          The Architecture Exists.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: "2vw 2.5vw", height: "57vh" }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
                padding: "2.5vh 2vw",
                background: "rgba(13,21,32,0.7)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "5vw", fontWeight: 800, color: "#f5a623", letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: "1vh" }}>{s.val}</div>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#f0ece6", marginBottom: "0.5vh" }}>{s.label}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1vw", color: "rgba(240,236,230,0.35)" }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
