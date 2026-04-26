import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { SearchInput } from '@szl-holdings/design-system';

const meta = {
  title: 'Forms/SearchInput',
  component: SearchInput,
  parameters: {
    docs: {
      description: {
        component: 'Search field with leading icon and clearable value.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Search evidence…',
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('threat intelligence');
    return (
      <SearchInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue('')}
        placeholder="Search runs, evidence, records…"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Search disabled',
    disabled: true,
  },
};
