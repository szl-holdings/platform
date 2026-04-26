import type { Meta, StoryObj } from '@storybook/react';
import { RunTimeline } from '@szl-holdings/design-system';
import type { RunSpan } from '@szl-holdings/design-system';

const spans: RunSpan[] = [
  { id: 's1', label: 'Trigger', startMs: 0, durationMs: 12, status: 'success' },
  { id: 's2', label: 'Evidence Retrieval', startMs: 12, durationMs: 340, status: 'success' },
  { id: 's3', label: 'Policy Evaluation', startMs: 352, durationMs: 88, status: 'success' },
  { id: 's4', label: 'Confidence Scoring', startMs: 440, durationMs: 56, status: 'success' },
  { id: 's5', label: 'Human Approval Gate', startMs: 496, durationMs: 14520, status: 'success' },
  { id: 's6', label: 'Action Execution', startMs: 15016, durationMs: 203, status: 'success' },
  { id: 's7', label: 'Audit Commit', startMs: 15219, durationMs: 34, status: 'success' },
];

const failedSpans: RunSpan[] = [
  { id: 's1', label: 'Trigger', startMs: 0, durationMs: 12, status: 'success' },
  { id: 's2', label: 'Evidence Retrieval', startMs: 12, durationMs: 340, status: 'success' },
  { id: 's3', label: 'Policy Evaluation', startMs: 352, durationMs: 88, status: 'success' },
  { id: 's4', label: 'Confidence Scoring', startMs: 440, durationMs: 56, status: 'error', errorMessage: 'Confidence below minimum threshold (45% < 80%)' },
];

const meta = {
  title: 'Cockpit/RunTimeline',
  component: RunTimeline,
  parameters: {
    docs: {
      description: {
        component: 'Horizontal Gantt-style timeline of agent run spans with status indicators and duration tooltips.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RunTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Completed: Story = {
  args: { spans, title: 'run_01jd8xk — Completed' },
};

export const Failed: Story = {
  args: { spans: failedSpans, title: 'run_01jd8xq — Failed' },
};

export const WithPendingSpan: Story = {
  args: {
    spans: [
      ...spans.slice(0, 4),
      { id: 's5', label: 'Human Approval Gate', startMs: 496, durationMs: 0, status: 'pending' },
    ],
    title: 'run_01jd8xr — Awaiting approval',
  },
};
