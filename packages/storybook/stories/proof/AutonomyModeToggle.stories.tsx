import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { AutonomyModeToggle, type AutonomyMode } from '@szl-holdings/design-system';

const meta = {
  title: 'Proof & Governance/AutonomyModeToggle',
  component: AutonomyModeToggle,
  parameters: {
    docs: {
      description: {
        component:
          "Controls the agent's operational autonomy level — from passive observation to fully autonomous action.",
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'full'],
    },
    readOnly: { control: 'boolean' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AutonomyModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Observe: Story = {
  args: { value: 'observe', variant: 'full' },
};

export const Recommend: Story = {
  args: { value: 'recommend', variant: 'full' },
};

export const AskToAct: Story = {
  args: { value: 'ask-to-act', variant: 'full' },
};

export const ApprovedAct: Story = {
  args: { value: 'approved-act', variant: 'full' },
};

export const Compact: Story = {
  args: { value: 'ask-to-act', variant: 'compact' },
};

export const ReadOnly: Story = {
  args: { value: 'ask-to-act', variant: 'full', readOnly: true },
};

export const Interactive: Story = {
  render: () => {
    const [mode, setMode] = useState<AutonomyMode>('recommend');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AutonomyModeToggle value={mode} onChange={setMode} variant="full" />
        <p style={{ fontSize: 'var(--gi-text-xs)', color: 'var(--gi-text-secondary)' }}>
          Current mode: {mode}
        </p>
      </div>
    );
  },
};
