import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const GOLD = 'var(--color-gold)';
const INK_900 = 'var(--color-ink-900)';
const INK_600 = 'var(--color-ink-600)';
const INK_500 = 'var(--color-ink-500)';
const CREAM = 'var(--color-cream-warm)';
const STONE_200 = 'var(--color-stone-200)';

const ENGAGEMENT_TYPES = [
  {
    id: 'residential-search',
    label: 'Residential Property Search',
    desc: 'Curated shortlist of off-market and on-market properties. Managed viewings, negotiation, and transaction support.',
    timeline: '4–12 weeks',
    fee: 'By retained arrangement',
    ideal: 'Primary residences, second homes, relocation buyers',
  },
  {
    id: 'commercial-advisory',
    label: 'Commercial Property Advisory',
    desc: 'Strategic advisory for commercial acquisitions, portfolio review, or lease negotiations. Full transaction management available.',
    timeline: 'Ongoing retainer or project-based',
    fee: 'Retainer from £2,500/month',
    ideal: 'Investors, developers, occupiers',
  },
  {
    id: 'relocation',
    label: 'Executive Relocation',
    desc: 'End-to-end relocation service for executives and high-net-worth individuals. Property, schools, community, onboarding.',
    timeline: '6–16 weeks',
    fee: 'Fixed engagement fee',
    ideal: 'Senior executives, international moves, family relocations',
  },
  {
    id: 'portfolio-review',
    label: 'Portfolio Strategy Review',
    desc: 'Comprehensive review of existing property holdings with strategic recommendations for optimisation, disposal, or acquisition.',
    timeline: '3–6 weeks',
    fee: 'From £4,500 fixed',
    ideal: 'High-net-worth individuals, family offices, trustees',
  },
  {
    id: 'interior-project',
    label: 'Interior Design Project',
    desc: 'Full interior design and project management. From concept through to completion. Rosa leads every project personally.',
    timeline: 'Dependent on scope',
    fee: 'Percentage of project value',
    ideal: 'Residential or boutique commercial spaces',
  },
  {
    id: 'other',
    label: 'Something Else',
    desc: 'Not sure which fits? Describe your situation and Rosa will determine the right approach.',
    timeline: 'TBD',
    fee: 'Discussed at initial call',
    ideal: 'Complex or multi-layered situations',
  },
];

const PROCESS = [
  {
    step: '01',
    title: 'Submit your enquiry',
    desc: 'Complete the form below. Rosa reviews every submission personally — typically within 24 hours on business days.',
  },
  {
    step: '02',
    title: 'Initial consultation',
    desc: 'A 30-minute call to understand your situation, priorities, and whether Carlota Jo is the right fit for your needs.',
  },
  {
    step: '03',
    title: 'Engagement proposal',
    desc: "If there's a fit, Rosa will present a clear proposal — scope, timeline, fee, and what you can expect from the engagement.",
  },
  {
    step: '04',
    title: 'Retained engagement',
    desc: 'Once retained, Rosa begins immediately. You will have direct access and a single point of accountability throughout.',
  },
];

const ASSURANCES = [
  {
    icon: Lock,
    label: 'Full discretion',
    desc: 'Every enquiry is treated with complete confidentiality. Your details are never shared.',
  },
  {
    icon: CheckCircle,
    label: 'No obligation',
    desc: 'The initial consultation is exploratory. There is no pressure to proceed.',
  },
  {
    icon: Shield,
    label: 'Principal-led only',
    desc: 'Rosa manages every engagement personally. No associate hand-offs.',
  },
  {
    icon: Clock,
    label: '24-hour response',
    desc: 'All enquiries receive a personal response within one business day.',
  },
];

