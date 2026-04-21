export default function S09Ask() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, #070b10 0%, #0c1628 50%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(12,200,217,0.08) 0%, transparent 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '0.12vh',
          background:
            'linear-gradient(90deg, transparent, #0cc8d9 30%, rgba(12,200,217,0.3) 70%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '0.12vh',
          background:
            'linear-gradient(90deg, transparent, #0cc8d9 30%, rgba(12,200,217,0.3) 70%, transparent)',
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
        <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column' }}>
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
            Series A — The Ask
          </div>
          <div
            style={{
              fontSize: '3.8vw',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#f0ece6',
              marginBottom: '2.5vh',
            }}
          >
            Build the Market. Own the Category.
          </div>
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(12,200,217,0.08), rgba(12,200,217,0.03))',
              border: '1px solid rgba(12,200,217,0.25)',
              borderRadius: '0.8vw',
              padding: '3vh 2.5vw',
              marginBottom: '3vh',
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85vw',
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,230,0.35)',
                marginBottom: '1vh',
              }}
            >
              Seeking
            </div>
            <div
              style={{
                fontSize: '4vw',
                fontWeight: 800,
                color: '#0cc8d9',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                marginBottom: '1vh',
              }}
            >
              Series A
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.25vw',
                color: 'rgba(240,236,230,0.5)',
              }}
            >
              Targeting 3–5 design partner contracts before close. First customer validates the loop
              — and unlocks the category.
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.1vw',
              fontWeight: 400,
              color: 'rgba(240,236,230,0.35)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            "We're entering a $16.3B market at 24.7% CAGR, and no competitor instruments the
            complete signal-to-outcome chain with governance at every step."
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.8vh' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85vw',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(240,236,230,0.3)',
              marginBottom: '0.5vh',
            }}
          >
            Use of Funds
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.2vw',
              marginBottom: '1vh',
            }}
          >
            <div
              style={{
                background: 'rgba(12,200,217,0.05)',
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.7vw',
                padding: '2vh 1.8vw',
              }}
            >
              <div
                style={{
                  fontSize: '1.8vw',
                  fontWeight: 800,
                  color: '#0cc8d9',
                  marginBottom: '0.5vh',
                }}
              >
                60%
              </div>
              <div
                style={{
                  fontSize: '1.05vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.4vh',
                }}
              >
                Engineering Team
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  color: 'rgba(240,236,230,0.4)',
                }}
              >
                First 3 core hires: backend, frontend/mobile, DevSecOps
              </div>
            </div>
            <div
              style={{
                background: 'rgba(12,200,217,0.05)',
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.7vw',
                padding: '2vh 1.8vw',
              }}
            >
              <div
                style={{
                  fontSize: '1.8vw',
                  fontWeight: 800,
                  color: '#0cc8d9',
                  marginBottom: '0.5vh',
                }}
              >
                25%
              </div>
              <div
                style={{
                  fontSize: '1.05vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.4vh',
                }}
              >
                Design Partner Program
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  color: 'rgba(240,236,230,0.4)',
                }}
              >
                3–5 paid pilots. Validate the loop. Build the revenue story.
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85vw',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(240,236,230,0.3)',
              marginBottom: '0.5vh',
            }}
          >
            First Three Hires
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
            <div
              style={{
                background: 'rgba(13,21,32,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0.6vw',
                padding: '1.5vh 1.8vw',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '1.05vw', fontWeight: 700, color: '#f0ece6' }}>
                  Backend / Infrastructure Engineer
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9vw',
                    color: 'rgba(240,236,230,0.4)',
                  }}
                >
                  Production hardening, AIS live feeds, SIEM connectors, Azure provisioning
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85vw',
                  color: '#0cc8d9',
                  background: 'rgba(12,200,217,0.08)',
                  padding: '0.3vh 0.7vw',
                  borderRadius: '0.3vw',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Hire 1
              </div>
            </div>
            <div
              style={{
                background: 'rgba(13,21,32,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0.6vw',
                padding: '1.5vh 1.8vw',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '1.05vw', fontWeight: 700, color: '#f0ece6' }}>
                  Frontend / Mobile Engineer
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9vw',
                    color: 'rgba(240,236,230,0.4)',
                  }}
                >
                  APEX App Store launch, UX polish, Mapbox/Stripe activation, domain app
                  completion
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85vw',
                  color: '#0cc8d9',
                  background: 'rgba(12,200,217,0.08)',
                  padding: '0.3vh 0.7vw',
                  borderRadius: '0.3vw',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Hire 2
              </div>
            </div>
            <div
              style={{
                background: 'rgba(13,21,32,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0.6vw',
                padding: '1.5vh 1.8vw',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '1.05vw', fontWeight: 700, color: '#f0ece6' }}>
                  Enterprise Sales / GTM Lead
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9vw',
                    color: 'rgba(240,236,230,0.4)',
                  }}
                >
                  Defense, maritime, and enterprise SaaS. Owns the design partner pipeline and first
                  ARR
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.85vw',
                  color: '#f5a623',
                  background: 'rgba(245,166,35,0.08)',
                  padding: '0.3vh 0.7vw',
                  borderRadius: '0.3vw',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Hire 3
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5vh',
              padding: '0 0.5vw',
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                color: 'rgba(240,236,230,0.35)',
              }}
            >
              szlholdings.com
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                color: 'rgba(240,236,230,0.35)',
              }}
            >
              Stephen Lutar, Founder
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1vw', color: '#0cc8d9' }}>
              CONDITIONALLY READY — Series A
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
