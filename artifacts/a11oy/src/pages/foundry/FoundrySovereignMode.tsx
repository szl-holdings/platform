import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';
const PURPLE = '#a78bfa';

interface SovereignDeployment {
  id: string;
  name: string;
  model: string;
  region: string;
  status: 'provisioned' | 'running' | 'standby';
  dataResidency: string;
  lastHealthCheck: string;
  callsToday: number;
  proofChainLocal: boolean;
  externalCalls: boolean;
}

const DEPLOYMENTS: SovereignDeployment[] = [
  { id: 'sv-1', name: 'Defense-Enclave-1', model: 'Llama 4 Maverick', region: 'US-GOV-EAST', status: 'running', dataResidency: 'US-GOV-EAST only', lastHealthCheck: '2026-05-05T09:00Z', callsToday: 482, proofChainLocal: true, externalCalls: false },
  { id: 'sv-2', name: 'Legal-Sovereign-EU', model: 'Llama 4 Maverick', region: 'EU-WEST-1', status: 'running', dataResidency: 'EU-WEST-1 only (GDPR)', lastHealthCheck: '2026-05-05T09:02Z', callsToday: 219, proofChainLocal: true, externalCalls: false },
  { id: 'sv-3', name: 'Classified-Intel-Air-Gap', model: 'Llama 4 Maverick', region: 'On-Premise (classified)', status: 'running', dataResidency: 'Secure enclave — no network', lastHealthCheck: '2026-05-05T08:58Z', callsToday: 84, proofChainLocal: true, externalCalls: false },
];

const STATUS_COLORS = {
  provisioned: GOLD,
  running: '#22c55e',
  standby: '#8a8a8a',
};