export default function EngagementIntakePage() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    timeline: '',
    budget: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'How quickly will I hear back?',
      a: 'Rosa reviews every enquiry personally and responds within one business day. For urgent matters, please note that in your message.',
    },
    {
      q: 'Is the initial consultation charged?',
      a: 'No. The initial 30-minute call is complimentary and without obligation. It exists so both parties can assess fit before any commitment is made.',
    },
    {
      q: 'What areas does Carlota Jo cover?',
      a: 'Primarily London and the Home Counties for residential. For commercial advisory and portfolio review, we work nationally and internationally for the right client.',
    },
    {
      q: 'Can I engage Carlota Jo if I already have an agent?',
      a: 'Yes. We often work as a second layer of strategic oversight — reviewing shortlists, negotiating terms, or providing a second opinion on transactions already in progress.',
    },
    {
      q: 'How are fees structured?',
      a: 'Fees vary by engagement type. Residential search is typically a retained fee plus a success fee at completion. Commercial advisory is retainer-based. Portfolio review is fixed-fee. All fees are discussed transparently before any commitment.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <Header />
      <div className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24" style={{ borderBottom: `1px solid ${STONE_200}` }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="max-w-2xl"
            >
              <p
                className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6"
                style={{ color: GOLD }}
              >
                Begin an Engagement
              </p>
              <h1
                className="font-serif font-light leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK_900 }}
              >
                The right way to start.
                <br />
                <span style={{ fontStyle: 'italic' }}>With the right information.</span>
              </h1>
              <p className="text-base font-light leading-relaxed" style={{ color: INK_600 }}>
                Every Carlota Jo engagement begins with a direct conversation — no automated intake,
                no junior staff. Before that call, a brief form helps Rosa understand your situation
                so the initial consultation is immediately productive.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16" style={{ borderBottom: `1px solid ${STONE_200}` }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <p
              className="text-[11px] font-medium tracking-[0.3em] uppercase mb-10"
              style={{ color: INK_500 }}
            >
              How it works
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {PROCESS.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <p
                    className="text-[11px] tracking-[0.2em] uppercase mb-3"
                    style={{ color: GOLD }}
                  >
                    {step.step}
                  </p>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: INK_900 }}>
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed font-light" style={{ color: INK_600 }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Engagement Type Selection */}
        <section className="py-16" style={{ borderBottom: `1px solid ${STONE_200}` }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <p
              className="text-[11px] font-medium tracking-[0.3em] uppercase mb-3"
              style={{ color: INK_500 }}
            >
              Step 1
            </p>
            <h2
              className="font-serif font-light mb-8"
              style={{ fontSize: '1.5rem', color: INK_900 }}
            >
              What best describes your enquiry?
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {ENGAGEMENT_TYPES.map((type, i) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  onClick={() => setSelectedType(type.id)}
                  className="text-left p-5 rounded-xl border transition-all"
                  style={{
                    border:
                      selectedType === type.id ? `1.5px solid ${GOLD}` : `1px solid ${STONE_200}`,
                    background: selectedType === type.id ? 'rgba(196,170,126,0.05)' : 'white',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1" style={{ color: INK_900 }}>
                        {type.label}
                      </p>
                      <p
                        className="text-xs font-light leading-relaxed mb-3"
                        style={{ color: INK_600 }}
                      >
                        {type.desc}
                      </p>
                      <div className="flex gap-4">
                        <span
                          className="text-[11px] flex items-center gap-1"
                          style={{ color: INK_500 }}
                        >
                          <Clock className="h-3 w-3" />
                          {type.timeline}
                        </span>
                        <span className="text-[11px]" style={{ color: INK_500 }}>
                          {type.fee}
                        </span>
                      </div>
                    </div>
                    {selectedType === type.id && (
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-16" style={{ borderBottom: `1px solid ${STONE_200}` }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <p
                  className="text-[11px] font-medium tracking-[0.3em] uppercase mb-3"
                  style={{ color: INK_500 }}
                >
                  Step 2
                </p>
                <h2
                  className="font-serif font-light mb-4"
                  style={{ fontSize: '1.5rem', color: INK_900 }}
                >
                  Tell Rosa about your situation.
                </h2>
                <p className="text-sm font-light leading-relaxed mb-8" style={{ color: INK_600 }}>
                  The more context you can provide, the more productive your initial consultation
                  will be. All information is treated with complete confidentiality.
                </p>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl p-8 text-center"
                    style={{
                      background: 'rgba(196,170,126,0.07)',
                      border: `1px solid rgba(196,170,126,0.2)`,
                    }}
                  >
                    <CheckCircle className="h-10 w-10 mx-auto mb-4" style={{ color: GOLD }} />
                    <h3 className="text-base font-semibold mb-2" style={{ color: INK_900 }}>
                      Enquiry received
                    </h3>
                    <p className="text-sm font-light" style={{ color: INK_600 }}>
                      Rosa will respond personally within one business day. You will receive a
                      confirmation by email shortly.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: INK_900 }}
                        >
                          Full name *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full px-4 py-3 text-sm rounded-lg border outline-none transition-all"
                          style={{ borderColor: STONE_200, color: INK_900, background: 'white' }}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: INK_900 }}
                        >
                          Email address *
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full px-4 py-3 text-sm rounded-lg border outline-none transition-all"
                          style={{ borderColor: STONE_200, color: INK_900, background: 'white' }}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: INK_900 }}
                        >
                          Phone (optional)
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          className="w-full px-4 py-3 text-sm rounded-lg border outline-none"
                          style={{ borderColor: STONE_200, color: INK_900, background: 'white' }}
                          placeholder="+44 ..."
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: INK_900 }}
                        >
                          Ideal timeline
                        </label>
                        <select
                          value={form.timeline}
                          onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                          className="w-full px-4 py-3 text-sm rounded-lg border outline-none"
                          style={{
                            borderColor: STONE_200,
                            color: form.timeline ? INK_900 : INK_500,
                            background: 'white',
                          }}
                        >
                          <option value="">Select timeline</option>
                          <option>As soon as possible</option>
                          <option>Within 3 months</option>
                          <option>3–6 months</option>
                          <option>6–12 months</option>
                          <option>No fixed timeline</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: INK_900 }}
                      >
                        Budget range (optional)
                      </label>
                      <select
                        value={form.budget}
                        onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                        className="w-full px-4 py-3 text-sm rounded-lg border outline-none"
                        style={{
                          borderColor: STONE_200,
                          color: form.budget ? INK_900 : INK_500,
                          background: 'white',
                        }}
                      >
                        <option value="">Prefer not to say at this stage</option>
                        <option>Under £500,000</option>
                        <option>£500,000 – £1,000,000</option>
                        <option>£1m – £2.5m</option>
                        <option>£2.5m – £5m</option>
                        <option>Over £5m</option>
                        <option>Not applicable (advisory/design)</option>
                      </select>
                    </div>
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: INK_900 }}
                      >
                        Your situation *
                      </label>
                      <textarea
                        required
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={5}
                        className="w-full px-4 py-3 text-sm rounded-lg border outline-none resize-none"
                        style={{ borderColor: STONE_200, color: INK_900, background: 'white' }}
                        placeholder="Describe your situation, what you're looking for, and anything else that would help Rosa prepare for your conversation..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-opacity hover:opacity-85"
                      style={{ background: INK_900, color: 'white' }}
                    >
                      Submit enquiry <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>

              {/* Assurances + FAQ */}
              <div className="space-y-8">
                <div
                  className="rounded-xl p-6"
                  style={{
                    background: 'rgba(196,170,126,0.06)',
                    border: `1px solid rgba(196,170,126,0.18)`,
                  }}
                >
                  <p
                    className="text-[11px] font-medium tracking-[0.3em] uppercase mb-5"
                    style={{ color: GOLD }}
                  >
                    Our assurances
                  </p>
                  <div className="space-y-4">
                    {ASSURANCES.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex gap-3">
                          <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
                          <div>
                            <p className="text-sm font-medium mb-0.5" style={{ color: INK_900 }}>
                              {item.label}
                            </p>
                            <p className="text-xs font-light" style={{ color: INK_600 }}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p
                    className="text-[11px] font-medium tracking-[0.3em] uppercase mb-5"
                    style={{ color: INK_500 }}
                  >
                    Common questions
                  </p>
                  <div className="space-y-1">
                    {faqs.map((faq, i) => (
                      <div key={i} style={{ borderBottom: `1px solid ${STONE_200}` }}>
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                          className="w-full text-left flex items-center justify-between py-4 gap-4"
                        >
                          <p className="text-sm font-medium" style={{ color: INK_900 }}>
                            {faq.q}
                          </p>
                          {expandedFaq === i ? (
                            <ChevronUp className="h-4 w-4 shrink-0" style={{ color: INK_500 }} />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: INK_500 }} />
                          )}
                        </button>
                        {expandedFaq === i && (
                          <p
                            className="pb-4 text-sm font-light leading-relaxed"
                            style={{ color: INK_600 }}
                          >
                            {faq.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ background: 'white', border: `1px solid ${STONE_200}` }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: INK_900 }}>
                    Prefer to speak directly?
                  </p>
                  <p className="text-xs font-light mb-3" style={{ color: INK_600 }}>
                    For introductions from existing clients or advisors, Rosa is reachable by phone
                    during business hours.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: GOLD }}
                  >
                    Contact page <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
