import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ProofEnvelope } from '@szl-holdings/design-system';

const baseEvidence = [
  { id: 'e1', label: 'SIEM Alert #8842', type: 'signal' as const },
  { id: 'e2', label: 'Threat Intel Feed', type: 'api' as const },
  { id: 'e3', label: 'Historical Pattern', type: 'model' as const },
];

const meta = {
  title: 'Proof & Governance/ProofEnvelope',
  component: ProofEnvelope,
  parameters: {
    docs: {
      description: {
        component: 'The primary governance wrapper. Attaches evidence, confidence, policy state, and autonomy mode to any content.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProofEnvelope>;

export default meta;
type Story = StoryObj<typeof meta>;

const content = (
  <div style={{ padding: '12px', background: 'var(--gi-bg-overlay)', borderRadius: 'var(--gi-radius-md)' }}>
    <p style={{ margin: 0, fontSize: 'var(--gi-text-sm)', color: 'var(--gi-text-primary)' }}>
      Block IP range <code style={{ fontFamily: 'var(--gi-font-mono)', color: 'var(--gi-accent-blue)' }}>185.220.0.0/16</code> for 72 hours based on credential-stuffing activity.
    </p>
  </div>
);

export const Allowed: Story = {
  args: {
    title: 'Recommended Action',
    confidence: 92,
    evidence: baseEvidence,
    timestamp: new Date().toISOString(),
    policyState: 'allowed',
    autonomyMode: 'approved-act',
    domain: 'Aegis',
    actionLabel: 'Execute',
    children: content,
  },
};

export const RequiresApproval: Story = {
  args: {
    title: 'Pending Approval',
    confidence: 67,
    evidence: baseEvidence.slice(0, 2),
    timestamp: new Date().toISOString(),
    policyState: 'requires-approval',
    autonomyMode: 'ask-to-act',
    domain: 'Counsel',
    children: (
      <div style={{ padding: '12px', background: 'var(--gi-bg-overlay)', borderRadius: 'var(--gi-radius-md)' }}>
        <p style={{ margin: 0, fontSize: 'var(--gi-text-sm)', color: 'var(--gi-text-primary)' }}>
          Issue cease-and-desist letter to Vendor #2291 re SLA breach.
        </p>
      </div>
    ),
  },
};

export const Blocked: Story = {
  args: {
    title: 'Action Blocked',
    confidence: 44,
    evidence: [baseEvidence[0]],
    timestamp: new Date().toISOString(),
    policyState: 'blocked',
    autonomyMode: 'observe',
    domain: 'Aegis',
    children: (
      <div style={{ padding: '12px', background: 'var(--gi-bg-overlay)', borderRadius: 'var(--gi-radius-md)' }}>
        <p style={{ margin: 0, fontSize: 'var(--gi-text-sm)', color: 'var(--gi-text-muted)' }}>
          Delete all authentication logs — blocked by retention policy.
        </p>
      </div>
    ),
  },
};

export const Contradiction: Story = {
  args: {
    title: 'Contradictory Evidence',
    confidence: 48,
    contradiction: true,
    evidence: baseEvidence,
    timestamp: new Date().toISOString(),
    policyState: 'requires-approval',
    autonomyMode: 'recommend',
    domain: 'Terra',
    children: (
      <div style={{ padding: '12px', background: 'var(--gi-bg-overlay)', borderRadius: 'var(--gi-radius-md)' }}>
        <p style={{ margin: 0, fontSize: 'var(--gi-text-sm)', color: 'var(--gi-text-primary)' }}>
          Appraisal value diverges significantly between two valuator models.
        </p>
      </div>
    ),
  },
};
