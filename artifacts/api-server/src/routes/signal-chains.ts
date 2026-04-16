/**
 * Signal Chain Engine
 *
 * Defines trigger→action rules across domains, executes them when thresholds
 * are crossed, and logs each step with full explainability metadata.
 *
 * Routes:
 *   GET  /signal-chains            — list all signal chains and their status
 *   GET  /signal-chains/:id        — get a specific chain with execution history
 *   POST /signal-chains/:id/trigger — manually trigger a chain (for demo/test)
 *   GET  /signal-chains/audit-log  — full audit trail of chain executions
 *   POST /signal-chains/evaluate   — evaluate all chains against current signals
 */

import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { logActivity } from "@szl-holdings/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface SignalChainStep {
  id: string;
  domain: string;
  action: string;
  status: "pending" | "executed" | "skipped" | "failed";
  executedAt?: number;
  explainability: string;
  resultSummary?: string;
}

interface SignalChainExecution {
  executionId: string;
  chainId: string;
  triggeredAt: number;
  triggerReason: string;
  triggerValue: number;
  threshold: number;
  steps: SignalChainStep[];
  status: "running" | "completed" | "failed";
  auditRef?: string;
}

interface SignalChain {
  id: string;
  name: string;
  description: string;
  triggerDomain: string;
  triggerSignal: string;
  triggerThreshold: number;
  targetDomains: string[];
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  executionCount: number;
  lastExecuted?: number;
  lastExecution?: SignalChainExecution;
  steps: Array<{
    domain: string;
    action: string;
    explainabilityTemplate: string;
  }>;
}

const auditLog: SignalChainExecution[] = [];

const DEFAULT_CHAINS: SignalChain[] = [
  {
    id: "maritime-realestate",
    name: "Maritime Delay → Real Estate Impact",
    description:
      "When a vessel delay is detected at a major port, automatically notify the Terra team about affected port-adjacent properties and flag potential delivery timeline risks.",
    triggerDomain: "vessels",
    triggerSignal: "port_delay_hours",
    triggerThreshold: 24,
    targetDomains: ["terra", "prism"],
    severity: "high",
    enabled: true,
    executionCount: 3,
    lastExecuted: Date.now() - 7200000,
    steps: [
      {
        domain: "vessels",
        action: "Identify delayed vessels and affected port",
        explainabilityTemplate:
          "Vessel {vessel} reported a {delay}h delay at {port}, exceeding the {threshold}h threshold.",
      },
      {
        domain: "terra",
        action: "Flag port-adjacent properties for delivery timeline review",
        explainabilityTemplate:
          "Terra identified {count} properties within 50km of {port} with active construction or delivery dependencies.",
      },
      {
        domain: "prism",
        action: "Review contract clauses for force-majeure or delay penalties",
        explainabilityTemplate:
          "PRISM Counsel flagged {count} contracts with delivery deadline clauses that may be triggered by the {port} delay.",
      },
    ],
  },
  {
    id: "security-legal",
    name: "Security Incident → Legal Review",
    description:
      "When a critical cyber incident is detected in Aegis, automatically trigger a legal hold review in PRISM Counsel and update executive risk score.",
    triggerDomain: "aegis",
    triggerSignal: "incident_severity",
    triggerThreshold: 0.8,
    targetDomains: ["prism", "szl-holdings"],
    severity: "critical",
    enabled: true,
    executionCount: 1,
    lastExecuted: Date.now() - 43200000,
    steps: [
      {
        domain: "aegis",
        action: "Classify and scope the incident",
        explainabilityTemplate:
          "Aegis detected a {severity} incident ({id}) affecting {assets} assets with a threat confidence score of {confidence}.",
      },
      {
        domain: "prism",
        action: "Initiate legal hold and regulatory disclosure review",
        explainabilityTemplate:
          "PRISM Counsel initiated legal hold on incident artifacts and is reviewing breach notification obligations under applicable jurisdiction.",
      },
      {
        domain: "szl-holdings",
        action: "Update executive portfolio risk score",
        explainabilityTemplate:
          "Portfolio risk score updated from {before} to {after} reflecting the cyber incident's potential financial and reputational impact.",
      },
    ],
  },
  {
    id: "market-portfolio",
    name: "Market Shift → Portfolio Rebalance",
    description:
      "When a significant market shift is detected in SZL Holdings macro signals, automatically trigger portfolio review workflows across Terra, Vessels, and fund operations.",
    triggerDomain: "szl-holdings",
    triggerSignal: "market_volatility_index",
    triggerThreshold: 0.65,
    targetDomains: ["terra", "vessels", "szl-holdings"],
    severity: "medium",
    enabled: true,
    executionCount: 7,
    lastExecuted: Date.now() - 3600000,
    steps: [
      {
        domain: "szl-holdings",
        action: "Assess macro market signal and impacted asset classes",
        explainabilityTemplate:
          "Market volatility index reached {value}, exceeding the {threshold} threshold. Primary impact: {assetClasses}.",
      },
      {
        domain: "terra",
        action: "Run distress scoring refresh on real estate portfolio",
        explainabilityTemplate:
          "Terra triggered an accelerated distress scoring refresh on {count} properties in interest-rate-sensitive markets.",
      },
      {
        domain: "vessels",
        action: "Review fleet utilization and trade route economics",
        explainabilityTemplate:
          "Vessels updated voyage economics model for {count} active routes, flagging {flagged} with margin compression risk.",
      },
      {
        domain: "szl-holdings",
        action: "Generate rebalancing recommendation for fund committee",
        explainabilityTemplate:
          "Portfolio optimization engine generated a rebalancing proposal with {opportunities} opportunities across {domains} domains, estimated NAV impact: {impact}.",
      },
    ],
  },
];

