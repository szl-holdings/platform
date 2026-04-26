import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { SegmentedControl } from '@szl-holdings/design-system';

const meta = {
  title: 'Forms/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    docs: {
      description: {
        component: 'Exclusive option picker — use for view switching, filter modes, or time ranges.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ViewSwitch: Story = {
  render: () => {
    const [view, setView] = useState('table');
    return (
      <SegmentedControl
        options={[
          { value: 'table', label: 'Table' },
          { value: 'timeline', label: 'Timeline' },
          { value: 'graph', label: 'Graph' },
        ]}
        value={view}
        onChange={setView}
      />
    );
  },
};

export const TimeRange: Story = {
  render: () => {
    const [range, setRange] = useState('7d');
    return (
      <SegmentedControl
        options={[
          { value: '24h', label: '24h' },
          { value: '7d', label: '7d' },
          { value: '30d', label: '30d' },
          { value: '90d', label: '90d' },
        ]}
        value={range}
        onChange={setRange}
      />
    );
  },
};

export const WithDisabled: Story = {
  render: () => {
    const [mode, setMode] = useState('recommend');
    return (
      <SegmentedControl
        options={[
          { value: 'observe', label: 'Observe' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'act', label: 'Act', disabled: true },
        ]}
        value={mode}
        onChange={setMode}
      />
    );
  },
};
