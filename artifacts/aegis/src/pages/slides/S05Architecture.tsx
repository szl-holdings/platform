export default function S05Architecture() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #070b10 0%, #0a0f18 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at 50% 100%, rgba(12,200,217,0.06) 0%, transparent 60%)',
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
            Architecture
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
          Three-Layer Platform
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vh', height: '62vh' }}>
          <div
            style={{
              flex: '1',
              border: '1px solid rgba(138,138,138,0.3)',
              borderLeft: '0.4vw solid #8a8a8a',
              borderRadius: '0.6vw',
              padding: '2.2vh 2.5vw',
              background: 'rgba(138,138,138,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '3vw',
            }}
          >
            <div style={{ minWidth: '12vw' }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85vw',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#8a8a8a',
                  marginBottom: '0.5vh',
                }}
              >
                Layer 03
              </div>
              <div style={{ fontSize: '1.7vw', fontWeight: 700, color: '#f0ece6' }}>
                Domain Packs
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.1vw',
                  color: 'rgba(240,236,230,0.4)',
                  marginTop: '0.4vh',
                }}
              >
                Vertical intelligence
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '1.5vw', flexWrap: 'wrap' }}>
              {[
                'Aegis — Security',
                'Vessels — Maritime',
                'Terra — Real Estate',
                'Counsel — Legal',
                'Carlota Jo — Advisory',
                'IMPERIUM — Cloud',
              ].map((d) => (
                <span
                  key={d}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.15vw',
                    color: 'rgba(240,236,230,0.55)',
                    background: 'rgba(138,138,138,0.08)',
                    border: '1px solid rgba(138,138,138,0.2)',
                    borderRadius: '0.3vw',
                    padding: '0.4vh 1vw',
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              flex: '1.2',
              border: '1px solid rgba(12,200,217,0.3)',
              borderLeft: '0.4vw solid #0cc8d9',
              borderRadius: '0.6vw',
              padding: '2.2vh 2.5vw',
              background: 'rgba(12,200,217,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '3vw',
            }}
          >
            <div style={{ minWidth: '12vw' }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85vw',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#0cc8d9',
                  marginBottom: '0.5vh',
                }}
              >
                Layer 02
              </div>
              <div style={{ fontSize: '1.7vw', fontWeight: 700, color: '#f0ece6' }}>
                Execution Fabric
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.1vw',
                  color: 'rgba(240,236,230,0.4)',
                  marginTop: '0.4vh',
                }}
              >
                Shared governance primitives
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '1.5vw', flexWrap: 'wrap' }}>
              {[
                'Counsel Runtime',
                'Outcome Graph',
                'Proof Chain',
                'Covenant Policy',
                'Simulation Engine',
                'PRAXIS Bus',
              ].map((d) => (
                <span
                  key={d}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.15vw',
                    color: 'rgba(240,236,230,0.55)',
                    background: 'rgba(12,200,217,0.06)',
                    border: '1px solid rgba(12,200,217,0.15)',
                    borderRadius: '0.3vw',
                    padding: '0.4vh 1vw',
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              flex: '1',
              border: '1px solid rgba(245,166,35,0.3)',
              borderLeft: '0.4vw solid #f5a623',
              borderRadius: '0.6vw',
              padding: '2.2vh 2.5vw',
              background: 'rgba(245,166,35,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '3vw',
            }}
          >
            <div style={{ minWidth: '12vw' }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85vw',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#f5a623',
                  marginBottom: '0.5vh',
                }}
              >
                Layer 01
              </div>
              <div style={{ fontSize: '1.7vw', fontWeight: 700, color: '#f0ece6' }}>
                Command Surfaces
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.1vw',
                  color: 'rgba(240,236,230,0.4)',
                  marginTop: '0.4vh',
                }}
              >
                Operator-facing interfaces
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '1.5vw', flexWrap: 'wrap' }}>
              {['Lyte Command Center', 'APEX Mobile', 'Command Portal'].map((d) => (
                <span
                  key={d}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.15vw',
                    color: 'rgba(240,236,230,0.55)',
                    background: 'rgba(245,166,35,0.06)',
                    border: '1px solid rgba(245,166,35,0.15)',
                    borderRadius: '0.3vw',
                    padding: '0.4vh 1vw',
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
