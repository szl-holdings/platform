import { m } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { FounderLayout } from './FounderLayout';

const WHAT_YOU_GET = [
  {
    icon: Zap,
    title: 'Direct founder access',
    body: 'You work with me, not an account team. Every architecture decision, integration question, and product iteration goes through the person who built it.',
  },
  {
    icon: BarChart3,
    title: 'Instrumented proof, not a trial',
    body: 'We instrument one real workflow together — with observability, checkpoints, and a measurable baseline — so the pilot produces documented evidence of improvement.',
  },
  {
    icon: Shield,
    title: 'Governance from day one',
    body: 'The same trust controls, AI governance model, and audit trail that run in production run in your pilot. No security gaps to close later.',
  },
  {
    icon: MessageSquare,
    title: 'Your feedback shapes the product',
    body: 'Design partners have direct influence on the product roadmap, integration priorities, and domain vocabulary. Your operating context becomes the template.',
  },
];

const PRODUCTS = [
  'Lyte — Decision Intelligence',
  'Alloy — Execution Fabric',
  'Vessels — Maritime Intelligence',
  'Terra — Real Estate Intelligence',
  'Aegis — Defense & Intelligence',
  'PRISM Counsel — Legal Command',
  'Not sure yet',
];

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const BASE_PATH = import.meta.env.BASE_URL ?? '/';

function apiUrl(path: string) {
  const base = BASE_PATH.replace(/\/$/, '');
  return `${base}/api${path}`;
}