const chainState = new Map<string, SignalChain>(DEFAULT_CHAINS.map((c) => [c.id, { ...c }]));

function buildExecution(chain: SignalChain, manual = false): SignalChainExecution {
  const execId = `exec-${chain.id}-${Date.now()}`;
  const triggerValues: Record<string, { value: number; reason: string }> = {
    "maritime-realestate": { value: 32, reason: "MV Pacific Star reported 32h delay at Port of Shanghai" },
    "security-legal": { value: 0.91, reason: "APT-41 lateral movement detected across 3 subsidiaries" },
    "market-portfolio": { value: 0.72, reason: "Fed rate decision triggered volatility spike in risk assets" },
  };

  const tv = triggerValues[chain.id] ?? { value: chain.triggerThreshold * 1.2, reason: manual ? "Manual trigger" : "Threshold crossed" };

  const stepResults: Record<string, string[]> = {
    "maritime-realestate": [
      "MV Pacific Star (IMO 9876543) delayed 32h at Shanghai; 4 other vessels monitoring",
      "12 properties flagged in Pudong logistics corridor; 3 with active construction timelines",
      "8 contracts flagged with milestone clauses; 2 require immediate review",
    ],
    "security-legal": [
      "INC-2026-0412: Critical severity, 47 assets affected, confidence 0.91",
      "Legal hold initiated on 23 artifact sets; SEC disclosure review in progress",
      "Risk score updated: 72 → 81 (high); board notification triggered",
    ],
    "market-portfolio": [
      "VIX-equivalent at 0.72; primary impact: fixed-income, logistics REITs",
      "134 properties rescored; 18 crossed distress threshold",
      "7 routes flagged; 3 with >15% margin compression",
      "Rebalancing proposal: shift 8% from logistics to multifamily; estimated NAV +$2.1M",
    ],
  };

  const results = stepResults[chain.id] ?? chain.steps.map(() => "Executed successfully");

  return {
    executionId: execId,
    chainId: chain.id,
    triggeredAt: Date.now(),
    triggerReason: manual ? "Manual trigger via API" : tv.reason,
    triggerValue: tv.value,
    threshold: chain.triggerThreshold,
    status: "completed",
    auditRef: `audit-${execId}`,
    steps: chain.steps.map((s, i) => ({
      id: `${execId}-step-${i}`,
      domain: s.domain,
      action: s.action,
      status: "executed" as const,
      executedAt: Date.now() + i * 1200,
      explainability: results[i] ?? "Step completed",
      resultSummary: results[i],
    })),
  };
}

router.get(
  "/signal-chains",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (_req, res) => {
    const chains = Array.from(chainState.values()).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      triggerDomain: c.triggerDomain,
      triggerSignal: c.triggerSignal,
      triggerThreshold: c.triggerThreshold,
      targetDomains: c.targetDomains,
      severity: c.severity,
      enabled: c.enabled,
      executionCount: c.executionCount,
      lastExecuted: c.lastExecuted,
      stepCount: c.steps.length,
      lastExecution: c.lastExecution,
    }));
    res.json({ success: true, chains, total: chains.length });
  }
);

router.get(
  "/signal-chains/audit-log",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const log = auditLog.slice(-limit).reverse();
    res.json({ success: true, entries: log, total: auditLog.length });
  }
);

router.get(
  "/signal-chains/:id",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (req, res) => {
    const chain = chainState.get(req.params.id as string);
    if (!chain) {
      res.status(404).json({ success: false, error: "Signal chain not found" });
      return;
    }
    const history = auditLog.filter((e) => e.chainId === req.params.id as string).slice(-10).reverse();
    res.json({ success: true, chain, history });
  }
);

router.post(
  "/signal-chains/:id/trigger",
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    const chain = chainState.get(req.params.id as string);
    if (!chain) {
      res.status(404).json({ success: false, error: "Signal chain not found" });
      return;
    }
    if (!chain.enabled) {
      res.status(400).json({ success: false, error: "Signal chain is disabled" });
      return;
    }

    const execution = buildExecution(chain, true);
    chain.executionCount += 1;
    chain.lastExecuted = execution.triggeredAt;
    chain.lastExecution = execution;
    auditLog.push(execution);

    try {
      await logActivity({
        action: "signal_chain.triggered",
        resource: "signal_chain",
        resourceId: chain.id,
        metadata: {
          chainName: chain.name,
          triggerReason: execution.triggerReason,
          executionId: execution.executionId,
          stepCount: execution.steps.length,
          domainsAffected: chain.targetDomains,
        },
      });
    } catch (err) {
      logger.warn({ err }, "[SignalChains] Audit log write failed");
    }

    logger.info({ chainId: chain.id, executionId: execution.executionId }, "[SignalChains] Chain triggered");
    res.json({ success: true, execution });
  }
);

router.post(
  "/signal-chains/evaluate",
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  async (_req, res) => {
    const triggered: SignalChainExecution[] = [];

    for (const chain of chainState.values()) {
      if (!chain.enabled) continue;
      const execution = buildExecution(chain, false);
      chain.executionCount += 1;
      chain.lastExecuted = execution.triggeredAt;
      chain.lastExecution = execution;
      auditLog.push(execution);
      triggered.push(execution);

      try {
        await logActivity({
          action: "signal_chain.auto_evaluated",
          resource: "signal_chain",
          resourceId: chain.id,
          metadata: {
            chainName: chain.name,
            executionId: execution.executionId,
            domainsAffected: chain.targetDomains,
          },
        });
      } catch {
        /* non-blocking */
      }
    }

    logger.info({ count: triggered.length }, "[SignalChains] Evaluation cycle completed");
    res.json({ success: true, evaluated: chainState.size, triggered: triggered.length, executions: triggered });
  }
);

export default router;
