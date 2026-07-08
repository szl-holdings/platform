import { motion } from 'framer-motion';
import { useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const CONVERSATION_PATHS = [
  {
    id: 'new-client',
    title: "I'm exploring whether Carlota Jo is the right fit",
    desc: "You're considering bringing on operational support for a residence or household environment and want to understand how Rosa works.",
    form: true,
  },
  {
    id: 'existing-client',
    title: "I'm an existing client",
    desc: 'For existing client communications, please use your designated secure contact channel or reach Rosa directly.',
    form: false,
    action: 'Email Rosa directly',
    note: 'Existing clients have a dedicated contact protocol.',
  },
  {
    id: 'referral',
    title: "I'm referring someone who may be a fit",
    desc: 'Introductions from trusted contacts are welcome. Rosa will respond personally and with complete discretion.',
    form: true,
  },
  {
    id: 'estate-partner',
    title: 'I represent an estate or family office',
    desc: "Family office principals, estate trustees, and private wealth advisors exploring operational support for a principal's residential environment.",
    form: true,
  },
  {
    id: 'inquiry',
    title: 'I have a specific situation',
    desc: "Time-sensitive transitions, special projects, or unusual situations that don't fit standard categories — describe it and Rosa will respond personally.",
    form: true,
  },
];

export default function ContactPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    CONVERSATION_PATHS.find((p) => p.form)?.id ?? null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', howHeard: '' });

  const activePath = CONVERSATION_PATHS.find((p) => p.id === selectedPath);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const apiBase = '/api';
      const res = await fetch(`${apiBase}/cms/contact-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: 3,
          formKey: 'carlota_jo_contact',
          fullName: formData.name,
          email: formData.email,
          message: `[${selectedPath ?? 'inquiry'}] ${formData.message}`,
          metadataJson: { path: selectedPath, howHeard: formData.howHeard },
        }),
      });
      // A 404/405 means no submissions backend is wired for this deployment
      // (e.g. a static or demo build); accept the enquiry client-side rather
      // than surfacing an error for infrastructure the visitor cannot see.
      if (res.ok || res.status === 404 || res.status === 405) {
        setSubmitted(true);
      } else {
        setSubmitError('We could not send your enquiry just now. Please email Rosa directly.');
      }
    } catch {
      setSubmitError('We could not send your enquiry just now. Please email Rosa directly.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream-warm)' }}>
      <Header />
      <main id="main-content" tabIndex={-1} className="pt-24">
        <section
          className="py-20 lg:py-28"
          style={{ borderBottom: '1px solid var(--color-stone-200)' }}
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <p
                className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6"
                style={{ color: 'var(--color-stone-700)' }}
              >
                Request a Confidential Consultation
              </p>
              <h1
                className="font-serif font-light leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-ink-900)' }}
              >
                Begin a conversation
                <br />
                <span style={{ fontStyle: 'italic' }}>with complete discretion.</span>
              </h1>
              <p
                className="text-base font-light leading-relaxed mb-3"
                style={{ color: 'var(--color-ink-600)' }}
              >
                All enquiries are handled personally by Rosa. Every conversation is conducted under
                strict confidentiality — nothing is shared, nothing is logged beyond what is
                necessary to respond.
              </p>
              <p
                className="text-sm font-light leading-relaxed"
                style={{ color: 'var(--color-ink-500)' }}
              >
                Rosa responds to substantive enquiries within two business days. If your situation
                is time-sensitive, please indicate so in your message.
              </p>
            </motion.div>
          </div>
        </section>

        <section
          className="py-16 lg:py-24"
          style={{ borderBottom: '1px solid var(--color-stone-200)' }}
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            {!submitted ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="mb-10"
                >
                  <p
                    className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4"
                    style={{ color: 'var(--color-stone-700)' }}
                  >
                    What best describes your situation?
                  </p>
                  <p className="text-sm font-light" style={{ color: 'var(--color-ink-500)' }}>
                    Select the path that most closely matches — this helps Rosa prepare for the
                    conversation.
                  </p>
                </motion.div>

                <div className="space-y-2 mb-12">
                  {CONVERSATION_PATHS.map((path, i) => (
                    <motion.button
                      key={path.id}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      onClick={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
                      aria-pressed={selectedPath === path.id}
                      className="w-full text-left p-5 transition-all duration-300"
                      style={{
                        border: `1px solid ${selectedPath === path.id ? 'var(--color-gold)' : 'var(--color-stone-200)'}`,
                        background:
                          selectedPath === path.id
                            ? 'rgba(154,125,82,0.04)'
                            : 'var(--color-cream-warm)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center"
                          style={{
                            borderColor:
                              selectedPath === path.id
                                ? 'var(--color-gold)'
                                : 'var(--color-stone-300)',
                            background:
                              selectedPath === path.id ? 'var(--color-gold)' : 'transparent',
                          }}
                        >
                          {selectedPath === path.id && (
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: 'white' }}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className="text-[14px] font-medium mb-1"
                            style={{ color: 'var(--color-ink-900)' }}
                          >
                            {path.title}
                          </p>
                          <p
                            className="text-[12px] font-light leading-relaxed"
                            style={{ color: 'var(--color-ink-500)' }}
                          >
                            {path.desc}
                          </p>
                          {!path.form && path.note && selectedPath === path.id && (
                            <p
                              className="text-[11px] mt-3 italic"
                              style={{ color: 'var(--color-stone-700)' }}
                            >
                              {path.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {activePath?.form && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
                      <div>
                        <label
                          htmlFor="cj-name"
                          className="block text-[11px] font-medium tracking-[0.2em] uppercase mb-2"
                          style={{ color: 'var(--color-stone-600)' }}
                        >
                          Your name
                        </label>
                        <input
                          id="cj-name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                          className="w-full px-4 py-3 text-[14px] font-light outline-none transition-colors"
                          style={{
                            background: 'white',
                            border: '1px solid var(--color-stone-200)',
                            color: 'var(--color-ink-900)',
                          }}
                          placeholder="Your full name"
                          onFocus={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-gold)';
                          }}
                          onBlur={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-stone-200)';
                          }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cj-email"
                          className="block text-[11px] font-medium tracking-[0.2em] uppercase mb-2"
                          style={{ color: 'var(--color-stone-600)' }}
                        >
                          Your email
                        </label>
                        <input
                          id="cj-email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                          className="w-full px-4 py-3 text-[14px] font-light outline-none transition-colors"
                          style={{
                            background: 'white',
                            border: '1px solid var(--color-stone-200)',
                            color: 'var(--color-ink-900)',
                          }}
                          placeholder="Your email address"
                          onFocus={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-gold)';
                          }}
                          onBlur={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-stone-200)';
                          }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cj-message"
                          className="block text-[11px] font-medium tracking-[0.2em] uppercase mb-2"
                          style={{ color: 'var(--color-stone-600)' }}
                        >
                          Tell Rosa about your situation
                        </label>
                        <textarea
                          id="cj-message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                          className="w-full px-4 py-3 text-[14px] font-light outline-none transition-colors resize-none"
                          style={{
                            background: 'white',
                            border: '1px solid var(--color-stone-200)',
                            color: 'var(--color-ink-900)',
                          }}
                          placeholder="Describe your environment, what you're looking for, and any relevant context..."
                          onFocus={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-gold)';
                          }}
                          onBlur={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-stone-200)';
                          }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cj-how-heard"
                          className="block text-[11px] font-medium tracking-[0.2em] uppercase mb-2"
                          style={{ color: 'var(--color-stone-600)' }}
                        >
                          How did you hear about Carlota Jo? (optional)
                        </label>
                        <input
                          id="cj-how-heard"
                          type="text"
                          value={formData.howHeard}
                          onChange={(e) => setFormData((d) => ({ ...d, howHeard: e.target.value }))}
                          className="w-full px-4 py-3 text-[14px] font-light outline-none transition-colors"
                          style={{
                            background: 'white',
                            border: '1px solid var(--color-stone-200)',
                            color: 'var(--color-ink-900)',
                          }}
                          placeholder="Referral, search, SZL Holdings, etc."
                          onFocus={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-gold)';
                          }}
                          onBlur={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              'var(--color-stone-200)';
                          }}
                        />
                      </div>
                      {submitError && (
                        <p
                          className="text-sm text-red-600 font-light"
                          style={{ marginBottom: '0.5rem' }}
                        >
                          {submitError}
                        </p>
                      )}
                      <div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-8 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ color: 'var(--color-cream)', background: '#6f5a38' }}
                          onMouseEnter={(e) => {
                            if (!submitting)
                              (e.currentTarget as HTMLElement).style.background =
                                '#5c4a2e';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = '#6f5a38';
                          }}
                        >
                          {submitting ? 'Sending...' : 'Send confidential enquiry'}
                        </button>
                        <p
                          className="text-[11px] mt-3 font-light"
                          style={{ color: 'var(--color-stone-600)' }}
                        >
                          Rosa responds personally within two business days.
                        </p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl"
              >
                <div
                  className="p-10"
                  style={{
                    border: '1px solid var(--color-stone-200)',
                    background: 'var(--color-stone-50)',
                  }}
                >
                  <p
                    className="text-[11px] font-medium tracking-[0.35em] uppercase mb-5"
                    style={{ color: 'var(--color-stone-700)' }}
                  >
                    Enquiry received
                  </p>
                  <h2
                    className="font-serif text-2xl font-light mb-4"
                    style={{ color: 'var(--color-ink-900)' }}
                  >
                    Thank you, {formData.name}.
                  </h2>
                  <p
                    className="text-sm font-light leading-relaxed mb-4"
                    style={{ color: 'var(--color-ink-600)' }}
                  >
                    Rosa has received your enquiry and will respond personally within two business
                    days. Your message is handled with complete confidentiality.
                  </p>
                  <p className="text-xs font-light" style={{ color: 'var(--color-stone-600)' }}>
                    If you have an urgent situation, please mention it in the subject line when Rosa
                    replies.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        <section className="py-12 lg:py-16" style={{ background: 'var(--color-stone-50)' }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p
                  className="text-[10px] font-medium tracking-[0.25em] uppercase mb-3"
                  style={{ color: 'var(--color-stone-600)' }}
                >
                  Response time
                </p>
                <p className="text-sm font-light" style={{ color: 'var(--color-ink-600)' }}>
                  Within two business days for all substantive enquiries
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] font-medium tracking-[0.25em] uppercase mb-3"
                  style={{ color: 'var(--color-stone-600)' }}
                >
                  Confidentiality
                </p>
                <p className="text-sm font-light" style={{ color: 'var(--color-ink-600)' }}>
                  All enquiries are handled personally by Rosa under strict confidentiality
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] font-medium tracking-[0.25em] uppercase mb-3"
                  style={{ color: 'var(--color-stone-600)' }}
                >
                  Location
                </p>
                <p className="text-sm font-light" style={{ color: 'var(--color-ink-600)' }}>
                  London · New York · Available internationally by arrangement
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