export default function FounderDesignPartner() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    product: '',
    useCase: '',
    message: '',
  });

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company || !form.message) {
      setErrorMessage('Please fill in all required fields.');
      setFormState('error');
      return;
    }
    setFormState('submitting');
    setErrorMessage('');
    try {
      const res = await fetch(apiUrl('/stephen/design-partner-intake'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          role: form.role.trim() || undefined,
          product: form.product || undefined,
          useCase: form.useCase.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setFormState('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
      setFormState('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid hsla(0,0%,100%,0.10)',
    background: 'hsla(214, 14%, 6%, 0.8)',
    color: 'hsl(38, 8%, 95%)',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'hsl(214, 7%, 64%)',
    marginBottom: '0.5rem',
    letterSpacing: '0.02em',
  };

  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)',
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '4rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'hsl(38, 52%, 58%)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'hsl(214, 6%, 57%)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Design Partner Program
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'hsl(38, 8%, 95%)',
              marginBottom: '1.25rem',
              maxWidth: '24ch',
            }}
          >
            One real workflow. Documented proof.
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: 'hsl(214, 6%, 57%)',
              maxWidth: '58ch',
            }}
          >
            A design partner engagement is not a trial. It's a structured proof exercise: we
            identify one workflow in your operating environment that has a measurable inefficiency,
            instrument it together, and produce documented evidence of improvement. Direct founder
            access throughout.
          </p>
        </m.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))',
            gap: '1.25rem',
            marginBottom: '4rem',
          }}
        >
          {WHAT_YOU_GET.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                borderRadius: '10px',
                border: '1px solid hsla(0,0%,100%,0.055)',
                background: 'hsla(214, 14%, 6%, 0.6)',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'hsla(38, 52%, 58%, 0.10)',
                  border: '1px solid hsla(38, 52%, 58%, 0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <item.icon size={17} style={{ color: 'hsl(38, 52%, 58%)' }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    color: 'hsl(38, 8%, 95%)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {item.title}
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'hsl(214, 6%, 57%)',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {item.body}
                </p>
              </div>
            </m.div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr min(480px, 100%)',
            gap: '4rem',
            alignItems: 'start',
          }}
          className="design-partner-grid"
        >
          <div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)',
                letterSpacing: '-0.015em',
                color: 'hsl(38, 8%, 95%)',
                marginBottom: '1rem',
                lineHeight: 1.2,
              }}
            >
              Who this is for
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                'Operators with a real, measurable workflow problem — not a research initiative',
                'Teams willing to provide real data and real operator access during the engagement',
                'Organizations that can move in 90 days or less from agreement to deployment',
                'Principals who want evidence before they commit, not a polished demo',
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <CheckCircle2
                    size={16}
                    style={{ color: 'hsl(38, 52%, 58%)', flexShrink: 0, marginTop: '2px' }}
                  />
                  <span
                    style={{
                      fontSize: '0.9375rem',
                      color: 'hsl(214, 6%, 57%)',
                      lineHeight: 1.6,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '3rem' }}>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: '1.0625rem',
                  color: 'hsl(38, 8%, 95%)',
                  marginBottom: '1rem',
                }}
              >
                What a 90-day engagement looks like
              </h3>
              {[
                {
                  period: 'Week 1–2',
                  label: 'Workflow selection + baseline',
                  detail: 'Identify the friction point. Define success criteria. Set the baseline.',
                },
                {
                  period: 'Week 3–4',
                  label: 'Integration setup',
                  detail: 'Configure connectors. Test signal ingestion. Validate data quality.',
                },
                {
                  period: 'Month 2',
                  label: 'Governed workflow live',
                  detail: 'End-to-end instrumented. AI recommendations running on live data.',
                },
                {
                  period: 'Month 3',
                  label: 'Measurement + review',
                  detail: 'Document outcomes vs. baseline. Define expansion scope if results land.',
                },
              ].map((phase) => (
                <div
                  key={phase.period}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '6rem 1fr',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'hsl(38, 52%, 58%)',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.03em',
                      paddingTop: '1px',
                    }}
                  >
                    {phase.period}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: 'hsl(38, 8%, 95%)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {phase.label}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'hsl(214, 6%, 57%)' }}>
                      {phase.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '2rem',
              borderRadius: '14px',
              border: '1px solid hsla(0,0%,100%,0.10)',
              background: 'hsla(214, 14%, 6%, 0.8)',
              position: 'sticky',
              top: '80px',
            }}
          >
            {formState === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'hsla(38, 52%, 58%, 0.12)',
                    border: '1px solid hsla(38, 52%, 58%, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}
                >
                  <CheckCircle2 size={24} style={{ color: 'hsl(38, 52%, 58%)' }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    color: 'hsl(38, 8%, 95%)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Application received.
                </h3>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'hsl(214, 6%, 57%)',
                    lineHeight: 1.65,
                  }}
                >
                  I review every application personally. If there's a fit, you'll hear from me
                  directly within 5 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: 'hsl(38, 8%, 95%)',
                    marginBottom: '1.5rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Apply to the program
                </h3>

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.875rem',
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Name <span style={{ color: 'hsl(38, 52%, 58%)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={update('name')}
                        placeholder="Your name"
                        style={inputStyle}
                        disabled={formState === 'submitting'}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.22)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.10)';
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Email <span style={{ color: 'hsl(38, 52%, 58%)' }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        placeholder="work@company.com"
                        style={inputStyle}
                        disabled={formState === 'submitting'}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.22)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.10)';
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.875rem',
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Company <span style={{ color: 'hsl(38, 52%, 58%)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={update('company')}
                        placeholder="Your organization"
                        style={inputStyle}
                        disabled={formState === 'submitting'}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.22)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.10)';
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <input
                        type="text"
                        value={form.role}
                        onChange={update('role')}
                        placeholder="Your title"
                        style={inputStyle}
                        disabled={formState === 'submitting'}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.22)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'hsla(0,0%,100%,0.10)';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Product of interest</label>
                    <select
                      value={form.product}
                      onChange={update('product')}
                      style={{
                        ...inputStyle,
                        cursor: 'pointer',
                      }}
                      disabled={formState === 'submitting'}
                    >
                      <option value="">Select a product...</option>
                      {PRODUCTS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>The workflow you want to instrument</label>
                    <input
                      type="text"
                      value={form.useCase}
                      onChange={update('useCase')}
                      placeholder="Brief description of the problem"
                      style={inputStyle}
                      disabled={formState === 'submitting'}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.22)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.10)';
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Why this matters to you <span style={{ color: 'hsl(38, 52%, 58%)' }}>*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={update('message')}
                      rows={4}
                      placeholder="What's the actual operational problem? What does success look like in 90 days?"
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                      disabled={formState === 'submitting'}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.22)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.10)';
                      }}
                    />
                  </div>

                  {formState === 'error' && errorMessage && (
                    <m.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'hsla(0, 70%, 50%, 0.08)',
                        border: '1px solid hsla(0, 70%, 50%, 0.20)',
                        fontSize: '0.875rem',
                        color: 'hsl(0, 70%, 65%)',
                      }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      {errorMessage}
                    </m.div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '8px',
                      background:
                        formState === 'submitting'
                          ? 'hsla(38, 52%, 58%, 0.6)'
                          : 'hsl(38, 52%, 58%)',
                      color: 'hsl(214, 18%, 3%)',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: formState === 'submitting' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.15s',
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {formState === 'submitting' ? (
                      'Sending application...'
                    ) : (
                      <>
                        Submit application
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'hsl(214, 6%, 55%)',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    I review every application personally. Expect a response within 5 business days.
                  </p>
                </div>
              </form>
            )}
          </m.div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .design-partner-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </FounderLayout>
  );
}
