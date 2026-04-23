/**
 * Reference connector: real-estate public records.
 *
 * In a production deployment this would call a county-assessor or MLS feed.
 * Here we ship a deterministic seed so the framework can be exercised
 * end-to-end in dev, demos, and CI without external network access.
 */

import { z } from 'zod';
import type { Connector } from '../types';

const ParcelSchema = z.object({
  parcelId: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  ownerName: z.string().min(1),
  assessedValueUsd: z.number().nonnegative(),
  lotSizeSqft: z.number().nonnegative(),
  lastSaleDate: z.string(),
  lastSalePriceUsd: z.number().nonnegative(),
});
export type Parcel = z.infer<typeof ParcelSchema>;

const SEED_PARCELS: Parcel[] = [
  {
    parcelId: 'TX-201-44-091',
    address: '4400 Westheimer Rd',
    city: 'Houston',
    state: 'TX',
    zip: '77027',
    ownerName: 'River Oaks Holdings LLC',
    assessedValueUsd: 18_400_000,
    lotSizeSqft: 96_500,
    lastSaleDate: '2023-06-12',
    lastSalePriceUsd: 21_750_000,
  },
  {
    parcelId: 'TX-201-44-092',
    address: '4424 Westheimer Rd',
    city: 'Houston',
    state: 'TX',
    zip: '77027',
    ownerName: 'Stonebridge Asset Co',
    assessedValueUsd: 7_200_000,
    lotSizeSqft: 38_100,
    lastSaleDate: '2024-02-04',
    lastSalePriceUsd: 8_100_000,
  },
  {
    parcelId: 'CA-310-27-014',
    address: '120 Mission Ave',
    city: 'San Francisco',
    state: 'CA',
    zip: '94110',
    ownerName: 'Mission Bay Capital Partners',
    assessedValueUsd: 42_900_000,
    lotSizeSqft: 124_300,
    lastSaleDate: '2022-11-18',
    lastSalePriceUsd: 47_500_000,
  },
  {
    parcelId: 'NY-1-1023-045',
    address: '425 Park Ave',
    city: 'New York',
    state: 'NY',
    zip: '10022',
    ownerName: '425 Park Owner LLC',
    assessedValueUsd: 312_000_000,
    lotSizeSqft: 67_800,
    lastSaleDate: '2021-09-30',
    lastSalePriceUsd: 365_000_000,
  },
  {
    parcelId: 'FL-250-19-203',
    address: '900 Brickell Plaza',
    city: 'Miami',
    state: 'FL',
    zip: '33131',
    ownerName: 'Brickell Vista Holdings',
    assessedValueUsd: 96_400_000,
    lotSizeSqft: 84_200,
    lastSaleDate: '2024-08-22',
    lastSalePriceUsd: 104_900_000,
  },
];

export const realEstateConnector: Connector<Parcel> = {
  id: 'real-estate-public-records',
  name: 'Real-Estate Public Records',
  kind: 'real-estate',
  description:
    'County assessor + recorder feed. Pulls parcel ownership, assessed value, lot size, and most-recent recorded transaction.',
  source: 'county-assessor://us-aggregate',
  schedule: { intervalSec: 3600, maxRetries: 3, timeoutMs: 15_000 },
  recordSchema: ParcelSchema,
  fetch: async () => {
    return SEED_PARCELS.map((p) => ({ ...p }));
  },
  transform: (record) => ({
    kind: 'property',
    namespace: 'public-records',
    identifier: record.parcelId,
    properties: {
      address: record.address,
      city: record.city,
      state: record.state,
      zip: record.zip,
      ownerName: record.ownerName,
      assessedValueUsd: record.assessedValueUsd,
      lotSizeSqft: record.lotSizeSqft,
      lastSaleDate: record.lastSaleDate,
      lastSalePriceUsd: record.lastSalePriceUsd,
    },
  }),
};
