export default function S11AlloyFoundry() {
  const layers = [
    {
      label: 'MODELS',
      items: ['Search & task-filter', 'HF Hub integration', 'Direct model cards'],
      color: '#c9b787',
    },
    {
      label: 'DATASETS',
      items: ['Live data preview', 'Column-level inspection', 'Version tracking'],
      color: '#3b82f6',
    },
    {
      label: 'SPACES',
      items: ['Embedded iframe viewer', 'SDK detection', 'One-click deploy'],
      color: '#10b981',
    },
    {
      label: 'INFERENCE',
      items: ['Model selector from Hub', 'Latency tracking', 'Governed execution'],
      color: '#8b5cf6',
    },
  ];

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
            'radial-gradient(ellipse 55% 55% at 70% 50%, rgba(201,183,135,0.05) 0%, transparent 55%)',
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
        <div style={{ flex: '0 0 34%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9vw',
              fontWeight: 500,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#c9b787',
              marginBottom: '2vh',
            }}
          >
            Alloy Foundry
          </div>
          <div
            style={{
              fontSize: '3.2vw',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#f0ece6',
              marginBottom: '2vh',
            }}
          >
            The Model &amp; Data Layer
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.15vw',
              color: 'rgba(240,236,230,0.5)',
              lineHeight: 1.55,
            }}
          >
            Foundry delegates to the Hugging Face Hub API — same contract, same endpoints,
            governed by the same nine-step loop. Every model invocation, dataset access,
            and space deployment is hashed, versioned, and auditable.
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5vw' }}>
          {layers.map((layer, i) => (
            <div
              key={i}
              style={{
                background: 'linear-gradient(145deg, rgba(13,21,32,0.9), rgba(7,11,16,0.8))',
                border: '1px solid rgba(201,183,135,0.12)',
                borderRadius: '0.6vw',
                padding: '2.2vh 2vw',
                display: 'flex',
                alignItems: 'center',
                gap: '2vw',
                borderLeft: `0.25vw solid ${layer.color}`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8vw',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: layer.color,
                  width: '8vw',
                  flexShrink: 0,
                }}
              >
                {layer.label}
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', flexWrap: 'wrap' }}>
                {layer.items.map((item, j) => (
                  <span
                    key={j}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.95vw',
                      color: 'rgba(240,236,230,0.55)',
                      padding: '0.4vh 0.7vw',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '0.3vw',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
