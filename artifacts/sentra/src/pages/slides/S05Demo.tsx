export default function S05Demo() {
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
            'radial-gradient(ellipse 60% 60% at 70% 50%, rgba(12,200,217,0.07) 0%, transparent 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          padding: '5.5vh 6vw',
          gap: '4vw',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '0 0 32%', display: 'flex', flexDirection: 'column' }}>
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
            Decision Theater
          </div>
          <div
            style={{
              fontSize: '3.5vw',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#f0ece6',
              marginBottom: '1.8vh',
            }}
          >
            The Platform Is Real
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
            This pitch is served from within the platform itself. The screenshot on the right is
            Decision Theater — a live, governed decision in the system.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
              <div
                style={{
                  width: '0.45vw',
                  height: '0.45vw',
                  borderRadius: '50%',
                  background: '#0cc8d9',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.05vw',
                  color: 'rgba(240,236,230,0.6)',
                }}
              >
                34 shared libraries — production monorepo
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
              <div
                style={{
                  width: '0.45vw',
                  height: '0.45vw',
                  borderRadius: '50%',
                  background: '#0cc8d9',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.05vw',
                  color: 'rgba(240,236,230,0.6)',
                }}
              >
                569 typed database tables (Drizzle ORM)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
              <div
                style={{
                  width: '0.45vw',
                  height: '0.45vw',
                  borderRadius: '50%',
                  background: '#0cc8d9',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.05vw',
                  color: 'rgba(240,236,230,0.6)',
                }}
              >
                OIDC PKCE auth + RBAC + org scoping
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
              <div
                style={{
                  width: '0.45vw',
                  height: '0.45vw',
                  borderRadius: '50%',
                  background: '#f5a623',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.05vw',
                  color: 'rgba(240,236,230,0.6)',
                }}
              >
                Immutable audit trail on every decision
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
              <div
                style={{
                  width: '0.45vw',
                  height: '0.45vw',
                  borderRadius: '50%',
                  background: '#f5a623',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.05vw',
                  color: 'rgba(240,236,230,0.6)',
                }}
              >
                Azure Bicep IaC — enterprise-ready infra
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              background: '#0a1220',
              border: '1px solid rgba(12,200,217,0.25)',
              borderRadius: '0.8vw',
              overflow: 'hidden',
              boxShadow: '0 0 4vw rgba(12,200,217,0.08), 0 0 0 1px rgba(12,200,217,0.1)',
            }}
          >
            <div
              style={{
                background: '#0d1828',
                borderBottom: '1px solid rgba(12,200,217,0.12)',
                padding: '1.2vh 1.5vw',
                display: 'flex',
                alignItems: 'center',
                gap: '1vw',
              }}
            >
              <div style={{ display: 'flex', gap: '0.4vw' }}>
                <div
                  style={{
                    width: '0.7vw',
                    height: '0.7vw',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                  }}
                />
                <div
                  style={{
                    width: '0.7vw',
                    height: '0.7vw',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                  }}
                />
                <div
                  style={{
                    width: '0.7vw',
                    height: '0.7vw',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '0.3vw',
                  padding: '0.4vh 1vw',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.75vw',
                  color: 'rgba(240,236,230,0.3)',
                }}
              >
                szlholdings.com/decisions/DEC-2026-0347
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.75vw',
                  color: '#0cc8d9',
                  fontWeight: 600,
                }}
              >
                Decision Theater
              </div>
            </div>
            <div
              style={{
                padding: '1.8vh 1.8vw',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2vh',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75vw',
                      color: 'rgba(240,236,230,0.3)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: '0.3vh',
                    }}
                  >
                    Decision Record
                  </div>
                  <div style={{ fontSize: '1vw', fontWeight: 700, color: '#f0ece6' }}>
                    Vessel Diversion — MV Horizon Star
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5vw' }}>
                  <div
                    style={{
                      background: 'rgba(74,222,128,0.12)',
                      border: '1px solid rgba(74,222,128,0.3)',
                      borderRadius: '0.3vw',
                      padding: '0.3vh 0.7vw',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75vw',
                      color: '#c9b787',
                      fontWeight: 600,
                    }}
                  >
                    APPROVED
                  </div>
                  <div
                    style={{
                      background: 'rgba(12,200,217,0.1)',
                      border: '1px solid rgba(12,200,217,0.2)',
                      borderRadius: '0.3vw',
                      padding: '0.3vh 0.7vw',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75vw',
                      color: '#0cc8d9',
                      fontWeight: 600,
                    }}
                  >
                    DEC-2026-0347
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.8vw',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.4vw',
                    padding: '1.2vh 1vw',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.4vh',
                    }}
                  >
                    Signal Source
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.85vw',
                      color: '#f0ece6',
                      fontWeight: 600,
                    }}
                  >
                    AIS Anomaly Engine
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      marginTop: '0.2vh',
                    }}
                  >
                    Conf: 94.2%
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.4vw',
                    padding: '1.2vh 1vw',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.4vh',
                    }}
                  >
                    Risk Simulation
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.85vw',
                      color: '#f5a623',
                      fontWeight: 600,
                    }}
                  >
                    P(loss): 8.1%
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      marginTop: '0.2vh',
                    }}
                  >
                    10K Monte Carlo runs
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.4vw',
                    padding: '1.2vh 1vw',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.4vh',
                    }}
                  >
                    Policy Gate
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.85vw',
                      color: '#c9b787',
                      fontWeight: 600,
                    }}
                  >
                    CLEARED
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      marginTop: '0.2vh',
                    }}
                  >
                    VP Operations
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6vw', alignItems: 'center' }}>
                {[
                  'Signal',
                  'Context',
                  'Recommend',
                  'Simulate',
                  'Policy',
                  'Execute',
                  'Proof',
                  'Outcome',
                  'Learning',
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: i <= 6 ? 'rgba(12,200,217,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${i <= 6 ? 'rgba(12,200,217,0.35)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '0.25vw',
                      padding: '0.5vh 0.2vw',
                      textAlign: 'center',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.58vw',
                      color: i <= 6 ? '#0cc8d9' : 'rgba(240,236,230,0.2)',
                      fontWeight: i <= 6 ? 600 : 400,
                    }}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8vw' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.4vw',
                    padding: '1.2vh 1vw',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5vh',
                    }}
                  >
                    Proof Chain
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75vw',
                      color: 'rgba(240,236,230,0.5)',
                      lineHeight: 1.4,
                    }}
                  >
                    SHA-256: a7f3c9...d2e1 — Immutable. Timestamped. Exportable.
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.4vw',
                    padding: '1.2vh 1vw',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.7vw',
                      color: 'rgba(240,236,230,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5vh',
                    }}
                  >
                    Outcome Tracking
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75vw',
                      color: 'rgba(240,236,230,0.5)',
                      lineHeight: 1.4,
                    }}
                  >
                    Predicted: $420K saved — Actual: $387K — Variance: -7.9%
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(12,200,217,0.04)',
                borderTop: '1px solid rgba(12,200,217,0.1)',
                padding: '0.8vh 1.8vw',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.7vw',
                  color: 'rgba(240,236,230,0.25)',
                }}
              >
                Decision receipt available for export — compliance-ready PDF
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.7vw',
                  color: '#0cc8d9',
                  fontWeight: 600,
                }}
              >
                Governed Autonomy — Sentra
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
