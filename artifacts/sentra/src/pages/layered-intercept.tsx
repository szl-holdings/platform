import { useState, useEffect } from 'react';
import { useApiQuery } from '@/lib/use-api-query';
import { api } from '@/lib/api';

const T = {
  bg: '#060608',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f0',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  red: '#ef4444',
  orange: '#f97316',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
};

interface Layer {
  id: string;
  num: number;
  name: string;
  description: string;
  color: string;
  intercept_time_hours: number;
  threat_count: number;
  blocked: number;
  controls: string[];
  cortex_note: string;
  active_intercepts: { id: string; threat: string; status: string; tti: string }[];
}

const LAYERS: Layer[] = [
  {
    id: 'perimeter', num: 1,
    name: 'Perimeter Layer',
    description: 'Network boundary, ingress/egress, DNS, firewall, WAF — the outer ring. Longest intercept window; cheapest to block here.',
    color: '#ef4444',
    intercept_time_hours: 18,
    threat_count: 47, blocked: 44,
    controls: ['WAF rule sets', 'DNS filtering', 'Ingress rate limiting', 'GeoIP blocks', 'DDoS mitigation'],
    cortex_note: 'Cortex predicts 2 adversary reconnaissance campaigns will reach this layer in the next 24h. Deception honeypots pre-staged.',
    active_intercepts: [
      { id: 'pi-001', threat: 'APT29 Recon Sweep', status: 'intercepted', tti: '0.5h' },
      { id: 'pi-002', threat: 'Lazarus Spear-Phish Delivery', status: 'decoyed', tti: '2h' },
    ],
  },
  {
    id: 'identity', num: 2,
    name: 'Identity Layer',
    description: 'Authentication, authorization, MFA, SSO, service accounts, credential stores. 82:1 machine-to-human ratio means most attack surface is non-human.',
    color: '#f59e0b',
    intercept_time_hours: 11,
    threat_count: 23, blocked: 20,
    controls: ['MFA enforcement', 'Credential rotation', 'Privileged access management', 'Zero-trust identity verification', 'Service account hardening'],
    cortex_note: 'Cortex identified a pass-the-hash path via 3 stale service accounts. Credential rotation countermove awaiting approval (Art. IX §2).',
    active_intercepts: [
      { id: 'id-001', threat: 'APT29 Pass-the-Hash', status: 'countermove-pending', tti: '6h' },
      { id: 'id-002', threat: 'FIN7 Credential Stuffing', status: 'blocked', tti: '0.2h' },
    ],
  },
  {
    id: 'workload', num: 3,
    name: 'Workload Layer',
    description: 'Running processes, containers, VMs, serverless functions. Lateral movement and privilege escalation typically happen here.',
    color: '#3b82f6',
    intercept_time_hours: 6,
    threat_count: 15, blocked: 12,
    controls: ['Runtime behavioral monitoring', 'Container microsegmentation', 'Process allow-listing', 'EDR coverage', 'Kernel patch enforcement'],
    cortex_note: 'APT41 privilege escalation path via vulnerable kernel module flagged. 52h intercept window. Patch pre-staging proposed.',
    active_intercepts: [
      { id: 'wl-001', threat: 'APT41 Kernel Exploit', status: 'monitoring', tti: '52h' },
      { id: 'wl-002', threat: 'Cryptominer Injection', status: 'blocked', tti: '0h' },
    ],
  },
  {
    id: 'data', num: 4,
    name: 'Data Layer',
    description: 'Databases, object storage, file shares, secrets vaults. Exfiltration and destruction impact happens here — the last controlled intercept point.',
    color: '#8b5cf6',
    intercept_time_hours: 3,
    threat_count: 8, blocked: 7,
    controls: ['Data loss prevention', 'Encryption at rest', 'Vault access controls', 'Exfiltration rate limits', 'Immutable backups'],
    cortex_note: 'FIN7 collection path targeting cloud storage modeled. 38h window. Honeypot data seeding pre-staged at highest-value buckets.',
    active_intercepts: [
      { id: 'dl-001', threat: 'FIN7 S3 Exfiltration', status: 'decoyed', tti: '38h' },
      { id: 'dl-002', threat: 'Sandworm Wiper Scenario', status: 'backup-staged', tti: '96h' },
    ],
  },
  {
    id: 'response', num: 5,
    name: 'Response Layer',
    description: 'Incident response, automated containment, forensics, and recovery. If attacks reach here, the prior four layers have been breached.',
    color: '#22c55e',
    intercept_time_hours: 1,
    threat_count: 3, blocked: 3,
    controls: ['Automated isolation playbooks', 'IR runbook activation', 'Forensic preservation', 'Recovery orchestration', 'On-call escalation'],
    cortex_note: 'Sandworm wiper scenario backup pre-staging auto-approved per Art. IX §4. Response playbook queued and ready.',
    active_intercepts: [
      { id: 'rp-001', threat: 'Sandworm Destructive Impact', status: 'playbook-queued', tti: '96h' },
    ],
  },
];

