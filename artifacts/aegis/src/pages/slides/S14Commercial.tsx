export default function S14Commercial() {
  const left = [
    {
      label: 'What we are building',
      items: [
        'The governance primitive stack for enterprise AI',
        'Six domain packs in high-consequence industries',
        'A Proof Chain that is the compliance product',
        'An Outcome Graph that calibrates AI continuously',
      ],
    },
    {
      label: 'What we are offering',
      items: [
        'Design-partner access — direct founder engagement',
        'Co-development with a founding technical team',
        'First-mover positioning in governed AI infrastructure',
        'Transparent roadmap and no black-box roadblocks',
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
          background: 'linear-gradient(90deg, transparent, #f5a623, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at 80% 30%, rgba(12,200,217,0.05) 0%, transparent 50%)',
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
              color: '#f5a623',
            }}
          >
            Commercial Path
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
          The Founder Runs Every Conversation.
        </h2>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5vw', height: '60vh' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3vh' }}>
            {left.map((section) => (
              <div key={section.label}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1vw',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#0cc8d9',
                    marginBottom: '1.5vh',
                  }}
                >
                  {section.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2vw' }}
                    >
                      <div
                        style={{
                          width: '0.4vw',
                          height: '0.4vw',
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
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5vh' }}>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#f5a623',
                marginBottom: '0.5vh',
              }}
            >
              Why now
            </div>
            <div
              style={{
                border: '1px solid rgba(245,166,35,0.2)',
                borderRadius: '0.8vw',
                padding: '2.8vh 2.5vw',
                background: 'rgba(245,166,35,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '1.6vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '1.2vh',
                  lineHeight: 1.2,
                }}
              >
                Regulators are moving
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25vw',
                  color: 'rgba(240,236,230,0.55)',
                  lineHeight: 1.5,
                }}
              >
                EU AI Act, SEC AI disclosure rules, and DORA mandates are creating an explainability
                gap that existing tools cannot fill. The infrastructure has to exist before the
                window closes.
              </div>
            </div>
            <div
              style={{
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.8vw',
                padding: '2.8vh 2.5vw',
                background: 'rgba(12,200,217,0.02)',
              }}
            >
              <div
                style={{
                  fontSize: '1.6vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '1.2vh',
                  lineHeight: 1.2,
                }}
              >
                Design-partner stage
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.25vw',
                  color: 'rgba(240,236,230,0.55)',
                  lineHeight: 1.5,
                }}
              >
                No fabricated logos, no inflated metrics. The architecture is real, the products are
                built, and the founder runs every conversation personally.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
