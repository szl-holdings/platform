import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { motion } from 'framer-motion';
import {
  Activity,
  Anchor,
  ArrowRight,
  BrainCircuit,
  Briefcase,
  Building2,
  Command as CmdIcon,
  Gavel,
  Shield,
  Users,
} from 'lucide-react';
import { Link } from 'wouter';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { MarketingNav } from '../../components/marketing/MarketingNav';
import { OPS_FEATURE_LIST } from './ops/data';

export function MarketingHome() {
  const apps = [
    {
      id: 'aegis',
      name: 'Aegis',
      icon: Shield,
      desc: 'Unified defense & intelligence command',
      color: 'text-[#3b82f6]',
    },
    {
      id: 'vessels',
      name: 'Vessels',
      icon: Anchor,
      desc: 'Maritime fleet management & routing',
      color: 'text-[#0ea5e9]',
    },
    {
      id: 'terra',
      name: 'Terra',
      icon: Building2,
      desc: 'Real estate intelligence & forecasting',
      color: 'text-[#40856a]',
    },
    {
      id: 'lyte',
      name: 'Lyte',
      icon: Activity,
      desc: 'Autonomous incident detection & AIOps',
      color: 'text-[#d4a054]',
    },
    {
      id: 'prism',
      name: 'PRISM Counsel',
      icon: Gavel,
      desc: 'Legal matter command & analysis',
      color: 'text-[#f59e0b]',
    },
    {
      id: 'szl-holdings',
      name: 'SZL Holdings',
      icon: Briefcase,
      desc: 'Executive portfolio intelligence',
      color: 'text-[#b8bfcb]',
    },
    {
      id: 'stephen',
      name: 'Stephen',
      icon: Users,
      desc: 'Personal executive command',
      color: 'text-white',
    },
    {
      id: 'command',
      name: 'Command',
      icon: CmdIcon,
      desc: 'Ecosystem orchestration & pulse',
      color: 'text-purple-500',
    },
    {
      id: 'carlota-jo',
      name: 'Carlota Jo',
      icon: BrainCircuit,
      desc: 'Consulting & portfolio advisory',
      color: 'text-pink-500',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-black text-white selection:bg-white/30 font-sans">
      <MarketingNav />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
              Ecosystem Online. 10 Platforms Operational.
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]">
              The OS for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                Global Operations
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
              SZL Command is the unified intelligence layer for defense, maritime, real estate, and
              enterprise operations. Powering the world's most critical infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/marketing/signup">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-white text-black hover:bg-white/90 rounded-none w-full sm:w-auto"
                >
                  Initialize Command
                </Button>
              </Link>
              <Link href="/marketing/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/5 rounded-none w-full sm:w-auto"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Showcase */}
      <section className="py-32 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Ten Specialized Domains.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto font-light">
              Purpose-built platforms sharing a unified ontology. Intelligence flows seamlessly
              across your entire operational footprint.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/marketing/apps/${app.id}`}
                  className="group block p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300 h-full"
                >
                  <app.icon
                    className={`w-10 h-10 mb-6 ${app.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />
                  <h3 className="text-2xl font-semibold mb-3 tracking-tight">{app.name}</h3>
                  <p className="text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
                    {app.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ops Center */}
      <section className="py-32 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-white/5 border border-white/10 mb-6 backdrop-blur-sm text-white/70">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              Command Ops Center
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              One Pane for the Whole Operation.
            </h2>
            <p className="text-xl text-white/50 max-w-3xl mx-auto font-light">
              Replace PagerDuty, Backstage, Nobl9, and your spreadsheet of approvals. Eight ops
              surfaces, all reading from the same source-of-record tables that power the platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {OPS_FEATURE_LIST.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/marketing/ops/${feature.slug}`}
                    className="group block p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 h-full"
                    data-testid={`link-ops-${feature.slug}`}
                  >
                    <Icon
                      className="w-7 h-7 mb-4 opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ color: feature.accent }}
                    />
                    <h3 className="text-lg font-semibold mb-2 tracking-tight">{feature.name}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-3 group-hover:text-white/70 transition-colors">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-xs text-white/40 group-hover:text-white/70 transition-colors">
                      Learn more <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/marketing/pricing">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
                See Ops Center Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Scale */}
      <section className="py-32 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="text-6xl font-bold mb-4">99.99%</div>
              <div className="text-white/50 font-medium tracking-wide uppercase text-sm">
                Uptime SLA
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-6xl font-bold mb-4">SOC2</div>
              <div className="text-white/50 font-medium tracking-wide uppercase text-sm">
                Type II Certified
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-6xl font-bold mb-4">&lt;50ms</div>
              <div className="text-white/50 font-medium tracking-wide uppercase text-sm">
                Global Latency
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-950 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <NewsletterSubscribe
              utmSource="command"
              variant="inline"
              heading="Intelligence briefings from SZL Command"
              subheading="Insights on governed AI, unified operations, and the platform powering high-consequence decisions — direct from the founding team."
            />
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
