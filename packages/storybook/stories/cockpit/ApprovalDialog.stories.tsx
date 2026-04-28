import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { ApprovalDialog, Button } from '@szl-holdings/design-system';

const meta = {
  title: 'Cockpit/ApprovalDialog',
  component: ApprovalDialog,
  parameters: {
    docs: {
      description: {
        component: 'Human-in-the-loop approval gate. Presents the agent\'s proposed action, evidence, and confidence for sign-off.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ApprovalDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: () => {},
    onApprove: () => {},
    onReject: () => {},
    title: 'Approve Automated Response',
    description: 'The PARAGON agent has identified a credential-stuffing attack and proposes blocking IP range 185.220.0.0/16.',
    confidence: 92,
    evidence: [
      { id: 'e1', label: 'SIEM Alert #8842', type: 'signal' },
      { id: 'e2', label: 'Threat Intel Feed', type: 'api' },
      { id: 'e3', label: 'Historical Pattern', type: 'model' },
    ],
  },
};

export const LowConfidence: Story = {
  args: {
    open: true,
    onClose: () => {},
    onApprove: () => {},
    onReject: () => {},
    title: 'Review Recommended Action',
    description: 'Counsel agent proposes issuing a cease-and-desist letter to vendor ID 2291. Confidence is below threshold.',
    confidence: 58,
    evidence: [
      { id: 'e1', label: 'Contract Review Draft', type: 'document' },
      { id: 'e2', label: 'Precedent Database', type: 'api' },
    ],
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
        <Button variant="primary" onClick={() => setOpen(true)}>Open approval request</Button>
        {result && <p style={{ color: 'var(--gi-text-secondary)', fontSize: 'var(--gi-text-sm)' }}>Decision: {result}</p>}
        <ApprovalDialog
          open={open}
          onClose={() => setOpen(false)}
          onApprove={() => { setResult('Approved'); setOpen(false); }}
          onReject={() => { setResult('Rejected'); setOpen(false); }}
          title="Approve Automated Response"
          description="Block IP range 185.220.0.0/16 based on credential-stuffing detection."
          confidence={92}
          evidence={[{ id: 'e1', label: 'SIEM Alert #8842', type: 'signal' }]}
        />
      </div>
    );
  },
};
