import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PolicyStateChip } from '@szl-holdings/design-system';

const meta = {
  title: 'Proof & Governance/PolicyStateChip',
  component: PolicyStateChip,
  parameters: {
    docs: {
      description: {
        component: 'Shows whether an action is allowed, requires approval, or is blocked under the current policy.',
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['allowed', 'requires-approval', 'blocked'],
    },
    variant: {
      control: 'select',
      options: ['compact', 'full'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PolicyStateChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Allowed: Story = {
  args: { state: 'allowed', variant: 'full' },
};

export const RequiresApproval: Story = {
  args: { state: 'requires-approval', reason: 'Confidence below 80% threshold', variant: 'full' },
};

export const Blocked: Story = {
  args: { state: 'blocked', reason: 'Shield mode active — all destructive actions suspended', variant: 'full' },
};

export const Compact: Story = {
  name: 'Compact — all three states',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <PolicyStateChip state="allowed" variant="compact" />
      <PolicyStateChip state="requires-approval" variant="compact" />
      <PolicyStateChip state="blocked" variant="compact" />
    </div>
  ),
};
