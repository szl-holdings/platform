import { useState } from 'react';

/**
 * AegisNewsletterWidget — intentionally standalone (not using the shared
 * NewsletterSubscribe component from @szl-holdings/shared-ui).
 *
 * Reason: PARAGON is a slide deck rendered at full viewport size. All layout
 * and typography use viewport-relative units (vw/vh) to maintain proportional
 * sizing across screen dimensions — a requirement that Tailwind-based shared
 * components cannot satisfy. The API contract (POST /api/newsletter/subscribe
 * with { email, utm_source }) is identical; only the presentation layer differs.
 */
function AegisNewsletterWidget() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), utm_source: 'aegis' }),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        style={{
          fontSize: '0.7vw',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(245,166,35,0.6)',
          marginBottom: '0.6vh',
        }}
      >
        SZL Command Newsletter
      </div>
      <div
        style={{
          fontSize: '1vw',
          color: 'rgba(240,236,230,0.55)',
          marginBottom: '1.2vh',
          lineHeight: 1.3,
        }}
      >
        Governed intelligence, direct to your inbox.
      </div>
      {status === 'success' ? (
        <div
          style={{
            fontSize: '0.85vw',
            color: '#c9b787',
            padding: '0.5vh 1vw',
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '0.3vw',
          }}
        >
          Subscribed — check your inbox to confirm.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: '0.5vw' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={status === 'loading'}
            style={{
              flex: 1,
              padding: '0.5vh 0.8vw',
              background: 'rgba(10,20,35,0.7)',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: '0.3vw',
              color: '#f0ece6',
              fontSize: '0.85vw',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(245,166,35,0.5)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(245,166,35,0.2)';
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            style={{
              padding: '0.5vh 1vw',
              background: 'rgba(245,166,35,0.75)',
              border: 'none',
              borderRadius: '0.3vw',
              color: '#07090d',
              fontWeight: 700,
              fontSize: '0.75vw',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {status === 'loading' ? '…' : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <div style={{ fontSize: '0.75vw', color: 'rgba(255,100,100,0.7)', marginTop: '0.4vh' }}>
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  );
}

export default function S15Closing() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #070b10 0%, #0d1b2e 50%, #070b10 100%)',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at 30% 60%, rgba(12,200,217,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(245,166,35,0.04) 0%, transparent 50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '0.3vw',
          height: '100%',
          background: 'linear-gradient(180deg, transparent, #0cc8d9 40%, #0cc8d9 60%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '0.15vh',
          background:
            'linear-gradient(90deg, #0cc8d9 0%, rgba(12,200,217,0.3) 60%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '7vh 7vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: '4vh' }}>
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
            PARAGON
          </span>
        </div>
        <h2
          style={{
            fontSize: '5.5vw',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f0ece6',
            lineHeight: 1.0,
            maxWidth: '22ch',
            marginBottom: '4vh',
          }}
        >
          Governed Autonomy
          <br />
          for High-Consequence
          <br />
          <span style={{ color: '#0cc8d9' }}>Operations.</span>
        </h2>
        <div style={{ display: 'flex', gap: '4vw', alignItems: 'flex-start', marginBottom: '5vh' }}>
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,230,0.3)',
                marginBottom: '0.8vh',
              }}
            >
              Website
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.5vw', color: '#f0ece6' }}>
              szlholdings.com
            </div>
          </div>
          <div
            style={{ width: '1px', background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }}
          />
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,230,0.3)',
                marginBottom: '0.8vh',
              }}
            >
              Offices
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.5vw', color: '#f0ece6' }}>
              Washington D.C. · London · Singapore
            </div>
          </div>
          <div
            style={{ width: '1px', background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }}
          />
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1vw',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,230,0.3)',
                marginBottom: '0.8vh',
              }}
            >
              Stage
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.5vw', color: '#f0ece6' }}>
              Design Partner · Owner-Operated
            </div>
          </div>
        </div>
        <div
          style={{
            border: '1px solid rgba(12,200,217,0.15)',
            borderRadius: '0.6vw',
            padding: '2vh 2.5vw',
            background: 'rgba(12,200,217,0.03)',
            display: 'inline-block',
            maxWidth: '55ch',
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.3vw',
              color: 'rgba(240,236,230,0.5)',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            "Every consequential decision follows the same nine-step loop: signal, context,
            recommendation, simulation, policy, execution, proof, outcome, learning. Governance is
            an architecture primitive, not a compliance afterthought."
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '5vh',
          left: '7vw',
          maxWidth: '28vw',
        }}
      >
        <AegisNewsletterWidget />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '5vh',
          right: '7vw',
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1vw',
            color: 'rgba(240,236,230,0.15)',
            letterSpacing: '0.1em',
          }}
        >
          CONFIDENTIAL · 2026
        </div>
      </div>
    </div>
  );
}