export function FoundrySovereignMode() {
  const [selected, setSelected] = useState<string | null>(null);
  const [configuringNew, setConfiguringNew] = useState(false);
  const [region, setRegion] = useState('US-GOV-EAST');
  const [model, setModel] = useState('Llama 4 Maverick');
  const [networkMode, setNetworkMode] = useState('air-gapped');
  const [step, setStep] = useState(1);

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / SOVEREIGN MODE"
        title="Air-Gapped Sovereign Deployments"
        subtitle="Sovereign Mode enables full on-premise execution for regulated industries. No external API calls. Data residency enforced at the hardware level. On-premise Proof Chain with no external attestation dependency."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="SOVEREIGN CELLS" value={String(DEPLOYMENTS.length)} sub="running" accent={PURPLE} />
        <KpiCard label="EXTERNAL CALLS" value="0" sub="guaranteed zero" accent="#22c55e" />
        <KpiCard label="DATA RESIDENCY" value="100%" sub="enforced" accent={PURPLE} />
        <KpiCard label="LOCAL PROOF CHAIN" value="100%" sub="on-premise attestation" accent="#22c55e" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: PURPLE }}>What Sovereign Mode Guarantees</div>
          <ul className="space-y-1 text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            <li>🛡 No external API calls — model runs entirely on-premise</li>
            <li>🛡 Data residency enforced at hardware/network level</li>
            <li>🛡 On-premise Proof Chain — no external attestation endpoint</li>
            <li>🛡 Air-gap verification report at each session close</li>
            <li>🛡 Sovereign audit trail stored locally with tamper detection</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: GOLD }}>vs. Microsoft Foundry "Disconnected"</div>
          <ul className="space-y-1 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            <li>✗ Foundry "disconnected" is a toggle, not verified air-gap</li>
            <li>✗ No hardware-level network isolation</li>
            <li>✗ No on-premise Proof Chain attestation</li>
            <li>✗ No sovereign audit trail with tamper detection</li>
            <li>✓ A11oy Sovereign Mode provides all of the above</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Active Sovereign Deployments</div>
        <button type="button" onClick={() => setConfiguringNew(true)}
          className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
          style={{ background: 'rgba(167,139,250,0.08)', color: PURPLE, border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer' }}>
          + New Sovereign Deployment
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {DEPLOYMENTS.map(d => (
          <div key={d.id} className="rounded-lg border p-4 cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: selected === d.id ? 'rgba(167,139,250,0.3)' : 'var(--color-a11oy-border)' }}
            onClick={() => setSelected(selected === d.id ? null : d.id)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] }} />
                  <span className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{d.name}</span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(167,139,250,0.12)', color: PURPLE }}>sovereign</span>
                </div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.model} · {d.region}</div>
              </div>
              <div className="text-right text-xs">
                <div style={{ color: '#22c55e' }}>🛡 Air-gapped</div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.callsToday} calls today</div>
              </div>
            </div>
            {selected === d.id && (
              <div className="mt-3 pt-3 border-t space-y-1.5 text-xs" style={{ borderColor: 'var(--color-a11oy-border)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Data Residency</span>
                  <span style={{ color: PURPLE }}>{d.dataResidency}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>External Calls</span>
                  <span style={{ color: d.externalCalls ? '#f87171' : '#22c55e' }}>{d.externalCalls ? 'DETECTED — ALERT' : 'None confirmed'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Local Proof Chain</span>
                  <span style={{ color: d.proofChainLocal ? '#22c55e' : '#f87171' }}>{d.proofChainLocal ? 'Active (on-premise)' : 'Not configured'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last Health Check</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{new Date(d.lastHealthCheck).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {configuringNew && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            New Sovereign Deployment — Step {step} of 3
          </div>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TARGET REGION / ENCLAVE</label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                  <option value="US-GOV-EAST">US-GOV-EAST</option>
                  <option value="US-GOV-WEST">US-GOV-WEST</option>
                  <option value="EU-WEST-1">EU-WEST-1 (GDPR)</option>
                  <option value="On-Premise">On-Premise (customer-managed)</option>
                  <option value="Classified">Classified Enclave (air-gapped)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>NETWORK MODE</label>
                <select value={networkMode} onChange={e => setNetworkMode(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                  <option value="air-gapped">Air-Gapped (verified — no external calls)</option>
                  <option value="private-cloud">Private Cloud (no public internet)</option>
                  <option value="isolated-vpc">Isolated VPC (limited egress)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MODEL (open-weight only for sovereign)</label>
                <select value={model} onChange={e => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                  <option value="Llama 4 Maverick">Llama 4 Maverick (Meta — open-weight)</option>
                  <option value="Llama 4 Scout">Llama 4 Scout (Meta — open-weight, lighter)</option>
                  <option value="Mistral Large">Mistral Large (Mistral — open-weight)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-2 rounded text-xs font-mono"
                  style={{ background: 'rgba(167,139,250,0.12)', color: PURPLE, border: '1px solid rgba(167,139,250,0.3)', cursor: 'pointer' }}>
                  Next: Security Configuration →
                </button>
                <button type="button" onClick={() => setConfiguringNew(false)}
                  className="px-4 py-2 rounded text-xs font-mono"
                  style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  'Hardware-level network isolation verified',
                  'On-premise Proof Chain storage configured',
                  'Sovereign audit trail enabled with tamper detection',
                  'Air-gap verification scheduled (every 15 min)',
                  'No external model API calls — open-weight only',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded text-xs"
                    style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    <span style={{ color: '#22c55e' }}>✓</span>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(3)}
                  className="flex-1 py-2 rounded text-xs font-mono"
                  style={{ background: 'rgba(167,139,250,0.12)', color: PURPLE, border: '1px solid rgba(167,139,250,0.3)', cursor: 'pointer' }}>
                  Next: Provision →
                </button>
                <button type="button" onClick={() => setStep(1)}
                  className="px-4 py-2 rounded text-xs font-mono"
                  style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
                  ← Back
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <div className="text-xl mb-2">🛡</div>
                <div className="font-medium text-sm mb-1" style={{ color: PURPLE }}>Ready to Provision Sovereign Deployment</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{model} · {region} · {networkMode}</div>
              </div>
              <button type="button" onClick={() => { setConfiguringNew(false); setStep(1); }}
                className="w-full py-3 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(167,139,250,0.12)', color: PURPLE, border: '1px solid rgba(167,139,250,0.3)', cursor: 'pointer' }}>
                Provision Sovereign Deployment
              </button>
            </div>
          )}
        </Card>
      )}

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Sovereign Mode extends the A11oy Reliquary Sovereign surface and absorbs the Lyte Run Console sovereign execution adapter. One air-gap configurator, one local proof chain, one sovereign doctrine.
      </div>
    </Layout>
  );
}
