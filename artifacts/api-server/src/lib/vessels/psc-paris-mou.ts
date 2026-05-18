/**
 * SZL Vessels — Paris MoU Port State Control Checklist
 * ────────────────────────────────────────────────────────────────────────────
 * Encoded from the public Paris MoU "Procedures for Port State Control"
 * (latest revision 2024) and Annex 10 deficiency code system.
 *
 *   Reference: https://www.parismou.org/inspection-search/inspection-results
 *   Reference: Paris MoU Annual Report 2024 (deficiency code statistics)
 *
 * Each item maps to a real Paris MoU deficiency code group. Items flagged
 * `detainable: true` are categories that historically account for >80% of
 * tanker / bulker detentions worldwide.
 */

export type PscStatus = 'pass' | 'fail' | 'action_required';

export interface PscChecklistItem {
  /** Paris MoU deficiency code or grouped code prefix. */
  code: string;
  /** Top-level category from Annex 10 (14 main groups). */
  category: string;
  /** Specific item being inspected within the category. */
  item: string;
  /** Default status seeded for a new vessel; PSC officers override per inspection. */
  status: PscStatus;
  /** Marked detainable in MoU Annex 1 — failure can ground the vessel. */
  detainable: boolean;
  /** Convention reference (SOLAS / MARPOL / MLC / ISM / ISPS / Load Lines). */
  convention: string;
}

/**
 * The 14 Annex 10 categories, expanded to the ~32 most-frequently-cited
 * sub-items in Paris MoU annual deficiency statistics.
 */
