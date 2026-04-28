import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { LayoutDashboard, Shield, FileText, BarChart3, Settings, Users, Bell } from 'lucide-react';
import { AppShell } from '@szl-holdings/design-system';

const meta = {
  title: 'Shell/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Primary application wrapper providing nav, top bar, and main content area.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNavItems = [
  { id: 'dashboard', label: 'Dashboard', href: '#', icon: <LayoutDashboard size={16} /> },
  { id: 'aegis', label: 'PARAGON', href: '#', icon: <Shield size={16} />, badge: 3 },
  { id: 'counsel', label: 'Counsel', href: '#', icon: <FileText size={16} /> },
  { id: 'analytics', label: 'Analytics', href: '#', icon: <BarChart3 size={16} /> },
  { id: 'team', label: 'Team', href: '#', icon: <Users size={16} /> },
  { id: 'settings', label: 'Settings', href: '#', icon: <Settings size={16} /> },
];

export const Default: Story = {
  args: {
    navItems: sampleNavItems,
    activeNavItem: 'dashboard',
    tenantLabel: 'SZL Holdings',
    children: (
      <div style={{ padding: '24px' }}>
        <h1 style={{ color: 'var(--gi-text-primary)', fontSize: 'var(--gi-text-xl)', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--gi-text-secondary)' }}>Main content area</p>
      </div>
    ),
  },
};

export const Collapsed: Story = {
  args: {
    ...Default.args,
    defaultCollapsed: true,
  },
};

export const WithRightInspector: Story = {
  args: {
    ...Default.args,
    activeNavItem: 'aegis',
    rightInspector: (
      <div style={{ width: '280px', padding: '16px', borderLeft: '1px solid var(--gi-border-default)', height: '100%' }}>
        <p style={{ color: 'var(--gi-text-secondary)', fontSize: 'var(--gi-text-sm)' }}>Inspector Panel</p>
      </div>
    ),
  },
};

export const WithTopBarRight: Story = {
  args: {
    ...Default.args,
    topBarRight: (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Bell size={16} style={{ color: 'var(--gi-text-secondary)' }} />
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gi-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--gi-bg-base)' }}>SZ</div>
      </div>
    ),
  },
};
