import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Flame,
  Loader2,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const ADD_ONS = [
  { id: 'xdr', label: 'Extended Detection & Response (XDR)' },
  { id: 'threat-hunting', label: 'Managed Threat Hunting' },
  { id: 'soc', label: '24/7 SOC-as-a-Service' },
  { id: 'compliance', label: 'Compliance Automation (SOC 2 / ISO 27001)' },
  { id: 'deception', label: 'Deception Technology' },
  { id: 'ir', label: 'Incident Response Retainer' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function EnterpriseDemo() {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    seats: '',
    notes: '',
    addOns: [] as string[],
  });
  const [status, setStatus] = useState<Status>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const toggleAddOn = (id: string) => {
    setForm((prev) => ({
      ...prev,
      addOns: prev.addOns.includes(id) ? prev.addOns.filter((a) => a !== id) : [...prev.addOns, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.email) return;
    setStatus('loading');
    setResultMessage('');
    setCheckoutUrl(null);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const successUrl = `${window.location.origin + baseUrl}/demo?quote=success`;
      const cancelUrl = `${window.location.origin + baseUrl}/demo?quote=cancel`;

      const res = await fetch('/api/billing/aegis/enterprise-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          seats: form.seats ? parseInt(form.seats, 10) : undefined,
          addOns: form.addOns,
          notes: form.notes,
          successUrl,
          cancelUrl,
        }),
      });
      const data = await res.json();
      const payload = data?.data ?? data;

      if (!res.ok) {
        setStatus('error');
        setResultMessage(payload?.error ?? 'Request failed. Please try again.');
        return;
      }

      if (payload?.url) {
        setCheckoutUrl(payload.url);
        setStatus('success');
        setResultMessage(
          'Your enterprise profile is ready. Complete payment to activate your Aegis environment.',
        );
      } else if (payload?.hostedInvoiceUrl) {
        setCheckoutUrl(payload.hostedInvoiceUrl);
        setStatus('success');
        setResultMessage(
          payload?.message ??
            'Your enterprise invoice has been sent. Review and pay to activate your Aegis environment.',
        );
      } else {
        setStatus('success');
        setResultMessage(
          payload?.message ??
            'Request received. A threat briefing specialist will contact you within 1 business day.',
        );
      }
    } catch {
      setStatus('error');
      setResultMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a0a] text-white">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[14px]">Aegis</span>
          <span className="text-[11px] text-gray-600 ml-1">/ Enterprise</span>
        </div>
        <Link href="/home">
          <button className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#f5f5f5]/20 bg-[#f5f5f5]/5 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#f5f5f5]" />
            <span className="text-[11px] font-semibold text-[#f5f5f5]/80 tracking-[0.1em] uppercase">
              Enterprise Briefing
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Schedule a private threat briefing.
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed max-w-xl">
            Our security engineers will assess your current posture and walk you through a live
            Aegis demo tailored to your threat profile. Zero commitment.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-[#110e0e]/80 border border-white/8 rounded-2xl p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#c9b787]/10 border border-[#c9b787]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-[#c9b787]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Request received</h2>
                <p className="text-gray-400 text-[14px] leading-relaxed">{resultMessage}</p>
              </div>
            </div>
            {checkoutUrl && (
              <a href={checkoutUrl}>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all text-[14px]">
                  Complete Enterprise Activation <ChevronRight className="w-4 h-4" />
                </button>
              </a>
            )}
            {!checkoutUrl && (
              <Link href="/">
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl transition-all text-[14px]">
                  Open SOC Dashboard <Shield className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#110e0e]/80 border border-white/8 rounded-2xl p-8 sm:p-10 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-2">
                  Company Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="Acme Corp"
                  className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5f5f5]/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5f5f5]/40 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-2">
                  Work Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="jane@acme.com"
                  className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5f5f5]/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-2">
                  Team Size
                </label>
                <select
                  value={form.seats}
                  onChange={(e) => setForm((p) => ({ ...p, seats: e.target.value }))}
                  className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#f5f5f5]/40 transition-colors"
                >
                  <option value="" className="bg-[#1a1515]">
                    Select range
                  </option>
                  <option value="10" className="bg-[#1a1515]">
                    1–25 people
                  </option>
                  <option value="50" className="bg-[#1a1515]">
                    26–100 people
                  </option>
                  <option value="250" className="bg-[#1a1515]">
                    101–500 people
                  </option>
                  <option value="1000" className="bg-[#1a1515]">
                    500+ people
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-3">
                Areas of Interest
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADD_ONS.map((addon) => (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddOn(addon.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-left transition-all text-[13px] ${
                      form.addOns.includes(addon.id)
                        ? 'border-[#f5f5f5]/40 bg-[#f5f5f5]/8 text-white'
                        : 'border-white/8 bg-white/2 text-gray-400 hover:border-white/15 hover:text-gray-300'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                        form.addOns.includes(addon.id)
                          ? 'border-[#f5f5f5] bg-[#f5f5f5]'
                          : 'border-gray-600'
                      }`}
                    >
                      {form.addOns.includes(addon.id) && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path
                            d="M1 3L3 5L7 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {addon.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-2">
                Current Security Challenges (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={4}
                placeholder="Tell us about your current threat landscape, stack, or pain points..."
                className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5f5f5]/40 transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f5f5f5]/8 border border-[#f5f5f5]/20">
                <AlertTriangle className="w-4 h-4 text-[#f5f5f5] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#f5f5f5]">{resultMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !form.companyName || !form.email}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all text-[14px] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Request Threat Briefing <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-600 text-center">
              No spam. No sales pressure. A security engineer will reach out within 1 business day.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
