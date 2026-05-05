import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import { Label } from '@szl-holdings/shared-ui/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Lock, Server, Shield, X, Zap } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { MarketingNav } from '../../components/marketing/MarketingNav';

const FEATURE_GROUPS: {
  group: string;
  rows: {
    label: string;
    free: string | boolean;
    pro: string | boolean;
    enterprise: string | boolean;
  }[];
}[] = [
  {
    group: 'Platform',
    rows: [
      { label: 'Users', free: '1', pro: 'Up to 10', enterprise: 'Unlimited' },
      { label: 'Connected Platforms', free: '1', pro: 'All 9', enterprise: 'All 9 + custom' },
      { label: 'API Access', free: false, pro: true, enterprise: true },
      {
        label: 'Data Exports',
        free: false,
        pro: 'CSV, JSON',
        enterprise: 'CSV, JSON, SFTP, custom',
      },
      { label: 'Real-time WebSocket Feeds', free: false, pro: true, enterprise: true },
      { label: 'Advanced AI Agents', free: false, pro: '5 agents', enterprise: 'Unlimited' },
    ],
  },
  {
    group: 'Ops Center',
    rows: [
      { label: 'Alert Inbox (cross-domain triage)', free: false, pro: true, enterprise: true },
      { label: 'SLA Dashboard (real telemetry SLOs)', free: false, pro: true, enterprise: true },
      {
        label: 'Health Score (composite ecosystem health)',
        free: false,
        pro: true,
        enterprise: true,
      },
      { label: 'Cost Analytics (usage × rate card)', free: false, pro: true, enterprise: true },
      { label: 'Release Feed (cross-app deployments)', free: false, pro: true, enterprise: true },
      { label: 'Daily Digest (role-aware briefing)', free: false, pro: true, enterprise: true },
      { label: 'Governance & Approvals audit trail', free: false, pro: false, enterprise: true },
      { label: 'Team & Access roster (RBAC)', free: false, pro: false, enterprise: true },
    ],
  },
  {
    group: 'Compliance & Support',
    rows: [
      { label: 'Audit Log Retention', free: '7 days', pro: '90 days', enterprise: 'Unlimited' },
      { label: 'Custom Integrations', free: false, pro: false, enterprise: true },
      { label: 'SSO / SAML', free: false, pro: false, enterprise: true },
      { label: 'On-Premise Deployment', free: false, pro: false, enterprise: true },
      { label: 'Dedicated Success Manager', free: false, pro: false, enterprise: true },
      { label: 'SLA Guarantee', free: false, pro: '99.9%', enterprise: '99.99%' },
      {
        label: 'Support Channel',
        free: 'Community',
        pro: 'Priority Email',
        enterprise: '24/7 Dedicated',
      },
    ],
  },
];

