/**
 * Per-artifact post-deploy smoke configuration.
 *
 * Each entry describes one deployed artifact. The smoke runner navigates to
 * `basePath` relative to the target host, checks that:
 *   - The HTTP response is 200
 *   - The page <title> contains `titleContains`
 *   - Navigation completes within `timeBudgetMs` milliseconds
 *   - No browser console errors are emitted
 *
 * To add a new artifact, append a new entry here and re-read SMOKE_RUNBOOK.md.
 */

export interface ArtifactSmokeConfig {
  /** Human-readable label used in test names and failure alerts. */
  name: string;
  /** URL path relative to the base URL, e.g. '/' or '/sentra/'. */
  path: string;
  /** Substring that must appear in document.title after navigation. */
  titleContains: string;
  /** Maximum acceptable navigation time in milliseconds. */
  timeBudgetMs: number;
  /**
   * Optional: one or more visible text strings that must appear in the
   * rendered page body (in addition to the title check).
   */
  bodyMarkers?: string[];
  /**
   * When true the artifact is excluded from CI smoke runs but still
   * present so maintainers can run it locally with --grep.
   */
  skipInCI?: boolean;
}

export const ARTIFACT_SMOKE_CONFIGS: ArtifactSmokeConfig[] = [
  {
    name: 'SZL Holdings — Governed Decision OS',
    path: '/',
    titleContains: 'SZL Holdings',
    timeBudgetMs: 8000,
  },
  {
    name: 'Sentra — Cyber Resilience Command',
    path: '/sentra/',
    titleContains: 'Sentra',
    timeBudgetMs: 8000,
  },
  {
    name: 'Counsel — Legal Matter Command',
    path: '/counsel/',
    titleContains: 'Counsel',
    timeBudgetMs: 8000,
  },
  {
    name: 'Pulse — AI Executive Briefing',
    path: '/pulse/',
    titleContains: 'Pulse',
    timeBudgetMs: 8000,
  },
  {
    name: 'Terra — Real Estate Intelligence',
    path: '/terra/',
    titleContains: 'Terra',
    timeBudgetMs: 8000,
  },
  {
    name: 'Vessels — Maritime Intelligence',
    path: '/vessels/',
    titleContains: 'Vessels',
    timeBudgetMs: 8000,
  },
  {
    name: 'Unified Command',
    path: '/command/',
    titleContains: 'Command',
    timeBudgetMs: 8000,
  },
  {
    name: 'Carlota Jo Consulting',
    path: '/carlota-jo/',
    titleContains: 'Carlota Jo',
    timeBudgetMs: 8000,
  },
  {
    name: 'Conduit — Reverse ETL',
    path: '/conduit/',
    titleContains: 'Conduit',
    timeBudgetMs: 8000,
  },
  {
    name: 'A11oy — Brand Orchestration Layer',
    path: '/a11oy/',
    titleContains: 'A11oy',
    timeBudgetMs: 8000,
  },
  {
    name: 'Lyte — Decision Intelligence',
    path: '/lyte/',
    titleContains: 'Lyte',
    timeBudgetMs: 8000,
  },
  {
    name: 'PRAXIS — Unified Agentic AI Layer',
    path: '/nexus/',
    titleContains: 'PRAXIS',
    timeBudgetMs: 8000,
  },
];

/** The API health endpoint, checked separately from the frontend artifacts. */
export const API_HEALTH_PATH = '/api/health';
