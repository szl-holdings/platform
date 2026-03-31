import type { AadHttpClient } from "@microsoft/sp-http";

export interface ILyteSignalSummaryProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  showCriticalOnly: boolean;
  maxSignals: number;
  theme: string;
  aadClient: AadHttpClient | undefined;
  userDisplayName: string;
}
