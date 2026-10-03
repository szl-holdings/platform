import { describe, expect, it } from 'vitest';
import {
  LP_REPORTS_MANIFEST,
  lpReportsHandler,
  PORTFOLIO_DATA_MANIFEST,
  portfolioDataHandler,
} from './domain-data-tools.js';
import {
  BUDGET_FORECAST_TOOL_MANIFEST,
  budgetForecastHandler,
  PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  portfolioSnapshotHandler,
} from './finance-tools.js';

const scopedReports = [
  {
    manifest: PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
    handler: portfolioSnapshotHandler,
    validInput: { portfolioId: 'portfolio-a' },
    invalidInput: { portfolioId: 42 },
    code: 'FINANCE_OPERATION_UNAVAILABLE',
  },
  {
    manifest: BUDGET_FORECAST_TOOL_MANIFEST,
    handler: budgetForecastHandler,
    validInput: { orgId: 'org-a' },
    invalidInput: { orgId: 42 },
    code: 'FINANCE_OPERATION_UNAVAILABLE',
  },
  {
    manifest: PORTFOLIO_DATA_MANIFEST,
    handler: portfolioDataHandler,
    validInput: { companySlug: 'company-a' },
    invalidInput: { companySlug: 42 },
    code: 'DOMAIN_DATA_OPERATION_UNAVAILABLE',
  },
  {
    manifest: LP_REPORTS_MANIFEST,
    handler: lpReportsHandler,
    validInput: { reportType: 'quarterly' },
    invalidInput: { reportType: 'unrecognized' },
    code: 'DOMAIN_DATA_OPERATION_UNAVAILABLE',
  },
];

describe('unsupported scoped finance and data reports', () => {
  it.each(scopedReports)('$manifest.id is unavailable for valid input', async ({
    manifest,
    handler,
    validInput,
    code,
  }) => {
    expect(manifest.enabled).toBe(false);
    await expect(handler(validInput, manifest)).rejects.toMatchObject({
      code,
      message: expect.stringContaining('No operation was performed.'),
    });
  });

  it.each(scopedReports)('$manifest.id still validates malformed input', async ({
    manifest,
    handler,
    invalidInput,
  }) => {
    await expect(handler(invalidInput, manifest)).rejects.toMatchObject({ name: 'ZodError' });
  });
});
