import { formatDate as formatSharedDate } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Check, Shield, User } from 'lucide-react';
import { useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const SERVICES = [
  {
    id: 'residence-operations',
    title: 'Residence Operations',
    desc: 'Day-to-day management of a primary or secondary residence.',
  },
  {
    id: 'property-coordination',
    title: 'Property Coordination',
    desc: 'Operational oversight across multiple properties.',
  },
  {
    id: 'household-systems',
    title: 'Household Systems',
    desc: 'Staff management, protocols, and household infrastructure.',
  },
  {
    id: 'vendor-management',
    title: 'Vendor Management',
    desc: 'Vetted provider network and vendor accountability.',
  },
  {
    id: 'lifestyle-admin',
    title: 'Lifestyle & Admin',
    desc: 'Administrative and lifestyle support for demanding schedules.',
  },
  {
    id: 'special-projects',
    title: 'Special Projects',
    desc: 'Estate activations, relocations, and high-stakes transitions.',
  },
];

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

function getNextBusinessDays(): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 3);
  while (days.length < 14) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(d.toISOString().split('T')[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDate(dateStr: string) {
  return formatSharedDate(new Date(dateStr + 'T12:00:00'), {
    intlOptions: { weekday: 'short', month: 'short', day: 'numeric' },
  });
}

type Step = 'service' | 'schedule' | 'details' | 'review';

interface FormData {
  service: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  howHeard: string;
}

const inputStyle = {
  width: '100%',
  background: 'white',
  border: '1px solid var(--color-stone-200)',
  color: 'var(--color-ink-900)',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 300,
  outline: 'none',
  transition: 'border-color 0.2s',
};

export default function BookingPage() {
  const [step, setStep] = useState<Step>('service');
  const [form, setForm] = useState<FormData>({
    service: '',
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    description: '',
    howHeard: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [confirmationId, setConfirmationId] = useState('');

  const steps: { id: Step; label: string }[] = [
    { id: 'service', label: 'Service' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'details', label: 'Details' },
    { id: 'review', label: 'Review' },
  ];

  const stepIdx = steps.findIndex((s) => s.id === step);

  const canProceed = () => {
    if (step === 'service') return !!form.service;
    if (step === 'schedule') return !!form.date && !!form.time;
    if (step === 'details')
      return (
        !!form.name.trim() && !!form.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      );
    return true;
  };

  const next = () => {
    const idx = stepIdx;
    if (idx < steps.length - 1) setStep(steps[idx + 1].id);
  };

  const back = () => {
    const idx = stepIdx;
    if (idx > 0) setStep(steps[idx - 1].id);
  };

  const selectedService = SERVICES.find((s) => s.id === form.service);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/booking/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          service: form.service,
          message: `[Consultation Request]\nPreferred date: ${formatDate(form.date)} at ${form.time} ET\n\n${form.description}`,
          company: form.howHeard ? `Heard via: ${form.howHeard}` : null,
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setConfirmationId(
        data.inquiryId ? `CJ-REQ-${data.inquiryId}` : 'CJ-' + Date.now().toString(36).toUpperCase(),
      );
      setSubmitted(true);
    } catch {
      setError(
        'Something went wrong. Please try again or contact Rosa directly at inquiries@carlotajo.com.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-cream-warm)' }}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg mx-auto px-6 text-center"
          >
            <div
              className="w-16 h-16 mx-auto mb-8 flex items-center justify-center"
              style={{ border: '1px solid var(--color-stone-200)' }}
            >
              <Check size={24} style={{ color: 'var(--color-gold)' }} strokeWidth={1.5} />
            </div>
            <p
              className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4"
              style={{ color: 'var(--color-gold)' }}
            >
              Request received
            </p>
            <h1
              className="font-serif text-3xl font-light mb-4"
              style={{ color: 'var(--color-ink-900)' }}
            >
              Thank you, {form.name.split(' ')[0]}.
            </h1>
            <p
              className="text-sm font-light leading-relaxed mb-4"
              style={{ color: 'var(--color-ink-600)' }}
            >
              Rosa has received your consultation request and will respond personally within two
              business days. Your enquiry is handled with complete confidentiality.
            </p>
            <p className="text-xs font-light mb-8" style={{ color: 'var(--color-stone-400)' }}>
              Reference: <span style={{ color: 'var(--color-gold)' }}>{confirmationId}</span>
            </p>

            <div
              className="p-8 text-left mb-8"
              style={{
                background: 'var(--color-stone-50)',
                border: '1px solid var(--color-stone-200)',
              }}
            >
              <div className="space-y-3">
                {[
                  { label: 'Service area', value: selectedService?.title || form.service },
                  { label: 'Preferred date', value: `${formatDate(form.date)} at ${form.time} ET` },
                  { label: 'Name', value: form.name },
                  { label: 'Email', value: form.email },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between gap-4">
                    <span
                      className="text-[12px] font-light"
                      style={{ color: 'var(--color-stone-400)' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-[12px] font-light text-right"
                      style={{ color: 'var(--color-ink-700)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={import.meta.env.BASE_URL}
              className="inline-block px-8 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
              style={{ color: 'var(--color-cream)', background: 'var(--color-gold)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-gold-light)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)';
              }}
            >
              Return Home
            </a>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-cream-warm)' }}>
      <Header />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-medium tracking-[0.4em] uppercase mb-3"
              style={{ color: 'var(--color-gold)' }}
            >
              Consultation Request
            </p>
            <h1
              className="font-serif text-3xl lg:text-4xl font-light mb-3"
              style={{ color: 'var(--color-ink-900)' }}
            >
              Request a confidential consultation.
            </h1>
            <p
              className="text-sm font-light max-w-md mx-auto"
              style={{ color: 'var(--color-ink-500)' }}
            >
              Rosa responds personally within two business days. There is no obligation after an
              initial conversation.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-14">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-xs font-medium transition-all"
                    style={{
                      background:
                        i < stepIdx
                          ? 'var(--color-gold-dim)'
                          : i === stepIdx
                            ? 'var(--color-gold)'
                            : 'transparent',
                      color:
                        i < stepIdx
                          ? 'var(--color-gold)'
                          : i === stepIdx
                            ? 'var(--color-cream)'
                            : 'var(--color-stone-400)',
                      border:
                        i < stepIdx
                          ? '1px solid var(--color-gold-border)'
                          : i === stepIdx
                            ? 'none'
                            : '1px solid var(--color-stone-200)',
                    }}
                  >
                    {i < stepIdx ? <Check size={12} /> : i + 1}
                  </div>
                  <span
                    className="text-[10px] tracking-wider uppercase hidden sm:block"
                    style={{ color: i <= stepIdx ? 'var(--color-gold)' : 'var(--color-stone-400)' }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-10 h-px mb-5 sm:mb-0"
                    style={{
                      background:
                        i < stepIdx ? 'var(--color-gold-border)' : 'var(--color-stone-200)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
            >
              {step === 'service' && (
                <div>
                  <h3
                    className="font-serif text-xl font-light mb-2"
                    style={{ color: 'var(--color-ink-900)' }}
                  >
                    What are you looking for support with?
                  </h3>
                  <p
                    className="text-[13px] font-light mb-7"
                    style={{ color: 'var(--color-ink-500)' }}
                  >
                    Select the area closest to your needs. Rosa will clarify scope during the
                    initial conversation.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => setForm((f) => ({ ...f, service: svc.id }))}
                        className="text-left p-5 transition-all duration-200"
                        style={{
                          border:
                            form.service === svc.id
                              ? '1px solid var(--color-gold)'
                              : '1px solid var(--color-stone-200)',
                          background: form.service === svc.id ? 'rgba(154,125,82,0.04)' : 'white',
                        }}
                        onMouseEnter={(e) => {
                          if (form.service !== svc.id)
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-stone-300)';
                        }}
                        onMouseLeave={(e) => {
                          if (form.service !== svc.id)
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-stone-200)';
                        }}
                      >
                        <h4
                          className="text-[14px] font-medium mb-1"
                          style={{ color: 'var(--color-ink-900)' }}
                        >
                          {svc.title}
                        </h4>
                        <p
                          className="text-[12px] font-light leading-relaxed"
                          style={{ color: 'var(--color-ink-500)' }}
                        >
                          {svc.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-7">
                  <div>
                    <h3
                      className="font-serif text-xl font-light mb-2"
                      style={{ color: 'var(--color-ink-900)' }}
                    >
                      When would you prefer to speak?
                    </h3>
                    <p
                      className="text-[13px] font-light mb-7"
                      style={{ color: 'var(--color-ink-500)' }}
                    >
                      Select a preferred date and time. All times are New York (ET). Rosa will
                      confirm within two business days.
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[11px] font-medium tracking-[0.18em] uppercase mb-3"
                      style={{ color: 'var(--color-stone-400)' }}
                    >
                      Available dates
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                      {getNextBusinessDays().map((d) => (
                        <button
                          key={d}
                          onClick={() => setForm((f) => ({ ...f, date: d }))}
                          className="py-3 px-2 text-[11px] text-center transition-all"
                          style={{
                            border:
                              form.date === d
                                ? '1px solid var(--color-gold)'
                                : '1px solid var(--color-stone-200)',
                            background: form.date === d ? 'rgba(154,125,82,0.04)' : 'white',
                            color: form.date === d ? 'var(--color-gold)' : 'var(--color-ink-600)',
                          }}
                        >
                          {formatDate(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-[11px] font-medium tracking-[0.18em] uppercase mb-3"
                      style={{ color: 'var(--color-stone-400)' }}
                    >
                      Preferred time (ET)
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setForm((f) => ({ ...f, time: t }))}
                          className="py-3 px-2 text-[11px] transition-all"
                          style={{
                            border:
                              form.time === t
                                ? '1px solid var(--color-gold)'
                                : '1px solid var(--color-stone-200)',
                            background: form.time === t ? 'rgba(154,125,82,0.04)' : 'white',
                            color: form.time === t ? 'var(--color-gold)' : 'var(--color-ink-600)',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-5">
                  <div>
                    <h3
                      className="font-serif text-xl font-light mb-2"
                      style={{ color: 'var(--color-ink-900)' }}
                    >
                      Your information
                    </h3>
                    <p
                      className="text-[13px] font-light mb-7"
                      style={{ color: 'var(--color-ink-500)' }}
                    >
                      This is used solely to confirm the consultation and allow Rosa to prepare. All
                      information is handled in confidence.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        className="block text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
                        style={{ color: 'var(--color-stone-400)' }}
                      >
                        Full name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        style={inputStyle}
                        placeholder="Your full name"
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'var(--color-stone-200)';
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
                        style={{ color: 'var(--color-stone-400)' }}
                      >
                        Email address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        style={inputStyle}
                        placeholder="Your email address"
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            'var(--color-stone-200)';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
                      style={{ color: 'var(--color-stone-400)' }}
                    >
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      style={inputStyle}
                      placeholder="Your preferred contact number"
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          'var(--color-stone-200)';
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
                      style={{ color: 'var(--color-stone-400)' }}
                    >
                      Brief description of your needs
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      style={{ ...inputStyle, resize: 'none' }}
                      placeholder="Tell Rosa a little about your household, properties, and what you're looking for support with. The more context, the more productive the conversation."
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          'var(--color-stone-200)';
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
                      style={{ color: 'var(--color-stone-400)' }}
                    >
                      How did you hear about Carlota Jo? (optional)
                    </label>
                    <input
                      type="text"
                      value={form.howHeard}
                      onChange={(e) => setForm((f) => ({ ...f, howHeard: e.target.value }))}
                      style={inputStyle}
                      placeholder="Referral, SZL Holdings, search, etc."
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          'var(--color-stone-200)';
                      }}
                    />
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h3
                      className="font-serif text-xl font-light mb-2"
                      style={{ color: 'var(--color-ink-900)' }}
                    >
                      Review your request
                    </h3>
                    <p
                      className="text-[13px] font-light mb-7"
                      style={{ color: 'var(--color-ink-500)' }}
                    >
                      Please confirm the details below before submitting.
                    </p>
                  </div>
                  <div
                    className="p-8 space-y-4"
                    style={{
                      background: 'var(--color-stone-50)',
                      border: '1px solid var(--color-stone-200)',
                    }}
                  >
                    {[
                      { label: 'Service area', value: selectedService?.title || form.service },
                      { label: 'Preferred date', value: `${formatDate(form.date)}` },
                      { label: 'Preferred time', value: `${form.time} ET (New York)` },
                      { label: 'Name', value: form.name },
                      { label: 'Email', value: form.email },
                      ...(form.phone ? [{ label: 'Phone', value: form.phone }] : []),
                      ...(form.description ? [{ label: 'Notes', value: form.description }] : []),
                    ].map((item, i, arr) => (
                      <div key={item.label}>
                        <div className="flex justify-between gap-6">
                          <span
                            className="text-[12px] font-light"
                            style={{ color: 'var(--color-stone-400)' }}
                          >
                            {item.label}
                          </span>
                          <span
                            className="text-[12px] font-light text-right"
                            style={{ color: 'var(--color-ink-700)' }}
                          >
                            {item.value}
                          </span>
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className="mt-4 h-px"
                            style={{ background: 'var(--color-stone-200)' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    className="flex items-start gap-3 text-[11px] font-light"
                    style={{ color: 'var(--color-stone-400)' }}
                  >
                    <Shield
                      size={14}
                      style={{
                        marginTop: '0.05rem',
                        flexShrink: 0,
                        color: 'var(--color-stone-300)',
                      }}
                    />
                    All details are held in strict confidence by Rosa personally. Nothing is shared.
                  </div>
                  {error && (
                    <p
                      className="text-sm font-light"
                      style={{
                        color: 'var(--color-ink-500)',
                        background: 'rgba(200,80,80,0.06)',
                        padding: '12px 16px',
                        border: '1px solid rgba(200,80,80,0.15)',
                      }}
                    >
                      {error}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-12">
            <button
              onClick={back}
              disabled={stepIdx === 0}
              className="flex items-center gap-2 text-[11px] tracking-wider uppercase transition-colors disabled:opacity-0 disabled:pointer-events-none"
              style={{ color: 'var(--color-ink-500)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-900)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-500)';
              }}
            >
              <ArrowLeft size={13} />
              Back
            </button>

            {step === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors disabled:opacity-60"
                style={{ color: 'var(--color-cream)', background: 'var(--color-gold)' }}
                onMouseEnter={(e) => {
                  if (!submitting)
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-gold-light)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)';
                }}
              >
                {submitting ? 'Submitting...' : 'Submit consultation request'}
              </button>
            ) : (
              <button
                onClick={next}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: 'var(--color-cream)', background: 'var(--color-gold)' }}
                onMouseEnter={(e) => {
                  if (canProceed())
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-gold-light)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)';
                }}
              >
                Continue
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
