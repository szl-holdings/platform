import type { Meta, StoryObj } from '@storybook/react';
import { GraphCanvas, type GraphNode, type GraphEdge } from '@szl-holdings/design-system';

const nodes: GraphNode[] = [
  { id: 'attacker', label: 'Threat Actor', group: 'threat', x: 100, y: 200 },
  { id: 'ip', label: '185.220.0.0/16', group: 'indicator', x: 300, y: 200 },
  { id: 'campaign', label: 'Cred-Stuffing Campaign', group: 'threat', x: 300, y: 50 },
  { id: 'target', label: 'Auth Service', group: 'asset', x: 500, y: 200 },
  { id: 'action', label: 'Block Rule', group: 'action', x: 700, y: 200 },
];

const edges: GraphEdge[] = [
  { id: 'e1', source: 'attacker', target: 'ip', label: 'controls' },
  { id: 'e2', source: 'ip', target: 'target', label: 'attacks' },
  { id: 'e3', source: 'campaign', target: 'ip', label: 'uses' },
  { id: 'e4', source: 'action', target: 'ip', label: 'blocks' },
];

const meta = {
  title: 'Cockpit/GraphCanvas',
  component: GraphCanvas,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive force-directed graph for visualising entity relationships, attack paths, and evidence connections.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GraphCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { nodes, edges },
};

export const EmptyGraph: Story = {
  args: { nodes: [], edges: [] },
};

export const SmallGraph: Story = {
  args: {
    nodes: nodes.slice(0, 3),
    edges: edges.slice(0, 2),
  },
};
