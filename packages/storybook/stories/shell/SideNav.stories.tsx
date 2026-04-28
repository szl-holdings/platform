import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LayoutDashboard, Shield, FileText, BarChart3, Settings, Users, AlertTriangle } from 'lucide-react';
import { SideNav } from '@szl-holdings/design-system';

const meta = {
  title: 'Shell/SideNav',
  component: SideNav,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Vertical navigation sidebar with collapsible sections, icons, badges, and nested items.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const sections = [
  {
    id: 'main',
    title: 'Command',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '#', icon: <LayoutDashboard size={16} /> },
      { id: 'aegis', label: 'PARAGON', href: '#', icon: <Shield size={16} />, badge: 3 },
      { id: 'counsel', label: 'Counsel', href: '#', icon: <FileText size={16} /> },
    ],
  },
  {
    id: 'analytics',
    title: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', href: '#', icon: <BarChart3 size={16} /> },
      { id: 'alerts', label: 'Alerts', href: '#', icon: <AlertTriangle size={16} />, badge: 12 },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    items: [
      { id: 'team', label: 'Team', href: '#', icon: <Users size={16} /> },
      { id: 'settings', label: 'Settings', href: '#', icon: <Settings size={16} /> },
    ],
  },
];

export const Default: Story = {
  args: {
    sections,
    activeItemId: 'dashboard',
    collapsed: false,
  },
  render: (args) => (
    <div style={{ height: '600px', display: 'flex' }}>
      <SideNav {...args} />
    </div>
  ),
};

export const Collapsed: Story = {
  args: {
    sections,
    activeItemId: 'aegis',
    collapsed: true,
  },
  render: (args) => (
    <div style={{ height: '600px', display: 'flex' }}>
      <SideNav {...args} />
    </div>
  ),
};

export const WithBadges: Story = {
  args: {
    sections,
    activeItemId: 'alerts',
    collapsed: false,
  },
  render: (args) => (
    <div style={{ height: '600px', display: 'flex' }}>
      <SideNav {...args} />
    </div>
  ),
};
