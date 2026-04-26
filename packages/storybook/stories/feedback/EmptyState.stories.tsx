import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { EmptyState, Button } from '@szl-holdings/design-system';
import { Search, Shield, FileText, BarChart3, Inbox } from 'lucide-react';

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component: 'Zero-state placeholder for lists, search results, or content areas with no data.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    icon: <Search size={32} />,
  },
};

export const NoThreats: Story = {
  args: {
    title: 'No active threats',
    description: 'The threat intelligence feed is clear. All systems are operating normally.',
    icon: <Shield size={32} />,
    action: <Button variant="ghost" size="sm">View history</Button>,
  },
};

export const NoDocuments: Story = {
  args: {
    title: 'No documents uploaded',
    description: 'Upload evidence documents to begin analysis and proof chain construction.',
    icon: <FileText size={32} />,
    action: <Button variant="primary" size="sm">Upload document</Button>,
  },
};

export const NoData: Story = {
  args: {
    title: 'Insufficient data',
    description: 'There isn\'t enough data yet to generate analytics insights for this time period.',
    icon: <BarChart3 size={32} />,
  },
};

export const EmptyInbox: Story = {
  args: {
    title: 'Approvals inbox is clear',
    description: 'All pending approvals have been reviewed. Check back when new items arrive.',
    icon: <Inbox size={32} />,
  },
};
