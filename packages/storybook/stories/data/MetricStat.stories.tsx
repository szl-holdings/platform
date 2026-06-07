import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MetricStat } from '@szl-holdings/design-system';
import { Shield, Zap, FileText, TrendingUp } from 'lucide-react';

const meta = {
  title: 'Data Display/MetricStat',
  component: MetricStat,
  parameters: {
    docs: {
      description: {
        component: 'Executive KPI card showing a large value with optional delta, trend, unit, and icon.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MetricStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Active Threats',
    value: 14,
  },
};

export const WithDelta: Story = {
  args: {
    label: 'Resolved Cases',
    value: 847,
    delta: '+12%',
    deltaPositive: true,
    trend: 'up',
  },
};

export const NegativeDelta: Story = {
  args: {
    label: 'Mean Time to Resolve',
    value: '4.2h',
    unit: 'avg',
    delta: '-18min',
    deltaPositive: true,
    trend: 'down',
    footnote: 'vs. 30-day average',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Threat Score',
    value: '6.8',
    unit: '/ 10',
    delta: '+0.4',
    deltaPositive: false,
    trend: 'up',
    icon: <Shield size={20} />,
  },
};

export const KPIGrid: Story = {
  name: 'KPI grid (4-up)',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <MetricStat label="Agent Runs" value={2_847} delta="+23%" deltaPositive trend="up" icon={<Zap size={16} />} />
      <MetricStat label="Active Matters" value={14} delta="-2" deltaPositive trend="down" icon={<FileText size={16} />} />
      <MetricStat label="Avg Confidence" value="91.4%" delta="+1.2pp" deltaPositive trend="up" icon={<TrendingUp size={16} />} />
      <MetricStat label="Escalations" value={3} delta="-5" deltaPositive trend="down" icon={<Shield size={16} />} />
    </div>
  ),
};
