/**
 * Task #1424 — Property screens mock data ↔ interface contract
 *
 * Two APEX property screens render local mock arrays as a fallback when
 * the API has no data. If those arrays drift from their TypeScript
 * interfaces, the screens silently render blank tiles (missing address,
 * percentComplete, applicantName, annualIncome, etc.).
 *
 * These tests assert each mock entry has every required field with a
 * non-empty / sensible value so the regression cannot recur.
 */

import { PROJECTS } from '../app/(shell)/properties/construction-monitor.data';
import { APPLICATIONS } from '../app/(shell)/properties/tenant-screening.data';

describe('construction-monitor — PROJECTS mock data ↔ ConstructionProject', () => {
  it('exports at least one project so the screen never renders empty', () => {
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it.each(PROJECTS.map((p) => [p.id, p] as const))(
    'project %s has every required field the UI reads',
    (_id, p) => {
      // Top-level scalars the cards read directly
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.address.length).toBeGreaterThan(0);
      expect(p.type.length).toBeGreaterThan(0);
      expect(p.totalBudget).toBeGreaterThan(0);
      expect(p.spentToDate).toBeGreaterThanOrEqual(0);
      expect(p.percentComplete).toBeGreaterThanOrEqual(0);
      expect(p.percentComplete).toBeLessThanOrEqual(100);
      expect(p.startDate.length).toBeGreaterThan(0);
      expect(p.targetCompletion.length).toBeGreaterThan(0);
      expect(p.gcName.length).toBeGreaterThan(0);
      expect(['passed', 'pending', 'failed', 'scheduled']).toContain(p.inspectionStatus);
      expect(Array.isArray(p.flags)).toBe(true);

      // Milestone shape the timeline card iterates
      expect(Array.isArray(p.milestones)).toBe(true);
      expect(p.milestones.length).toBeGreaterThan(0);
      for (const m of p.milestones) {
        expect(m.id.length).toBeGreaterThan(0);
        expect(m.label.length).toBeGreaterThan(0);
        expect(m.dueDate.length).toBeGreaterThan(0);
        expect(['complete', 'in-progress', 'upcoming', 'delayed']).toContain(m.status);
        if (m.status === 'complete') {
          // Renderer falls back to dueDate, so completedDate is optional, but
          // when present it must be a non-empty string.
          if (m.completedDate !== undefined) {
            expect(m.completedDate.length).toBeGreaterThan(0);
          }
        }
      }

      // Budget lines the budget card iterates
      expect(Array.isArray(p.budgetLines)).toBe(true);
      expect(p.budgetLines.length).toBeGreaterThan(0);
      for (const b of p.budgetLines) {
        expect(b.category.length).toBeGreaterThan(0);
        expect(b.budgeted).toBeGreaterThanOrEqual(0);
        expect(b.spent).toBeGreaterThanOrEqual(0);
        expect(b.committed).toBeGreaterThanOrEqual(0);
      }
    },
  );

  it('all project ids are unique', () => {
    const ids = PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('tenant-screening — APPLICATIONS mock data ↔ ScreeningApplication', () => {
  it('exports at least one application so the screen never renders empty', () => {
    expect(APPLICATIONS.length).toBeGreaterThan(0);
  });

  it.each(APPLICATIONS.map((a) => [a.id, a] as const))(
    'application %s has every required field the UI reads',
    (_id, a) => {
      expect(a.id.length).toBeGreaterThan(0);
      expect(a.applicantName.length).toBeGreaterThan(0);
      expect(a.property.length).toBeGreaterThan(0);
      expect(a.unit.length).toBeGreaterThan(0);
      expect(a.submittedDate.length).toBeGreaterThan(0);
      expect(['approved', 'pending', 'in-review', 'denied', 'more-info']).toContain(a.status);
      expect(a.creditScore).toBeGreaterThan(0);
      expect(a.creditScore).toBeLessThan(900);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(a.creditGrade);
      expect(a.annualIncome).toBeGreaterThan(0);
      expect(a.monthlyRent).toBeGreaterThan(0);
      expect(a.rentToIncome).toBeGreaterThan(0);
      expect(a.rentToIncome).toBeLessThanOrEqual(100);
      expect(['clear', 'flag', 'pending']).toContain(a.backgroundCheck);
      expect(typeof a.evictionHistory).toBe('boolean');
      expect(['verified', 'pending', 'unverified']).toContain(a.employmentStatus);
      expect(['checked', 'pending', 'failed']).toContain(a.references);
      if (a.notes !== undefined) {
        expect(a.notes.length).toBeGreaterThan(0);
      }
    },
  );

  it('all application ids are unique', () => {
    const ids = APPLICATIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
