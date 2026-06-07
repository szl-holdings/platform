import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TopBar, StatusBadge } from '@szl-holdings/design-system';

const meta = {
  title: 'Shell/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Horizontal top navigation bar with breadcrumbs, tenant label, and right-side slot.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
    tenantLabel: 'SZL Holdings',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    breadcrumbs: [
      { label: 'SZL Holdings', href: '#' },
      { label: 'Aegis', href: '#' },
      { label: 'Threat Analysis' },
    ],
    tenantLabel: 'SZL Holdings — Production',
  },
};

export const WithStatusBadge: Story = {
  args: {
    title: 'Aegis Command',
    tenantLabel: 'SZL Holdings',
    statusBadge: <StatusBadge variant="active" label="Live" showDot />,
  },
};

export const WithCustomRight: Story = {
  args: {
    title: 'Analytics',
    tenantLabel: 'SZL Holdings',
    right: (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: 'var(--gi-text-xs)', color: 'var(--gi-text-secondary)' }}>
        <span>Last sync: 2m ago</span>
        <StatusBadge variant="success" label="Healthy" showDot />
      </div>
    ),
  },
};
