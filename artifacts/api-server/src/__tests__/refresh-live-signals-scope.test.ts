/**
 * refresh-live-signals: seed-scope safety
 * ----------------------------------------
 * The Daily Live Signal Refresh job must NEVER touch real, operator-authored
 * incidents/alerts/events — only the rows inserted by seed-live-signals.ts.
 *
 * The refresher enforces this by gating every db.select() with a title-based
 * filter: firestorm uses inArray(title, FIRESTORM_SEED_TITLES), and the
 * vessels selects are wrapped in vesselsTitleScope / vesselsEventsTitleScope
 * which OR together LIKE '<prefix>%' clauses for each known seed prefix.
 *
 * Updates always use eq(table.id, row.id) where row was returned by a scoped
 * select, so by construction no non-seeded row can be modified — provided
 * every select in the file remains scoped.
 *
 * This test:
 *   1. Verifies the seed-identifier constants are exported and well-formed.
 *   2. Source-scans refresh-live-signals.ts and asserts that EVERY .where()
 *      call against the three tracked tables references the matching
 *      seed-scope filter. If a future edit drops the filter, this test
 *      fails before the refresher can be deployed.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  FIRESTORM_SEED_TITLES,
  VESSELS_ALERTS_SEED_TITLE_PREFIXES,
  VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES,
} from "../scripts/refresh-live-signals";

const HERE = dirname(fileURLToPath(import.meta.url));
const REFRESHER_PATH = join(HERE, "../scripts/refresh-live-signals.ts");
const REFRESHER_SRC = readFileSync(REFRESHER_PATH, "utf8");

describe("refresh-live-signals seed-scope safety", () => {
  it("exports a non-empty list of seed identifiers for each tracked table", () => {
    expect(FIRESTORM_SEED_TITLES.length).toBeGreaterThanOrEqual(5);
    expect(VESSELS_ALERTS_SEED_TITLE_PREFIXES.length).toBeGreaterThanOrEqual(5);
    expect(VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES.length).toBeGreaterThanOrEqual(2);
  });

  it("uses uniquely phrased identifiers unlikely to collide with operator data", () => {
    // Every firestorm seed title contains an em-dash and is a multi-word
    // proper-noun phrase — extremely unlikely to be hand-typed by an analyst.
    for (const t of FIRESTORM_SEED_TITLES) {
      expect(t).toMatch(/—/);
      expect(t.length).toBeGreaterThan(20);
    }
    // Vessels alert prefixes end in either "— " or "+" — both are stable
    // markers we control.
    for (const p of VESSELS_ALERTS_SEED_TITLE_PREFIXES) {
      expect(p).toMatch(/(— |\+)$/);
    }
    for (const p of VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES) {
      expect(p).toMatch(/(— |\+)/);
    }
  });

  it("seed identifiers are unique within each table list", () => {
    expect(new Set(FIRESTORM_SEED_TITLES).size).toBe(FIRESTORM_SEED_TITLES.length);
    expect(new Set(VESSELS_ALERTS_SEED_TITLE_PREFIXES).size).toBe(VESSELS_ALERTS_SEED_TITLE_PREFIXES.length);
    expect(new Set(VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES).size).toBe(VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES.length);
  });

  it("every db.select() against firestormIncidentsTable is scoped to FIRESTORM_SEED_TITLES", () => {
    const selectChunks = REFRESHER_SRC.match(
      /db[\s\S]*?\.select\([\s\S]*?\.from\(firestormIncidentsTable\)[\s\S]*?\.where\(([\s\S]*?)\)\s*(?:\.orderBy|\.limit|;)/g,
    ) ?? [];
    expect(selectChunks.length).toBeGreaterThan(0);
    for (const chunk of selectChunks) {
      expect(chunk).toMatch(/inArray\(\s*firestormIncidentsTable\.title\s*,\s*FIRESTORM_SEED_TITLES/);
    }
  });

  it("every db.select() against vesselsAlertsTable is scoped to VESSELS_ALERTS_SEED_TITLE_PREFIXES", () => {
    const selectChunks = REFRESHER_SRC.match(
      /db[\s\S]*?\.select\([\s\S]*?\.from\(vesselsAlertsTable\)[\s\S]*?\.where\(([\s\S]*?)\)\s*(?:\.orderBy|\.limit|;)/g,
    ) ?? [];
    expect(selectChunks.length).toBeGreaterThan(0);
    for (const chunk of selectChunks) {
      expect(chunk).toMatch(/vesselsTitleScope\(\s*VESSELS_ALERTS_SEED_TITLE_PREFIXES\s*\)/);
    }
  });

  it("every db.select() against vesselsEventsTable is scoped to VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES", () => {
    const selectChunks = REFRESHER_SRC.match(
      /db[\s\S]*?\.select\([\s\S]*?\.from\(vesselsEventsTable\)[\s\S]*?\.where\(([\s\S]*?)\)\s*(?:\.orderBy|\.limit|;)/g,
    ) ?? [];
    expect(selectChunks.length).toBeGreaterThan(0);
    for (const chunk of selectChunks) {
      expect(chunk).toMatch(/vesselsEventsTitleScope\(\s*VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES\s*\)/);
    }
  });

  it("every db.update() targets a row by primary key (eq(table.id, ...)) — never a broad WHERE", () => {
    const updateChunks = REFRESHER_SRC.match(
      /db[\s\S]*?\.update\([\s\S]*?\.set\([\s\S]*?\.where\(([\s\S]*?)\)/g,
    ) ?? [];
    expect(updateChunks.length).toBeGreaterThan(0);
    for (const chunk of updateChunks) {
      expect(chunk).toMatch(/eq\(\s*\w+Table\.id\s*,\s*\w+(?:\.\w+)?\s*\)/);
    }
  });
});
