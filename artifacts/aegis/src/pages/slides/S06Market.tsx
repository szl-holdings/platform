export default function S06Market() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: '#070b10',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 50% 60% at 80% 30%, rgba(12,200,217,0.06) 0%, transparent 55%)',
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
        <div
          style={{
            flex: '0 0 30%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
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
            Market
          </div>
          <div
            style={{
              fontSize: '3.5vw',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#f0ece6',
              marginBottom: '3vh',
            }}
          >
            Why SZL Wins
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8vh',
              marginBottom: '3.5vh',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1vw',
                  color: 'rgba(240,236,230,0.5)',
                }}
              >
                2025
              </div>
              <div style={{ fontSize: '1.8vw', fontWeight: 800, color: '#0cc8d9' }}>$16.3B</div>
            </div>
            <div
              style={{
                height: '0.5vh',
                background: 'linear-gradient(90deg, #0cc8d9, rgba(12,200,217,0.3))',
                borderRadius: '0.5vh',
                width: '60%',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.8vh',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1vw',
                  color: 'rgba(240,236,230,0.5)',
                }}
              >
                2030
              </div>
              <div style={{ fontSize: '1.8vw', fontWeight: 800, color: '#f5a623' }}>$50.1B</div>
            </div>
            <div
              style={{
                height: '0.5vh',
                background: 'linear-gradient(90deg, #f5a623, rgba(245,166,35,0.3))',
                borderRadius: '0.5vh',
                width: '100%',
              }}
            />
          </div>
          <div
            style={{
              background: 'rgba(12,200,217,0.06)',
              border: '1px solid rgba(12,200,217,0.15)',
              borderRadius: '0.6vw',
              padding: '2vh 1.5vw',
            }}
          >
            <div
              style={{ fontSize: '1vw', fontWeight: 700, color: '#0cc8d9', marginBottom: '0.5vh' }}
            >
              Five Unique Capabilities
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85vw',
                color: 'rgba(240,236,230,0.4)',
                lineHeight: 1.5,
              }}
            >
              No named competitor implements all five. The moat is architectural.
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85vw',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(240,236,230,0.3)',
              marginBottom: '1.5vh',
            }}
          >
            Competitive Feature Matrix
          </div>
          <div
            style={{
              background: 'rgba(13,21,32,0.8)',
              border: '1px solid rgba(12,200,217,0.12)',
              borderRadius: '0.8vw',
              overflow: 'hidden',
              marginBottom: '2vh',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr',
                background: 'rgba(12,200,217,0.08)',
                borderBottom: '1px solid rgba(12,200,217,0.12)',
                padding: '1.2vh 1.5vw',
                gap: '0.5vw',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  fontWeight: 600,
                  color: 'rgba(240,236,230,0.5)',
                }}
              >
                Capability
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  fontWeight: 600,
                  color: 'rgba(240,236,230,0.5)',
                  textAlign: 'center',
                }}
              >
                Enterprise AI platforms
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  fontWeight: 600,
                  color: 'rgba(240,236,230,0.5)',
                  textAlign: 'center',
                }}
              >
                Anduril
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  fontWeight: 600,
                  color: 'rgba(240,236,230,0.5)',
                  textAlign: 'center',
                }}
              >
                Vanta
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  fontWeight: 600,
                  color: 'rgba(240,236,230,0.5)',
                  textAlign: 'center',
                }}
              >
                Databricks
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9vw',
                  fontWeight: 600,
                  color: '#0cc8d9',
                  textAlign: 'center',
                }}
              >
                SZL
              </div>
            </div>
            {[
              ['Signal ingestion + cross-domain correlation', '✓', '✓', '–', '✓', '✓'],
              ['Risk simulation inline with decisions', '–', '–', '–', '–', '✓'],
              ['Policy gate with human approval', '~', '✓', '✓', '–', '✓'],
              ['Outcome tracking with variance', '–', '–', '–', '–', '✓'],
              ['Closed-loop confidence calibration', '–', '–', '–', '–', '✓'],
            ].map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr',
                  borderBottom: ri < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  padding: '1vh 1.5vw',
                  gap: '0.5vw',
                  background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.95vw',
                    color: 'rgba(240,236,230,0.65)',
                  }}
                >
                  {row[0]}
                </div>
                {[row[1], row[2], row[3], row[4]].map((cell, ci) => (
                  <div
                    key={ci}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.1vw',
                      color:
                        cell === '✓'
                          ? '#4ade80'
                          : cell === '~'
                            ? '#f5a623'
                            : 'rgba(240,236,230,0.2)',
                    }}
                  >
                    {cell}
                  </div>
                ))}
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '1.1vw',
                    color: '#0cc8d9',
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.2vw' }}>
            <div
              style={{
                background: 'rgba(12,200,217,0.05)',
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.6vw',
                padding: '1.5vh 1.2vw',
              }}
            >
              <div
                style={{
                  fontSize: '0.9vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.4vh',
                }}
              >
                Defense / Security
              </div>
              <div style={{ fontSize: '1.5vw', fontWeight: 800, color: '#0cc8d9' }}>$180B+</div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8vw',
                  color: 'rgba(240,236,230,0.3)',
                }}
              >
                global market
              </div>
            </div>
            <div
              style={{
                background: 'rgba(12,200,217,0.05)',
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.6vw',
                padding: '1.5vh 1.2vw',
              }}
            >
              <div
                style={{
                  fontSize: '0.9vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.4vh',
                }}
              >
                Maritime Intelligence
              </div>
              <div style={{ fontSize: '1.5vw', fontWeight: 800, color: '#0cc8d9' }}>$14B+</div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8vw',
                  color: 'rgba(240,236,230,0.3)',
                }}
              >
                intelligence market
              </div>
            </div>
            <div
              style={{
                background: 'rgba(12,200,217,0.05)',
                border: '1px solid rgba(12,200,217,0.15)',
                borderRadius: '0.6vw',
                padding: '1.5vh 1.2vw',
              }}
            >
              <div
                style={{
                  fontSize: '0.9vw',
                  fontWeight: 700,
                  color: '#f0ece6',
                  marginBottom: '0.4vh',
                }}
              >
                Real Estate Data
              </div>
              <div style={{ fontSize: '1.5vw', fontWeight: 800, color: '#0cc8d9' }}>$16B+</div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8vw',
                  color: 'rgba(240,236,230,0.3)',
                }}
              >
                data market
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
