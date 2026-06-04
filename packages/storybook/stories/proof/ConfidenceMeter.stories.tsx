import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ConfidenceMeter } from '@szl-holdings/design-system';

const meta = {
  title: 'Proof & Governance/ConfidenceMeter',
  component: ConfidenceMeter,
  parameters: {
    docs: {
      description: {
        component: 'Visual indicator of AI model certainty. High (≥80%), medium (50-79%), low (<50%), and contradiction states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'full'],
    },
    contradiction: { control: 'boolean' },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConfidenceMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const High: Story = {
  args: { value: 94, label: 'Threat Classification', variant: 'full' },
};

export const Medium: Story = {
  args: { value: 67, label: 'Document Intent', variant: 'full' },
};

export const Low: Story = {
  args: { value: 38, label: 'Anomaly Prediction', variant: 'full' },
};

export const Contradiction: Story = {
  args: { value: 48, label: 'Conflicting Evidence', variant: 'full', contradiction: true },
};

export const Compact: Story = {
  args: { value: 91, variant: 'compact' },
};

export const Range: Story = {
  name: 'Full range comparison',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
      {[97, 84, 71, 58, 42, 23].map((v) => (
        <ConfidenceMeter key={v} value={v} label={`${v}% confidence`} variant="full" />
      ))}
    </div>
  ),
};
