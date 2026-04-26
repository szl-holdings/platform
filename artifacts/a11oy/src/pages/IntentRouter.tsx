import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const VERTICALS = [
  { id: 'maritime', label: 'Maritime', color: '#8a8a8a' },
  { id: 'cyber', label: 'Cyber', color: '#f5f5f5' },
  { id: 'legal', label: 'Legal', color: '#c9b787' },
  { id: 'revenue', label: 'Revenue', color: '#b08d52' },
  { id: 'defense', label: 'Defense', color: '#f5f5f5' },
  { id: 'real-estate', label: 'Real Estate', color: '#c9b787' },
  { id: 'advisory', label: 'Advisory', color: '#8a8a8a' },
  { id: 'core', label: 'Core', color: '#5e5e5e' },
];

const DEMO_INTENTS = [
  { id: 'i01', text: 'Flag Horizon Star — delayed ETA and fuel anomaly. Recommend port alternatives.', domain: 'maritime', confidence: 0.96, priority: 'high', entities: ['vessel:Horizon Star', 'signal:eta_delay', 'signal:fuel_anomaly'], routed: ['Cascade Navigator', 'Pipeline Oracle'] },
  { id: 'i02', text: 'TG-Ember C2 traffic on 8080. Isolate affected hosts and draft incident report.', domain: 'cyber', confidence: 0.98, priority: 'critical', entities: ['threat:TG-Ember', 'ioc:c2_8080', 'action:isolate'], routed: ['Guardian', 'MirrorEval'] },
  { id: 'i03', text: 'Talbot matter deadline in 48h. Opposing counsel has filed late 3 times. Prepare motion.', domain: 'legal', confidence: 0.94, priority: 'high', entities: ['matter:Talbot', 'deadline:48h', 'pattern:late_filing'], routed: ['Counsel Sentinel'] },
  { id: 'i04', text: 'Pipeline velocity down 22% this quarter. Surface top 3 deal acceleration interventions.', domain: 'revenue', confidence: 0.91, priority: 'medium', entities: ['metric:pipeline_velocity', 'delta:-22%', 'domain:revenue'], routed: ['Pipeline Oracle', 'MirrorEval'] },
  { id: 'i05', text: 'Plano industrial cap rates moved 18bps. Recommend portfolio rebalancing actions.', domain: 'real-estate', confidence: 0.89, priority: 'medium', entities: ['market:Plano', 'signal:cap_rate', 'delta:+18bps'], routed: ['DOMAINE Analyst'] },
  { id: 'i06', text: 'SIGINT pattern matches prior GROM adversary signature. Assess threat to contractor assets.', domain: 'defense', confidence: 0.97, priority: 'critical', entities: ['signal:sigint', 'adversary:GROM', 'asset:contractor'], routed: ['Aegis Sentinel', 'Guardian'] },
  { id: 'i07', text: 'Prepare Q2 board deck for Carlota Jo clients — highlight portfolio performance and next steps.', domain: 'advisory', confidence: 0.88, priority: 'low', entities: ['client:Carlota_Jo', 'doc:board_deck', 'period:Q2'], routed: ['Carlota Jo Advisor'] },
  { id: 'i08', text: 'Proof chain verification failed for workcell WC-0041. Investigate and restore chain integrity.', domain: 'core', confidence: 0.99, priority: 'high', entities: ['workcell:WC-0041', 'signal:proof_fail', 'action:restore'], routed: ['Fabric Watchdog', 'MirrorEval'] },
  { id: 'i09', text: 'MV Cascade Endeavor — 3 crew members flagged for OFAC. Advise on port entry.', domain: 'maritime', confidence: 0.95, priority: 'critical', entities: ['vessel:Cascade_Endeavor', 'check:OFAC', 'decision:port_entry'], routed: ['Cascade Navigator', 'Counsel Sentinel'] },
  { id: 'i10', text: 'DNS exfiltration pattern detected on APAC segment. Contain and notify CISO.', domain: 'cyber', confidence: 0.96, priority: 'high', entities: ['technique:dns_exfil', 'segment:APAC', 'notify:CISO'], routed: ['Guardian'] },
  { id: 'i11', text: 'Opposing counsel in Meridian case missed 2 discovery deadlines. File motion to compel.', domain: 'legal', confidence: 0.93, priority: 'high', entities: ['matter:Meridian', 'deadline:discovery', 'motion:compel'], routed: ['Counsel Sentinel'] },
  { id: 'i12', text: 'Top 5 enterprise accounts showing churn signals. Surface recommended interventions.', domain: 'revenue', confidence: 0.90, priority: 'high', entities: ['signal:churn', 'segment:enterprise', 'count:5'], routed: ['Pipeline Oracle', 'Cascade Navigator'] },
  { id: 'i13', text: 'Austin multifamily deals — cap rate compression accelerating. Flag for portfolio review.', domain: 'real-estate', confidence: 0.87, priority: 'medium', entities: ['market:Austin', 'asset:multifamily', 'signal:cap_compression'], routed: ['DOMAINE Analyst'] },
  { id: 'i14', text: 'Lateral movement detected from compromised contractor account in defense subnet.', domain: 'defense', confidence: 0.98, priority: 'critical', entities: ['technique:lateral_movement', 'account:contractor', 'subnet:defense'], routed: ['Aegis Sentinel', 'Guardian'] },
  { id: 'i15', text: 'Run weekly MirrorEval sweep across all active workcells and surface confidence drops.', domain: 'core', confidence: 0.99, priority: 'medium', entities: ['sweep:mirroreval', 'scope:all_workcells', 'signal:confidence_drop'], routed: ['Fabric Watchdog', 'MirrorEval'] },
];

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

