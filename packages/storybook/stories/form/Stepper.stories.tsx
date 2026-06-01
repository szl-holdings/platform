import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Stepper, Button } from '@szl-holdings/design-system';

const meta = {
  title: 'Forms/Stepper',
  component: Stepper,
  parameters: {
    docs: {
      description: {
        component: 'Multi-step workflow navigation with complete, current, upcoming, and error states.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const policySteps = [
  { id: 'review', label: 'Policy Review', description: 'Review policy parameters' },
  { id: 'evidence', label: 'Evidence Check', description: 'Validate supporting evidence' },
  { id: 'approval', label: 'Human Approval', description: 'Authorised signatory required' },
  { id: 'activate', label: 'Activation', description: 'Policy goes live' },
];

export const Default: Story = {
  args: {
    steps: policySteps,
    currentStepId: 'evidence',
    getStepStatus: (id) => {
      if (id === 'review') return 'complete';
      if (id === 'evidence') return 'current';
      return 'upcoming';
    },
  },
};

export const WithError: Story = {
  args: {
    steps: policySteps,
    currentStepId: 'evidence',
    getStepStatus: (id) => {
      if (id === 'review') return 'complete';
      if (id === 'evidence') return 'error';
      return 'upcoming';
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [current, setCurrent] = useState('review');
    const steps = policySteps;
    const idx = steps.findIndex((s) => s.id === current);

    const getStatus = (id: string) => {
      const i = steps.findIndex((s) => s.id === id);
      if (i < idx) return 'complete' as const;
      if (i === idx) return 'current' as const;
      return 'upcoming' as const;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Stepper steps={steps} currentStepId={current} getStepStatus={getStatus} onStepClick={(id) => setCurrent(id)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => setCurrent(steps[idx - 1].id)}>Back</Button>
          <Button variant="primary" size="sm" disabled={idx === steps.length - 1} onClick={() => setCurrent(steps[idx + 1].id)}>Next</Button>
        </div>
      </div>
    );
  },
};
