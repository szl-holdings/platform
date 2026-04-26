export default function S08DividerMoat() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #070b10 0%, #0d1b2e 50%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(12,200,217,0.1) 0%, transparent 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '7vw',
          right: '7vw',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(12,200,217,0.3), transparent)',
          transform: 'translateY(-50%)',
        }}
      />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1vw',
            fontWeight: 600,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#0cc8d9',
            marginBottom: '2vh',
          }}
        >
          Part Two
        </div>
        <h2
          style={{
            fontSize: '8vw',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#f0ece6',
            lineHeight: 0.95,
          }}
        >
          Why This
          <br />
          <span style={{ color: '#0cc8d9' }}>Wins.</span>
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.6vw',
            color: 'rgba(240,236,230,0.35)',
            marginTop: '3vh',
            fontWeight: 300,
          }}
        >
          Competitive differentiation · Architecture moat · Build evidence
        </p>
      </div>
    </div>
  );
}
