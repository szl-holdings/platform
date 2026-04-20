import { useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const API = '/api';

export default function InquiriesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', type: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API}/booking/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company || undefined,
          service: form.type || undefined,
          message: form.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Submission failed (${res.status})`);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again or email us directly.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d]">
      <Header />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="grid md:grid-cols-12 gap-16">
          <div className="md:col-span-5">
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/70 mb-4">
              Inquiries
            </p>
            <h1
              className="text-3xl md:text-4xl font-light text-[#f5f0e8] leading-tight mb-5"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Begin a private conversation
            </h1>
            <p className="text-[#f5f0e8]/40 text-[13.5px] font-light leading-relaxed mb-8">
              We respond to substantive enquiries within two business days. All submissions are
              treated with full confidentiality.
            </p>
            <div className="space-y-4">
              {[
                'Founder or leadership team advisory',
                'Brand strategy or market positioning',
                'Growth architecture and commercial strategy',
                'Transformation and change advisory',
                'Investor and board preparation',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-[#c8a96a]/40 mt-2 shrink-0" />
                  <span className="text-[#f5f0e8]/38 text-[13px] font-light">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-[#f5f0e8]/6">
              <p className="text-[12px] text-[#f5f0e8]/25 font-light leading-relaxed">
                inquiries@carlotajo.com
                <br />
                London · New York
              </p>
            </div>
          </div>

          <div className="md:col-span-7">
            {submitted ? (
              <div className="bg-[#0c0e14] border border-[#f5f0e8]/6 p-10 text-center">
                <h3
                  className="text-[22px] font-light text-[#f5f0e8] mb-3"
                  style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
                >
                  Inquiry received
                </h3>
                <p className="text-[#f5f0e8]/38 text-[13px] font-light">
                  We will respond within two business days. All submissions are treated with
                  complete confidentiality.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { label: 'Name', key: 'name', type: 'text', placeholder: 'Your full name' },
                  {
                    label: 'Organisation',
                    key: 'company',
                    type: 'text',
                    placeholder: 'Company or firm',
                  },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'your@email.com' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-medium tracking-[0.18em] uppercase text-[#f5f0e8]/28 mb-2">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      required
                      className="w-full bg-[#0c0e14] border border-[#f5f0e8]/8 px-4 py-3 text-[13px] text-[#f5f0e8] placeholder-[#f5f0e8]/18 font-light focus:outline-none focus:border-[#c8a96a]/30 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-medium tracking-[0.18em] uppercase text-[#f5f0e8]/28 mb-2">
                    Inquiry type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    required
                    className="w-full bg-[#0c0e14] border border-[#f5f0e8]/8 px-4 py-3 text-[13px] text-[#f5f0e8] font-light focus:outline-none focus:border-[#c8a96a]/30 transition-colors"
                  >
                    <option value="">Select type</option>
                    <option value="advisory">Executive advisory</option>
                    <option value="brand">Brand strategy</option>
                    <option value="growth">Growth architecture</option>
                    <option value="transformation">Transformation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium tracking-[0.18em] uppercase text-[#f5f0e8]/28 mb-2">
                    Tell us about your situation
                  </label>
                  <textarea
                    placeholder="What's the challenge, and what kind of support are you looking for..."
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    rows={5}
                    required
                    className="w-full bg-[#0c0e14] border border-[#f5f0e8]/8 px-4 py-3 text-[13px] text-[#f5f0e8] placeholder-[#f5f0e8]/18 font-light focus:outline-none focus:border-[#c8a96a]/30 transition-colors resize-none"
                  />
                </div>
                {submitError && (
                  <p className="text-[12px] text-red-400/80 font-light border border-red-500/20 bg-red-500/5 px-4 py-3">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 text-[13px] font-medium tracking-[0.1em] text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#07090d]/40 border-t-[#07090d] rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit private inquiry'
                  )}
                </button>
                <p className="text-center text-[11px] text-[#f5f0e8]/18 font-light">
                  All submissions are strictly confidential
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
