import { z } from "zod";
import {
  FundTransferInputSchema,
  FUND_TRANSFER_TOOL_MANIFEST,
  fundTransferHandler,
  PortfolioSnapshotInputSchema,
  PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  portfolioSnapshotHandler,
  BudgetForecastInputSchema,
  BUDGET_FORECAST_TOOL_MANIFEST,
  budgetForecastHandler,
  RegulatoryFilingInputSchema,
  REGULATORY_FILING_TOOL_MANIFEST,
  regulatoryFilingHandler,
} from "@workspace/tool-mesh/tools/finance-tools";
import { defineTool } from "../typed-tool.js";

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
  handler: (input) => portfolioSnapshotHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
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
  handler: (input) => regulatoryFilingHandler(input) as Promise<z.infer<typeof GenericOutputSchema>>,
});

export {
  FundTransferInputSchema,
  PortfolioSnapshotInputSchema,
  BudgetForecastInputSchema,
  RegulatoryFilingInputSchema,
};
