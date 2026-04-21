import {
  Activity,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Gauge,
  Shield,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { AuditEntry } from '../lib/types';

const APP_COLORS: Record<string, string> = {
  aegis: '#ff4455',
  vessels: '#00d4ff',
  terra: '#00ff88',
  pulse: '#ffb700',
  command: '#a855f7',
  'szl-holdings': '#22d3ee',
  'carlota-jo': '#f472b6',
  'prism-counsel': '#818cf8',
  lyte: '#fb923c',
  nexus: '#a3e635',
};

function seed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateAuditEntries(): AuditEntry[] {
  const agents = [
    {
      slug: 'aegis',
      name: 'Aegis Intel Agent',
      actions: ['fetch_threat_feed', 'score_vulnerability', 'correlate_incidents'],
    },
    {
      slug: 'vessels',
      name: 'Vessels Route Agent',
      actions: ['query_fleet_positions', 'assess_port_risk', 'compute_voyage_economics'],
    },
    {
      slug: 'terra',
      name: 'Terra Distress Agent',
      actions: ['scan_distress_signals', 'score_property_risk', 'generate_acquisition_brief'],
    },
    {
      slug: 'pulse',
      name: 'Pulse Briefing Agent',
      actions: ['compile_executive_brief', 'rank_insights', 'schedule_delivery'],
    },
    {
      slug: 'command',
      name: 'Command Correlation Agent',
      actions: ['cross_domain_correlate', 'surface_anomalies', 'prioritize_actions'],
    },
    {
      slug: 'nexus',
      name: 'PRAXIS Orchestrator',
      actions: ['plan_agent_sequence', 'stitch_outputs', 'verify_completeness'],
    },
  ];

  const reasonings: Record<string, string[]> = {
    fetch_threat_feed: [
      'Selected CISA KEV feed over NVD because KEV covers actively exploited CVEs — higher signal density for immediate risk.',
      'Chose real-time AbuseIPDB ingestion rather than cached copy; threat actor IPs rotate within hours so freshness is critical.',
    ],
    score_vulnerability: [
      'Applied CVSS 3.1 base score weighted by asset exposure score. Rejected EPSS-only scoring because the tenant has no patching telemetry yet.',
      'Boosted CVSS base score by 1.4× for assets flagged as internet-facing; internal-only assets capped at medium severity.',
    ],
    correlate_incidents: [
      'Matched incidents on (source IP, MITRE technique, asset group) triple. Rejected fuzzy-only match — too many false correlations in last run.',
      'Used temporal proximity window of ±15 minutes. Considered ±60 min but that merged unrelated campaigns in October test set.',
    ],
    query_fleet_positions: [
      'Polled AIS-proxy endpoint rather than direct Baltic Exchange API; proxy caches at 5-min cadence which is sufficient for voyage risk.',
      'Filtered to active vessels only (speed > 0.5 kn) to avoid anchored vessels inflating risk scores.',
    ],
    assess_port_risk: [
      'Cross-referenced vessel destination against OFAC SDN list and UN sanctions registry. Skipped EU blocking-statute check — not applicable for this tenant.',
      'Port risk score = max(sanction_score, weather_score, congestion_score). Rejected weighted average — max exposes worst-case clearly.',
    ],
    compute_voyage_economics: [
      'Used Bunker price index from last Tuesday (no intraday feed available). Flagged output with staleness warning.',
      'Charter rate pulled from BIMCO historical average for vessel class; live Baltic index not in scope for this run.',
    ],
    scan_distress_signals: [
      'Queried 90-day tax lien, lis pendens, and pre-foreclosure records. Excluded short-sales — separate signal category.',
      "Weighted tax delinquency at 0.6 of distress score; prior research shows it's the strongest leading indicator for NYC ZIP codes.",
    ],
    score_property_risk: [
      'Distress score = 0.6 × tax_signal + 0.3 × ownership_stress + 0.1 × market_momentum. Coefficients from internal NYC regression model.',
      'Rejected ML-only scoring for this run — not enough labeled data in new ZIP codes. Reverted to rules-based with human-readable explanations.',
    ],
    generate_acquisition_brief: [
      'Structured brief following Carlota Jo deal-memo template. Excluded financial projections — no verified rent-roll available.',
      'Included comparable sales within 0.5 miles and 12 months. Wider radius would include different submarket dynamics.',
    ],
    compile_executive_brief: [
      'Ranked insights by (urgency × novelty). Suppressed items already seen in previous 3 briefs to avoid repetition fatigue.',
      'Limited brief to 5 insights. Tested 7 in user study — exec read time exceeded 3 minutes; 5 holds attention.',
    ],
    rank_insights: [
      'Used preference signal from prior brief engagement (which items the user expanded). Items with 0 prior opens deprioritized.',
      'Recency-boosted items from the last 4 hours by 1.5×. Older items compete on absolute urgency only.',
    ],
    schedule_delivery: [
      'Scheduled for 06:45 user local time based on saved preference. Avoided 07:00 slot — congested with calendar notifications.',
      'Delivery channel: push (mobile) primary, email fallback. SMS reserved for P0 alerts only.',
    ],
    cross_domain_correlate: [
      'Joined Aegis threat signals with Vessels port-risk events on (timestamp, geo_region) key. 14 correlations found, 3 above threshold.',
      'Applied graph-based propagation to find second-order correlations. Direct matches are obvious; graph catches latent connections.',
    ],
    surface_anomalies: [
      'Used rolling 7-day baseline per metric. Flagged deviations > 2σ. Rejected 3σ threshold — misses early-warning signals.',
      'Anomaly score penalized for known maintenance windows. Prevents false alerts during scheduled downtime.',
    ],
    prioritize_actions: [
      'Ranked by (severity × asset_value × time_sensitivity). Normalized across domains so Aegis and Terra actions are comparable.',
      "Deprioritized actions requiring > 2 approval hops — they won't close today regardless of urgency.",
    ],
    plan_agent_sequence: [
      'Analyzed intent graph to identify parallelizable steps. Aegis and Vessels runs have no data dependency — scheduled concurrently.',
      'Rejected sequential execution — would add 4.2s median latency per dependent step. Parallel saves ~12s on this plan.',
    ],
    stitch_outputs: [
      'Applied semantic deduplication across agent outputs. 3 overlapping risk items merged into one with combined evidence.',
      'Structured stitched output as BLUF + supporting detail per domain. Rejected flat list — execs skip to domain they own.',
    ],
    verify_completeness: [
      'Checked all required fields in output schema. 2 optional fields missing (vessel_flag, property_ownership_depth) — noted in metadata.',
      'Re-ran Pulse step because initial output confidence < 0.72 threshold. Second pass scored 0.84 — accepted.',
    ],
  };

  const now = Date.now();
  const entries: AuditEntry[] = [];

  for (let i = 0; i < 24; i++) {
    const agent = agents[i % agents.length];
    const action = agent.actions[i % agent.actions.length];
    const s = seed(`${agent.slug}-${action}-${i}`);
    const rpm = 60;
    const used = (s % 45) + 5;
    const tpm = 150000;
    const tUsed = (s % 80000) + 10000;
    const status: AuditEntry['status'] =
      i % 9 === 0 ? 'error' : i % 7 === 0 ? 'skipped' : 'success';
    const dur = 180 + (s % 2800);
    const startedAt = new Date(now - (i * 3 * 60 * 1000 + (s % 60000))).toISOString();
    const completedAt = new Date(new Date(startedAt).getTime() + dur).toISOString();
    const reasoningArr = reasonings[action] ?? [
      'Chose this action based on current data availability and tenant configuration.',
    ];
    const reasoning = reasoningArr[s % reasoningArr.length];

    entries.push({
      id: `aud_${((s % 900000) + 100000).toString(36)}`,
      runId: `run_${((seed(`run-${i}`) % 900000) + 100000).toString(36)}`,
      agentSlug: agent.slug,
      agentName: agent.name,
      intent: EXAMPLE_INTENTS[i % EXAMPLE_INTENTS.length],
      action,
      endpoint: `/api/nexus/domain-agents/${agent.slug}/${action.replace(/_/g, '-')}`,
      status,
      durationMs: dur,
      reasoning,
      alternativesConsidered: ALTERNATIVES[action] ?? ['Direct API call', 'Cached lookup'],
      outputSummary:
        status === 'error'
          ? 'Agent returned 503 — upstream data feed timeout. Retried once; failed. Step skipped, downstream steps warned.'
          : status === 'skipped'
            ? 'Step skipped — prerequisite step returned insufficient data (confidence < threshold). Orchestrator logged and continued.'
            : (OUTPUT_SUMMARIES[action]?.[s % 2] ??
              'Completed successfully. Results passed to downstream stitching step.'),
      rateLimit: {
        agentSlug: agent.slug,
        requestsPerMinute: rpm,
        requestsUsedThisMinute: used,
        tokensPerMinute: tpm,
        tokensUsedThisMinute: tUsed,
      },
      startedAt,
      completedAt,
    });
  }

  return entries.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

const EXAMPLE_INTENTS = [
  "Summarize today's threat risk across Aegis and Vessels, then draft an executive brief in Pulse format.",
  'Pull the latest KPIs from SZL Holdings, Terra, and Vessels, and compile a cross-portfolio snapshot.',
  'Cross-reference Prism Counsel open matters against Aegis threat intel and flag any intersecting risk vectors.',
];

const ALTERNATIVES: Record<string, string[]> = {
  fetch_threat_feed: [
    'Poll NVD CVE API directly',
    'Use cached daily snapshot',
    'Aggregate all feeds without filtering',
  ],
  score_vulnerability: [
    'EPSS-only scoring',
    'CVSS base score without exposure weighting',
    'Manual analyst scoring',
  ],
  correlate_incidents: [
    'Fuzzy-only matching (rejected: too many false positives)',
    'Exact field match only (rejected: misses variants)',
    'ML clustering (rejected: no labeled data)',
  ],
  query_fleet_positions: [
    'Direct Baltic Exchange API',
    'Use 30-min cached snapshot',
    'Query only vessels with active voyage orders',
  ],
  assess_port_risk: [
    'OFAC check only',
    'Weather-only risk',
    'Full weighted composite including EU blocking statute',
  ],
  scan_distress_signals: [
    'Tax lien only',
    'All public records with equal weighting',
    'ML signal detection (rejected: insufficient training data for new ZIPs)',
  ],
  compile_executive_brief: [
    'Flat list of all signals',
    'Domain-separated sections without cross-domain ranking',
    '7-item limit (rejected: too long for exec read time)',
  ],
  plan_agent_sequence: [
    'Sequential execution (rejected: too slow)',
    'Fully parallel with no dependency graph (rejected: data hazards)',
    'Single super-agent call',
  ],
  stitch_outputs: [
    'Concatenate raw outputs',
    'Domain-separated without deduplication',
    'LLM-only synthesis (rejected: hallucination risk on numeric data)',
  ],
};

const OUTPUT_SUMMARIES: Record<string, [string, string]> = {
  fetch_threat_feed: [
    'Ingested 847 KEV entries, 12 new since last run. 3 match monitored CVE watchlist.',
    "Ingested 1,204 AbuseIPDB entries. 7 IPs match current tenant's egress allowlist — flagged for review.",
  ],
  score_vulnerability: [
    'Scored 43 CVEs. 2 rated Critical (CVSS ≥ 9.0 + internet-facing). 7 rated High. Remainder Medium or below.',
    'Re-scored 18 CVEs after exposure context update. 4 escalated from Medium to High.',
  ],
  correlate_incidents: [
    'Found 6 correlated incident clusters. Largest cluster: 4 incidents sharing source IP and MITRE T1059.',
    '3 new correlations surfaced. 1 cross-domain: Aegis threat actor IP matches Vessels port-call destination.',
  ],
  query_fleet_positions: [
    'Retrieved positions for 34 active vessels. 2 in high-risk zones per sanctions overlay.',
    '29 vessels reporting. 5 in port, 24 underway. Average speed 12.4 kn. 1 vessel overdue check-in.',
  ],
  assess_port_risk: [
    'Port risk assessed for 8 upcoming calls. 1 port flagged High (OFAC touch). 2 flagged Medium (weather).',
    'All 6 planned port calls cleared. No sanctions flags. Minor weather delay risk at Rotterdam (+18hrs).',
  ],
  compile_executive_brief: [
    'Brief compiled: 5 insights across Aegis (2), Terra (1), Vessels (1), Command (1). Delivery scheduled 06:45.',
    'Brief compiled: 4 insights. Top item: cross-domain correlation between Aegis threat actor and Vessels port call.',
  ],
  plan_agent_sequence: [
    'Planned 6-step sequence. Steps 1–2 parallelized (Aegis + Vessels). Step 3 gates on both. Est. total: 4.8s.',
    'Planned 4-step sequence. All steps sequential due to data dependency chain. Est. total: 3.2s.',
  ],
  stitch_outputs: [
    'Stitched 4 agent outputs. Deduplicated 2 overlapping risk items. Final output: BLUF + 5 domain findings.',
    'Stitched 3 agent outputs. 0 overlaps. Final output: 4 findings, confidence 0.87.',
  ],
};

function RateLimitBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = Math.round((used / total) * 100);
  const color = pct >= 95 ? '#ff4455' : pct >= 80 ? '#ffb700' : '#00ff88';
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-mono text-muted-foreground/50">{label}</span>
        <span className="text-[9px] font-mono" style={{ color }}>
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="h-1 rounded-full bg-nexus-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const color = APP_COLORS[entry.agentSlug] ?? '#8896aa';
  const statusColor =
    entry.status === 'success' ? '#00ff88' : entry.status === 'error' ? '#ff4455' : '#8896aa';

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        open
          ? 'border-[#a3e635]/30 bg-nexus-surface'
          : 'border-nexus bg-nexus-surface hover:border-nexus-cyan/20'
      }`}
    >
      <button
        className="w-full text-left flex items-center gap-3 px-4 py-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-mono font-bold shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {entry.agentSlug.slice(0, 3).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color }}>
              {entry.agentName}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50">·</span>
            <span className="text-[10px] font-mono text-muted-foreground/70">{entry.action}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{entry.intent}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[9px] font-mono text-muted-foreground/40">
            {entry.durationMs}ms
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ color: statusColor, backgroundColor: `${statusColor}15` }}
          >
            {entry.status}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/30">
            {new Date(entry.startedAt).toLocaleTimeString()}
          </span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-nexus">
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-nexus-bg rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="w-3 h-3 text-[#a3e635]" />
                <span className="text-[10px] font-semibold text-[#a3e635]">Reasoning</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{entry.reasoning}</p>
              {entry.alternativesConsidered.length > 0 && (
                <div className="mt-2">
                  <p className="text-[9px] font-mono text-muted-foreground/40 mb-1">
                    Alternatives rejected:
                  </p>
                  <ul className="space-y-0.5">
                    {entry.alternativesConsidered.map((alt, i) => (
                      <li
                        key={i}
                        className="text-[9px] text-muted-foreground/50 flex items-start gap-1"
                      >
                        <XCircle className="w-2.5 h-2.5 text-nexus-red/50 mt-0.5 shrink-0" />
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-nexus-bg rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3 h-3 text-nexus-cyan" />
                <span className="text-[10px] font-semibold text-nexus-cyan">Result</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {entry.outputSummary}
              </p>
              <div className="mt-3 text-[9px] font-mono text-muted-foreground/40 space-y-0.5">
                <div>
                  RUN ID: <span className="text-muted-foreground/60">{entry.runId}</span>
                </div>
                <div>
                  ENTRY: <span className="text-muted-foreground/60">{entry.id}</span>
                </div>
                <div>
                  ENDPOINT: <span className="text-muted-foreground/60">{entry.endpoint}</span>
                </div>
                <div>
                  STARTED:{' '}
                  <span className="text-muted-foreground/60">
                    {new Date(entry.startedAt).toISOString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-nexus-bg rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Gauge className="w-3 h-3 text-[#ffb700]" />
              <span className="text-[10px] font-semibold text-[#ffb700]">
                Agent Rate Limits at Execution
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <RateLimitBar
                used={entry.rateLimit.requestsUsedThisMinute}
                total={entry.rateLimit.requestsPerMinute}
                label="Requests / min"
              />
              <RateLimitBar
                used={entry.rateLimit.tokensUsedThisMinute}
                total={entry.rateLimit.tokensPerMinute}
                label="Tokens / min"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentRateLimitPanel({ entries }: { entries: AuditEntry[] }) {
  const latest = new Map<string, AuditEntry>();
  for (const e of entries) {
    if (!latest.has(e.agentSlug) || e.startedAt > latest.get(e.agentSlug)!.startedAt) {
      latest.set(e.agentSlug, e);
    }
  }
  const agents = Array.from(latest.values());

  return (
    <div className="bg-nexus-surface border border-[#a3e635]/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4 text-[#a3e635]" />
        <span className="text-xs font-semibold">Live Agent Rate Limits</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">
          current minute
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {agents.map((e) => {
          const color = APP_COLORS[e.agentSlug] ?? '#8896aa';
          const pct = Math.round(
            (e.rateLimit.requestsUsedThisMinute / e.rateLimit.requestsPerMinute) * 100,
          );
          const statusColor = pct >= 95 ? '#ff4455' : pct >= 80 ? '#ffb700' : '#00ff88';
          return (
            <div key={e.agentSlug} className="bg-nexus-bg rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded text-[8px] font-mono font-bold flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {e.agentSlug.slice(0, 3).toUpperCase()}
                </div>
                <span className="text-[10px] font-semibold truncate" style={{ color }}>
                  {e.agentName.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono ml-auto" style={{ color: statusColor }}>
                  {pct}%
                </span>
              </div>
              <RateLimitBar
                used={e.rateLimit.requestsUsedThisMinute}
                total={e.rateLimit.requestsPerMinute}
                label="RPM"
              />
              <div className="mt-1.5">
                <RateLimitBar
                  used={e.rateLimit.tokensUsedThisMinute}
                  total={e.rateLimit.tokensPerMinute}
                  label="TPM"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AuditTrail() {
  const [entries] = useState<AuditEntry[]>(() => generateAuditEntries());
  const [filterSlug, setFilterSlug] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const slugs = Array.from(new Set(entries.map((e) => e.agentSlug)));

  const filtered = entries.filter(
    (e) =>
      (filterSlug === 'all' || e.agentSlug === filterSlug) &&
      (filterStatus === 'all' || e.status === filterStatus),
  );

  const successCount = entries.filter((e) => e.status === 'success').length;
  const errorCount = entries.filter((e) => e.status === 'error').length;
  const skippedCount = entries.filter((e) => e.status === 'skipped').length;
  const avgDuration = Math.round(entries.reduce((s, e) => s + e.durationMs, 0) / entries.length);

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-[#a3e635]" />
          <div>
            <h1 className="text-lg font-semibold">Agent Audit Trail</h1>
            <p className="text-xs text-muted-foreground">
              Full immutable log of every agent action · Reasoning · Rate limits · Outcomes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Runs', value: entries.length, color: '#a3e635' },
            { label: 'Successful', value: successCount, color: '#00ff88' },
            { label: 'Errors', value: errorCount, color: '#ff4455' },
            { label: 'Avg Duration', value: `${avgDuration}ms`, color: '#ffb700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-nexus-surface border border-nexus rounded-xl p-4">
              <div className="text-[10px] font-mono text-muted-foreground/50 mb-1">
                {stat.label}
              </div>
              <div className="text-2xl font-semibold" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <AgentRateLimitPanel entries={entries} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-mono text-muted-foreground/50">Filter:</span>
          <select
            className="text-xs bg-nexus-surface border border-nexus rounded-lg px-2 py-1.5 text-muted-foreground focus:outline-none focus:border-[#a3e635]/30"
            value={filterSlug}
            onChange={(e) => setFilterSlug(e.target.value)}
          >
            <option value="all">All agents</option>
            {slugs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="text-xs bg-nexus-surface border border-nexus rounded-lg px-2 py-1.5 text-muted-foreground focus:outline-none focus:border-[#a3e635]/30"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="skipped">Skipped</option>
          </select>
          <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
            {filtered.length} entries
          </span>
        </div>

        <div className="space-y-2">
          {filtered.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground/40">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No entries match the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
