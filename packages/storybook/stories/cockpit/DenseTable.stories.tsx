import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DenseTable } from '@szl-holdings/design-system';
import { StatusBadge } from '@szl-holdings/design-system';

interface Threat {
  id: string;
  indicator: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  source: string;
  seen: string;
}

const rows: Threat[] = [
  { id: '1', indicator: '185.220.0.0/16', type: 'IP Range', severity: 'error', source: 'SIEM', seen: '2m ago' },
  { id: '2', indicator: 'malware-c2.evil.com', type: 'Domain', severity: 'error', source: 'Threat Feed', seen: '5m ago' },
  { id: '3', indicator: 'CVE-2024-1234', type: 'Vulnerability', severity: 'warning', source: 'NVD', seen: '12m ago' },
  { id: '4', indicator: 'apt-group-7', type: 'Actor', severity: 'warning', source: 'Intel Feed', seen: '1h ago' },
  { id: '5', indicator: 'T1059.001', type: 'Technique', severity: 'info', source: 'MITRE', seen: '2h ago' },
];

const meta = {
  title: 'Cockpit/DenseTable',
  component: DenseTable,
  parameters: {
    docs: {
      description: {
        component: 'High-density data table optimised for operator view — minimal row height, monospace IDs, semantic column types.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DenseTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DenseTable<Threat>
      columns={[
        { key: 'indicator', header: 'Indicator', render: (r) => <span style={{ fontFamily: 'var(--gi-font-mono)', fontSize: 'var(--gi-text-xs)' }}>{r.indicator}</span> },
        { key: 'type', header: 'Type', render: (r) => r.type },
        { key: 'severity', header: 'Severity', render: (r) => <StatusBadge variant={r.severity} label={r.severity} /> },
        { key: 'source', header: 'Source', render: (r) => r.source },
        { key: 'seen', header: 'Seen', render: (r) => <span style={{ color: 'var(--gi-text-secondary)' }}>{r.seen}</span> },
      ]}
      rows={rows}
      getRowKey={(r) => r.id}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DenseTable<Threat>
      columns={[
        { key: 'indicator', header: 'Indicator', render: (r) => r.indicator },
        { key: 'type', header: 'Type', render: (r) => r.type },
      ]}
      rows={[]}
      getRowKey={(r) => r.id}
      emptyMessage="No threats detected in this time window."
    />
  ),
};
