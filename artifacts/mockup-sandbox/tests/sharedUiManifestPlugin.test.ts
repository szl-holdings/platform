import { writeFileSync, mkdtempSync } from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { classifyName, parseExportsFromIndex } from '../sharedUiManifestPlugin.js';

function withFixture(content: string, fn: (filePath: string) => void) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'sui-test-'));
  const filePath = path.join(dir, 'index.ts');
  writeFileSync(filePath, content, 'utf-8');
  fn(filePath);
}

describe('classifyName', () => {
  it('accepts PascalCase component names', () => {
    expect(classifyName('AuthGate')).toBe(true);
    expect(classifyName('AutonomyDial')).toBe(true);
    expect(classifyName('AnimatedCounter')).toBe(true);
    expect(classifyName('AlertCard')).toBe(true);
  });

  it('rejects type-alias suffixes', () => {
    expect(classifyName('AuthGateProps')).toBe(false);
    expect(classifyName('AmbientIntelligenceConfig')).toBe(false);
    expect(classifyName('DashboardWidgetType')).toBe(false);
    expect(classifyName('AnomalyFeedOptions')).toBe(false);
  });

  it('accepts real components that happen to end in State', () => {
    expect(classifyName('ErrorState')).toBe(true);
    expect(classifyName('EmptyState')).toBe(true);
    expect(classifyName('SafeFallbackState')).toBe(true);
  });

  it('rejects ALL_CAPS constants', () => {
    expect(classifyName('APPROVED_CTAS')).toBe(false);
    expect(classifyName('MAX_RETRY')).toBe(false);
  });

  it('rejects camelCase names', () => {
    expect(classifyName('useAnalytics')).toBe(false);
    expect(classifyName('fadeIn')).toBe(false);
  });

  it('rejects empty / falsy names', () => {
    expect(classifyName('')).toBe(false);
  });
});

describe('parseExportsFromIndex — single-line blocks', () => {
  it('parses single-line value exports', () => {
    withFixture(
      `export { AuthGate, type AuthGateProps } from './AuthGate';`,
      (fp) => {
        const result = parseExportsFromIndex(fp);
        const names = result.map((e) => e.name);
        expect(names).toContain('AuthGate');
        expect(names).not.toContain('AuthGateProps');
      },
    );
  });

  it('marks real components as isComponent=true', () => {
    withFixture(
      `export { default as AnimatedCounter } from './animated-counter';`,
      (fp) => {
        const result = parseExportsFromIndex(fp);
        const e = result.find((x) => x.name === 'AnimatedCounter');
        expect(e).toBeDefined();
        expect(e!.isComponent).toBe(true);
      },
    );
  });

  it('skips export type { } blocks entirely', () => {
    withFixture(
      `export type { AuthGateProps, SomeConfig } from './auth-gate';`,
      (fp) => {
        const result = parseExportsFromIndex(fp);
        expect(result).toHaveLength(0);
      },
    );
  });
});

describe('parseExportsFromIndex — multi-line blocks', () => {
  it('collects all names from a multi-line export block', () => {
    const fixture = `export {
  AutonomyDial,
  type AutonomyDialProps,
} from './AutonomyDial';`;
    withFixture(fixture, (fp) => {
      const result = parseExportsFromIndex(fp);
      const names = result.map((e) => e.name);
      expect(names).toContain('AutonomyDial');
      expect(names).not.toContain('AutonomyDialProps');
    });
  });

  it('handles mixed type and value exports in multi-line block', () => {
    const fixture = `export {
  AdminAuditTrail,
  type AdminAuditTrailProps,
  type AuditActionType,
  type AuditActorType,
  type AuditTrailEntry,
} from './admin-audit-trail';`;
    withFixture(fixture, (fp) => {
      const result = parseExportsFromIndex(fp);
      const names = result.map((e) => e.name);
      expect(names).toContain('AdminAuditTrail');
      expect(names).not.toContain('AdminAuditTrailProps');
      expect(names).not.toContain('AuditActionType');
      expect(names).not.toContain('AuditActorType');
      expect(names).not.toContain('AuditTrailEntry');
    });
  });

  it('handles aliased re-exports', () => {
    const fixture = `export {
  KnowledgeEntry as AgentKnowledgeEntry,
} from './agent-insights-widget';`;
    withFixture(fixture, (fp) => {
      const result = parseExportsFromIndex(fp);
      const names = result.map((e) => e.name);
      expect(names).toContain('AgentKnowledgeEntry');
      expect(names).not.toContain('KnowledgeEntry');
    });
  });

  it('handles large multi-export block like alloy-decision-card', () => {
    const fixture = `export {
  ActionTypeBadge,
  ApprovalBadge,
  AuditTrailDrawer,
  ConfidenceBand,
  DecisionCard,
  type DecisionCardProps,
  DegradedModeBanner,
  EnvironmentLabel,
  type EvidenceItem as AlloyEvidenceItem,
  EvidencePanel,
  HumanReviewBadge,
  PriorityBadge,
  RiskBadge,
  SafeFallbackState,
} from './alloy-decision-card';`;
    withFixture(fixture, (fp) => {
      const result = parseExportsFromIndex(fp);
      const names = result.map((e) => e.name);
      expect(names).toContain('ActionTypeBadge');
      expect(names).toContain('ApprovalBadge');
      expect(names).toContain('DecisionCard');
      expect(names).toContain('EvidencePanel');
      expect(names).toContain('SafeFallbackState');
      expect(names).not.toContain('DecisionCardProps');
      expect(names).not.toContain('EvidenceItem');
      expect(names).not.toContain('AlloyEvidenceItem');
    });
  });

  it('handles animation/utility names (camelCase) excluded from components', () => {
    const fixture = `export {
  ambientDrift,
  fadeIn,
  hoverLift,
  scaleIn,
} from './animations';`;
    withFixture(fixture, (fp) => {
      const result = parseExportsFromIndex(fp);
      const components = result.filter((e) => e.isComponent);
      expect(components).toHaveLength(0);
    });
  });
});

describe('parseExportsFromIndex — against real shared-ui index', () => {
  const realIndexPath = path.resolve(
    import.meta.dirname ?? process.cwd(),
    '../../../lib/shared-ui/src/index.ts',
  );

  it('enumerates at least 20 components from real index.ts', () => {
    const result = parseExportsFromIndex(realIndexPath);
    const components = result.filter((e) => e.isComponent);
    expect(components.length).toBeGreaterThanOrEqual(20);
  });

  it('includes known multi-line-block components', () => {
    const result = parseExportsFromIndex(realIndexPath);
    const names = result.map((e) => e.name);
    expect(names).toContain('AutonomyDial');
    expect(names).toContain('AdminAuditTrail');
    expect(names).toContain('DecisionCard');
    expect(names).toContain('AnimatedCounter');
    expect(names).toContain('AuthGate');
  });

  it('excludes type-alias exports from real index', () => {
    const result = parseExportsFromIndex(realIndexPath);
    const names = result.map((e) => e.name);
    expect(names).not.toContain('AuthGateProps');
    expect(names).not.toContain('AutonomyDialProps');
    expect(names).not.toContain('AdminAuditTrailProps');
    expect(names).not.toContain('AuditActionType');
  });
});
