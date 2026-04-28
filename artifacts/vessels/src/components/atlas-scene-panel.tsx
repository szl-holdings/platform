import {
  productAccent,
  AtlasScenePanel as SharedAtlasScenePanel,
} from '@szl-holdings/design-system';
import { Activity, MapPin, Package, ShieldAlert, TrendingDown } from 'lucide-react';

interface AtlasScenePanelProps {
  vesselId?: string | number;
  incidentId?: string | number;
  propertyId?: string | number;
  isDemo?: boolean;
}

const DEMO_VESSEL = {
  name: 'MV Atlantic Falcon',
  imo: 'IMO 9823451',
  flag: 'Panama',
  type: 'Bulk Carrier',
  dwt: '82,400 DWT',
  lat: 24.87,
  lng: 56.34,
  heading: 247,
  speed: '14.2 kn',
  destination: 'Rotterdam (NLRTM)',
  eta: 'Apr 28, 2026 06:00 UTC',
  status: 'Underway',
  lastPort: 'Dubai (AEDXB)',
  voyage: 'V-2026-0419-AF7',
};

const DEMO_CARGO = [
  {
    id: 'BL-001',
    commodity: 'Iron Ore',
    quantity: '44,200 MT',
    origin: 'Fujairah',
    shipper: 'Emirates Mining Corp',
    sanctionFlag: false,
  },
  {
    id: 'BL-002',
    commodity: 'Coal (Thermal)',
    quantity: '21,800 MT',
    origin: 'Ruwais',
    shipper: 'Gulf Energy Ltd',
    sanctionFlag: false,
  },
  {
    id: 'BL-003',
    commodity: 'Steel Coils',
    quantity: '8,400 MT',
    origin: 'Jebel Ali',
    shipper: 'Nile Steel Group',
    sanctionFlag: true,
  },
];

const DEMO_RISKS = [
  {
    label: 'Sanctions Exposure',
    score: 0.61,
    level: 'HIGH',
    detail: '1 B/L shipper (Nile Steel Group) matches OFAC secondary list cluster',
    color: 'var(--gi-accent-amber)',
  },
  {
    label: 'War Risk Premium',
    score: 0.44,
    level: 'MEDIUM',
    detail: 'Red Sea corridor proximity — war risk up 18% since Apr 12',
    color: 'var(--gi-state-requires-approval)',
  },
  {
    label: 'Port State Control',
    score: 0.22,
    level: 'LOW',
    detail: 'Last PSC inspection clear — Rotterdam Port Authority, Mar 2026',
    color: 'var(--gi-state-allowed)',
  },
  {
    label: 'Weather Routing',
    score: 0.31,
    level: 'LOW',
    detail: 'Sea state 3–4 forecast on current heading — within operating envelope',
    color: 'var(--gi-state-allowed)',
  },
];

const ACCENT = productAccent.vessels;

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '0.375rem',
  padding: '0.5rem 0.625rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  color: 'rgba(255,255,255,0.3)',
  fontFamily: 'monospace',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: '0 0 0.2rem',
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: 'monospace',
  margin: 0,
};

