import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from '@szl-holdings/design-system';

const meta = {
  title: 'Feedback/LoadingState',
  component: LoadingState,
  parameters: {
    docs: {
      description: {
        component: 'Spinner-based loading indicator in three sizes with optional inline mode.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Loading…',
    size: 'md',
  },
};

export const Small: Story = {
  args: { size: 'sm', message: 'Fetching data…' },
};

export const Large: Story = {
  args: { size: 'lg', message: 'Running analysis…' },
};

export const Inline: Story = {
  args: {
    size: 'sm',
    inline: true,
    message: 'Processing',
  },
};

export const NoMessage: Story = {
  args: { size: 'md' },
};

export const AnalysisRunning: Story = {
  args: {
    size: 'lg',
    message: 'Agent is evaluating policy constraints…',
  },
};
