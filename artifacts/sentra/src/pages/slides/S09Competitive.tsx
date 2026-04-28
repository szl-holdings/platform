export default function S09Competitive() {
  const legacy = [
    'Governance bolted on post-deployment',
    'Opaque AI outputs — no reasoning trail',
    'Siloed point solutions per vertical',
    'No immutable audit trail on decisions',
    'No outcome tracking — decisions unlinked from consequences',
    'Policy lives in the UI, not the platform',
  ];
  const szl = [
    'Governance is an architecture primitive from day one',
    'Every output attributed — model, source, confidence score',
    'One platform infrastructure, six domain packs',
    'Proof Chain: immutable, append-only, queryable',
    'Outcome Graph links every decision to real-world result',
    'Covenant Policy enforced at the workflow layer',
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
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '5vh',
          bottom: '5vh',
          width: '1px',
          background: 'rgba(255,255,255,0.07)',
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
            Differentiation
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
          Governed by Design, Not Compliance
        </h2>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5vw', height: '62vh' }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,230,0.3)',
                marginBottom: '2vh',
              }}
            >
              Legacy Approach
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
              {legacy.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2vw' }}>
                  <div
                    style={{
                      width: '0.5vw',
                      height: '0.5vw',
                      borderRadius: '50%',
                      background: 'rgba(240,236,230,0.15)',
                      flexShrink: 0,
                      marginTop: '0.7vh',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1.3vw',
                      color: 'rgba(240,236,230,0.35)',
                      lineHeight: 1.4,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#0cc8d9',
                marginBottom: '2vh',
              }}
            >
              PARAGON
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
              {szl.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2vw' }}>
                  <div
                    style={{
                      width: '0.5vw',
                      height: '0.5vw',
                      borderRadius: '50%',
                      background: '#0cc8d9',
                      flexShrink: 0,
                      marginTop: '0.7vh',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1.3vw',
                      color: '#f0ece6',
                      lineHeight: 1.4,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
