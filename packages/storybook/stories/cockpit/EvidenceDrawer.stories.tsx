import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { EvidenceDrawer, Button, type EvidenceItem } from '@szl-holdings/design-system';

const sampleEvidence: EvidenceItem[] = [
  {
    id: 'e1',
    label: 'SIEM Alert #8842',
    type: 'signal',
    timestamp: '2026-04-26T14:29:55Z',
    excerpt:
      'Detected 847 failed login attempts from IP range 185.220.0.0/16 over 5-minute window.',
  },
  {
    id: 'e2',
    label: 'Threat Intel Feed — AlienVault OTX',
    type: 'api',
    timestamp: '2026-04-26T14:28:00Z',
    excerpt:
      'IP range flagged as Tor exit node cluster associated with credential-stuffing campaigns.',
  },
  {
    id: 'e3',
    label: 'Historical Pattern Match',
    type: 'model',
    timestamp: '2026-04-26T14:25:00Z',
    excerpt: 'Pattern matches 3 prior incidents resolved by block action with 94% success rate.',
  },
  {
    id: 'e4',
    label: 'Runbook: Credential Attack Response',
    type: 'document',
    url: '#',
    excerpt: 'Standard procedure for blocking IP ranges during active credential-stuffing attacks.',
  },
];

const meta = {
  title: 'Cockpit/EvidenceDrawer',
  component: EvidenceDrawer,
  parameters: {
    docs: {
      description: {
        component:
          'Slide-in panel showing the full evidence chain behind an agent decision. Each item shows source type, excerpt, and timestamp.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EvidenceDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: 'Evidence — Block IP Range',
    items: sampleEvidence,
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          View Evidence Chain
        </Button>
        <EvidenceDrawer
          open={open}
          onClose={() => setOpen(false)}
          title="Evidence — Block IP Range"
          items={sampleEvidence}
        />
      </div>
    );
  },
};
