import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Breadcrumb } from '@szl-holdings/design-system';
import { Home, Shield, ChevronRight } from 'lucide-react';

const meta = {
  title: 'Shell/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    docs: {
      description: {
        component: 'Hierarchical navigation trail with optional icons and custom separators.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'PARAGON', href: '#' },
      { label: 'Threat Analysis' },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      { label: 'Home', href: '#', icon: <Home size={12} /> },
      { label: 'PARAGON', href: '#', icon: <Shield size={12} /> },
      { label: 'Incident #4829' },
    ],
  },
};

export const LongPath: Story = {
  args: {
    items: [
      { label: 'SZL Holdings', href: '#' },
      { label: 'PARAGON', href: '#' },
      { label: 'Threat Intelligence', href: '#' },
      { label: 'Incidents', href: '#' },
      { label: 'INC-2024-04829' },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Command', href: '#' },
      { label: 'Counsel', href: '#' },
      { label: 'Matter #102' },
    ],
    separator: <ChevronRight size={12} />,
  },
};
