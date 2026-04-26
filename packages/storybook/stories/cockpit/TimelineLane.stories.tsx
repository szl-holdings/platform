import type { Meta, StoryObj } from '@storybook/react';
import { TimelineLane } from '@szl-holdings/design-system';
import type { CockpitTimelineEvent } from '@szl-holdings/design-system';

const events: CockpitTimelineEvent[] = [
  { id: 'e1', label: 'Incident detected', timestamp: '2026-04-26T08:00:00Z', severity: 'critical' },
  { id: 'e2', label: 'Aegis agent triggered', timestamp: '2026-04-26T08:00:12Z', severity: 'info' },
  { id: 'e3', label: 'Evidence collected', timestamp: '2026-04-26T08:00:52Z', severity: 'info' },
  { id: 'e4', label: 'Policy escalation', timestamp: '2026-04-26T08:01:20Z', severity: 'warning' },
  { id: 'e5', label: 'Human approval requested', timestamp: '2026-04-26T08:01:28Z', severity: 'warning' },
  { id: 'e6', label: 'Approved by S. Chen', timestamp: '2026-04-26T08:05:42Z', severity: 'info' },
  { id: 'e7', label: 'Block action executed', timestamp: '2026-04-26T08:05:45Z', severity: 'info' },
  { id: 'e8', label: 'Incident resolved', timestamp: '2026-04-26T08:05:55Z', severity: 'info' },
];

const meta = {
  title: 'Cockpit/TimelineLane',
  component: TimelineLane,
  parameters: {
    docs: {
      description: {
        component: 'Chronological event lane for incident timelines, run histories, and audit sequences.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TimelineLane>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { events, title: 'Incident INC-2026-04829' },
};

export const Critical: Story = {
  args: {
    events: events.filter((e) => ['critical', 'warning'].includes(e.severity)),
    title: 'Critical Events Only',
  },
};
