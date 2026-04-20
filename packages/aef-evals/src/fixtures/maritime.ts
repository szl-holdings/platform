import type { GoldenFixtureSet } from '../types.js';

export const maritimeFixtures: GoldenFixtureSet = {
  fixtureSetId: 'vessels-maritime-risk-golden-v1',
  profileId: 'vessels_maritime_risk',
  domain: 'maritime',
  description:
    'Golden retrieval fixtures for the Vessels Maritime Risk profile. Covers IMO number lookup, MMSI search, sanctions screening, dark vessel detection, and PSC detention queries.',
  queries: [
    {
      queryId: 'mar-q001',
      query: 'IMO 9123456 vessel port history Gulf of Mexico',
      relevantChunkIds: ['chunk-imo-9123456-port-history', 'chunk-imo-9123456-manifest'],
      notes: 'Exact IMO match should be boosted above fuzzy vessel name matches.',
    },
    {
      queryId: 'mar-q002',
      query: 'MMSI 123456789 AIS gap dark vessel spoofing Indian Ocean',
      relevantChunkIds: ['chunk-mmsi-123456789-ais-gap', 'chunk-dark-vessel-iocean-2024'],
      notes: 'MMSI exact match with dark vessel flag.',
    },
    {
      queryId: 'mar-q003',
      query: 'OFAC SDN sanctions tanker flag state Panama 2024',
      relevantChunkIds: ['chunk-sdn-tanker-panama-2024', 'chunk-ofac-sdn-list-2024-q3'],
      notes: 'Sanctions entity name exact match should rank above generic tanker content.',
    },
    {
      queryId: 'mar-q004',
      query: 'PSC detention bulk carrier port state control Singapore',
      relevantChunkIds: ['chunk-psc-singapore-2024-001', 'chunk-psc-bulk-carrier-record'],
    },
    {
      queryId: 'mar-q005',
      query: 'classification society renewal certificate cargo ship',
      relevantChunkIds: ['chunk-class-cert-renewal-2024', 'chunk-cargo-ship-certificate'],
    },
  ],
  corpus: [
    {
      chunkId: 'chunk-imo-9123456-port-history',
      text: 'Vessel IMO 9123456 port-call history for 2024: arrived Gulf of Mexico Houston anchorage on 2024-03-12, departed for Galveston on 2024-03-15, then transit to New Orleans 2024-03-22. All port calls in the Gulf of Mexico are corroborated by AIS Class A position reports.',
    },
    {
      chunkId: 'chunk-imo-9123456-manifest',
      text: 'Cargo manifest for IMO 9123456 covering Gulf of Mexico voyages: 42,000 metric tons crude oil loaded at Houston, bill-of-lading references attached, declared destination Rotterdam. Manifest cross-checked against port history filings for vessel IMO 9123456.',
    },
    {
      chunkId: 'chunk-mmsi-123456789-ais-gap',
      text: 'AIS transponder for MMSI 123456789 reported a 14-hour gap on 2024-04-08 while transiting the Indian Ocean north of the Maldives. The gap pattern is consistent with deliberate AIS shutdown and possible identity spoofing under MMSI 123456789.',
    },
    {
      chunkId: 'chunk-dark-vessel-iocean-2024',
      text: 'Dark-vessel detection bulletin: Indian Ocean sector. Synthetic-aperture-radar imagery from 2024-04-08 shows a tanker silhouette with no matching AIS broadcast in the Maldives transit corridor. Suspected dark vessel running with AIS off, consistent with spoofing tradecraft.',
    },
    {
      chunkId: 'chunk-sdn-tanker-panama-2024',
      text: 'OFAC SDN List addition (2024-Q3): tanker Mariposa Star, Panama flag state, owner blocked under Iran sanctions Executive Order 13599. Vessel listed on Specially Designated Nationals list as a sanctioned tanker carrying Panama flag in 2024.',
    },
    {
      chunkId: 'chunk-ofac-sdn-list-2024-q3',
      text: 'Quarterly OFAC SDN list update for 2024-Q3 includes 11 newly designated tankers, 6 of which fly Panama flag state. Sanctions designations cite ship-to-ship transfer activity tied to OFAC-listed entities.',
    },
    {
      chunkId: 'chunk-psc-singapore-2024-001',
      text: 'Singapore Maritime and Port Authority Port State Control inspection record PSC-SG-2024-001: Panama-flagged bulk carrier detained at Tuas anchorage for life-saving appliance and ISM deficiencies. Detention lifted after rectification on 2024-05-02.',
    },
    {
      chunkId: 'chunk-psc-bulk-carrier-record',
      text: 'Tokyo MOU port state control regional record for the bulk carrier fleet calling Singapore in 2024 shows three detentions and seventeen high-risk inspections, with bulk carriers over 20 years old contributing to most PSC findings.',
    },
    {
      chunkId: 'chunk-class-cert-renewal-2024',
      text: "Classification society certificate renewal completed 2024-06-15 by Lloyd's Register for the cargo ship Atlantic Carrier. The renewal certificate covers hull, machinery, and SOLAS statutory items and is valid through 2029.",
    },
    {
      chunkId: 'chunk-cargo-ship-certificate',
      text: 'Cargo Ship Safety Construction Certificate issued for general cargo ships under SOLAS Chapter II-1, including hull integrity, watertight subdivision, and stability checks performed by classification surveyor.',
    },
    {
      chunkId: 'chunk-distractor-galley-recipe',
      text: 'Galley recipe book: instructions for preparing seafarer meals during long ocean transits, including provisioning quantities for crews of 20.',
    },
    {
      chunkId: 'chunk-distractor-marine-insurance',
      text: 'Marine hull and machinery insurance policy boilerplate covering general average, salvage, and collision liability for commercial shipping.',
    },
    {
      chunkId: 'chunk-distractor-port-tariff',
      text: 'Port tariff schedule listing pilotage, towage, and berth occupancy charges for container terminals in Northwest Europe.',
    },
    {
      chunkId: 'chunk-distractor-bunker-price',
      text: 'Daily bunker price index for VLSFO and MGO across Singapore, Rotterdam, and Fujairah hubs published by independent energy reporting agency.',
    },
    {
      chunkId: 'chunk-distractor-crew-training',
      text: 'STCW basic safety training schedule for deck and engine officers, covering personal survival, fire fighting, and first aid modules.',
    },
  ],
};
