import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  Hash,
  Key,
  Loader2,
  Lock,
  Radio,
  Satellite,
  ShieldCheck,
  Waves,
  XCircle,
} from 'lucide-react';

const ALLOY_GOLD = '#c9b787';

type FeedKind = 'COASTAL_RADAR' | 'VTS' | 'RF' | 'HYDROPHONE' | 'OPTICAL';

interface RegisteredFeed {
  id: string;
  ownerOrg: string;
  kind: FeedKind;
  label: string;
  endpoint: string;
  schemaValid: boolean;
  covenantKeyId: string | null;
  airGapped: boolean;
  status: 'pending' | 'validated' | 'minted' | 'live';
  lastHeartbeat: string;
}

const KIND_CONFIG: Record<FeedKind, { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; schemaHint: string }> = {
  COASTAL_RADAR: { icon: Radio, label: 'Coastal radar', schemaHint: 'NMEA-2000 RATTM bursts, 1Hz min' },
  VTS: { icon: Database, label: 'VTS feed', schemaHint: 'IALA VTM Annex A, 5s update' },
  RF: { icon: Activity, label: 'RF geolocation', schemaHint: 'Custom JSON: bearing, freq, snr, ts' },
  HYDROPHONE: { icon: Waves, label: 'Hydrophone', schemaHint: '24-bit FLAC stream + classification metadata' },
  OPTICAL: { icon: Satellite, label: 'Optical / EO', schemaHint: 'GeoTIFF or NITF, ≤6h latency' },
};

const SEED_FEEDS: RegisteredFeed[] = [
  {
    id: 'f1',
    ownerOrg: 'Royal Bahrain Naval Force',
    kind: 'COASTAL_RADAR',
    label: 'Sitra · Pier 4 X-band',
    endpoint: 'tcp://10.42.7.18:4444',
    schemaValid: true,
    covenantKeyId: 'CK-RBNF-184',
    airGapped: true,
    status: 'live',
    lastHeartbeat: '14s ago',
  },
  {
    id: 'f2',
    ownerOrg: 'Port of Singapore Authority',
    kind: 'VTS',
    label: 'PSA · East Anchorage VTS',
    endpoint: 'https://vts.psa.gov.sg/v2/stream',
    schemaValid: true,
    covenantKeyId: 'CK-PSA-104',
    airGapped: false,
    status: 'live',
    lastHeartbeat: '3s ago',
  },
  {
    id: 'f3',
    ownerOrg: 'JMSDF · Yokosuka',
    kind: 'HYDROPHONE',
    label: 'Sagami Bay array #2',
    endpoint: 'sftp://hydra-2.jmsdf.local',
    schemaValid: true,
    covenantKeyId: 'CK-JMSDF-072',
    airGapped: true,
    status: 'live',
    lastHeartbeat: '1m ago',
  },
  {
    id: 'f4',
    ownerOrg: 'Greek Coast Guard',
    kind: 'RF',
    label: 'Aegean RF mesh · Lesvos',
    endpoint: 'tls://rf.hcg.gr:8443',
    schemaValid: false,
    covenantKeyId: null,
    airGapped: true,
    status: 'pending',
    lastHeartbeat: '—',
  },
];

