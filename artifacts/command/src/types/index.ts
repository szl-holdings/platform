export type TrendDirection = "up" | "down" | "neutral";
export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type DomainId = "aegis" | "vessels" | "szl" | "lyte" | "prism" | "terra" | "carlota" | "stephen";

export interface DomainKpi {
  label: string;
  value: string;
  trend: TrendDirection;
}

export interface DomainAlerts {
  count: number;
  severity: SeverityLevel;
}

export interface DomainData {
  id: DomainId;
  name: string;
  icon: string;
  color: string;
  score: number;
  status: string;
  kpis: DomainKpi[];
  alerts: DomainAlerts;
  sparkline: number[];
  link: string;
}

export interface TimelineEvent {
  id: number;
  time: string;
  domain: DomainId;
  severity: SeverityLevel;
  title: string;
  detail: string;
}

export interface IntelligenceCard {
  id: string;
  title: string;
  severity: SeverityLevel;
  description: string;
  entities: string[];
  action: string;
}

export interface CommandAction {
  id: string;
  domain: DomainId;
  priority: PriorityLevel;
  text: string;
  buttonText: string;
}

export interface EcosystemSnapshot {
  domains: DomainData[];
  timeline: TimelineEvent[];
  intelligence: IntelligenceCard[];
  actions: CommandAction[];
  compositeScore: number;
  compositeStatus: string;
  lastUpdated: Date;
}
