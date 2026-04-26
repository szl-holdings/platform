import type { Meta, StoryObj } from '@storybook/react';
import { AuditRail } from '@szl-holdings/design-system';
import type { AuditEvent } from '@szl-holdings/design-system';

const meta = {
  title: 'Cockpit/AuditRail',
  component: AuditRail,
  parameters: {
    docs: {
      description: {
        component: 'Immutable, append-only audit trail for agent actions, policy changes, and human decisions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuditRail>;

export default meta;
type Story = StoryObj<typeof meta>;

const events: AuditEvent[] = [
  { id: '1', kind: 'agent_action', message: 'Aegis agent blocked IP range 185.220.0.0/16', actor: 'aegis-agent', timestamp: '2026-04-26T14:32:00Z' },
  { id: '2', kind: 'human_approval', message: 'Sarah Chen approved block action', actor: 'sarah.chen@szl.com', timestamp: '2026-04-26T14:31:45Z' },
  { id: '3', kind: 'policy_change', message: 'Autonomy mode escalated to Ask-to-Act', actor: 'policy-guard', timestamp: '2026-04-26T14:31:20Z' },
  { id: '4', kind: 'agent_action', message: 'Evidence harvester indexed 14 new threat indicators', actor: 'aegis-agent', timestamp: '2026-04-26T14:30:00Z' },
  { id: '5', kind: 'system', message: 'Run initiated by scheduled trigger', actor: 'scheduler', timestamp: '2026-04-26T14:29:55Z' },
];

export const Default: Story = {
  args: { events },
};

export const SingleEvent: Story = {
  args: {
    events: [events[1]],
  },
};

export const PolicyHeavy: Story = {
  args: {
    events: [
      { id: '1', kind: 'policy_change', message: 'Shield mode activated — all actions require approval', actor: 'admin', timestamp: '2026-04-26T10:00:00Z' },
      { id: '2', kind: 'human_approval', message: 'Marcus Vance approved emergency policy update', actor: 'marcus.vance@szl.com', timestamp: '2026-04-26T10:01:00Z' },
      { id: '3', kind: 'policy_change', message: 'Confidence threshold raised from 80% to 92%', actor: 'admin', timestamp: '2026-04-26T10:02:00Z' },
    ],
  },
};