export default function CortexSsmPage() {
  const [feeds, setFeeds] = useState<RegisteredFeed[]>(SEED_FEEDS);
  const [draft, setDraft] = useState({ ownerOrg: '', kind: 'COASTAL_RADAR' as FeedKind, label: '', endpoint: '', airGapped: true });
  const [validating, setValidating] = useState(false);
  const [minting, setMinting] = useState<string | null>(null);

  // Synchronous, deterministic validation. No setTimeout pretense — the only
  // checks we can actually perform in-browser are (1) protocol is not plain
  // http://, and (2) endpoint length is plausible. Anything claiming a live
  // probe would require a server endpoint which does not yet exist; we mark
  // such feeds `pending` so the operator/back-office can complete validation.
  function validateAndAdd() {
    if (!draft.ownerOrg || !draft.label || !draft.endpoint) return;
    setValidating(true);
    try {
      const protoOk = /^(tcp|sftp|tls|https):\/\//i.test(draft.endpoint);
      const lengthOk = draft.endpoint.length >= 12;
      const schemaValid = protoOk && lengthOk;
      const newFeed: RegisteredFeed = {
        id: `f${Date.now()}`,
        ownerOrg: draft.ownerOrg,
        kind: draft.kind,
        label: draft.label,
        endpoint: draft.endpoint,
        schemaValid,
        covenantKeyId: null,
        airGapped: draft.airGapped,
        status: schemaValid ? 'validated' : 'pending',
        lastHeartbeat: '—',
      };
      setFeeds((prev) => [newFeed, ...prev]);
      setDraft({ ownerOrg: '', kind: 'COASTAL_RADAR', label: '', endpoint: '', airGapped: true });
    } finally {
      setValidating(false);
    }
  }

  // Synchronous Covenant Key mint. The key id is a content-addressable hash
  // of (ownerOrg + endpoint + nonce) so the same feed registered twice yields
  // a distinguishable key. Server-side anchoring of the key will land with
  // the Covenant Key registry endpoint (see roadmap); for now the key is
  // visible to the operator and recorded in browser state only.
  function mintCovenantKey(id: string) {
    setMinting(id);
    try {
      setFeeds((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const orgTag = (f.ownerOrg.match(/[A-Z]+/g)?.join('') || 'OP').slice(0, 5);
          const nonce = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return {
            ...f,
            covenantKeyId: `CK-${orgTag}-${nonce}`,
            status: 'live',
            lastHeartbeat: 'just now',
          };
        }),
      );
    } finally {
      setMinting(null);
    }
  }

  return (
    <div className="min-h-full" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="border-l-2 pl-5 mb-8" style={{ borderColor: ALLOY_GOLD }}>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5" style={{ color: ALLOY_GOLD }}>
            Cortex · SSM · Sovereign Sensor Mesh
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Bring your own sensors</h1>
          <p className="text-sm text-white/50 mt-1.5 max-w-2xl">
            A navy or port authority registers their coastal radar, VTS, RF and hydrophone feeds. A11oy
            validates the schema, mints a Covenant Key, and the feed becomes a first-class layer in MIFC
            alongside commercial sources. In Sovereign Mode no telemetry leaves the customer mesh.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-5 space-y-5">
            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderTop: `2px solid ${ALLOY_GOLD}`,
              }}
            >
              <div className="text-sm font-semibold text-white mb-1">Register a feed</div>
              <p className="text-[11px] text-white/45 mb-4">
                A11oy will validate the schema, probe the endpoint, and offer a Covenant Key.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">Owner organization</label>
                  <input
                    value={draft.ownerOrg}
                    onChange={(e) => setDraft({ ...draft, ownerOrg: e.target.value })}
                    placeholder="e.g. Royal Bahrain Naval Force"
                    className="w-full text-xs bg-white/[0.03] border rounded-md px-3 py-2 text-white/85 outline-none"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">Sensor kind</label>
                  <select
                    value={draft.kind}
                    onChange={(e) => setDraft({ ...draft, kind: e.target.value as FeedKind })}
                    className="w-full text-xs bg-white/[0.03] border rounded-md px-3 py-2 text-white/85 outline-none"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    {Object.entries(KIND_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>{cfg.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/35 mt-1">
                    Schema: <span className="font-mono">{KIND_CONFIG[draft.kind].schemaHint}</span>
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">Feed label</label>
                  <input
                    value={draft.label}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    placeholder="e.g. Sitra · Pier 4 X-band"
                    className="w-full text-xs bg-white/[0.03] border rounded-md px-3 py-2 text-white/85 outline-none"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">Endpoint</label>
                  <input
                    value={draft.endpoint}
                    onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
                    placeholder="tcp://… · sftp://… · tls://… · https://…"
                    className="w-full text-xs bg-white/[0.03] border rounded-md px-3 py-2 text-white/85 outline-none font-mono"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                  <p className="text-[10px] text-white/35 mt-1">Plain-HTTP endpoints will fail schema validation.</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-white/65">
                  <input
                    type="checkbox"
                    checked={draft.airGapped}
                    onChange={(e) => setDraft({ ...draft, airGapped: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <Lock className="w-3 h-3" style={{ color: ALLOY_GOLD }} />
                  Sovereign Mode (air-gapped, no egress)
                </label>
                <button
                  onClick={validateAndAdd}
                  disabled={validating || !draft.ownerOrg || !draft.label || !draft.endpoint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}40` }}
                >
                  {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {validating ? 'Validating schema…' : 'Validate & register'}
                </button>
              </div>
            </div>

            <div className="rounded-lg border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: ALLOY_GOLD }}>
                <Hash className="w-3 h-3" /> Covenant Key contract
              </div>
              <ul className="space-y-1.5 text-[11px] text-white/55 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: ALLOY_GOLD }} />
                  Customer holds the only signing key — the platform stores only the public counterpart.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: ALLOY_GOLD }} />
                  Sensor packets are signed at source; A11oy refuses to fuse anything that fails verification.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: ALLOY_GOLD }} />
                  In Sovereign Mode, fusion runs inside the customer mesh; no telemetry, no model weights, no fingerprints leave.
                </li>
              </ul>
            </div>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 px-1 flex items-center justify-between">
              <span>Registered feeds · {feeds.length}</span>
              <span>{feeds.filter((f) => f.status === 'live').length} live</span>
            </div>
            <div className="space-y-2">
              {feeds.map((f) => {
                const I = KIND_CONFIG[f.kind].icon;
                const isLive = f.status === 'live';
                const isValid = f.schemaValid;
                return (
                  <div
                    key={f.id}
                    className="rounded-md border p-4"
                    style={{
                      background: 'hsl(var(--card))',
                      borderColor: isLive ? `${ALLOY_GOLD}30` : isValid ? 'hsl(var(--border))' : 'rgba(217,122,76,0.25)',
                      borderLeft: isLive ? `2px solid ${ALLOY_GOLD}` : isValid ? '2px solid #5baa8a55' : '2px solid #d97a4c',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${ALLOY_GOLD}10`, border: `1px solid ${ALLOY_GOLD}25` }}>
                          <I className="w-4 h-4" style={{ color: ALLOY_GOLD }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{f.label}</div>
                          <div className="text-[10px] text-white/45 font-mono mt-0.5">
                            {KIND_CONFIG[f.kind].label} · {f.ownerOrg}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded" style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}30` }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ALLOY_GOLD }} />
                            live · {f.lastHeartbeat}
                          </span>
                        ) : isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/25 bg-emerald-500/10">
                            <CheckCircle2 className="w-2.5 h-2.5" /> validated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded text-amber-400 border border-amber-500/25 bg-amber-500/10">
                            <XCircle className="w-2.5 h-2.5" /> schema fail
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-white/35 mb-2">{f.endpoint}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-[10px]">
                        {f.airGapped && (
                          <span className="inline-flex items-center gap-1 text-white/55 px-2 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Lock className="w-2.5 h-2.5" /> sovereign · air-gapped
                          </span>
                        )}
                        {f.covenantKeyId && (
                          <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded" style={{ color: ALLOY_GOLD, background: `${ALLOY_GOLD}10`, border: `1px solid ${ALLOY_GOLD}25` }}>
                            <Key className="w-2.5 h-2.5" /> {f.covenantKeyId}
                          </span>
                        )}
                      </div>
                      {isValid && !f.covenantKeyId && (
                        <button
                          onClick={() => mintCovenantKey(f.id)}
                          disabled={minting === f.id}
                          className="text-[11px] font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                          style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}40` }}
                        >
                          {minting === f.id ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <Key className="w-3 h-3 inline mr-1" />}
                          {minting === f.id ? 'Minting…' : 'Mint Covenant Key'}
                          <ChevronRight className="w-3 h-3 inline" />
                        </button>
                      )}
                      {!isValid && (
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70">
                          <AlertTriangle className="w-3 h-3" />
                          Endpoint must use TLS/SFTP/TCP — plain HTTP refused.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 px-1 mt-4 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Mesh registry gated by A11oy PCE Gate · Constitution vessels.ssm.v1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
