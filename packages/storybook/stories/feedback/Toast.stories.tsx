import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { ToastContainer, Button } from '@szl-holdings/design-system';
import type { Toast } from '@szl-holdings/design-system';

const meta = {
  title: 'Feedback/Toast',
  component: ToastContainer,
  parameters: {
    docs: {
      description: {
        component: 'Transient notification toasts with five semantic variants and optional action buttons.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleToasts: Toast[] = [
  { id: '1', message: 'Run completed successfully', description: 'Agent processed 847 records in 3.2s.', variant: 'success' },
];

export const Success: Story = {
  args: {
    toasts: [{ id: '1', message: 'Policy approved', description: 'The autonomy policy has been activated.', variant: 'success' }],
    onDismiss: () => {},
    position: 'top-right',
  },
};

export const Warning: Story = {
  args: {
    toasts: [{ id: '1', message: 'Approval required', description: 'This action needs human sign-off before proceeding.', variant: 'warning' }],
    onDismiss: () => {},
  },
};

export const Error: Story = {
  args: {
    toasts: [{ id: '1', message: 'Run failed', description: 'The agent encountered an unrecoverable error. Trace: abc123.', variant: 'error' }],
    onDismiss: () => {},
  },
};

export const Info: Story = {
  args: {
    toasts: [{ id: '1', message: 'New evidence available', description: '3 new documents have been indexed for this matter.', variant: 'info' }],
    onDismiss: () => {},
  },
};

export const WithAction: Story = {
  args: {
    toasts: [{
      id: '1',
      message: 'Evidence bundle exported',
      description: 'Your export is ready to download.',
      variant: 'success',
      action: { label: 'Download', onClick: () => {} },
    }],
    onDismiss: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = React.useRef(0);
    const variants: Toast['variant'][] = ['success', 'warning', 'error', 'info', 'neutral'];
    const messages = [
      'Run completed successfully',
      'Approval required',
      'Connection timeout',
      'New evidence indexed',
      'Settings saved',
    ];

    const addToast = (variant: Toast['variant'], message: string) => {
      const id = String(++counterRef.current);
      setToasts((t) => [...t, { id, message, variant, duration: 4000 }]);
    };

    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {variants.map((v, i) => (
          <Button key={v} variant="secondary" size="sm" onClick={() => addToast(v, messages[i])}>
            Show {v}
          </Button>
        ))}
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>
    );
  },
};
