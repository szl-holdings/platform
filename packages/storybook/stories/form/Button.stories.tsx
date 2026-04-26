import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '@szl-holdings/design-system';
import { Plus, Download, Trash2, ArrowRight, RefreshCw, Loader } from 'lucide-react';

const meta = {
  title: 'Forms/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Core action trigger. Five variants × four sizes with icon and loading state support.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive', 'outline'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Approve run' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Export data' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'View details' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Cancel' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete record' },
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All sizes',
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="primary" size="xs">Extra small</Button>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With icons',
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant="primary" icon={<Plus size={14} />}>New run</Button>
      <Button variant="secondary" icon={<Download size={14} />}>Export</Button>
      <Button variant="ghost" iconRight={<ArrowRight size={14} />}>View all</Button>
      <Button variant="destructive" icon={<Trash2 size={14} />}>Delete</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Processing…' },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
};
