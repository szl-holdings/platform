export default function S04Loop() {
  const steps = [
    {
      n: '01',
      label: 'Signal',
      color: '#8a8a8a',
      desc: 'Risk indicators detected, normalized, and routed by the Event Fabric',
    },
    {
      n: '02',
      label: 'Context',
      color: '#8a8a8a',
      desc: 'Cross-domain enrichment via PRAXIS Bus — correlation ID attached',
    },
    {
      n: '03',
      label: 'Recommendation',
      color: '#c9b787',
      desc: 'AI proposes action with source citations and confidence score',
    },
    {
      n: '04',
      label: 'Simulation',
      color: '#c9b787',
      desc: 'Monte Carlo models risk before action — confidence intervals exposed',
    },
    {
      n: '05',
      label: 'Policy',
      color: '#c9b787',
      desc: 'Covenant Policy enforces who can approve and under what conditions',
    },
    {
      n: '06',
      label: 'Execution',
      color: '#8a8a8a',
      desc: 'Counsel orchestrates the approved action as a durable process',
    },
    {
      n: '07',
      label: 'Proof',
      color: '#c9b787',
      desc: 'Proof Chain records the complete trail — immutable and queryable',
    },
    {
      n: '08',
      label: 'Outcome',
      color: '#f5f5f5',
      desc: 'Outcome Graph records real-world result and action effectiveness',
    },
    {
      n: '09',
      label: 'Learning',
      color: '#c9b787',
      desc: 'Historical outcomes calibrate simulation models and AI confidence',
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
            Platform Core
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
          The Canonical Decision Loop
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: '1.5vw 2vw',
            height: '62vh',
          }}
        >
          {steps.map((s) => (
            <div
              key={s.n}
              style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.6vw',
                padding: '2vh 1.8vw',
                background: 'rgba(13,21,32,0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8vh',
                borderTop: `2px solid ${s.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8vw' }}>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9vw',
                    fontWeight: 600,
                    color: s.color,
                    letterSpacing: '0.1em',
                  }}
                >
                  {s.n}
                </span>
                <span style={{ fontSize: '1.4vw', fontWeight: 700, color: '#f0ece6' }}>
                  {s.label}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.15vw',
                  fontWeight: 400,
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.45,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
