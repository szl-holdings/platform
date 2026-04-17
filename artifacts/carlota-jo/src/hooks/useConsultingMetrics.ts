import { useMemo } from "react";
import {
  TEAM,
  ENGAGEMENTS,
  INVOICES,
  TIME_ENTRIES,
  CAPACITY_ALERTS,
} from "@/data/operationalData";

export type PlatformMetric = {
  label: string;
  value: string;
  change: string;
  up: boolean;
  source?: "live" | "static";
};

export type ConsultingMetrics = {
  platform: PlatformMetric[];
  modules: {
    timeTracking: string;
    capacityPlanner: string;
    profitability: string;
    engagementDelivery: string;
    revenue: string;
  };
  raw: {
    activeEngagements: number;
    portfolioContractedGBP: number;
    blendedMarginPct: number;
    avgUtilisationPct: number;
    benchCapacityMembers: number;
    rateRealisationPct: number;
    outstandingInvoicesGBP: number;
    weeklyBillableHours: number;
    capacityAlertsCount: number;
  };
};

const fmtGBP = (v: number): string => {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `£${(v / 1000).toFixed(0)}K`;
  return `£${v}`;
};

export function useConsultingMetrics(): ConsultingMetrics {
  return useMemo(() => {
    // From capacity-planner
    const avgUtilisation = Math.round(
      TEAM.reduce((s, m) => s + m.utilisation, 0) / TEAM.length,
    );
    const benchCapacityMembers = TEAM.filter(
      (m) => m.status === "bench" || m.status === "under",
    ).length;

    // From profitability-analytics
    const activeEngagements = ENGAGEMENTS.filter(
      (e) => e.status !== "complete",
    ).length;
    const portfolioContracted = ENGAGEMENTS.reduce(
      (s, e) => s + e.contractedValue,
      0,
    );
    const totalCollected = ENGAGEMENTS.reduce((s, e) => s + e.collected, 0);
    const totalCost = ENGAGEMENTS.reduce((s, e) => s + e.costToDate, 0);
    const blendedMargin =
      totalCollected > 0
        ? Math.round(((totalCollected - totalCost) / totalCollected) * 100)
        : 0;
    const avgRateRealisation = Math.round(
      ENGAGEMENTS.reduce((s, e) => s + e.rateRealisationPct, 0) /
        ENGAGEMENTS.length,
    );

    // From time-tracking
    const billableHours = TIME_ENTRIES.filter((e) => e.billable).reduce(
      (s, e) => s + e.hours,
      0,
    );
    const nonBillableHours = TIME_ENTRIES.filter((e) => !e.billable).reduce(
      (s, e) => s + e.hours,
      0,
    );
    const billableUtilisation =
      billableHours + nonBillableHours > 0
        ? Math.round((billableHours / (billableHours + nonBillableHours)) * 100)
        : 0;
    const outstandingInvoices = INVOICES.filter(
      (i) => i.status === "sent" || i.status === "overdue",
    ).reduce((s, i) => s + i.amount, 0);

    return {
      raw: {
        activeEngagements,
        portfolioContractedGBP: portfolioContracted,
        blendedMarginPct: blendedMargin,
        avgUtilisationPct: avgUtilisation,
        benchCapacityMembers,
        rateRealisationPct: avgRateRealisation,
        outstandingInvoicesGBP: outstandingInvoices,
        weeklyBillableHours: billableHours,
        capacityAlertsCount: CAPACITY_ALERTS.length,
      },
      platform: [
        {
          label: "Active Engagements",
          value: activeEngagements.toString(),
          change: `${ENGAGEMENTS.filter((e) => e.status === "at-risk").length} at risk`,
          up: true,
          source: "live",
        },
        {
          label: "Portfolio Contracted",
          value: fmtGBP(portfolioContracted),
          change: `${fmtGBP(totalCollected)} collected`,
          up: true,
          source: "live",
        },
        {
          label: "Blended Margin",
          value: `${blendedMargin}%`,
          change: "vs 38% target",
          up: blendedMargin >= 38,
          source: "live",
        },
        {
          label: "Client Health Avg",
          value: "84/100",
          change: "Excellent",
          up: true,
          source: "static",
        },
        {
          label: "Knowledge Nodes",
          value: "1,247",
          change: "+142 this week",
          up: true,
          source: "static",
        },
        {
          label: "Team Utilisation",
          value: `${avgUtilisation}%`,
          change: `${benchCapacityMembers} with bench capacity`,
          up: true,
          source: "live",
        },
      ],
      modules: {
        timeTracking: `${billableHours}h billable · ${billableUtilisation}% billable rate`,
        capacityPlanner: `${avgUtilisation}% avg utilisation`,
        profitability: `${blendedMargin}% blended margin`,
        engagementDelivery: `${activeEngagements} active engagements`,
        revenue: `${fmtGBP(portfolioContracted)} portfolio value`,
      },
    };
  }, []);
}
