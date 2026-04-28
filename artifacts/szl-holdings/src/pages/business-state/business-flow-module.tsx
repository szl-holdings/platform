import { ChevronRight } from 'lucide-react';
import { BG_CARD, BORDER } from './constants';
import { DomainTag } from './helpers';
import type { DomainId } from './types';

const FLOWS = [
  {
    id: 'f1',
    name: 'Security Incident → Remediation',
    domains: ['aegis' as DomainId],
    steps: ['Signal Detection', 'AI Triage', 'Analyst Review', 'Playbook Execution', 'Resolution'],
    throughput: '1,840/mo',
    avgCycle: '41 min',
    efficiency: 91,
  },
  {
    id: 'f2',
    name: 'Property Lead → Deal Close',
    domains: ['terra' as DomainId],
    steps: ['Lead Intake', 'Distress Score', 'Ownership Verify', 'Deal Pitch', 'Due Diligence', 'Close'],
    throughput: '640/mo',
    avgCycle: '55 min',
    efficiency: 68,
  },
  {
    id: 'f3',
    name: 'Vessel Risk → Alert → Action',
    domains: ['vessels' as DomainId],
    steps: ['AIS Monitor', 'Anomaly Detect', 'Risk Score', 'Compliance Check', 'Alert Dispatch'],
    throughput: '762/mo',
    avgCycle: '18 min',
    efficiency: 77,
  },
  {
    id: 'f4',
    name: 'Matter Intake → Review → Close',
    domains: ['prism' as DomainId],
    steps: ['Intake Form', 'Conflict Check', 'Attorney Assign', 'Review', 'Billing'],
    throughput: '210/mo',
    avgCycle: '14 min',
    efficiency: 88,
  },
];

export function BusinessFlowModule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {FLOWS.map((flow) => {
        const effColor =
          flow.efficiency >= 85 ? '#22c55e' : flow.efficiency >= 70 ? '#f59e0b' : '#ef4444';
        return (
          <div
            key={flow.id}
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '0.75rem', padding: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{flow.name}</span>
              {flow.domains.map((d) => (
                <DomainTag key={d} domain={d} />
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{flow.throughput}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>avg {flow.avgCycle}</span>
                <span style={{ fontWeight: 700, color: effColor }}>{flow.efficiency}% complete</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {flow.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      background: `hsla(0,0%,100%,${0.02 + i * 0.01})`,
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.5)',
                      textAlign: 'center',
                      fontWeight: 500,
                    }}
                  >
                    {step}
                  </div>
                  {i < flow.steps.length - 1 && (
                    <ChevronRight style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
