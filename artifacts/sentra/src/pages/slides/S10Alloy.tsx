export default function S10Alloy() {
  const capabilities = [
    { label: 'FOUNDRY', desc: 'Models, datasets, spaces — HF Hub integration', color: '#c9b787' },
    { label: 'GOVERNANCE', desc: 'Proof Chain + Covenant + Audit stream', color: '#6366f1' },
    { label: 'FLEET', desc: 'Every SZL surface, browsable in one place', color: '#3b82f6' },
    { label: 'ENTERPRISE', desc: 'SSO, regions, RBAC, dedicated inference', color: '#10b981' },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: '#070b10',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(201,183,135,0.06) 0%, transparent 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '5.5vh 6vw',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9vw',
            fontWeight: 500,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#c9b787',
            marginBottom: '1.5vh',
          }}
        >
          Introducing
        </div>
        <div
          style={{
            fontSize: '3.5vw',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#f0ece6',
            marginBottom: '0.8vh',
          }}
        >
          Alloy — The Enterprise AI Hub
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.2vw',
            color: 'rgba(240,236,230,0.45)',
            marginBottom: '4vh',
            maxWidth: '52vw',
            lineHeight: 1.5,
          }}
        >
          The unified front door to every model, dataset, governance record, and team control
          in the SZL ecosystem. One platform. Every capability. Full audit trail.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5vw',
            maxWidth: '65vw',
          }}
        >
          {capabilities.map((cap, i) => (
            <div
              key={i}
              style={{
                background: 'linear-gradient(145deg, rgba(13,21,32,0.9), rgba(7,11,16,0.8))',
                border: '1px solid rgba(201,183,135,0.15)',
                borderRadius: '0.7vw',
                padding: '3vh 2.5vw',
                borderLeft: `0.25vw solid ${cap.color}`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.75vw',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: cap.color,
                  marginBottom: '1vh',
                }}
              >
                {cap.label}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.1vw',
                  color: 'rgba(240,236,230,0.6)',
                  lineHeight: 1.45,
                }}
              >
                {cap.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
