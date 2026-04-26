import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Select } from '@szl-holdings/design-system';

const meta = {
  title: 'Forms/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component: 'Native-style dropdown select with GI design tokens and optional placeholder.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Select a product…"
        options={[
          { value: 'aegis', label: 'Aegis — Cyber Resilience' },
          { value: 'counsel', label: 'Counsel — Legal Matters' },
          { value: 'terra', label: 'Terra — Real Estate' },
          { value: 'vessels', label: 'Vessels — Maritime' },
        ]}
      />
    );
  },
};

export const Preselected: Story = {
  render: () => {
    const [value, setValue] = useState('counsel');
    return (
      <Select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        options={[
          { value: 'aegis', label: 'Aegis' },
          { value: 'counsel', label: 'Counsel' },
          { value: 'terra', label: 'Terra' },
        ]}
      />
    );
  },
};

export const WithDisabledOption: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Select autonomy mode…"
        options={[
          { value: 'observe', label: 'Observe' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'draft', label: 'Draft' },
          { value: 'ask-to-act', label: 'Ask to Act' },
          { value: 'approved-act', label: 'Approved Act', disabled: true },
        ]}
      />
    );
  },
};
