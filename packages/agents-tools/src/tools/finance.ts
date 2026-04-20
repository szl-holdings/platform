import {
  BUDGET_FORECAST_TOOL_MANIFEST,
  BudgetForecastInputSchema,
  budgetForecastHandler,
  FUND_TRANSFER_TOOL_MANIFEST,
  FundTransferInputSchema,
  fundTransferHandler,
  PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  PortfolioSnapshotInputSchema,
  portfolioSnapshotHandler,
  REGULATORY_FILING_TOOL_MANIFEST,
  RegulatoryFilingInputSchema,
  regulatoryFilingHandler,
} from '@workspace/tool-mesh/tools/finance-tools';
import { z } from 'zod';
import { defineTool } from '../typed-tool.js';

const GenericOutputSchema = z.record(z.unknown());

export const fundTransferTool = defineTool({
  manifest: FUND_TRANSFER_TOOL_MANIFEST,
  inputSchema: FundTransferInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => fundTransferHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const portfolioSnapshotTool = defineTool({
  manifest: PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  inputSchema: PortfolioSnapshotInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) =>
    portfolioSnapshotHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const budgetForecastTool = defineTool({
  manifest: BUDGET_FORECAST_TOOL_MANIFEST,
  inputSchema: BudgetForecastInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) => budgetForecastHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export const regulatoryFilingTool = defineTool({
  manifest: REGULATORY_FILING_TOOL_MANIFEST,
  inputSchema: RegulatoryFilingInputSchema,
  outputSchema: GenericOutputSchema,
  handler: (input) =>
    regulatoryFilingHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export {
  BudgetForecastInputSchema,
  FundTransferInputSchema,
  PortfolioSnapshotInputSchema,
  RegulatoryFilingInputSchema,
};