export function IntentRouter() {
  const [selected, setSelected] = useState<string>(DEMO_INTENTS[0].id);
  const [animating, setAnimating] = useState(false);
  const [shownEntities, setShownEntities] = useState<number>(0);
  const [shownRoutes, setShownRoutes] = useState<number>(0);

  const intent = DEMO_INTENTS.find(i => i.id === selected)!;
  const vertical = VERTICALS.find(v => v.id === intent.domain)!;

  useEffect(() => {
    setAnimating(true);
    setShownEntities(0);
    setShownRoutes(0);
    const t1 = setTimeout(() => {
      let e = 0;
      const ei = setInterval(() => {
        e++;
        setShownEntities(e);
        if (e >= intent.entities.length) clearInterval(ei);
      }, 200);
    }, 300);
    const t2 = setTimeout(() => {
      let r = 0;
      const ri = setInterval(() => {
        r++;
        setShownRoutes(r);
        if (r >= intent.routed.length) clearInterval(ri);
      }, 300);
    }, 900);
    const t3 = setTimeout(() => setAnimating(false), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [selected, intent.entities.length, intent.routed.length]);

  const priorityColor = intent.priority === 'critical' ? '#f5f5f5' : intent.priority === 'high' ? '#c9b787' : intent.priority === 'medium' ? '#8a8a8a' : '#5e5e5e';

  return (
    <Layout>
      <PageHeader
        label="INTENT ROUTER"
        title="Intent Classification & Routing"
        subtitle="Natural language intents classified by domain, entities extracted, priority assigned, and routed to the right operator agents."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="DEMO INTENTS" value={DEMO_INTENTS.length} sub="across 8 verticals" accent={T.accent} />
        <KpiCard label="DOMAINS" value={VERTICALS.length} sub="coverage" accent={T.accent} />
        <KpiCard label="AVG CONFIDENCE" value="93.5%" sub="classification" accent={T.accent} />
        <KpiCard label="AVG ROUTING TIME" value="42ms" sub="domain + entity" accent={T.dim} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Intent library */}
        <div>
          <SectionTitle>Intent Library</SectionTitle>
          <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-1">
            {DEMO_INTENTS.map(intent => {
              const v = VERTICALS.find(vv => vv.id === intent.domain)!;
              const pc = intent.priority === 'critical' ? '#f5f5f5' : intent.priority === 'high' ? '#c9b787' : '#8a8a8a';
              return (
                <button
                  key={intent.id}
                  onClick={() => setSelected(intent.id)}
                  className="text-left rounded-lg p-2.5 transition-all"
                  style={{
                    background: selected === intent.id ? `${v.color}12` : T.surface,
                    border: `1px solid ${selected === intent.id ? v.color + '40' : T.border}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${v.color}18`, color: v.color }}>{v.label}</span>
                    <span className="text-[9px] font-mono" style={{ color: pc }}>{intent.priority}</span>
                  </div>
                  <div className="text-[10px] leading-snug" style={{ color: selected === intent.id ? T.text : T.dim }}>
                    {intent.text.slice(0, 72)}{intent.text.length > 72 ? '…' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classification panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>INCOMING INTENT</div>
            <p className="text-sm mb-3" style={{ color: T.text }}>{intent.text}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Domain confidence */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>DOMAIN CONFIDENCE</div>
                <div className="flex flex-col gap-2">
                  {VERTICALS.map(v => (
                    <div key={v.id}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px]" style={{ color: v.id === intent.domain ? v.color : T.muted }}>{v.label}</span>
                      </div>
                      <ConfidenceBar
                        value={v.id === intent.domain ? intent.confidence : Math.random() * 0.15}
                        color={v.id === intent.domain ? v.color : 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col gap-4">
                {/* Priority */}
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>PRIORITY ASSIGNED</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: priorityColor }} />
                    <span className="text-sm font-mono uppercase font-bold" style={{ color: priorityColor }}>{intent.priority}</span>
                  </div>
                </div>

                {/* Entities */}
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>EXTRACTED ENTITIES</div>
                  <div className="flex flex-col gap-1">
                    <AnimatePresence>
                      {intent.entities.slice(0, shownEntities).map((ent, i) => (
                        <motion.div
                          key={`${selected}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] font-mono px-2 py-1 rounded"
                          style={{ background: `${vertical.color}12`, color: vertical.color, border: `1px solid ${vertical.color}25` }}
                        >
                          {ent}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Routing paths */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>ROUTING → OPERATOR AGENTS</div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {intent.routed.slice(0, shownRoutes).map((agent, i) => (
                    <motion.div
                      key={`${selected}-route-${i}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: `${vertical.color}12`, border: `1px solid ${vertical.color}30` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: vertical.color }} />
                      <span className="text-xs font-medium" style={{ color: vertical.color }}>{agent}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {shownRoutes === 0 && animating && (
                  <div className="text-[10px] font-mono animate-pulse" style={{ color: T.muted }}>routing…</div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: T.border }} />
                <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                  {Math.round(intent.confidence * 100)}% confidence · {intent.domain} domain
                </span>
                <div className="h-px flex-1" style={{ background: T.border }} />
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {VERTICALS.slice(0, 6).map(v => {
              const count = DEMO_INTENTS.filter(i => i.domain === v.id).length;
              return (
                <Card key={v.id}>
                  <div className="text-[9px] font-mono uppercase" style={{ color: T.muted }}>{v.label}</div>
                  <div className="text-xl font-mono font-bold mt-1" style={{ color: v.color }}>{count}</div>
                  <div className="text-[9px]" style={{ color: T.muted }}>demo intents</div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
