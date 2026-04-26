import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState } from '@szl-holdings/design-system';

const meta = {
  title: 'Feedback/ErrorState',
  component: ErrorState,
  parameters: {
    docs: {
      description: {
        component: 'Structured error display with message, optional error code, trace ID, and retry action.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'An unexpected error occurred while loading data.',
    onRetry: () => alert('Retrying…'),
  },
};

export const WithCode: Story = {
  args: {
    title: 'Connection failed',
    message: 'Unable to reach the evidence ledger service. Check network connectivity and try again.',
    code: 'ERR_SERVICE_UNAVAILABLE',
    onRetry: () => {},
  },
};

export const WithTraceId: Story = {
  args: {
    title: 'Policy evaluation failed',
    message: 'The policy guard returned an unexpected response during evaluation.',
    code: '500',
    traceId: 'trace_01jd8xk7pq0wzfr4n9gm5hvc3b',
    onRetry: () => {},
  },
};

export const NoRetry: Story = {
  args: {
    title: 'Access denied',
    message: 'You do not have permission to view this resource. Contact your administrator.',
    code: '403',
  },
};
