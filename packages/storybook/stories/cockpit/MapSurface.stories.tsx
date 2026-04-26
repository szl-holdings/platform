import type { Meta, StoryObj } from '@storybook/react';
import { MapSurface } from '@szl-holdings/design-system';
import type { MapMarker } from '@szl-holdings/design-system';

const markers: MapMarker[] = [
  { id: 'm1', lat: 51.5074, lng: -0.1278, label: 'London HQ', variant: 'success' },
  { id: 'm2', lat: 40.7128, lng: -74.006, label: 'New York Office', variant: 'success' },
  { id: 'm3', lat: 1.3521, lng: 103.8198, label: 'Singapore Hub', variant: 'warning' },
  { id: 'm4', lat: 25.2048, lng: 55.2708, label: 'Dubai Entity', variant: 'error' },
  { id: 'm5', lat: 35.6762, lng: 139.6503, label: 'Tokyo Partner', variant: 'info' },
];

const vesselMarkers: MapMarker[] = [
  { id: 'v1', lat: 22.3964, lng: 114.1095, label: 'IMOQ-8821 — On Route', variant: 'success' },
  { id: 'v2', lat: 1.0, lng: 104.0, label: 'IMOQ-9034 — Deviation Alert', variant: 'error' },
  { id: 'v3', lat: 13.7563, lng: 100.5018, label: 'IMOQ-7712 — Port Arrival', variant: 'info' },
];

const meta = {
  title: 'Cockpit/MapSurface',
  component: MapSurface,
  parameters: {
    docs: {
      description: {
        component: 'Geographic intelligence surface for entity location, vessel tracking, and threat geospatial analysis.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MapSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offices: Story = {
  args: {
    markers,
    title: 'Global Entity Map',
  },
};

export const VesselTracking: Story = {
  args: {
    markers: vesselMarkers,
    title: 'Fleet Status',
  },
};

export const Empty: Story = {
  args: {
    markers: [],
    title: 'No active locations',
  },
};
