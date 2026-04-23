/**
 * Reference connector: consolidated sanctions list.
 *
 * Production deployments would pull OFAC SDN, EU Consolidated, UK OFSI, and
 * UN 1267 lists. The seed reproduces the shape of an OFAC SDN entry.
 */

import { z } from 'zod';
import type { Connector } from '../types';

const SanctionedEntitySchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['individual', 'entity', 'vessel', 'aircraft']),
  programs: z.array(z.string()),
  listSource: z.enum(['OFAC-SDN', 'EU', 'UK-OFSI', 'UN-1267']),
  country: z.string().length(2).nullable(),
  listedAt: z.string(),
  aliases: z.array(z.string()),
});
export type SanctionedEntity = z.infer<typeof SanctionedEntitySchema>;

const SEED_SANCTIONS: SanctionedEntity[] = [
  {
    uid: 'OFAC-SDN-50112',
    name: 'PARAGON LOGISTICS LTD',
    type: 'entity',
    programs: ['SDGT', 'IRAN'],
    listSource: 'OFAC-SDN',
    country: 'AE',
    listedAt: '2024-09-12',
    aliases: ['PARAGON LOG', 'PRG LOGISTICS DMCC'],
  },
  {
    uid: 'OFAC-SDN-50113',
    name: 'KARAKORUM SHIPPING CO',
    type: 'entity',
    programs: ['NORTH-KOREA'],
    listSource: 'OFAC-SDN',
    country: 'KP',
    listedAt: '2024-11-04',
    aliases: ['KARAKORUM MARINE'],
  },
  {
    uid: 'EU-2024-0871',
    name: 'IVANENKO MIKHAIL SERGEYEVICH',
    type: 'individual',
    programs: ['UKRAINE-RELATED'],
    listSource: 'EU',
    country: 'RU',
    listedAt: '2024-08-19',
    aliases: ['M. IVANENKO', 'MISHA IVANENKO'],
  },
  {
    uid: 'OFAC-SDN-50488',
    name: 'M/V CRIMSON HORIZON',
    type: 'vessel',
    programs: ['NORTH-KOREA', 'SDGT'],
    listSource: 'OFAC-SDN',
    country: null,
    listedAt: '2025-01-22',
    aliases: ['CRIMSON HRZN', 'EX-RED DAWN'],
  },
];

export const sanctionsConnector: Connector<SanctionedEntity> = {
  id: 'sanctions-consolidated',
  name: 'Consolidated Sanctions',
  kind: 'sanctions',
  description:
    'Consolidated sanctions list (OFAC SDN, EU, UK OFSI, UN 1267). Used by Vessels and Counsel for screening.',
  source: 'sanctions://consolidated',
  schedule: { intervalSec: 86_400, maxRetries: 3, timeoutMs: 30_000 },
  recordSchema: SanctionedEntitySchema,
  fetch: async () => SEED_SANCTIONS.map((s) => ({ ...s, programs: [...s.programs], aliases: [...s.aliases] })),
  transform: (record) => ({
    kind: 'sanctioned-entity',
    namespace: record.listSource.toLowerCase(),
    identifier: record.uid,
    properties: {
      name: record.name,
      type: record.type,
      programs: record.programs,
      listSource: record.listSource,
      country: record.country,
      listedAt: record.listedAt,
      aliases: record.aliases,
    },
  }),
};
