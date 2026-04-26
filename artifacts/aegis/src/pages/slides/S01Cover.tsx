const _base = import.meta.env.BASE_URL;

export default function S01Cover() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, #070b10 0%, #0c1628 55%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 65% 40%, rgba(12,200,217,0.09) 0%, transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55vw',
          height: '100%',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 4vh, rgba(12,200,217,0.03) 4vh, rgba(12,200,217,0.03) 4.06vh), repeating-linear-gradient(90deg, transparent, transparent 5vw, rgba(12,200,217,0.03) 5vw, rgba(12,200,217,0.03) 5.08vw)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '0.25vw',
          height: '100%',
          background:
            'linear-gradient(180deg, transparent 0%, #0cc8d9 30%, #0cc8d9 70%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '60%',
          height: '0.12vh',
          background:
            'linear-gradient(90deg, #0cc8d9 0%, rgba(12,200,217,0.2) 70%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '6vh',
          right: '5vw',
          width: '0.12vw',
          height: '30vh',
          background: 'linear-gradient(180deg, transparent, rgba(245,166,35,0.4), transparent)',
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
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1vw',
            fontWeight: 500,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#0cc8d9',
            marginBottom: '3vh',
          }}
        >
          Series A — 2026
        </div>
        <div
          style={{
            fontSize: '6.5vw',
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: '#f0ece6',
            marginBottom: '2.5vh',
            maxWidth: '70vw',
          }}
        >
          Governed
          <br />
          Decision
          <br />
          Infrastructure
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.6vw',
            fontWeight: 400,
            color: 'rgba(240,236,230,0.55)',
            maxWidth: '46vw',
            lineHeight: 1.55,
            marginBottom: '6vh',
          }}
        >
          The structural layer between signal detection and action execution — where every AI
          recommendation earns a source, an approval, and an outcome record.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.5vw',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1.2vw',
                fontWeight: 700,
                color: '#f0ece6',
                letterSpacing: '0.02em',
              }}
            >
              Aegis
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 400,
                color: 'rgba(240,236,230,0.4)',
                marginTop: '0.3vh',
              }}
            >
              Stephen Lutar, Founder
            </div>
          </div>
          <div
            style={{
              width: '0.08vw',
              height: '4vh',
              background: 'rgba(255,255,255,0.12)',
            }}
          />
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1vw',
              color: 'rgba(240,236,230,0.35)',
            }}
          >
            Washington D.C. · London · Singapore
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: '6vw',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5vh',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.8vw', fontWeight: 700, color: '#0cc8d9', lineHeight: 1 }}>
            $16.3B
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85vw',
              color: 'rgba(240,236,230,0.35)',
              marginTop: '0.4vh',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Market 2025
          </div>
        </div>
        <div
          style={{
            width: '4vw',
            height: '0.08vh',
            background: 'rgba(255,255,255,0.08)',
            alignSelf: 'flex-end',
          }}
        />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.8vw', fontWeight: 700, color: '#f5a623', lineHeight: 1 }}>
            24.7%
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85vw',
              color: 'rgba(240,236,230,0.35)',
              marginTop: '0.4vh',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            CAGR
          </div>
        </div>
        <div
          style={{
            width: '4vw',
            height: '0.08vh',
            background: 'rgba(255,255,255,0.08)',
            alignSelf: 'flex-end',
          }}
        />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.8vw', fontWeight: 700, color: '#f0ece6', lineHeight: 1 }}>
            $50.1B
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85vw',
              color: 'rgba(240,236,230,0.35)',
              marginTop: '0.4vh',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Market 2030
          </div>
        </div>
      </div>
    </div>
  );
}
