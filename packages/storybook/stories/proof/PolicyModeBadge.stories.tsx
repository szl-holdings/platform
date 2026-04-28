import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PolicyModeBadge } from '@szl-holdings/design-system';

const meta = {
  title: 'Proof & Governance/PolicyModeBadge',
  component: PolicyModeBadge,
  parameters: {
    docs: {
      description: {
        component: 'Policy context badge linking an action to its governing policy. Includes product, action type, and workspace scope.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['dark', 'light'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PolicyModeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PARAGON: Story = {
  args: {
    product: 'PARAGON',
    actionType: 'block-ip',
    workspace: 'Production',
  },
};

export const Counsel: Story = {
  args: {
    product: 'Counsel',
    actionType: 'draft-letter',
    workspace: 'Legal',
  },
};

export const Light: Story = {
  args: {
    product: 'DOMAINE',
    actionType: 'appraisal',
    workspace: 'APAC',
    variant: 'light',
  },
};

export const AllProducts: Story = {
  name: 'All products',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <PolicyModeBadge product="PARAGON" actionType="threat-response" workspace="Production" />
      <PolicyModeBadge product="Counsel" actionType="legal-draft" workspace="Legal" />
      <PolicyModeBadge product="DOMAINE" actionType="appraisal" workspace="APAC" />
      <PolicyModeBadge product="SEXTANT" actionType="route-deviation" workspace="Fleet" />
    </div>
  ),
};
