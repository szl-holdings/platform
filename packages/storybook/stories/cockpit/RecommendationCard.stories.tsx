import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RecommendationCard } from '@szl-holdings/design-system';

const meta = {
  title: 'Cockpit/RecommendationCard',
  component: RecommendationCard,
  parameters: {
    docs: {
      description: {
        component: 'Agent-generated recommendation with confidence indicator, evidence sources, and accept/dismiss actions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecommendationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Block suspicious IP range',
    description: 'PARAGON detected coordinated credential-stuffing activity from 185.220.0.0/16. Recommend blocking for 72 hours.',
    confidence: 92,
    onAccept: () => {},
    onDismiss: () => {},
  },
};

export const LowConfidence: Story = {
  args: {
    title: 'Issue formal warning to vendor',
    description: 'Contract compliance review identified 2 SLA breaches. Recommend issuing a formal warning letter before escalation.',
    confidence: 61,
    onAccept: () => {},
    onDismiss: () => {},
  },
};

export const HighUrgency: Story = {
  args: {
    title: 'Immediately revoke service account',
    description: 'Service account sa_deploy_prod shows suspicious lateral movement consistent with compromise. Immediate revocation recommended.',
    confidence: 97,
    onAccept: () => {},
    onDismiss: () => {},
  },
};

export const WithoutActions: Story = {
  args: {
    title: 'Monitor shipping route deviation',
    description: 'Vessel IMOQ-8821 has deviated 340nm from planned route. No policy-mandated action required; continuing to monitor.',
    confidence: 84,
  },
};
