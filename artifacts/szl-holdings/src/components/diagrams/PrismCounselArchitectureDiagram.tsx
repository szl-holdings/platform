import { m, useReducedMotion } from 'framer-motion';
import { Brain, Cpu, Database, FileText, Globe, Layers, MessageSquare, Shield } from 'lucide-react';

const PRISM_LAYERS = [
  {
    id: 'm365',
    label: 'Microsoft 365 Companion Layer',
    sublabel: 'Outlook · Teams · SharePoint · Word · Copilot connectors',
    items: [
      'Teams approval cards',
      'Outlook comms import',
      'Word demand export',
      'SharePoint matter sync',
    ],
    color: '#4a90b8',
    bg: 'hsla(207,52%,40%,0.08)',
    border: 'hsla(207,52%,40%,0.20)',
    icon: MessageSquare,
  },
  {
    id: 'surface',
    label: 'Command Surfaces',
    sublabel: 'Lawyer Life OS · Matter Desk · NY Practice · Review Desk · Copilot Workbench',
    items: ['Today view', 'Matter Desk', 'NY Command', 'Review Desk', 'Prep / Sign-Off'],
    color: '#d4a054',
    bg: 'hsla(38,72%,58%,0.08)',
    border: 'hsla(38,72%,58%,0.20)',
    icon: Layers,
    highlight: true,
  },
  {
    id: 'intelligence',
    label: 'Matter Intelligence Engine',
    sublabel: 'Section 31 · Alloy AI fabric · PRISM scoring · Deadline engine · Insurer intel',
    items: [
      'PRISM pillars',
      'Settlement forecast',
      'Deadline clock',
      'Insurer behavior',
      'Proof Chain',
    ],
    color: '#8b7ac8',
    bg: 'hsla(258,40%,60%,0.08)',
    border: 'hsla(258,40%,60%,0.20)',
    icon: Brain,
  },
  {
    id: 'alloy',
    label: 'Alloy Control Plane',
    sublabel:
      'Workflow orchestration · Approval gates · Audit trail · AI governance · Source tracing',
    items: [
      'Approval chains',
      'Audit record',
      'AI governance',
      'Export safety',
      'Role enforcement',
    ],
    color: '#c8953c',
    bg: 'hsla(36,56%,50%,0.08)',
    border: 'hsla(36,56%,50%,0.20)',
    icon: Cpu,
  },
  {
    id: 'signals',
    label: 'Signal & Data Layer',
    sublabel: 'NY DFS Reg 68 · CMS MSPRP · NYSCEF · Weather · Court feeds · Case management',
    items: [
      'NY Reg 68 clocks',
      'Medicare liens',
      'Court schedules',
      'Weather data',
      'Case management',
    ],
    color: '#4a8c5c',
    bg: 'hsla(145,30%,40%,0.08)',
    border: 'hsla(145,30%,40%,0.20)',
    icon: Globe,
  },
];

export function PrismCounselArchitectureDiagram() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'hsla(214,12%,5%,0.90)',
        borderRadius: '0.875rem',
        border: '1px solid hsla(0,0%,100%,0.08)',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}
      >
        <Shield size={13} color="hsl(38,72%,58%)" />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'hsl(38,72%,58%)',
          }}
        >
          PRISM Counsel — Architecture
        </span>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5625rem',
          color: 'hsl(214,7%,45%)',
          marginBottom: '1.25rem',
          letterSpacing: '0.04em',
        }}
      >
        Alloy control plane · Section 31 intelligence · M365-native execution · Governed proof chain
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {PRISM_LAYERS.map((layer, i) => {
          const Icon = layer.icon;
          return (
            <m.div
              key={layer.id}
              initial={prefersReduced ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              style={{
                background: layer.bg,
                border: `1px solid ${layer.border}`,
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                outline: layer.highlight ? `1px solid ${layer.color}22` : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Icon size={12} color={layer.color} style={{ marginTop: '1px', flexShrink: 0 }} />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.5625rem',
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: layer.color,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.5rem',
                      color: 'hsl(214,7%,45%)',
                      letterSpacing: '0.04em',
                      marginTop: '1px',
                    }}
                  >
                    {layer.sublabel}
                  </div>
                </div>
              </div>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingLeft: '1.25rem' }}
              >
                {layer.items.map((item) => (
                  <span
                    key={item}
                    style={{
                      fontSize: '0.6875rem',
                      color: 'hsl(38,8%,72%)',
                      background: 'hsla(214,12%,8%,0.60)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: '0.25rem',
                      padding: '0.125rem 0.4375rem',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </m.div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '0.875rem',
          padding: '0.625rem 0.875rem',
          background: 'hsla(38,72%,58%,0.04)',
          border: '1px solid hsla(38,72%,58%,0.14)',
          borderRadius: '0.4375rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Shield size={10} color="hsl(38,72%,58%)" />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            fontWeight: 500,
            color: 'hsl(38,72%,58%)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Every AI output hashed · every action attributed · every approval recorded · every export
          screened
        </span>
      </div>
    </div>
  );
}
