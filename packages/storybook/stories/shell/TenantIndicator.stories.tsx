import type { Meta, StoryObj } from '@storybook/react';
import { TenantIndicator } from '@szl-holdings/design-system';

const meta = {
  title: 'Shell/TenantIndicator',
  component: TenantIndicator,
  parameters: {
    docs: {
      description: {
        component: 'Displays the current tenant name and environment context (production, staging, development, demo).',
      },
    },
  },
  argTypes: {
    environment: {
      control: 'select',
      options: ['production', 'staging', 'development', 'demo'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TenantIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Production: Story = {
  args: {
    tenantName: 'SZL Holdings',
    environment: 'production',
  },
};

export const Staging: Story = {
  args: {
    tenantName: 'SZL Holdings',
    environment: 'staging',
  },
};

export const Development: Story = {
  args: {
    tenantName: 'SZL Dev Sandbox',
    environment: 'development',
  },
};

export const Demo: Story = {
  args: {
    tenantName: 'ACME Corp (Demo)',
    environment: 'demo',
  },
};

export const LongTenantName: Story = {
  args: {
    tenantName: 'Carlota Jo International Consulting Group',
    environment: 'production',
  },
};