export function AtlasScenePanel({ vesselId, isDemo }: AtlasScenePanelProps) {
  const v = DEMO_VESSEL;
  const vesselIdStr = vesselId != null ? String(vesselId) : undefined;
  const displayId = vesselIdStr ? `VSL-${vesselIdStr.slice(-6).toUpperCase()}` : v.imo;


  const positionContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        {[
          { label: 'Vessel', value: v.name },
          { label: 'Type / Flag', value: `${v.type} · ${v.flag}` },
          { label: 'Position', value: `${v.lat}°N, ${v.lng}°E` },
          { label: 'Speed / Heading', value: `${v.speed} · ${v.heading}°` },
          { label: 'Destination', value: v.destination },
          { label: 'ETA', value: v.eta },
          { label: 'Last Port', value: v.lastPort },
          { label: 'Voyage Ref', value: v.voyage },
        ].map(({ label, value }) => (
          <div key={label} style={fieldStyle}>
            <p style={labelStyle}>{label}</p>
            <p style={valueStyle}>{value}</p>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.625rem',
          background: `${ACCENT}08`,
          borderRadius: '0.375rem',
          border: `1px solid ${ACCENT}20`,
        }}
      >
        <Activity style={{ width: 12, height: 12, color: ACCENT, flexShrink: 0 }} />
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'monospace',
          }}
        >
          AIS signal last received{' '}
          <strong style={{ color: 'rgba(255,255,255,0.8)' }}>4 min ago</strong> · MMSI 357234810
        </span>
      </div>
    </div>
  );

  const cargoContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {DEMO_CARGO.map((bl) => (
        <div
          key={bl.id}
          style={{
            background: bl.sanctionFlag ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.025)',
            border: bl.sanctionFlag
              ? '1px solid rgba(239,68,68,0.2)'
              : '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.5rem',
            padding: '0.75rem 0.875rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  margin: '0 0 0.25rem',
                }}
              >
                {bl.commodity}
              </p>
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'monospace',
                  margin: 0,
                }}
              >
                {bl.quantity} · {bl.origin} · {bl.shipper}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.06em',
                }}
              >
                {bl.id}
              </span>
              {bl.sanctionFlag && (
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    padding: '0.15rem 0.4rem',
                    borderRadius: '2rem',
                    background: 'color-mix(in srgb, var(--gi-state-blocked) 14%, transparent)',
                    color: 'var(--gi-state-blocked)',
                    border: '1px solid color-mix(in srgb, var(--gi-state-blocked) 30%, transparent)',
                  }}
                >
                  OFAC FLAG
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <p
        style={{
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.2)',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0.25rem 0 0',
        }}
      >
        {v.dwt} capacity · SanctionsWatchAgent monitoring · covenant-policy gated
      </p>
    </div>
  );

  const riskContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {DEMO_RISKS.map((r) => (
        <div
          key={r.label}
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.5rem',
            padding: '0.75rem 0.875rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem',
            }}
          >
            <span
              style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}
            >
              {r.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '2rem',
                  background: `color-mix(in srgb, ${r.color} 10%, transparent)`,
                  color: r.color,
                  border: `1px solid color-mix(in srgb, ${r.color} 19%, transparent)`,
                }}
              >
                {r.level}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: r.color,
                }}
              >
                {Math.round(r.score * 100)}%
              </span>
            </div>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.07)',
              marginBottom: '0.375rem',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                background: r.color,
                width: `${r.score * 100}%`,
                opacity: 0.7,
              }}
            />
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {r.detail}
          </p>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.625rem',
          background: 'color-mix(in srgb, var(--gi-accent-amber) 6%, transparent)',
          borderRadius: '0.375rem',
          border: '1px solid color-mix(in srgb, var(--gi-accent-amber) 15%, transparent)',
        }}
      >
        <TrendingDown style={{ width: 12, height: 12, color: 'var(--gi-accent-amber)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'monospace',
          }}
        >
          Composite risk score{' '}
          <strong style={{ color: 'var(--gi-state-requires-approval)' }}>0.44 / MEDIUM</strong> —
          awaiting compliance review for B/L BL-003
        </span>
      </div>
    </div>
  );

  return (
    <SharedAtlasScenePanel
      headerTitle="ATLAS Vessel Scene"
      footerLabel="vessels · atlas scene · live-signal integrated"
      accentColor={ACCENT}
      displayId={displayId}
      isDemo={isDemo}
      defaultTab="position"
      tabs={[
        { id: 'position', label: 'Position & Voyage', icon: MapPin, content: positionContent },
        { id: 'cargo', label: 'Cargo Manifest', icon: Package, content: cargoContent },
        { id: 'risk', label: 'Risk Assessment', icon: ShieldAlert, content: riskContent },
      ]}
    />
  );
}
