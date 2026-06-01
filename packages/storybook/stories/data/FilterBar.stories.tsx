import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { FilterBar, SearchInput } from '@szl-holdings/design-system';

const meta = {
  title: 'Data Display/FilterBar',
  component: FilterBar,
  parameters: {
    docs: {
      description: {
        component: 'Horizontal row of filter chips with optional search input and action slot.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const runFilters = [
  { id: 'all', label: 'All runs' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Pending' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'rejected', label: 'Rejected' },
];

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    return (
      <FilterBar
        filters={runFilters}
        activeFilter={active}
        onFilterChange={setActive}
      />
    );
  },
};

export const WithSearch: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    const [query, setQuery] = useState('');
    return (
      <FilterBar
        filters={runFilters}
        activeFilter={active}
        onFilterChange={setActive}
        search={
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            placeholder="Search runs…"
          />
        }
      />
    );
  },
};
