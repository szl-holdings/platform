import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { GlobalCommandPalette, Button } from '@szl-holdings/design-system';
import { LayoutDashboard, Shield, FileText, BarChart3, Settings, Search, LogOut, Zap } from 'lucide-react';

const meta = {
  title: 'Shell/GlobalCommandPalette',
  component: GlobalCommandPalette,
  parameters: {
    docs: {
      description: {
        component: 'Command-K style global search and action palette. Sections organise commands by category.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlobalCommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', section: 'Navigate', icon: <LayoutDashboard size={14} />, onSelect: () => {} },
  { id: 'nav-aegis', label: 'Go to Aegis', description: 'Cyber Resilience Command', section: 'Navigate', icon: <Shield size={14} />, onSelect: () => {} },
  { id: 'nav-counsel', label: 'Go to Counsel', description: 'Legal Matter Command', section: 'Navigate', icon: <FileText size={14} />, onSelect: () => {} },
  { id: 'nav-analytics', label: 'Go to Analytics', section: 'Navigate', icon: <BarChart3 size={14} />, onSelect: () => {} },
  { id: 'action-run', label: 'Trigger Manual Run', shortcut: '⌘R', section: 'Actions', icon: <Zap size={14} />, onSelect: () => {} },
  { id: 'action-search', label: 'Search Evidence', shortcut: '⌘F', section: 'Actions', icon: <Search size={14} />, onSelect: () => {} },
  { id: 'admin-settings', label: 'Open Settings', section: 'Admin', icon: <Settings size={14} />, onSelect: () => {} },
  { id: 'admin-logout', label: 'Sign Out', section: 'Admin', icon: <LogOut size={14} />, onSelect: () => {} },
];

export const Open: Story = {
  args: {
    open: true,
    onClose: () => {},
    items: sampleItems,
    placeholder: 'Search commands, navigate, take action…',
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Open Command Palette ⌘K
        </Button>
        <GlobalCommandPalette
          open={open}
          onClose={() => setOpen(false)}
          items={sampleItems}
          placeholder="Search commands, navigate, take action…"
        />
      </div>
    );
  },
};

export const WithFewItems: Story = {
  args: {
    open: true,
    onClose: () => {},
    items: sampleItems.slice(0, 3),
  },
};
