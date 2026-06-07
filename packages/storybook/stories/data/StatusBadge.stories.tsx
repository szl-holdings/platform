import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { StatusBadge } from '@szl-holdings/design-system';

const meta = {
  title: 'Data Display/StatusBadge',
  component: StatusBadge,
  parameters: {
    docs: {
      description: {
        component: 'Semantic status marker with ten contextual variants and optional pulsing dot.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info', 'neutral', 'pending', 'active', 'approved', 'rejected', 'escalated'],
    },
    showDot: { control: 'boolean' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <StatusBadge variant="success" label="Success" />
      <StatusBadge variant="warning" label="Warning" />
      <StatusBadge variant="error" label="Error" />
      <StatusBadge variant="info" label="Info" />
      <StatusBadge variant="neutral" label="Neutral" />
      <StatusBadge variant="pending" label="Pending" />
      <StatusBadge variant="active" label="Active" />
      <StatusBadge variant="approved" label="Approved" />
      <StatusBadge variant="rejected" label="Rejected" />
      <StatusBadge variant="escalated" label="Escalated" />
    </div>
  ),
};

export const WithDots: Story = {
  name: 'With pulsing dots',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <StatusBadge variant="active" label="Live" showDot />
      <StatusBadge variant="warning" label="Degraded" showDot />
      <StatusBadge variant="error" label="Down" showDot />
    </div>
  ),
};

export const InTable: Story = {
  name: 'In table context',
  render: () => (
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 'var(--gi-text-sm)', color: 'var(--gi-text-primary)' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--gi-border-default)' }}>
          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--gi-text-secondary)' }}>Agent Run</th>
          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--gi-text-secondary)' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {[
          { run: 'run_01jd8xk', status: 'approved' as const },
          { run: 'run_01jd8xm', status: 'pending' as const },
          { run: 'run_01jd8xn', status: 'escalated' as const },
          { run: 'run_01jd8xp', status: 'rejected' as const },
        ].map(({ run, status }) => (
          <tr key={run} style={{ borderBottom: '1px solid var(--gi-border-subtle)' }}>
            <td style={{ padding: '10px 12px', fontFamily: 'var(--gi-font-mono)', fontSize: 'var(--gi-text-xs)' }}>{run}</td>
            <td style={{ padding: '10px 12px' }}><StatusBadge variant={status} label={status.charAt(0).toUpperCase() + status.slice(1)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
