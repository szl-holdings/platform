export default function S08BusinessModel() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(155deg, #070b10 0%, #0c1428 55%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 55% 60% at 75% 50%, rgba(245,166,35,0.06) 0%, transparent 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '0.25vw',
          height: '100%',
          background: 'linear-gradient(180deg, transparent, #f5a623 30%, #f5a623 70%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          padding: '5.5vh 6vw',
          gap: '4vw',
        }}
      >
        <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9vw',
              fontWeight: 500,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#f5a623',
              marginBottom: '2vh',
            }}
          >
            Business Model
          </div>
          <div
            style={{
              fontSize: '3.5vw',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#f0ece6',
              marginBottom: '2vh',
            }}
          >
            Platform + Domain Pack
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.2vw',
              color: 'rgba(240,236,230,0.5)',
              lineHeight: 1.55,
              marginBottom: '3.5vh',
            }}
          >
            Enterprise annual contracts. Platform foundation plus per-domain commercial modules.
            Anchors between Vanta-tier (compliance SaaS) and Windward-tier (maritime intelligence).
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
            <div
              style={{
                background: 'rgba(245,166,35,0.07)',
                border: '1px solid rgba(245,166,35,0.2)',
                borderRadius: '0.6vw',
                padding: '2vh 2vw',
                borderLeft: '0.25vw solid #f5a623',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5vh',
                }}
              >
                <div style={{ fontSize: '1.1vw', fontWeight: 700, color: '#f0ece6' }}>
                  Platform License
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.2vw',
                    fontWeight: 700,
                    color: '#f5a623',
                  }}
                >
                  $50K–$150K
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.95vw',
                  color: 'rgba(240,236,230,0.4)',
                }}
              >
                Annual. Governance infrastructure, nine-step loop, Command portal, trust center
              </div>
            </div>
            <div
              style={{
                background: 'rgba(245,166,35,0.07)',
                border: '1px solid rgba(245,166,35,0.2)',
                borderRadius: '0.6vw',
                padding: '2vh 2vw',
                borderLeft: '0.25vw solid #f5a623',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5vh',
                }}
              >
                <div style={{ fontSize: '1.1vw', fontWeight: 700, color: '#f0ece6' }}>
                  Domain Pack
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.2vw',
                    fontWeight: 700,
                    color: '#f5a623',
                  }}
                >
                  $50K–$200K
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.95vw',
                  color: 'rgba(240,236,230,0.4)',
                }}
              >
                Annual per domain. PARAGON security modules, Vessels commercial intel, Terra property
                analysis
              </div>
            </div>
            <div
              style={{
                background: 'rgba(12,200,217,0.05)',
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.6vw',
                padding: '2vh 2vw',
                borderLeft: '0.25vw solid #0cc8d9',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5vh',
                }}
              >
                <div style={{ fontSize: '1.1vw', fontWeight: 700, color: '#f0ece6' }}>
                  Enterprise Total
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.2vw',
                    fontWeight: 700,
                    color: '#0cc8d9',
                  }}
                >
                  $50K–$500K
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.95vw',
                  color: 'rgba(240,236,230,0.4)',
                }}
              >
                Annual contract value. Enterprise-tier aspirations with commercial operator focus
              </div>
            </div>
          </div>
        </div>
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9vw',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(240,236,230,0.3)',
              marginBottom: '2vh',
            }}
          >
            Three-Phase Commercial Path
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
            <div
              style={{
                background: 'rgba(12,200,217,0.06)',
                border: '1px solid rgba(12,200,217,0.18)',
                borderRadius: '0.8vw',
                padding: '2.5vh 2.5vw',
                display: 'flex',
                gap: '2vw',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '3.5vw',
                  height: '3.5vw',
                  borderRadius: '50%',
                  background: 'rgba(12,200,217,0.12)',
                  border: '1px solid rgba(12,200,217,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '1.4vw', fontWeight: 800, color: '#0cc8d9' }}>1</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.2vw',
                    fontWeight: 700,
                    color: '#f0ece6',
                    marginBottom: '0.4vh',
                  }}
                >
                  Design Partners
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1vw',
                    color: 'rgba(240,236,230,0.45)',
                  }}
                >
                  3–5 enterprise organizations. Paid pilots at $25K–$75K. Validate decision loop in
                  real operational context.
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(245,166,35,0.05)',
                border: '1px solid rgba(245,166,35,0.15)',
                borderRadius: '0.8vw',
                padding: '2.5vh 2.5vw',
                display: 'flex',
                gap: '2vw',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '3.5vw',
                  height: '3.5vw',
                  borderRadius: '50%',
                  background: 'rgba(245,166,35,0.1)',
                  border: '1px solid rgba(245,166,35,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '1.4vw', fontWeight: 800, color: '#f5a623' }}>2</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.2vw',
                    fontWeight: 700,
                    color: '#f0ece6',
                    marginBottom: '0.4vh',
                  }}
                >
                  Domain Licensing
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1vw',
                    color: 'rgba(240,236,230,0.45)',
                  }}
                >
                  Single-vertical enterprise licenses. Vessel operators, security operations
                  centers, real estate firms.
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(240,236,230,0.03)',
                border: '1px solid rgba(240,236,230,0.08)',
                borderRadius: '0.8vw',
                padding: '2.5vh 2.5vw',
                display: 'flex',
                gap: '2vw',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '3.5vw',
                  height: '3.5vw',
                  borderRadius: '50%',
                  background: 'rgba(240,236,230,0.06)',
                  border: '1px solid rgba(240,236,230,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '1.4vw', fontWeight: 800, color: 'rgba(240,236,230,0.7)' }}>
                  3
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.2vw',
                    fontWeight: 700,
                    color: '#f0ece6',
                    marginBottom: '0.4vh',
                  }}
                >
                  Platform Licensing
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1vw',
                    color: 'rgba(240,236,230,0.45)',
                  }}
                >
                  Multi-domain enterprise platform contracts. Enterprise-tier value with Vanta-tier
                  sales motion for smaller buyers.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
