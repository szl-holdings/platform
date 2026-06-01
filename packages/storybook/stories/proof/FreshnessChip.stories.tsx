import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FreshnessChip } from '@szl-holdings/design-system';

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

const meta = {
  title: 'Proof & Governance/FreshnessChip',
  component: FreshnessChip,
  parameters: {
    docs: {
      description: {
        component: 'Data recency indicator — fresh (< 5 min), aging (5-60 min), stale (> 1 hour), or unknown.',
      },
    },
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['fresh', 'aging', 'stale', 'unknown'],
    },
    showAbsolute: { control: 'boolean' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FreshnessChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fresh: Story = {
  args: { timestamp: minutesAgo(2), level: 'fresh' },
};

export const Aging: Story = {
  args: { timestamp: minutesAgo(25), level: 'aging' },
};

export const Stale: Story = {
  args: { timestamp: hoursAgo(3), level: 'stale' },
};

export const Unknown: Story = {
  args: { timestamp: null, level: 'unknown' },
};

export const WithAbsolute: Story = {
  args: { timestamp: minutesAgo(12), level: 'aging', showAbsolute: true },
};

export const AllLevels: Story = {
  name: 'All freshness levels',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <FreshnessChip timestamp={minutesAgo(1)} level="fresh" />
      <FreshnessChip timestamp={minutesAgo(30)} level="aging" />
      <FreshnessChip timestamp={hoursAgo(6)} level="stale" />
      <FreshnessChip timestamp={null} level="unknown" />
    </div>
  ),
};
