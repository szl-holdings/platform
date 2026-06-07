import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TableToolbar, Button } from '@szl-holdings/design-system';
import { Plus } from 'lucide-react';

const meta = {
  title: 'Data Display/TableToolbar',
  component: TableToolbar,
  parameters: {
    docs: {
      description: {
        component: 'Table action bar showing row counts, export, refresh, and custom action slots.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TableToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    totalCount: 847,
    onExport: () => {},
    onRefresh: () => {},
  },
};

export const WithSelection: Story = {
  args: {
    totalCount: 847,
    selectedCount: 12,
    onExport: () => {},
    onRefresh: () => {},
  },
};

export const WithCustomActions: Story = {
  args: {
    totalCount: 14,
    onRefresh: () => {},
    children: (
      <Button variant="primary" size="sm" icon={<Plus size={14} />}>New Matter</Button>
    ),
  },
};
