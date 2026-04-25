/**
 * Alloy Meridian — Decision Weather
 *
 * Produces probability forecasts for key business risk events:
 * delay, churn, cost overrun, incident, and opportunity conversion.
 * Designed to give operators an at-a-glance "weather forecast" for
 * the next 7, 14, and 30 days.
 */

export type WeatherEventType =
  | 'delivery_delay'
  | 'customer_churn'
  | 'cost_overrun'
  | 'incident'
  | 'opportunity_conversion';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface WeatherForecastWindow {
  days: 7 | 14 | 30;
  probability: number;
  trend: 'rising' | 'falling' | 'stable';
  confidenceInterval: [number, number];
  driverSignals: string[];
}

export interface WeatherEvent {
  type: WeatherEventType;
  label: string;
  icon: string;
  currentProbability: number;
  severity: Severity;
  windows: WeatherForecastWindow[];
  lastUpdated: string;
  advisory: string;
}

export interface DecisionWeatherReport {
  overallRisk: 'clear' | 'caution' | 'warning' | 'storm';
  events: WeatherEvent[];
  forecastHorizonDays: 30;
  generatedAt: string;
  mode: 'live' | 'simulation';
}

function severityFromProb(p: number): Severity {
  if (p >= 0.7) return 'critical';
  if (p >= 0.5) return 'high';
  if (p >= 0.3) return 'medium';
  return 'low';
}

function trendFromDeltas(p7: number, p14: number, p30: number): 'rising' | 'falling' | 'stable' {
  const delta = p30 - p7;
  if (delta > 0.08) return 'rising';
  if (delta < -0.08) return 'falling';
  return 'stable';
}

function buildAdvisory(type: WeatherEventType, prob: number): string {
  if (prob < 0.25) {
    return `${type.replace(/_/g, ' ')} risk is low. Continue monitoring.`;
  }
  if (prob < 0.5) {
    return `Moderate ${type.replace(/_/g, ' ')} risk. Prepare mitigation plan.`;
  }
  return `High ${type.replace(/_/g, ' ')} risk. Immediate attention recommended.`;
}

const WEATHER_PRESETS: Array<{
  type: WeatherEventType;
  label: string;
  icon: string;
  p7base: number;
  p14base: number;
  p30base: number;
  drivers: string[];
}> = [
  {
    type: 'delivery_delay',
    label: 'Delivery Delay',
    icon: '🚦',
    p7base: 0.31,
    p14base: 0.42,
    p30base: 0.47,
    drivers: ['CI failure rate elevated', 'Sprint velocity declining', '3 PRs blocked >5 days'],
  },
  {
    type: 'customer_churn',
    label: 'Customer Churn',
    icon: '🌀',
    p7base: 0.18,
    p14base: 0.22,
    p30base: 0.28,
    drivers: ['NPS signal stale (14d)', 'Support ticket volume up 23%'],
  },
  {
    type: 'cost_overrun',
    label: 'Cost Overrun',
    icon: '⚠️',
    p7base: 0.12,
    p14base: 0.19,
    p30base: 0.26,
    drivers: ['Cloud spend trending +18% MoM', 'Unplanned incident response costs'],
  },
  {
    type: 'incident',
    label: 'Service Incident',
    icon: '🔴',
    p7base: 0.55,
    p14base: 0.62,
    p30base: 0.65,
    drivers: ['2 active incidents', 'Memory usage at 74%', '3 open critical CVEs'],
  },
  {
    type: 'opportunity_conversion',
    label: 'Opportunity Conversion',
    icon: '✅',
    p7base: 0.38,
    p14base: 0.51,
    p30base: 0.63,
    drivers: ['Pipeline velocity improving', 'Product demo scheduled', 'Positive market timing index'],
  },
];

export function generateDecisionWeather(): DecisionWeatherReport {
  const now = new Date().toISOString();
  const jitter = (Math.random() - 0.5) * 0.04;

  const events: WeatherEvent[] = WEATHER_PRESETS.map((preset) => {
    const p7 = Math.min(1, Math.max(0, preset.p7base + jitter));
    const p14 = Math.min(1, Math.max(0, preset.p14base + jitter));
    const p30 = Math.min(1, Math.max(0, preset.p30base + jitter));

    const windows: WeatherForecastWindow[] = [
      {
        days: 7,
        probability: Math.round(p7 * 100) / 100,
        trend: trendFromDeltas(p7, p14, p30),
        confidenceInterval: [
          Math.round(Math.max(0, p7 - 0.12) * 100) / 100,
          Math.round(Math.min(1, p7 + 0.12) * 100) / 100,
        ],
        driverSignals: preset.drivers.slice(0, 2),
      },
      {
        days: 14,
        probability: Math.round(p14 * 100) / 100,
        trend: trendFromDeltas(p7, p14, p30),
        confidenceInterval: [
          Math.round(Math.max(0, p14 - 0.16) * 100) / 100,
          Math.round(Math.min(1, p14 + 0.16) * 100) / 100,
        ],
        driverSignals: preset.drivers,
      },
      {
        days: 30,
        probability: Math.round(p30 * 100) / 100,
        trend: trendFromDeltas(p7, p14, p30),
        confidenceInterval: [
          Math.round(Math.max(0, p30 - 0.22) * 100) / 100,
          Math.round(Math.min(1, p30 + 0.22) * 100) / 100,
        ],
        driverSignals: preset.drivers,
      },
    ];

    return {
      type: preset.type,
      label: preset.label,
      icon: preset.icon,
      currentProbability: Math.round(p7 * 100) / 100,
      severity: severityFromProb(p7),
      windows,
      lastUpdated: now,
      advisory: buildAdvisory(preset.type, p7),
    };
  });

  const maxProb = Math.max(...events.map((e) => e.currentProbability));
  const overallRisk =
    maxProb >= 0.7
      ? 'storm'
      : maxProb >= 0.5
        ? 'warning'
        : maxProb >= 0.3
          ? 'caution'
          : 'clear';

  return {
    overallRisk,
    events,
    forecastHorizonDays: 30,
    generatedAt: now,
    mode: 'simulation',
  };
}
