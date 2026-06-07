import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PageHeader, Button, StatusBadge } from '@szl-holdings/design-system';
import { Download, RefreshCw, Plus } from 'lucide-react';

const meta = {
  title: 'Shell/PageHeader',
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component: 'Page-level header with title, subtitle, metadata, badge, and action slots.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Threat Intelligence',
    subtitle: 'Monitor and respond to emerging security threats across the enterprise.',
  },
};

export const WithMeta: Story = {
  args: {
    title: 'Active Cases',
    subtitle: 'Legal matter tracking and document management.',
    meta: [
      { label: 'Open', value: '14' },
      { label: 'In Review', value: '6' },
      { label: 'Closed (30d)', value: '23' },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: 'Run Ledger',
    subtitle: 'Agent execution history and audit trail.',
    badge: <StatusBadge variant="active" label="Live" showDot />,
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />}>Refresh</Button>
        <Button variant="secondary" size="sm" icon={<Download size={14} />}>Export</Button>
        <Button variant="primary" size="sm" icon={<Plus size={14} />}>New Run</Button>
      </div>
    ),
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Policy Guard',
    subtitle: 'Autonomy policy enforcement and compliance monitoring.',
    badge: <StatusBadge variant="warning" label="3 Escalations" />,
    meta: [
      { label: 'Policy Mode', value: 'Ask-to-Act' },
      { label: 'Confidence Threshold', value: '85%' },
    ],
  },
};
