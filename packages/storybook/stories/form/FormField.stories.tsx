import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FormField } from '@szl-holdings/design-system';

const meta = {
  title: 'Forms/FormField',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component: 'Label, hint, and error wrapper for any form control. Pairs with any input element.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

const inputStyle = {
  width: '100%',
  background: 'var(--gi-bg-overlay)',
  border: '1px solid var(--gi-border-default)',
  borderRadius: 'var(--gi-radius-md)',
  padding: '8px 12px',
  color: 'var(--gi-text-primary)',
  fontSize: 'var(--gi-text-sm)',
  outline: 'none',
};

export const Default: Story = {
  args: {
    label: 'Tenant name',
    htmlFor: 'tenant',
    children: <input id="tenant" style={inputStyle} placeholder="e.g. SZL Holdings" />,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Confidence threshold',
    htmlFor: 'threshold',
    hint: 'Agent will escalate runs below this confidence value.',
    children: <input id="threshold" type="number" style={inputStyle} defaultValue={85} min={0} max={100} />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Policy justification',
    htmlFor: 'justification',
    required: true,
    error: 'Justification must be at least 50 characters.',
    children: (
      <textarea
        id="justification"
        style={{ ...inputStyle, height: '80px', resize: 'vertical', border: '1px solid var(--gi-error-border)' }}
        placeholder="Describe why this policy change is needed…"
      />
    ),
  },
};

export const Required: Story = {
  args: {
    label: 'API key',
    htmlFor: 'apikey',
    required: true,
    hint: 'Used for outbound webhook authentication.',
    children: <input id="apikey" type="password" style={inputStyle} placeholder="sk-…" />,
  },
};
