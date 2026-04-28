import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { DataGrid, StatusBadge } from '@szl-holdings/design-system';

interface Run {
  id: string;
  agent: string;
  status: 'approved' | 'pending' | 'escalated' | 'rejected';
  confidence: number;
  duration: string;
  timestamp: string;
}

const sampleRows: Run[] = [
  { id: 'run_01jd8xk', agent: 'PARAGON Threat Scanner', status: 'approved', confidence: 94, duration: '3.2s', timestamp: '2026-04-26 14:32' },
  { id: 'run_01jd8xm', agent: 'Counsel Drafter', status: 'pending', confidence: 78, duration: '8.1s', timestamp: '2026-04-26 14:28' },
  { id: 'run_01jd8xn', agent: 'Policy Guard', status: 'escalated', confidence: 61, duration: '1.4s', timestamp: '2026-04-26 14:25' },
  { id: 'run_01jd8xp', agent: 'Evidence Harvester', status: 'approved', confidence: 97, duration: '12.5s', timestamp: '2026-04-26 14:20' },
  { id: 'run_01jd8xq', agent: 'Forecast Fabric', status: 'rejected', confidence: 45, duration: '5.7s', timestamp: '2026-04-26 14:15' },
];

const columns = [
  { key: 'id', header: 'Run ID', render: (r: Run) => <span style={{ fontFamily: 'var(--gi-font-mono)', fontSize: 'var(--gi-text-xs)', color: 'var(--gi-text-secondary)' }}>{r.id}</span> },
  { key: 'agent', header: 'Agent', render: (r: Run) => r.agent },
  { key: 'status', header: 'Status', render: (r: Run) => <StatusBadge variant={r.status} label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} /> },
  { key: 'confidence', header: 'Confidence', render: (r: Run) => `${r.confidence}%` },
  { key: 'duration', header: 'Duration', render: (r: Run) => r.duration },
  { key: 'timestamp', header: 'Timestamp', render: (r: Run) => <span style={{ color: 'var(--gi-text-secondary)', fontSize: 'var(--gi-text-xs)' }}>{r.timestamp}</span> },
];

const meta = {
  title: 'Data Display/DataGrid',
  component: DataGrid,
  parameters: {
    docs: {
      description: {
        component: 'High-density data table with sortable columns, row selection, and customisable cell renderers.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataGrid<Run>
      columns={columns}
      rows={sampleRows}
      getRowKey={(r) => r.id}
    />
  ),
};

export const WithRowSelection: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>('run_01jd8xm');
    return (
      <DataGrid<Run>
        columns={columns}
        rows={sampleRows}
        getRowKey={(r) => r.id}
        selectedRowKey={selected}
        onRowClick={(r) => setSelected(r.id)}
      />
    );
  },
};

export const Loading: Story = {
  render: () => (
    <DataGrid<Run>
      columns={columns}
      rows={[]}
      getRowKey={(r) => r.id}
      loading
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataGrid<Run>
      columns={columns}
      rows={[]}
      getRowKey={(r) => r.id}
      emptyMessage="No runs match the current filters."
    />
  ),
};
