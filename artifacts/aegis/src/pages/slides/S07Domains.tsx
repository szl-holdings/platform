export default function S07Domains() {
  const domains = [
    {
      name: 'Aegis',
      cat: 'Security & Defense',
      color: '#3b82f6',
      desc: 'SOC command, threat intel, MITRE ATT&CK, governed incident response',
    },
    {
      name: 'Vessels',
      cat: 'Maritime Intelligence',
      color: '#0ea5e9',
      desc: 'AIS telemetry, fleet command, sanctions screening, voyage economics',
    },
    {
      name: 'Terra',
      cat: 'Real Estate Intelligence',
      color: '#22c55e',
      desc: 'Distress pipeline, ownership graph, deal flow, governed underwriting',
    },
    {
      name: 'PRISM Counsel',
      cat: 'Legal Intelligence',
      color: '#a78bfa',
      desc: 'Matter twins, deadline tracking, governed demand workflows',
    },
    {
      name: 'Carlota Jo',
      cat: 'Premium Advisory',
      color: '#f472b6',
      desc: 'UHNW client intake, managed delivery, audit-grade document handling',
    },
    {
      name: 'IMPERIUM',
      cat: 'Cloud Sovereignty',
      color: '#fb923c',
      desc: 'Multi-cloud governance, policy enforcement, infrastructure audit trail',
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
            Domain Packs
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
          Six High-Consequence Verticals
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '2vw',
            height: '62vh',
          }}
        >
          {domains.map((d) => (
            <div
              key={d.name}
              style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.8vw',
                padding: '2.8vh 2.2vw',
                background: 'rgba(13,21,32,0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1vh',
                borderTop: `0.3vh solid ${d.color}`,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ fontSize: '1.8vw', fontWeight: 800, color: '#f0ece6' }}>{d.name}</div>
                <div
                  style={{
                    width: '0.6vw',
                    height: '0.6vw',
                    borderRadius: '50%',
                    background: d.color,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1vw',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: d.color,
                }}
              >
                {d.cat}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.2vw',
                  fontWeight: 400,
                  color: 'rgba(240,236,230,0.5)',
                  lineHeight: 1.5,
                }}
              >
                {d.desc}
              </div>
              <div
                style={{
                  marginTop: 'auto',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1vw',
                  color: 'rgba(240,236,230,0.2)',
                  fontStyle: 'italic',
                }}
              >
                Inherits full governance primitive stack
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