const FAQS = [
  {
    q: 'How does the free trial work?',
    a: 'The Command Pro free trial gives you 14 days of full access with no credit card required. At the end of the trial period, you can choose to subscribe or downgrade to the Initiate plan.',
  },
  {
    q: 'Can I change plans after signing up?',
    a: 'Yes. You can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately; billing is prorated.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data is retained for 30 days after cancellation. You can export all data at any time during your subscription using our CSV and JSON export tools.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Annual billing saves 17% compared to monthly. Additional volume discounts are available for Enterprise customers with multi-year commitments.',
  },
  {
    q: 'Is the platform GDPR and SOC 2 compliant?',
    a: 'We are SOC 2 Type II certified and fully GDPR compliant. All data is encrypted in transit and at rest. Detailed security documentation is available on request.',
  },
  {
    q: 'Can I deploy on-premise?',
    a: 'On-premise and private cloud deployments are available exclusively on the Ecosystem Enterprise plan. Contact sales to discuss your infrastructure requirements.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
        data-testid="faq-toggle"
      >
        <span className="font-medium text-white/90 group-hover:text-white transition-colors pr-8">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-white/60 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-white/20 mx-auto" />;
  return <span className="text-white/70 text-sm">{value}</span>;
}

function ContactSalesModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Message received. Our team will contact you within 1 business day.');
    setTimeout(onClose, 1500);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
          data-testid="modal-close"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-2xl font-bold mb-2">Contact Sales</h3>
        <p className="text-white/50 text-sm mb-6">
          Tell us about your organization and we'll be in touch within 1 business day.
        </p>
        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-medium">Message sent. Stand by.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">First Name</Label>
                <Input
                  required
                  className="bg-white/5 border-white/10 text-white h-10"
                  placeholder="Jane"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70 text-xs">Last Name</Label>
                <Input
                  required
                  className="bg-white/5 border-white/10 text-white h-10"
                  placeholder="Smith"
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white/70 text-xs">Work Email</Label>
              <Input
                required
                type="email"
                className="bg-white/5 border-white/10 text-white h-10"
                placeholder="jane@organization.com"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/70 text-xs">Organization</Label>
              <Input
                required
                className="bg-white/5 border-white/10 text-white h-10"
                placeholder="ACME Defense Corp"
                data-testid="input-org"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/70 text-xs">Team Size</Label>
              <select
                className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm"
                data-testid="select-team-size"
              >
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="200+">200+</option>
              </select>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-white text-black hover:bg-white/90 mt-2"
              data-testid="button-submit-sales"
            >
              Send Inquiry
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export function MarketingPricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');

  const handleCheckout = async (planId: string, tier: string) => {
    if (tier !== 'free' && !checkoutEmail) {
      toast.error('Please enter your email to start a trial');
      return;
    }
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/billing/command/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/a11oy/marketing/signup?success=true`,
          cancelUrl: `${window.location.origin}/a11oy/marketing/pricing`,
          email: checkoutEmail || undefined,
        }),
      });

      if (res.status === 503) {
        toast.error(
          'Pro subscriptions are not yet configured. Please contact sales@szlholdings.com for Pro access.',
        );
        setIsCheckoutLoading(false);
        return;
      }

      const data = await res.json();
      const url = data.url ?? data.data?.url;
      if (url?.startsWith('http')) {
        window.location.href = url;
      } else {
        toast.success('Trial initialized — redirecting to signup');
        setTimeout(() => {
          window.location.href = '/a11oy/marketing/signup?success=true';
        }, 1000);
      }
    } catch {
      toast.error('Failed to initialize checkout. Please try again.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const TRUST = [
    { icon: Shield, label: 'SOC 2 Type II Certified' },
    { icon: Lock, label: 'GDPR Compliant' },
    { icon: Server, label: 'End-to-End Encrypted' },
    { icon: Zap, label: '99.97% Avg. Uptime' },
  ];

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans">
      <MarketingNav />

      <AnimatePresence>
        {showSalesModal && <ContactSalesModal onClose={() => setShowSalesModal(false)} />}
      </AnimatePresence>

      {/* Hero */}
      <section className="pt-40 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10" />
        <div className="max-w-3xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6"
          >
            Predictable Pricing.
            <br />
            Infinite Scale.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60 mb-10 font-light"
          >
            Deploy the intelligence ecosystem exactly how your organization needs it.
          </motion.p>

          {/* Email capture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 max-w-sm mx-auto mb-10"
          >
            <Input
              type="email"
              placeholder="Work email"
              value={checkoutEmail}
              onChange={(e) => setCheckoutEmail(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white h-11"
              data-testid="input-checkout-email"
            />
          </motion.div>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-white/50'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20 relative"
              data-testid="toggle-billing"
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full"
                animate={{ x: isAnnual ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-white/50'}`}>
              Annually <span className="text-emerald-400 text-xs ml-1">Save 17%</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-1">Initiate</h3>
              <p className="text-white/50 text-sm">For individuals exploring the platform.</p>
            </div>
            <div className="text-5xl font-bold mb-8">
              $0<span className="text-lg text-white/40 font-normal">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> 1 User
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> Access to 1 Platform
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> 7-day audit log
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> Community support
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full h-11 border-white/20 text-white hover:bg-white/5"
              onClick={() => handleCheckout('price_free', 'free')}
              data-testid="button-start-free"
            >
              Start Free
            </Button>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-2xl bg-white/[0.04] border border-blue-500/30 flex flex-col relative shadow-[0_0_60px_rgba(59,130,246,0.1)]"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-1 text-blue-100">Command Pro</h3>
              <p className="text-blue-200/50 text-sm">For operating teams and professionals.</p>
            </div>
            <div className="text-5xl font-bold mb-2">
              ${isAnnual ? '82' : '99'}
              <span className="text-lg text-white/40 font-normal">/mo</span>
            </div>
            {isAnnual && <p className="text-emerald-400 text-xs mb-6">Billed annually — $984/yr</p>}
            {!isAnnual && <div className="mb-6" />}
            <ul className="space-y-3 mb-8 flex-1 text-sm text-blue-100/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Up to 10 Users
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> All 9 Platforms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> API Access + Webhooks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> 5 AI Agents
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Ops Center: alerts, SLA,
                health, costs, releases, digest
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> 90-day audit log
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> 99.9% SLA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Priority email support
              </li>
            </ul>
            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() =>
                handleCheckout(isAnnual ? 'command-pro-annual' : 'command-pro-monthly', 'pro')
              }
              disabled={isCheckoutLoading}
              data-testid="button-start-trial"
            >
              {isCheckoutLoading ? 'Initializing...' : 'Start 14-Day Free Trial'}
            </Button>
            <p className="text-center text-white/30 text-xs mt-3">No credit card required</p>
          </motion.div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-1">Ecosystem Enterprise</h3>
              <p className="text-white/50 text-sm">For large-scale institutional deployments.</p>
            </div>
            <div className="text-5xl font-bold mb-8">Custom</div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> Unlimited Users
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> Unlimited AI Agents
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> Full Ops Center +
                Governance & Team admin
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> Custom Integrations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> SSO / SAML
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> On-Premise Deployment
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> 99.99% SLA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/30 shrink-0" /> 24/7 Dedicated Support
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full h-11 border-white/20 text-white hover:bg-white/5"
              onClick={() => setShowSalesModal(true)}
              data-testid="button-contact-sales"
            >
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="pb-24 max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight text-center mb-12"
        >
          Full Feature Comparison
        </motion.h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left p-4 pl-6 text-white/50 font-medium w-1/2">Feature</th>
                <th className="text-center p-4 text-white/70 font-semibold">Initiate</th>
                <th className="text-center p-4 text-blue-400 font-semibold">Command Pro</th>
                <th className="text-center p-4 text-white/70 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_GROUPS.map((group) => (
                <Fragment key={group.group}>
                  <tr className="bg-white/[0.03]">
                    <td
                      colSpan={4}
                      className="p-3 pl-6 text-xs uppercase tracking-wider text-white/50 font-semibold"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.rows.map((f, i) => (
                    <tr
                      key={`${group.group}-${i}`}
                      className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                      data-testid={`row-feature-${f.label
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')}`}
                    >
                      <td className="p-4 pl-6 text-white/80">{f.label}</td>
                      <td className="p-4 text-center">
                        <FeatureCell value={f.free} />
                      </td>
                      <td className="p-4 text-center">
                        <FeatureCell value={f.pro} />
                      </td>
                      <td className="p-4 text-center">
                        <FeatureCell value={f.enterprise} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="pb-24 max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center"
            >
              <Icon className="w-6 h-6 text-white/40" />
              <span className="text-xs text-white/60 font-medium leading-snug">{label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-32 max-w-3xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight mb-12"
        >
          Frequently Asked
        </motion.h2>
        <div>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
