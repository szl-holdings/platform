import {
  Activity,
  AlertTriangle,
  Brain,
  DollarSign,
  GitBranch,
  History,
  Layers,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import type { DomainId } from './types';

export const DOMAINS: Record<DomainId, { name: string; color: string }> = {
  aegis: { name: 'Aegis', color: '#6366f1' },
  terra: { name: 'Terra', color: '#4d7c0f' },
  vessels: { name: 'Vessels', color: '#3b82f6' },
  lyte: { name: 'Lyte', color: '#f59e0b' },
  prism: { name: 'PRAXIS', color: '#a855f7' },
  carlota: { name: 'Carlota', color: '#c2a55a' },
};

export const EXEC_HEALTH = {
  score: 76,
  delta: '+3 pts',
  trend: 'up' as const,
  exposure: '$8.4M',
  topIssues: [
    { title: 'Lyte API P95 breaching 2.4s SLA', severity: 'high', domain: 'lyte' as DomainId },
    { title: 'Carlota Jo real-time feed stale 3h+', severity: 'high', domain: 'carlota' as DomainId },
    { title: '2 over-budget domains consuming $1.2M extra', severity: 'medium', domain: 'aegis' as DomainId },
  ],
  topOpps: [
    { title: 'Lyte AI Signal Summarizer usage +34% — expand capacity', value: '$820K ARR uplift', domain: 'lyte' as DomainId },
    { title: 'Vessels Voyage Economics re-engagement possible', value: '$280K saved', domain: 'vessels' as DomainId },
    { title: 'Terra distress borough filter = retention lever', value: '$140K ARR', domain: 'terra' as DomainId },
  ],
  blockedActions: [
    { title: 'LP Q1 Update Report', reason: 'Draft pending CFO sign-off', exposure: '$180M LP portfolio' },
    { title: 'PRAXIS Webhook Deploy', reason: 'Code review queue depth 12', exposure: 'Enterprise blocker' },
    { title: 'Carlota Jo Feed Reconnect', reason: 'CRM credentials expired', exposure: 'Churn risk' },
  ],
  changesYesterday: [
    'Vessels fleet uptime maintained 99.8% for 7th consecutive day',
    'Terra distress engine usage +21% — no borough filter yet deployed',
    'Aegis bundle grew 1.34MB vs 900KB budget — MITRE module root cause',
    'PRAXIS matter intake completion 88.3% — up 2.1% this week',
  ],
  changesLastWeek: [
    'Portfolio Health Score improved from 73 → 76 (+3 pts)',
    'Carlota Jo real-time data pipeline SLA breach — 4 occurrences',
    'Lyte API SLA degradation — 18.5% of readings over threshold',
    'Aegis client satisfaction NPS held at 82 — stable',
    'New: Terra Ownership Graph usage declining −22% — intervention needed',
  ],
};

export const KPI_HEALTH_DATA = [
  { id: 'k1', domain: 'lyte' as DomainId, name: 'API Latency P95', current: '2.4s', target: '2.0s', status: 'breach', trend: 'up' as const, causal: 'Full table scan on distress_score query; index missing' },
  { id: 'k2', domain: 'aegis' as DomainId, name: 'Security MTTR', current: '11m', target: '15m', status: 'healthy', trend: 'down' as const, causal: 'Automated playbook firing 43% of incidents without analyst' },
  { id: 'k3', domain: 'vessels' as DomainId, name: 'Fleet Uptime', current: '99.8%', target: '99.5%', status: 'healthy', trend: 'flat' as const, causal: 'No anomalous port events in trailing 7 days' },
  { id: 'k4', domain: 'terra' as DomainId, name: 'Deal Response Time', current: '18h', target: '24h', status: 'healthy', trend: 'down' as const, causal: 'AI pre-triage routing reducing analyst queue depth' },
  { id: 'k5', domain: 'lyte' as DomainId, name: 'Driver On-Time Rate', current: '88%', target: '92%', status: 'breach', trend: 'down' as const, causal: 'Weather event clusters in DC corridor; 3 routes impacted' },
  { id: 'k6', domain: 'prism' as DomainId, name: 'Contract Turnaround', current: '68h', target: '72h', status: 'healthy', trend: 'down' as const, causal: 'AI review assistant reducing first-read time by 18%' },
  { id: 'k7', domain: 'carlota' as DomainId, name: 'Data Freshness', current: '3.7h stale', target: '<1h', status: 'breach', trend: 'up' as const, causal: 'CRM sync credentials expired; pipeline disconnected' },
  { id: 'k8', domain: 'aegis' as DomainId, name: 'Patch Compliance', current: '96.4%', target: '95%', status: 'healthy', trend: 'flat' as const, causal: 'Weekly automated patch cycle running on schedule' },
];

export const RISK_REGISTER = [
  { id: 'r1', title: 'Carlota Jo real-time data SLA breach', domain: 'carlota' as DomainId, probability: 0.9, impact: 'High', level: 'critical', owner: 'Ops Lead', mitigation: 'Reconnect CRM sync, add freshness watchdog', trend: 'up' as const },
  { id: 'r2', title: 'Lyte API latency breach escalation', domain: 'lyte' as DomainId, probability: 0.7, impact: 'High', level: 'high', owner: 'Eng Team', mitigation: 'Add index on distress_score + borough', trend: 'up' as const },
  { id: 'r3', title: 'Aegis bundle over-budget degrading UX', domain: 'aegis' as DomainId, probability: 0.6, impact: 'Medium', level: 'high', owner: 'Frontend Lead', mitigation: 'Code-split MITRE ATT&CK (280KB eager load)', trend: 'flat' as const },
  { id: 'r4', title: 'Terra ownership graph declining usage', domain: 'terra' as DomainId, probability: 0.5, impact: 'Medium', level: 'medium', owner: 'Product Lead', mitigation: 'UX review, add AI-guided walkthrough', trend: 'down' as const },
  { id: 'r5', title: 'LP Q1 Report deadline exposure', domain: 'terra' as DomainId, probability: 0.4, impact: 'High', level: 'medium', owner: 'CFO', mitigation: 'Fast-track CFO review session this week', trend: 'flat' as const },
];

export const OPP_REGISTER = [
  { id: 'o1', title: 'Lyte AI Signal Summarizer adoption acceleration', domain: 'lyte' as DomainId, probability: 0.85, value: '$820K ARR', level: 'high', action: 'Expand capacity, add org-wide rollout incentive', owner: 'Growth Lead' },
  { id: 'o2', title: 'Terra distress borough filter — retention lever', domain: 'terra' as DomainId, probability: 0.8, value: '$140K ARR', level: 'high', action: 'Low-effort implementation; prioritize this sprint', owner: 'Eng Team' },
  { id: 'o3', title: 'PRAXIS & Carlota Jo webhook enterprise unlock', domain: 'prism' as DomainId, probability: 0.7, value: 'Unblocks 3 enterprise deals', level: 'high', action: 'Implement using shared webhook-engine lib', owner: 'Backend Lead' },
  { id: 'o4', title: 'Vessels Voyage Economics re-engagement', domain: 'vessels' as DomainId, probability: 0.6, value: '$280K saved', level: 'medium', action: 'Charter rate benchmark feature re-activation', owner: 'Product Lead' },
];

export const POLICIES_SUMMARY = [
  { id: 'p1', title: 'Data Retention & Disposal', status: 'active', owner: 'Priya Nair', domains: ['All'], lastReview: 'Apr 10', enforcement: 'auto' },
  { id: 'p2', title: 'Cross-Domain Access Control', status: 'active', owner: 'James Okafor', domains: ['Aegis', 'Vessels', 'Terra'], lastReview: 'Apr 8', enforcement: 'auto' },
  { id: 'p3', title: 'AI Model Governance', status: 'pending', owner: 'Stephen Lutar', domains: ['Command', 'Aegis'], lastReview: 'Apr 14', enforcement: 'manual' },
  { id: 'p4', title: 'Maritime Cybersecurity IR', status: 'active', owner: 'James Okafor', domains: ['Vessels', 'Aegis'], lastReview: 'Apr 5', enforcement: 'auto' },
  { id: 'p5', title: 'RE Deal Approval Thresholds', status: 'draft', owner: 'Sofia Reyes', domains: ['Terra'], lastReview: 'Apr 15', enforcement: 'manual' },
];

export const VALUE_LEDGER = [
  { id: 'v1', type: 'at-risk' as const, label: 'Carlota Jo pipeline disconnection', amount: 380000, domain: 'carlota' as DomainId, note: 'Churn risk if feed stale > 24h' },
  { id: 'v2', type: 'at-risk' as const, label: 'Lyte SLA penalties exposure', amount: 420000, domain: 'lyte' as DomainId, note: '2 SLAs breaching, contractual penalties possible' },
  { id: 'v3', type: 'at-risk' as const, label: 'Aegis bundle degradation — churn risk', amount: 280000, domain: 'aegis' as DomainId, note: 'UX degradation in high-usage MITRE module' },
  { id: 'v4', type: 'protected' as const, label: 'Automated incident response savings', amount: 1200000, domain: 'aegis' as DomainId, note: '43% of incidents closed auto, saving ~8h analyst time/day' },
  { id: 'v5', type: 'protected' as const, label: 'Terra AI pre-triage — deal velocity', amount: 340000, domain: 'terra' as DomainId, note: '18% faster response = fewer lost deals' },
  { id: 'v6', type: 'created' as const, label: 'Lyte Signal Summarizer ARR uplift', amount: 820000, domain: 'lyte' as DomainId, note: '+34% usage → upsell trigger' },
  { id: 'v7', type: 'created' as const, label: 'Terra borough filter conversion value', amount: 140000, domain: 'terra' as DomainId, note: 'Estimated from user feedback NPS uplift' },
];

export const WORKFLOW_PERF = [
  { id: 'w1', name: 'Carlota Jo Client Onboarding', domain: 'carlota' as DomainId, steps: 8, completion: 84, avgMin: 22, bottleneck: 'Step 4: Contract sign-off (avg 6m)', status: 'active' },
  { id: 'w2', name: 'Aegis Incident Response', domain: 'aegis' as DomainId, steps: 12, completion: 91, avgMin: 41, bottleneck: 'Step 7: Escalation approval (avg 11m)', status: 'active' },
  { id: 'w3', name: 'Vessels Inspection Workflow', domain: 'vessels' as DomainId, steps: 6, completion: 77, avgMin: 18, bottleneck: 'Step 5: Photo upload (avg 4m)', status: 'active' },
  { id: 'w4', name: 'Terra Due Diligence', domain: 'terra' as DomainId, steps: 10, completion: 68, avgMin: 55, bottleneck: 'Step 6: Ownership verification (avg 18m)', status: 'active' },
  { id: 'w5', name: 'PRAXIS Matter Intake', domain: 'prism' as DomainId, steps: 7, completion: 88, avgMin: 14, bottleneck: 'Step 3: Conflict check (avg 3m)', status: 'active' },
  { id: 'w6', name: 'SZL LP Quarterly Update', domain: 'lyte' as DomainId, steps: 9, completion: 55, avgMin: 90, bottleneck: 'Not yet run — template ready', status: 'pending' },
];

export const AGENT_TRUST = [
  { id: 'a1', agent: 'Aegis Threat Correlator', domain: 'aegis' as DomainId, trustScore: 94, accuracy: 91, actionsExecuted: 1840, humanOverrides: 12, status: 'certified' },
  { id: 'a2', agent: 'Lyte Signal Summarizer', domain: 'lyte' as DomainId, trustScore: 89, accuracy: 87, actionsExecuted: 3420, humanOverrides: 38, status: 'certified' },
  { id: 'a3', agent: 'Terra Distress Ranker', domain: 'terra' as DomainId, trustScore: 82, accuracy: 84, actionsExecuted: 640, humanOverrides: 22, status: 'monitored' },
  { id: 'a4', agent: 'Vessels Route Risk Scorer', domain: 'vessels' as DomainId, trustScore: 86, accuracy: 88, actionsExecuted: 762, humanOverrides: 15, status: 'certified' },
  { id: 'a5', agent: 'PRAXIS Conflict Checker', domain: 'prism' as DomainId, trustScore: 78, accuracy: 81, actionsExecuted: 210, humanOverrides: 42, status: 'monitored' },
  { id: 'a6', agent: 'Carlota Brand Sentiment', domain: 'carlota' as DomainId, trustScore: 71, accuracy: 74, actionsExecuted: 94, humanOverrides: 28, status: 'probation' },
];

export const MODULES = [
  { id: 'exec', label: 'Executive Overview', icon: Star },
  { id: 'kpi', label: 'KPI/SLO Health', icon: Activity },
  { id: 'flow', label: 'Business Flow', icon: GitBranch },
  { id: 'risk', label: 'Risk Register', icon: AlertTriangle },
  { id: 'opp', label: 'Opportunities', icon: TrendingUp },
  { id: 'policy', label: 'Policy & Compliance', icon: Shield },
  { id: 'value', label: 'Value Ledger', icon: DollarSign },
  { id: 'workflow', label: 'Workflow Performance', icon: Layers },
  { id: 'agent', label: 'Agent Trust', icon: Brain },
  { id: 'log', label: 'Decision Log', icon: History },
] as const;
