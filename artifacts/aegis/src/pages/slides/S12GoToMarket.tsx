export default function S12GoToMarket() {
  const phases = [
    {
      phase: 'Phase 01',
      label: 'Design Partners',
      timing: 'Now — 2026',
      color: '#0cc8d9',
      items: [
        '1–3 anchor partners per domain',
        'Direct founder-run engagements',
        'Co-develop workflows and edge cases',
        'Build proof points and references',
      ],
    },
    {
      phase: 'Phase 02',
      label: 'Domain Licensing',
      timing: '2026 — 2027',
      color: '#8b5cf6',
      items: [
        'SaaS licensing per domain pack',
        'Outcome Graph as the value metric',
        'Proof Chain as the compliance product',
        'Self-serve + high-touch enterprise',
      ],
    },
    {
      phase: 'Phase 03',
      label: 'Platform Licensing',
      timing: '2027+',
      color: '#f5a623',
      items: [
        'Full platform infrastructure license',
        'Customers build on shared primitives',
        'Custom domain pack development',
        'Revenue share on governed decisions',
      ],
    },
  ];
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(160deg, #070b10 0%, #0a0f18 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '0.15vh',
          background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)',
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
            Go-to-Market
          </span>
        </div>
        <h2
          style={{
            fontSize: '3.5vw',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#f0ece6',
            lineHeight: 1.05,
            marginBottom: '4vh',
          }}
        >
          Three-Phase Commercial Path
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '3vw',
            height: '62vh',
          }}
        >
          {phases.map((p) => (
            <div
              key={p.phase}
              style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.8vw',
                padding: '3vh 2.5vw',
                background: 'rgba(13,21,32,0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5vh',
                borderTop: `0.3vh solid ${p.color}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9vw',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: p.color,
                    marginBottom: '0.6vh',
                  }}
                >
                  {p.phase}
                </div>
                <div
                  style={{
                    fontSize: '2vw',
                    fontWeight: 800,
                    color: '#f0ece6',
                    lineHeight: 1.1,
                    marginBottom: '0.5vh',
                  }}
                >
                  {p.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.1vw',
                    color: 'rgba(240,236,230,0.35)',
                  }}
                >
                  {p.timing}
                </div>
              </div>
              <div style={{ width: '2vw', height: '0.15vh', background: p.color, opacity: 0.4 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh', flex: 1 }}>
                {p.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1vw' }}>
                    <div
                      style={{
                        width: '0.4vw',
                        height: '0.4vw',
                        borderRadius: '50%',
                        background: p.color,
                        flexShrink: 0,
                        marginTop: '0.8vh',
                      }}
                    />
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1.25vw',
                        color: 'rgba(240,236,230,0.6)',
                        lineHeight: 1.4,
                      }}
                    >
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
