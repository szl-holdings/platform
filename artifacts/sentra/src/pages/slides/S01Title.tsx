const _base = import.meta.env.BASE_URL;

export default function S01Title() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #070b10 0%, #0a1422 50%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 70% 40%, rgba(12,200,217,0.08) 0%, transparent 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40vw',
          height: '100%',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2vh, rgba(12,200,217,0.025) 2vh, rgba(12,200,217,0.025) 2.05vh), repeating-linear-gradient(90deg, transparent, transparent 4vw, rgba(12,200,217,0.025) 4vw, rgba(12,200,217,0.025) 4.1vw)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '0.3vw',
          height: '100%',
          background: 'linear-gradient(180deg, transparent, #0cc8d9 40%, #0cc8d9 60%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '0.15vh',
          background:
            'linear-gradient(90deg, #0cc8d9 0%, rgba(12,200,217,0.3) 60%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '7vh 7vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: '2.5vh' }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.1vw',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#0cc8d9',
            }}
          >
            Sentra
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '1px',
              height: '1.2vw',
              background: 'rgba(255,255,255,0.2)',
              margin: '0 1vw',
              verticalAlign: 'middle',
            }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.1vw',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(240,236,230,0.4)',
            }}
          >
            Investor Presentation · 2026
          </span>
        </div>
        <h1
          style={{
            fontSize: '7.5vw',
            fontWeight: 800,
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            color: '#f0ece6',
            maxWidth: '14ch',
            marginBottom: '3vh',
          }}
        >
          The Governed
          <br />
          <span style={{ color: '#0cc8d9' }}>Decision</span>
          <br />
          Layer.
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.8vw',
            fontWeight: 300,
            color: 'rgba(240,236,230,0.55)',
            maxWidth: '38ch',
            lineHeight: 1.5,
          }}
        >
          The infrastructure between AI inference and
          <br />
          consequential action — governed, proven, traceable.
        </p>
        <div style={{ display: 'flex', gap: '3vw', marginTop: '4vh' }}>
          <div>
            <div
              style={{
                fontSize: '1.1vw',
                fontWeight: 300,
                color: 'rgba(240,236,230,0.35)',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.08em',
              }}
            >
              Est. 2023
            </div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div
              style={{
                fontSize: '1.1vw',
                fontWeight: 300,
                color: 'rgba(240,236,230,0.35)',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.08em',
              }}
            >
              Washington D.C. · London · Singapore
            </div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div
              style={{
                fontSize: '1.1vw',
                fontWeight: 300,
                color: 'rgba(240,236,230,0.35)',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.08em',
              }}
            >
              Owner-Operated
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '5vh',
          right: '7vw',
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontSize: '1vw',
            color: 'rgba(240,236,230,0.2)',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '0.1em',
          }}
        >
          CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}
