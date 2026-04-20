export default function S02SeriesProblem() {
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
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '0.12vh',
          background:
            'linear-gradient(90deg, transparent, #f5a623 30%, rgba(245,166,35,0.3) 70%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '7vh 7vw',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9vw',
            fontWeight: 500,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#f5a623',
            marginBottom: '2.5vh',
          }}
        >
          The Problem
        </div>
        <div
          style={{
            fontSize: '4.2vw',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#f0ece6',
            marginBottom: '1.5vh',
          }}
        >
          AI Without Accountability
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.5vw',
            fontWeight: 400,
            color: 'rgba(240,236,230,0.5)',
            marginBottom: '5vh',
            maxWidth: '55vw',
          }}
        >
          High-consequence decisions happen every day with no source attribution, no human approval
          gate, and no outcome record.
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '2vw',
            flex: 1,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(245,166,35,0.08), rgba(245,166,35,0.03))',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: '0.8vw',
              padding: '3.5vh 2.5vw',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: '3vw',
                fontWeight: 800,
                color: '#f5a623',
                lineHeight: 1,
                marginBottom: '2vh',
              }}
            >
              01
            </div>
            <div
              style={{
                fontSize: '1.5vw',
                fontWeight: 700,
                color: '#f0ece6',
                marginBottom: '1.5vh',
                lineHeight: 1.2,
              }}
            >
              No Source Attribution
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.15vw',
                fontWeight: 400,
                color: 'rgba(240,236,230,0.5)',
                lineHeight: 1.5,
              }}
            >
              AI outputs recommendations with no link to the signal, the model, or the confidence
              basis. Operators act on black-box outputs.
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(245,166,35,0.08), rgba(245,166,35,0.03))',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: '0.8vw',
              padding: '3.5vh 2.5vw',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: '3vw',
                fontWeight: 800,
                color: '#f5a623',
                lineHeight: 1,
                marginBottom: '2vh',
              }}
            >
              02
            </div>
            <div
              style={{
                fontSize: '1.5vw',
                fontWeight: 700,
                color: '#f0ece6',
                marginBottom: '1.5vh',
                lineHeight: 1.2,
              }}
            >
              No Approval Gate
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.15vw',
                fontWeight: 400,
                color: 'rgba(240,236,230,0.5)',
                lineHeight: 1.5,
              }}
            >
              Autonomous workflows execute without human review. Policy violations are discovered
              after the fact — in audit logs, not before action.
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(245,166,35,0.08), rgba(245,166,35,0.03))',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: '0.8vw',
              padding: '3.5vh 2.5vw',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: '3vw',
                fontWeight: 800,
                color: '#f5a623',
                lineHeight: 1,
                marginBottom: '2vh',
              }}
            >
              03
            </div>
            <div
              style={{
                fontSize: '1.5vw',
                fontWeight: 700,
                color: '#f0ece6',
                marginBottom: '1.5vh',
                lineHeight: 1.2,
              }}
            >
              No Outcome Record
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.15vw',
                fontWeight: 400,
                color: 'rgba(240,236,230,0.5)',
                lineHeight: 1.5,
              }}
            >
              Decisions are not tracked against results. AI confidence cannot improve. The system
              makes the same mistakes, at scale, indefinitely.
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: '3.5vh',
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.3vw',
            fontWeight: 500,
            color: 'rgba(240,236,230,0.35)',
            fontStyle: 'italic',
          }}
        >
          "Impressive demo, but where is the governance? Who is accountable when the AI is wrong?"
        </div>
      </div>
    </div>
  );
}
