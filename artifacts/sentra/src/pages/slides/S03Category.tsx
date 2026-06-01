export default function S03Category() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(160deg, #070b10 0%, #0a1422 60%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 30% 60%, rgba(12,200,217,0.08) 0%, transparent 55%)',
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
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6vh 7vw',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9vw',
            fontWeight: 500,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#0cc8d9',
            marginBottom: '2vh',
          }}
        >
          Category
        </div>
        <div
          style={{
            fontSize: '4vw',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#f0ece6',
            marginBottom: '1.2vh',
          }}
        >
          Governed Decision Infrastructure
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.4vw',
            color: 'rgba(240,236,230,0.5)',
            maxWidth: '60vw',
            lineHeight: 1.55,
            marginBottom: '4vh',
          }}
        >
          The structural layer between signal detection and action execution. Every AI
          recommendation has a source, a confidence score, a policy gate, a decision record, and an
          outcome tracker.
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '2vw',
            marginBottom: '4vh',
          }}
        >
          <div
            style={{
              background: 'rgba(12,200,217,0.06)',
              border: '1px solid rgba(12,200,217,0.18)',
              borderRadius: '0.7vw',
              padding: '2.8vh 2.2vw',
            }}
          >
            <div
              style={{
                fontSize: '3.2vw',
                fontWeight: 800,
                color: '#0cc8d9',
                lineHeight: 1,
                marginBottom: '0.8vh',
              }}
            >
              $16.3B
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9vw',
                fontWeight: 500,
                color: 'rgba(240,236,230,0.45)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Market Today (2025)
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                color: 'rgba(240,236,230,0.3)',
                marginTop: '0.8vh',
              }}
            >
              Decision Intelligence — MarketsandMarkets
            </div>
          </div>
          <div
            style={{
              background: 'rgba(245,166,35,0.07)',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: '0.7vw',
              padding: '2.8vh 2.2vw',
            }}
          >
            <div
              style={{
                fontSize: '3.2vw',
                fontWeight: 800,
                color: '#f5a623',
                lineHeight: 1,
                marginBottom: '0.8vh',
              }}
            >
              24.7%
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9vw',
                fontWeight: 500,
                color: 'rgba(240,236,230,0.45)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              CAGR (2024–2030)
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                color: 'rgba(240,236,230,0.3)',
                marginTop: '0.8vh',
              }}
            >
              Fastest-growing infrastructure segment
            </div>
          </div>
          <div
            style={{
              background: 'rgba(12,200,217,0.06)',
              border: '1px solid rgba(12,200,217,0.18)',
              borderRadius: '0.7vw',
              padding: '2.8vh 2.2vw',
            }}
          >
            <div
              style={{
                fontSize: '3.2vw',
                fontWeight: 800,
                color: '#f0ece6',
                lineHeight: 1,
                marginBottom: '0.8vh',
              }}
            >
              $50.1B
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9vw',
                fontWeight: 500,
                color: 'rgba(240,236,230,0.45)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Market in 2030
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                color: 'rgba(240,236,230,0.3)',
                marginTop: '0.8vh',
              }}
            >
              Three times current value in 5 years
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(12,200,217,0.05), rgba(12,200,217,0.02))',
            border: '1px solid rgba(12,200,217,0.12)',
            borderRadius: '0.7vw',
            padding: '2.5vh 2.5vw',
            borderLeft: '0.3vw solid #0cc8d9',
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.35vw',
              fontWeight: 500,
              color: '#f0ece6',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            "This is the governance layer the AI action economy is missing. They've built what
            a vertically-integrated AI platform would achieve today — but for commercial operators instead of
            government."
          </div>
        </div>
      </div>
    </div>
  );
}
