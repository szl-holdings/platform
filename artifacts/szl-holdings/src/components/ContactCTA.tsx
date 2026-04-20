import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

const audiences = [
  {
    title: 'Investors & LPs',
    description:
      'Capital deployment, portfolio performance, and strategic co-investment opportunities.',
    accent: 'hsl(210,10%,72%)',
    accentMuted: 'hsla(210,10%,72%,0.08)',
    accentBorder: 'hsla(210,10%,72%,0.14)',
  },
  {
    title: 'Enterprise Clients',
    description: 'Product access, enterprise agreements, and partnership discussions.',
    accent: 'hsl(192,70%,46%)',
    accentMuted: 'hsla(192,70%,46%,0.08)',
    accentBorder: 'hsla(192,70%,46%,0.16)',
  },
  {
    title: 'Strategic Partners',
    description: 'Technology, channel, and strategic alliance conversations.',
    accent: 'hsl(218,50%,58%)',
    accentMuted: 'hsla(218,50%,58%,0.08)',
    accentBorder: 'hsla(218,50%,58%,0.16)',
  },
];

export function ContactCTA() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '6px',
    background: 'hsla(0,0%,100%,0.04)',
    border: '1px solid hsla(0,0%,100%,0.08)',
    color: 'hsl(38,12%,94%)',
    fontSize: '13.5px',
    outline: 'none',
    transition: 'border-color 0.18s ease',
    fontFamily: 'inherit',
  };

  return (
    <section
      id="contact"
      style={{
        background: 'hsl(210,12%,7%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 'clamp(2.5rem,5vw,4rem)' }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'hsl(210,5%,46%)',
              marginBottom: '1rem',
            }}
          >
            Contact by Audience
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              lineHeight: '1.12',
              color: 'hsl(38,12%,94%)',
              marginBottom: '0.75rem',
            }}
          >
            Start a strategic conversation
          </h2>
          <p
            style={{
              fontSize: '1.0625rem',
              color: 'hsl(210,5%,58%)',
              lineHeight: '1.65',
              maxWidth: '34rem',
            }}
          >
            For investor relations, strategic partnerships, and portfolio enquiries. We respond
            within 24 hours.
          </p>
        </m.div>

        <div className="grid lg:grid-cols-[1fr,480px] gap-8 lg:gap-12 items-start">
          <div>
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              {audiences.map((a, i) => (
                <m.div
                  key={a.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.52, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.875rem',
                    background: a.accentMuted,
                    border: `1px solid ${a.accentBorder}`,
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: a.accent,
                      marginBottom: '0.875rem',
                    }}
                  />
                  <h3
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      letterSpacing: '-0.005em',
                      color: 'hsl(38,12%,94%)',
                      marginBottom: '0.375rem',
                    }}
                  >
                    {a.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'hsl(210,5%,56%)',
                      lineHeight: '1.55',
                    }}
                  >
                    {a.description}
                  </p>
                </m.div>
              ))}
            </div>

            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '0.875rem',
                background: 'hsla(210,12%,10%,0.40)',
                border: '1px solid hsla(0,0%,100%,0.05)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,40%)',
                    marginBottom: '0.375rem',
                  }}
                >
                  General inquiries
                </p>
                <p style={{ fontSize: '13px', color: 'hsl(210,5%,62%)' }}>
                  inquiries@szlholdings.com
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,40%)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Offices
                </p>
                <p style={{ fontSize: '13px', color: 'hsl(210,5%,62%)' }}>
                  Washington D.C. · London · Singapore
                </p>
              </div>
            </div>
          </div>

          <m.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.62, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {submitted ? (
              <div
                style={{
                  padding: '2.5rem',
                  borderRadius: '1rem',
                  background: 'hsla(210,10%,10%,0.55)',
                  border: '1px solid hsla(0,0%,100%,0.07)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'hsla(152,50%,42%,0.12)',
                    border: '1px solid hsla(152,50%,42%,0.24)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  <span style={{ color: 'hsl(152,50%,46%)', fontSize: '18px' }}>✓</span>
                </div>
                <p
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    letterSpacing: '-0.008em',
                    color: 'hsl(38,12%,94%)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Message received
                </p>
                <p style={{ fontSize: '0.875rem', color: 'hsl(210,5%,56%)', lineHeight: '1.58' }}>
                  Our team will respond within 24 business hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  padding: 'clamp(1.5rem,3vw,2rem)',
                  borderRadius: '1rem',
                  background: 'hsla(210,10%,10%,0.55)',
                  border: '1px solid hsla(0,0%,100%,0.07)',
                  boxShadow: '0 4px 20px hsla(0,0%,0%,0.24)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'hsl(210,5%,50%)',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="Your name"
                      onFocus={(e) =>
                        ((e.target as HTMLInputElement).style.borderColor =
                          'hsla(210,10%,72%,0.30)')
                      }
                      onBlur={(e) =>
                        ((e.target as HTMLInputElement).style.borderColor = 'hsla(0,0%,100%,0.08)')
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'hsl(210,5%,50%)',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="your@email.com"
                      onFocus={(e) =>
                        ((e.target as HTMLInputElement).style.borderColor =
                          'hsla(210,10%,72%,0.30)')
                      }
                      onBlur={(e) =>
                        ((e.target as HTMLInputElement).style.borderColor = 'hsla(0,0%,100%,0.08)')
                      }
                    />
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: 'hsl(210,5%,50%)',
                      marginBottom: '0.5rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    style={{ ...inputStyle, resize: 'none' }}
                    placeholder="Investor inquiry, strategic partnership, or portfolio enquiry"
                    onFocus={(e) =>
                      ((e.target as HTMLTextAreaElement).style.borderColor =
                        'hsla(210,10%,72%,0.30)')
                    }
                    onBlur={(e) =>
                      ((e.target as HTMLTextAreaElement).style.borderColor = 'hsla(0,0%,100%,0.08)')
                    }
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '0.6875rem 1.5rem',
                    borderRadius: '6px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    letterSpacing: '-0.005em',
                    color: 'hsl(210,12%,6%)',
                    background: 'hsl(210,8%,84%)',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'hsl(38,15%,96%)';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 4px 16px hsla(0,0%,0%,0.28)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'hsl(210,8%,84%)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  Send enquiry
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </form>
            )}
          </m.div>
        </div>
      </div>
    </section>
  );
}
