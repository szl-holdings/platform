/**
 * Confidence Degradation Monitor
 *
 * Detects when an agent's confidence calibration or accuracy is declining
 * and triggers automatic alerts and human review escalation recommendations.
 */

import { scoringEngine, type AgentPerformanceProfile } from "./scoring-engine.js";

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertType =
  | "confidence_degradation"
  | "accuracy_decline"
  | "high_override_rate"
  | "low_acceptance_rate"
  | "skill_effectiveness_decline"
  | "calibration_drift"
  | "human_review_escalation";

export interface ConfidenceAlert {
  alertId: string;
  agentId: string;
  tenantId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  currentValue: number;
  threshold: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  recommendedAction: string;
  requiresHumanReview: boolean;
  autoResolvable: boolean;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  metadata: Record<string, unknown>;
}

export interface MonitorConfig {
  accuracyDeclineThreshold: number;
  overrideRateThreshold: number;
  lowAcceptanceThreshold: number;
  calibrationDriftThreshold: number;
  skillDeclineThreshold: number;
  shortWindowDays: number;
  longWindowDays: number;
  minSampleForAlert: number;
  alertCooldownMs: number;
}

const DEFAULT_MONITOR_CONFIG: MonitorConfig = {
  accuracyDeclineThreshold: 0.1,
  overrideRateThreshold: 0.3,
  lowAcceptanceThreshold: 0.5,
  calibrationDriftThreshold: 0.15,
  skillDeclineThreshold: 0.1,
  shortWindowDays: 7,
  longWindowDays: 30,
  minSampleForAlert: 5,
  alertCooldownMs: 4 * 60 * 60 * 1000,
};

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class ConfidenceMonitor {
  private config: MonitorConfig;
  private activeAlerts = new Map<string, ConfidenceAlert>();
  private lastAlertTime = new Map<string, number>();

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_MONITOR_CONFIG, ...config };
  }

  private isOnCooldown(key: string): boolean {
    const last = this.lastAlertTime.get(key);
    if (!last) return false;
    return Date.now() - last < this.config.alertCooldownMs;
  }

  private recordAlert(key: string, alert: ConfidenceAlert): void {
    this.activeAlerts.set(alert.alertId, alert);
    this.lastAlertTime.set(key, Date.now());
    void this.persistAlert(alert);
  }

  private async persistAlert(alert: ConfidenceAlert): Promise<void> {
    try {
      const { db, alloyConfidenceAlerts } = await import("@szl-holdings/db");
      await db.insert(alloyConfidenceAlerts).values({
        alertId: alert.alertId,
        agentId: alert.agentId,
        tenantId: alert.tenantId,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        trend: alert.trend,
        recommendedAction: alert.recommendedAction,
        requiresHumanReview: alert.requiresHumanReview,
        autoResolvable: alert.autoResolvable,
        metadata: alert.metadata,
      });
    } catch {
    }
  }

  async evaluate(agentId: string, tenantId: string): Promise<ConfidenceAlert[]> {
    await scoringEngine.loadFromDb(agentId).catch(() => {});

    const profile = scoringEngine.computeAgentProfile(agentId, this.config.longWindowDays);
    const trend = scoringEngine.detectTrend(agentId, this.config.shortWindowDays, this.config.longWindowDays);
    const newAlerts: ConfidenceAlert[] = [];

    if (profile.accuracy.totalDecisions < this.config.minSampleForAlert) {
      return newAlerts;
    }

    if (
      trend.trend === "declining" &&
      Math.abs(trend.delta) > this.config.accuracyDeclineThreshold &&
      !this.isOnCooldown(`accuracy_decline:${agentId}`)
    ) {
      const alert: ConfidenceAlert = {
        alertId: generateAlertId(),
        agentId,
        tenantId,
        alertType: "accuracy_decline",
        severity: Math.abs(trend.delta) > 0.2 ? "high" : "medium",
        title: "Agent Accuracy Declining",
        description: `Agent ${agentId} accuracy score has declined by ${Math.round(Math.abs(trend.delta) * 100)}% ` +
          `over the past ${this.config.shortWindowDays} days compared to the ${this.config.longWindowDays}-day baseline. ` +
          `Short-term score: ${Math.round(trend.shortTermScore * 100)}%, long-term baseline: ${Math.round(trend.longTermScore * 100)}%.`,
        currentValue: trend.shortTermScore,
        threshold: trend.longTermScore - this.config.accuracyDeclineThreshold,
        trend: "declining",
        recommendedAction: "Review recent decisions for systematic errors. Consider increasing human review triggers and reducing auto-action scope.",
        requiresHumanReview: Math.abs(trend.delta) > 0.2,
        autoResolvable: true,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        metadata: { shortTermScore: trend.shortTermScore, longTermScore: trend.longTermScore, delta: trend.delta },
      };
      this.recordAlert(`accuracy_decline:${agentId}`, alert);
      newAlerts.push(alert);
    }

    if (
      profile.accuracy.overrideRate > this.config.overrideRateThreshold &&
      !this.isOnCooldown(`high_override:${agentId}`)
    ) {
      const alert: ConfidenceAlert = {
        alertId: generateAlertId(),
        agentId,
        tenantId,
        alertType: "high_override_rate",
        severity: profile.accuracy.overrideRate > 0.5 ? "critical" : "high",
        title: "High Decision Override Rate",
        description: `Agent ${agentId} has an override rate of ${Math.round(profile.accuracy.overrideRate * 100)}% ` +
          `(${profile.accuracy.overriddenDecisions} of ${profile.accuracy.totalDecisions} decisions). ` +
          `This indicates systematic misalignment between AI recommendations and human operator judgments.`,
        currentValue: profile.accuracy.overrideRate,
        threshold: this.config.overrideRateThreshold,
        trend: trend.trend,
        recommendedAction: "Immediate human review of agent reasoning patterns. Inspect override reasons for common themes. Consider suspending autonomous actions until root cause is resolved.",
        requiresHumanReview: true,
        autoResolvable: false,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        metadata: { overrideRate: profile.accuracy.overrideRate, overriddenCount: profile.accuracy.overriddenDecisions, total: profile.accuracy.totalDecisions },
      };
      this.recordAlert(`high_override:${agentId}`, alert);
      newAlerts.push(alert);
    }

    if (
      profile.accuracy.acceptanceRate < this.config.lowAcceptanceThreshold &&
      !this.isOnCooldown(`low_acceptance:${agentId}`)
    ) {
      const alert: ConfidenceAlert = {
        alertId: generateAlertId(),
        agentId,
        tenantId,
        alertType: "low_acceptance_rate",
        severity: profile.accuracy.acceptanceRate < 0.35 ? "critical" : "high",
        title: "Low Decision Acceptance Rate",
        description: `Agent ${agentId} acceptance rate has dropped to ${Math.round(profile.accuracy.acceptanceRate * 100)}%. ` +
          `Fewer than half of this agent's decisions are being accepted without modification or rejection.`,
        currentValue: profile.accuracy.acceptanceRate,
        threshold: this.config.lowAcceptanceThreshold,
        trend: trend.trend,
        recommendedAction: "Review agent configuration, prompt templates, and decision object schema. Evaluate if the agent is operating outside its designed competency domain.",
        requiresHumanReview: true,
        autoResolvable: false,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        metadata: { acceptanceRate: profile.accuracy.acceptanceRate, total: profile.accuracy.totalDecisions },
      };
      this.recordAlert(`low_acceptance:${agentId}`, alert);
      newAlerts.push(alert);
    }

    if (
      profile.calibration.calibrationVerdict === "overconfident" &&
      profile.calibration.calibrationError > this.config.calibrationDriftThreshold &&
      !this.isOnCooldown(`calibration_drift:${agentId}`)
    ) {
      const alert: ConfidenceAlert = {
        alertId: generateAlertId(),
        agentId,
        tenantId,
        alertType: "calibration_drift",
        severity: profile.calibration.calibrationError > 0.25 ? "high" : "medium",
        title: "Confidence Calibration Drift Detected",
        description: `Agent ${agentId} is significantly overconfident. Average predicted confidence is ` +
          `${Math.round(profile.calibration.meanPredictedConfidence * 100)}% but actual acceptance rate is ` +
          `${Math.round(profile.calibration.meanActualAcceptanceRate * 100)}%. ` +
          `Calibration error: ${Math.round(profile.calibration.calibrationError * 100)}%.`,
        currentValue: profile.calibration.calibrationError,
        threshold: this.config.calibrationDriftThreshold,
        trend: trend.trend,
        recommendedAction: `Apply confidence adjustment of ${Math.round(profile.calibration.recommendedAdjustment * 100)}% to future decisions. Review prompt calibration instructions.`,
        requiresHumanReview: false,
        autoResolvable: true,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        metadata: {
          calibrationBias: profile.calibration.calibrationBias,
          calibrationError: profile.calibration.calibrationError,
          recommendedAdjustment: profile.calibration.recommendedAdjustment,
        },
      };
      this.recordAlert(`calibration_drift:${agentId}`, alert);
      newAlerts.push(alert);
    }

    const decliningSkills = profile.skillEffectiveness.filter(
      s => s.trend === "declining" && s.totalUsages >= this.config.minSampleForAlert
    );
    for (const skill of decliningSkills) {
      const key = `skill_decline:${agentId}:${skill.skillId}`;
      if (!this.isOnCooldown(key)) {
        const alert: ConfidenceAlert = {
          alertId: generateAlertId(),
          agentId,
          tenantId,
          alertType: "skill_effectiveness_decline",
          severity: "medium",
          title: `Skill Effectiveness Declining: ${skill.capability}`,
          description: `Skill '${skill.capability}' (${skill.skillId}) for agent ${agentId} is showing declining effectiveness. ` +
            `Current acceptance rate: ${Math.round(skill.acceptanceRate * 100)}%, ` +
            `override rate: ${Math.round(skill.overrideRate * 100)}%.`,
          currentValue: skill.effectivenessScore,
          threshold: this.config.skillDeclineThreshold,
          trend: "declining",
          recommendedAction: `Review the ${skill.capability} skill configuration and prompt templates. Consider A/B testing alternative approaches for this capability.`,
          requiresHumanReview: false,
          autoResolvable: true,
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
          metadata: { skillId: skill.skillId, capability: skill.capability, effectivenessScore: skill.effectivenessScore },
        };
        this.recordAlert(key, alert);
        newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    const updated = { ...alert, resolvedAt: new Date().toISOString(), resolvedBy };
    this.activeAlerts.set(alertId, updated);
    void this.updateAlertResolution(alertId, resolvedBy);
    return true;
  }

  private async updateAlertResolution(alertId: string, resolvedBy: string): Promise<void> {
    try {
      const { db, alloyConfidenceAlerts } = await import("@szl-holdings/db");
      const { eq } = await import("drizzle-orm");
      await db.update(alloyConfidenceAlerts)
        .set({ resolvedAt: new Date(), resolvedBy })
        .where(eq(alloyConfidenceAlerts.alertId, alertId));
    } catch {
    }
  }

  getActiveAlerts(agentId?: string): ConfidenceAlert[] {
    const all = [...this.activeAlerts.values()].filter(a => !a.resolvedAt);
    return agentId ? all.filter(a => a.agentId === agentId) : all;
  }

  getAlertHistory(agentId: string): ConfidenceAlert[] {
    return [...this.activeAlerts.values()].filter(a => a.agentId === agentId);
  }

  async loadAlertsFromDb(tenantId: string): Promise<void> {
    try {
      const { db, alloyConfidenceAlerts } = await import("@szl-holdings/db");
      const { eq, isNull } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(alloyConfidenceAlerts)
        .where(eq(alloyConfidenceAlerts.tenantId, tenantId));

      for (const row of rows) {
        const alert: ConfidenceAlert = {
          alertId: row.alertId,
          agentId: row.agentId,
          tenantId: row.tenantId,
          alertType: row.alertType as AlertType,
          severity: row.severity as AlertSeverity,
          title: row.title,
          description: row.description,
          currentValue: row.currentValue,
          threshold: row.threshold,
          trend: row.trend as ConfidenceAlert["trend"],
          recommendedAction: row.recommendedAction,
          requiresHumanReview: row.requiresHumanReview,
          autoResolvable: row.autoResolvable,
          createdAt: row.createdAt.toISOString(),
          resolvedAt: row.resolvedAt?.toISOString() ?? null,
          resolvedBy: row.resolvedBy,
          metadata: row.metadata as Record<string, unknown>,
        };
        this.activeAlerts.set(alert.alertId, alert);
      }
    } catch {
    }
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  updateConfig(patch: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...patch };
  }
}

export const confidenceMonitor = new ConfidenceMonitor();