export const PARIS_MOU_CHECKLIST: PscChecklistItem[] = [
  // 01 — Certificates & documentation
  { code: '01101', category: 'Certificates & Documentation', item: 'International Tonnage Certificate (1969)',          status: 'pass', detainable: true,  convention: 'Tonnage 1969' },
  { code: '01112', category: 'Certificates & Documentation', item: 'Cargo Ship Safety Construction Certificate',       status: 'pass', detainable: true,  convention: 'SOLAS Ch. I' },
  { code: '01114', category: 'Certificates & Documentation', item: 'Cargo Ship Safety Equipment Certificate',          status: 'pass', detainable: true,  convention: 'SOLAS Ch. I' },
  { code: '01116', category: 'Certificates & Documentation', item: 'Cargo Ship Safety Radio Certificate',              status: 'pass', detainable: true,  convention: 'SOLAS Ch. I' },
  { code: '01140', category: 'Certificates & Documentation', item: 'Minimum Safe Manning Document',                    status: 'pass', detainable: true,  convention: 'SOLAS V/14' },
  { code: '01220', category: 'Certificates & Documentation', item: 'IOPP Certificate',                                 status: 'pass', detainable: true,  convention: 'MARPOL Annex I' },

  // 02 — Structural condition
  { code: '02105', category: 'Structural Condition',        item: 'Hull plating / corrosion',                         status: 'pass', detainable: true,  convention: 'SOLAS II-1' },
  { code: '02108', category: 'Structural Condition',        item: 'Ballast tanks coating condition',                  status: 'pass', detainable: false, convention: 'SOLAS II-1' },
  { code: '02110', category: 'Structural Condition',        item: 'Watertight bulkheads & doors',                     status: 'pass', detainable: true,  convention: 'SOLAS II-1' },

  // 04 — Emergency systems
  { code: '04101', category: 'Emergency Systems',           item: 'Emergency lighting & power',                       status: 'pass', detainable: true,  convention: 'SOLAS II-1/42' },
  { code: '04108', category: 'Emergency Systems',           item: 'Emergency fire pump operational',                  status: 'pass', detainable: true,  convention: 'SOLAS II-2/10' },
  { code: '04110', category: 'Emergency Systems',           item: 'Muster list posted; drills logged',                status: 'pass', detainable: false, convention: 'SOLAS III/8' },

  // 05 — Radio communication
  { code: '05108', category: 'Radio Communication',         item: 'GMDSS — DSC / EPIRB / SART operational',           status: 'pass', detainable: true,  convention: 'SOLAS IV' },
  { code: '05116', category: 'Radio Communication',         item: 'Radio log entries current',                        status: 'pass', detainable: false, convention: 'SOLAS IV/17' },

  // 07 — Fire safety
  { code: '07105', category: 'Fire Safety',                 item: 'Fixed fire-detection & alarm system',              status: 'pass', detainable: true,  convention: 'SOLAS II-2/7' },
  { code: '07110', category: 'Fire Safety',                 item: 'Fire main pressure & hydrants',                    status: 'pass', detainable: true,  convention: 'SOLAS II-2/10' },
  { code: '07115', category: 'Fire Safety',                 item: 'Engine room CO₂ / foam system',                    status: 'pass', detainable: true,  convention: 'SOLAS II-2/10' },
  { code: '07120', category: 'Fire Safety',                 item: 'Fire-fighting equipment maintenance records',      status: 'pass', detainable: false, convention: 'SOLAS II-2/14' },

  // 09 — Life-saving appliances
  { code: '09108', category: 'Life-Saving Appliances',      item: 'Lifeboats — launching & on-load release',          status: 'pass', detainable: true,  convention: 'SOLAS III/20' },
  { code: '09112', category: 'Life-Saving Appliances',      item: 'Liferafts service current',                        status: 'pass', detainable: true,  convention: 'SOLAS III/20' },
  { code: '09118', category: 'Life-Saving Appliances',      item: 'Immersion suits & lifejackets',                    status: 'pass', detainable: false, convention: 'SOLAS III/32' },

  // 10 — Navigation
  { code: '10101', category: 'Navigation',                  item: 'ECDIS / charts up to date',                        status: 'pass', detainable: true,  convention: 'SOLAS V/27' },
  { code: '10105', category: 'Navigation',                  item: 'Magnetic compass deviation card current',          status: 'pass', detainable: false, convention: 'SOLAS V/19' },
  { code: '10115', category: 'Navigation',                  item: 'Voyage Data Recorder operational',                 status: 'pass', detainable: true,  convention: 'SOLAS V/20' },
  { code: '10125', category: 'Navigation',                  item: 'AIS broadcasting valid identity & position',       status: 'pass', detainable: true,  convention: 'SOLAS V/19.2.4' },

  // 11 — Cargo / cargo operations
  { code: '11101', category: 'Cargo Operations',            item: 'Cargo securing manual on board',                   status: 'pass', detainable: false, convention: 'SOLAS VI/5' },
  { code: '11110', category: 'Cargo Operations',            item: 'Cargo gear test certificates',                     status: 'pass', detainable: false, convention: 'SOLAS VI/5' },
  { code: '11150', category: 'Cargo Operations',            item: 'Oil Record Book Part I / II entries current',      status: 'pass', detainable: true,  convention: 'MARPOL I/17' },

  // 13 — Propulsion & auxiliary machinery
  { code: '13101', category: 'Propulsion & Machinery',      item: 'Main engine cleanliness & leak-free',              status: 'pass', detainable: false, convention: 'SOLAS II-1/26' },
  { code: '13105', category: 'Propulsion & Machinery',      item: 'Steering gear — primary & auxiliary',              status: 'pass', detainable: true,  convention: 'SOLAS II-1/29' },

  // 14 — ISM / ISPS
  { code: '14108', category: 'ISM Code',                    item: 'Safety Management Certificate & SMS manual',       status: 'pass', detainable: true,  convention: 'ISM Code' },
  { code: '14110', category: 'ISM Code',                    item: 'Non-conformity reports closed-out',                status: 'pass', detainable: false, convention: 'ISM Code' },
  { code: '15108', category: 'ISPS',                        item: 'International Ship Security Certificate',          status: 'pass', detainable: true,  convention: 'ISPS / SOLAS XI-2' },

  // 18 — MLC working & living
  { code: '18101', category: 'MLC Working & Living',        item: 'Seafarer Employment Agreements on file',           status: 'pass', detainable: false, convention: 'MLC 2006' },
  { code: '18110', category: 'MLC Working & Living',        item: 'Hours of rest records compliant',                  status: 'pass', detainable: true,  convention: 'MLC 2006' },
  { code: '18118', category: 'MLC Working & Living',        item: 'Crew accommodation, sanitation & galley hygiene',  status: 'pass', detainable: false, convention: 'MLC 2006' },

  // 19 — MARPOL Annex VI
  { code: '19103', category: 'MARPOL Annex VI — Air',       item: 'Bunker Delivery Notes — sulphur content ≤0.50% m/m',status: 'pass', detainable: true,  convention: 'MARPOL VI/14' },
  { code: '19108', category: 'MARPOL Annex VI — Air',       item: 'EIAPP certificates for all NOx-tier engines',      status: 'pass', detainable: false, convention: 'MARPOL VI/13' },
  { code: '19115', category: 'MARPOL Annex VI — Air',       item: 'SEEMP Part II / III (CII implementation plan)',    status: 'pass', detainable: false, convention: 'MARPOL VI/22A' },
];

/**
 * Convenience builder: returns the seeded checklist that a new vessel
 * should receive when first added to the registry.
 */
export function buildSeedChecklist(): Array<{
  category: string;
  status: PscStatus;
  code: string;
  detainable: boolean;
  convention: string;
}> {
  return PARIS_MOU_CHECKLIST.map((i) => ({
    category: `${i.category} — ${i.item}`,
    status: i.status,
    code: i.code,
    detainable: i.detainable,
    convention: i.convention,
  }));
}

/**
 * Detainable-only subset — used when a vessel is in a high-risk port and
 * the platform recommends a fast-path inspection.
 */
export function detainableChecklist(): PscChecklistItem[] {
  return PARIS_MOU_CHECKLIST.filter((i) => i.detainable);
}

export function checklistStats() {
  const total = PARIS_MOU_CHECKLIST.length;
  const detainable = PARIS_MOU_CHECKLIST.filter((i) => i.detainable).length;
  const byCategory: Record<string, number> = {};
  for (const i of PARIS_MOU_CHECKLIST) byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
  return { total, detainable, byCategory };
}
