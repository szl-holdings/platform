export default function S03Thesis() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(160deg, #070b10 0%, #0d1520 60%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at 80% 50%, rgba(12,200,217,0.06) 0%, transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '10vh',
          bottom: '10vh',
          width: '1px',
          background: 'rgba(12,200,217,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '0 7vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: '2.5vh' }}>
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
            The Thesis
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '7vw',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '5.5vw',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 0.95,
                color: '#f0ece6',
                marginBottom: '4vh',
              }}
            >
              Signal.
              <br />
              <span style={{ color: '#0cc8d9' }}>Decision.</span>
              <br />
              Proof.
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.65vw',
                fontWeight: 400,
                color: 'rgba(240,236,230,0.55)',
                lineHeight: 1.6,
                maxWidth: '36ch',
              }}
            >
              We built the governed infrastructure layer between AI output and real-world
              consequence.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5vh' }}>
            <div style={{ borderLeft: '0.3vw solid #0cc8d9', paddingLeft: '2vw' }}>
              <div
                style={{
                  fontSize: '1.55vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.6vh',
                }}
              >
                Every decision, governed
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25vw',
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.4,
                }}
              >
                Policy-gated at the architecture layer — not the UI
              </div>
            </div>
            <div style={{ borderLeft: '0.3vw solid rgba(12,200,217,0.4)', paddingLeft: '2vw' }}>
              <div
                style={{
                  fontSize: '1.55vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.6vh',
                }}
              >
                Every output, attributed
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25vw',
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.4,
                }}
              >
                Model identity, source citations, confidence on every recommendation
              </div>
            </div>
            <div style={{ borderLeft: '0.3vw solid rgba(12,200,217,0.2)', paddingLeft: '2vw' }}>
              <div
                style={{
                  fontSize: '1.55vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.6vh',
                }}
              >
                Every consequence, tracked
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25vw',
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.4,
                }}
              >
                Outcome Graph links decisions to real-world results — learning on every loop
              </div>
            </div>
            <div style={{ borderLeft: '0.3vw solid rgba(12,200,217,0.1)', paddingLeft: '2vw' }}>
              <div
                style={{
                  fontSize: '1.55vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.6vh',
                }}
              >
                Every action, proven
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25vw',
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.4,
                }}
              >
                Proof Chain is immutable, append-only, queryable by actor, action, and time
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
