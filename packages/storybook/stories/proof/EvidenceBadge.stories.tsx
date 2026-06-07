import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { EvidenceBadge, type EvidenceSource } from '@szl-holdings/design-system';

const sources: EvidenceSource[] = [
  { id: 'e1', label: 'SIEM Alert #8842', type: 'signal', timestamp: '2026-04-26T14:29:55Z' },
  { id: 'e2', label: 'Threat Intel Feed', type: 'api' },
  { id: 'e3', label: 'Historical Pattern', type: 'model' },
  { id: 'e4', label: 'Runbook', type: 'document', url: '#' },
];

const meta = {
  title: 'Proof & Governance/EvidenceBadge',
  component: EvidenceBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Compact badge showing the number of evidence sources backing a claim. Expands on click.',
      },
    },
  },
  argTypes: {
    compact: { control: 'boolean' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EvidenceBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { sources },
};

export const Compact: Story = {
  args: { sources, compact: true },
};

export const SingleSource: Story = {
  args: { sources: [sources[0]] },
};

export const MixedSources: Story = {
  name: 'Mixed source types',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <EvidenceBadge sources={[{ id: 's1', label: 'Signal', type: 'signal' }]} compact />
      <EvidenceBadge sources={[{ id: 'a1', label: 'API', type: 'api' }]} compact />
      <EvidenceBadge sources={[{ id: 'd1', label: 'Document', type: 'document' }]} compact />
      <EvidenceBadge sources={[{ id: 'm1', label: 'Model', type: 'model' }]} compact />
      <EvidenceBadge sources={[{ id: 'u1', label: 'User', type: 'user' }]} compact />
      <EvidenceBadge sources={sources} />
    </div>
  ),
};
