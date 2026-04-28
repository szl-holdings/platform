import type { Meta, StoryObj } from '@storybook/react';
import { NarrativePanel } from '@szl-holdings/design-system';
import type { NarrativeParagraph } from '@szl-holdings/design-system';

const paragraphs: NarrativeParagraph[] = [
  {
    id: 'p1',
    heading: 'Threat Detection',
    body: 'PARAGON identified a coordinated credential-stuffing attack originating from Tor exit nodes in IP range 185.220.0.0/16. 847 failed authentication attempts were detected over a 5-minute window — 12× above the baseline rate.',
  },
  {
    id: 'p2',
    heading: 'Evidence Assessment',
    body: 'The pattern was cross-validated against AlienVault OTX threat feeds, which confirmed the IP range is associated with known credential-stuffing campaigns. Historical incident analysis shows blocking this range resolved 3 similar events with a 94% success rate.',
  },
  {
    id: 'p3',
    heading: 'Recommended Action',
    body: 'Block IP range 185.220.0.0/16 at the perimeter firewall for 72 hours. Monitor for lateral movement from any sessions active before the block. Escalate to SOC if authentication anomalies continue from other IP ranges.',
    confidence: 92,
  },
];

const meta = {
  title: 'Cockpit/NarrativePanel',
  component: NarrativePanel,
  parameters: {
    docs: {
      description: {
        component: 'AI-generated narrative explanation of an agent\'s reasoning, structured as headed paragraphs with optional per-paragraph confidence.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NarrativePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Threat Analysis Narrative',
    paragraphs,
    timestamp: '2026-04-26T14:32:00Z',
  },
};

export const SingleParagraph: Story = {
  args: {
    title: 'Executive Summary',
    paragraphs: [paragraphs[0]],
  },
};

export const Loading: Story = {
  args: {
    title: 'Generating narrative…',
    paragraphs: [],
    loading: true,
  },
};
