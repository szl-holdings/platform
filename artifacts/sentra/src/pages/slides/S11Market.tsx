export default function S11Market() {
  const markets = [
    {
      domain: 'AI Governance & Trust',
      size: '$28B',
      growth: '+38% CAGR',
      note: 'Enterprise AI audit and explainability',
      color: '#0cc8d9',
    },
    {
      domain: 'Security Operations (SOC/XDR)',
      size: '$31B',
      growth: '+14% CAGR',
      note: 'Governed threat detection and response',
      color: '#c9b787',
    },
    {
      domain: 'Maritime Intelligence',
      size: '$4.2B',
      growth: '+11% CAGR',
      note: 'Fleet command, AIS, sanctions compliance',
      color: '#8a8a8a',
    },
    {
      domain: 'Legal Tech',
      size: '$35B',
      growth: '+20% CAGR',
      note: 'AI-governed matter and litigation management',
      color: '#c9b787',
    },
    {
      domain: 'Commercial Real Estate Tech',
      size: '$14B',
      growth: '+16% CAGR',
      note: 'Distress detection and governed underwriting',
      color: '#c9b787',
    },
    {
      domain: 'Cloud Governance',
      size: '$22B',
      growth: '+24% CAGR',
      note: 'Multi-cloud policy and infrastructure compliance',
      color: '#c9b787',
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
            Market Opportunity
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2vw', marginBottom: '3.5vh' }}>
          <h2
            style={{
              fontSize: '3.5vw',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#f0ece6',
              lineHeight: 1.05,
            }}
          >
            Six High-Value Markets
          </h2>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '2vw',
              color: '#f5a623',
              fontWeight: 700,
            }}
          >
            $134B+ Combined TAM
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.6vh',
            height: '65vh',
            justifyContent: 'flex-start',
          }}
        >
          {markets.map((m) => (
            <div
              key={m.domain}
              style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1fr 2.5fr',
                alignItems: 'center',
                gap: '2vw',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '1.6vh',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw' }}>
                <div
                  style={{
                    width: '0.4vw',
                    height: '3vh',
                    background: m.color,
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: '1.5vw', fontWeight: 600, color: '#f0ece6' }}>
                  {m.domain}
                </div>
              </div>
              <div
                style={{
                  fontSize: '2vw',
                  fontWeight: 800,
                  color: '#f5a623',
                  letterSpacing: '-0.02em',
                }}
              >
                {m.size}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.2vw',
                  color: '#0cc8d9',
                  fontWeight: 500,
                }}
              >
                {m.growth}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.15vw',
                  color: 'rgba(240,236,230,0.4)',
                }}
              >
                {m.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
