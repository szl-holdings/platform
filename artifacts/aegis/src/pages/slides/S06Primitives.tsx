export default function S06Primitives() {
  const primitives = [
    {
      name: 'Outcome Graph',
      desc: 'Decision lifecycle and consequence measurement — links every action to real-world result',
      color: '#0cc8d9',
    },
    {
      name: 'Proof Chain',
      desc: 'Immutable, append-only audit trail — provenance on every AI recommendation and approval',
      color: '#8b5cf6',
    },
    {
      name: 'Covenant Policy',
      desc: 'Platform-layer governance — enforces who can act, under what conditions, non-delegatable',
      color: '#10b981',
    },
    {
      name: 'Simulation Engine',
      desc: 'Monte Carlo probabilistic risk modeling before action — confidence intervals exposed to operators',
      color: '#f59e0b',
    },
    {
      name: 'FORGE Runtime',
      desc: 'Durable workflow orchestration — multi-step execution with checkpoint recovery and agent coordination',
      color: '#6366f1',
    },
    {
      name: 'PRAXIS Bus',
      desc: 'Cross-domain event fabric — signal routing with correlation IDs across all domain packs',
      color: '#ec4899',
    },
  ];
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: '#070b10', fontFamily: "'Sora', sans-serif" }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '0.15vh',
          background: 'linear-gradient(90deg, transparent, #0cc8d9, transparent)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, padding: '5vh 7vw' }}>
        <div style={{ marginBottom: '1vh' }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1vw',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#0cc8d9',
            }}
          >
            Execution Fabric
          </span>
        </div>
        <h2
          style={{
            fontSize: '3.5vw',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#f0ece6',
            lineHeight: 1.05,
            marginBottom: '3.5vh',
          }}
        >
          Six Shared Governance Primitives
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '2vw 2.5vw',
            height: '62vh',
          }}
        >
          {primitives.map((p) => (
            <div
              key={p.name}
              style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.8vw',
                padding: '3vh 2.2vw',
                background: 'rgba(13,21,32,0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2vh',
              }}
            >
              <div style={{ width: '2.5vw', height: '0.25vh', background: p.color }} />
              <div
                style={{ fontSize: '1.6vw', fontWeight: 700, color: '#f0ece6', lineHeight: 1.1 }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.2vw',
                  fontWeight: 400,
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.5,
                }}
              >
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