const INTERCEPT_STATUS_COLORS: Record<string, string> = {
  intercepted: '#22c55e',
  blocked: '#22c55e',
  decoyed: '#c9b787',
  'countermove-pending': '#f97316',
  monitoring: '#3b82f6',
  'backup-staged': '#8b5cf6',
  'playbook-queued': '#8b5cf6',
};

export default function LayeredIntercept() {
  const [selectedLayer, setSelectedLayer] = useState<Layer>(LAYERS[0]);
  const [pulse, setPulse] = useState(0);

  interface LayeredInterceptData { layers: Layer[]; overall_intercept_rate: number; doctrine: string; }
  const INTERCEPT_FALLBACK: LayeredInterceptData = { layers: LAYERS, overall_intercept_rate: 0.907, doctrine: 'Iron Dome — intercept at the outermost feasible layer' };

  const { data: interceptData } = useApiQuery<LayeredInterceptData>(
    () => api.cortex.layeredIntercept(),
    'data',
    INTERCEPT_FALLBACK
  );
  const liveLayers: Layer[] = interceptData.layers ?? LAYERS;

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % liveLayers.length), 2000);
    return () => clearInterval(iv);
  }, [liveLayers.length]);

  const totalThreats = liveLayers.reduce((a, l) => a + (l.threat_count ?? 0), 0);
  const totalBlocked = liveLayers.reduce((a, l) => a + (l.blocked ?? 0), 0);

  return (
    <div className="min-h-screen p-6" style={{ background: T.bg, color: T.text }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: T.accent }}>Layered Intercept Doctrine</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>Iron Dome–Inspired</span>
          </div>
          <h1 className="text-3xl font-light mb-2" style={{ color: T.text, letterSpacing: '-0.02em' }}>Multi-Layer Defense Intercept</h1>
          <p className="text-sm" style={{ color: T.dim, maxWidth: 680 }}>
            Five concentric defense layers — Perimeter → Identity → Workload → Data → Response. Each layer has a time-to-intercept budget calibrated by the Predictive Defense Cortex. Intercept at the outermost layer is always cheaper than letting threats reach the core.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-lg p-4 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-2xl font-mono font-bold mb-1" style={{ color: T.accent }}>{totalBlocked}</div>
            <div className="text-[9px] font-mono uppercase tracking-wide" style={{ color: T.muted }}>Threats Blocked</div>
            <div className="text-[10px]" style={{ color: T.green }}>{((totalBlocked / totalThreats) * 100).toFixed(0)}% intercept rate</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-2xl font-mono font-bold mb-1" style={{ color: T.red }}>{totalThreats - totalBlocked}</div>
            <div className="text-[9px] font-mono uppercase tracking-wide" style={{ color: T.muted }}>Active / Monitoring</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-2xl font-mono font-bold mb-1" style={{ color: '#f59e0b' }}>1h</div>
            <div className="text-[9px] font-mono uppercase tracking-wide" style={{ color: T.muted }}>Shortest TTI Window</div>
            <div className="text-[10px]" style={{ color: T.dim }}>Response layer</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-2xl font-mono font-bold mb-1" style={{ color: T.green }}>18h</div>
            <div className="text-[9px] font-mono uppercase tracking-wide" style={{ color: T.muted }}>Longest TTI Window</div>
            <div className="text-[10px]" style={{ color: T.dim }}>Perimeter layer</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>Defense Layers — click to inspect</div>
            <div className="flex flex-col gap-2">
              {liveLayers.map((layer, i) => {
                const blockPct = layer.threat_count > 0 ? (layer.blocked / layer.threat_count) * 100 : 0;
                const isSelected = selectedLayer.id === layer.id;
                return (
                  <button key={layer.id} onClick={() => setSelectedLayer(layer)} className="text-left rounded-xl p-4 transition-all" style={{ background: isSelected ? `${layer.color}08` : T.surface, border: `2px solid ${isSelected ? `${layer.color}40` : T.border}`, cursor: 'pointer' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold" style={{ background: `${layer.color}15`, color: layer.color }}>L{layer.num}</div>
                        {i < liveLayers.length - 1 && <div className="w-px h-4 mt-1" style={{ background: `${layer.color}30` }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: isSelected ? layer.color : T.text }}>{layer.name}</span>
                          <span className="text-[9px] font-mono" style={{ color: layer.color }}>TTI: {layer.intercept_time_hours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${blockPct}%`, background: layer.color }} />
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: T.dim }}>{layer.blocked}/{layer.threat_count}</span>
                        </div>
                        {i === pulse % liveLayers.length && (
                          <div className="text-[9px] mt-1 animate-pulse" style={{ color: layer.color }}>● active monitoring</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${selectedLayer.color}30` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-bold flex-shrink-0" style={{ background: `${selectedLayer.color}15`, color: selectedLayer.color }}>L{selectedLayer.num}</div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: selectedLayer.color }}>{selectedLayer.name}</div>
                  <div className="text-[10px]" style={{ color: T.muted }}>Time-to-Intercept budget: {selectedLayer.intercept_time_hours}h</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xl font-mono font-bold" style={{ color: selectedLayer.blocked === selectedLayer.threat_count ? T.green : T.orange }}>{selectedLayer.blocked}/{selectedLayer.threat_count}</div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>blocked</div>
                </div>
              </div>
              <p className="text-xs mb-4" style={{ color: T.dim }}>{selectedLayer.description}</p>

              <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)' }}>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: T.accent }}>Cortex Prediction</div>
                <div className="text-[10px]" style={{ color: T.dim }}>{selectedLayer.cortex_note}</div>
              </div>

              <div className="mb-4">
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>Active Controls</div>
                <div className="flex flex-wrap gap-1">
                  {selectedLayer.controls.map(c => (
                    <span key={c} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: `${selectedLayer.color}08`, border: `1px solid ${selectedLayer.color}20`, color: selectedLayer.color }}>{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>Active Intercepts</div>
                <div className="flex flex-col gap-2">
                  {(selectedLayer.active_intercepts ?? []).map(intercept => (
                    <div key={intercept.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${INTERCEPT_STATUS_COLORS[intercept.status]}20` }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: INTERCEPT_STATUS_COLORS[intercept.status] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs" style={{ color: T.text }}>{intercept.threat}</div>
                        <div className="text-[9px] font-mono" style={{ color: INTERCEPT_STATUS_COLORS[intercept.status] }}>{intercept.status.replace(/-/g, ' ').toUpperCase()}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] font-mono" style={{ color: intercept.tti === '0h' || intercept.tti === '0.2h' || intercept.tti === '0.5h' ? T.green : T.dim }}>TTI: {intercept.tti}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>Iron Dome Doctrine — Layer Priority</div>
              <div className="grid grid-cols-5 gap-2">
                {liveLayers.map(layer => {
                  const pct = layer.threat_count > 0 ? (layer.blocked / layer.threat_count) * 100 : 0;
                  return (
                    <div key={layer.id} className="text-center">
                      <div className="w-full rounded-full overflow-hidden mb-1" style={{ height: 60, background: 'rgba(255,255,255,0.04)', position: 'relative' }}>
                        <div className="absolute bottom-0 left-0 right-0 rounded-full" style={{ height: `${pct}%`, background: layer.color, opacity: 0.6 }} />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color: layer.color }}>{pct.toFixed(0)}%</div>
                      </div>
                      <div className="text-[8px] font-mono" style={{ color: layer.color }}>L{layer.num}</div>
                      <div className="text-[7px]" style={{ color: T.muted }}>{layer.intercept_time_hours}h</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[9px] text-center" style={{ color: T.muted }}>
                Intercept at the outermost feasible layer. The deeper a threat penetrates, the shorter the response window.
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg text-[10px] flex items-center gap-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
          Layered Intercept — Iron Dome doctrine applied to the cyber domain. Every layer has a time budget; the Predictive Defense Cortex pre-positions defenses at the earliest feasible intercept point.
        </div>
      </div>
    </div>
  );
}
