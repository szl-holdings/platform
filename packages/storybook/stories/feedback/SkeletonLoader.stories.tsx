import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SkeletonText, SkeletonCard, SkeletonKPI, SkeletonTable } from '@szl-holdings/design-system';

const meta = {
  title: 'Feedback/SkeletonLoader',
  component: SkeletonText,
  parameters: {
    docs: {
      description: {
        component: 'Content-aware skeleton placeholders for text blocks, cards, KPI grids, and data tables.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SkeletonText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  name: 'SkeletonText',
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <SkeletonText lines={4} lastLineWidth="60%" />
    </div>
  ),
};

export const Card: Story = {
  name: 'SkeletonCard',
  render: () => (
    <div style={{ maxWidth: '360px' }}>
      <SkeletonCard lines={3} />
    </div>
  ),
};

export const KPI: Story = {
  name: 'SkeletonKPI',
  render: () => (
    <div>
      <SkeletonKPI columns={4} />
    </div>
  ),
};

export const Table: Story = {
  name: 'SkeletonTable',
  render: () => (
    <SkeletonTable rows={6} cols={5} />
  ),
};

export const DashboardComposition: Story = {
  name: 'Dashboard composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SkeletonKPI columns={3} />
      <SkeletonTable rows={5} cols={4} />
    </div>
  ),
};
