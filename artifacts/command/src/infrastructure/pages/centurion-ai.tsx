import { ClassificationBadge } from '@imp/components/classification-badge';
import { CENTURION_PROFILES, getAquilaColor, getAquilaLabel } from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

function MetricBar({
  label,
  value,
  max = 100,
  unit = '%',
  color,
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const autoColor = color || (pct < 60 ? '#4ade80' : pct < 80 ? '#facc15' : '#ef4444');
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className="font-mono text-[10px]" style={{ color: autoColor }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: autoColor }}
        />
      </div>
    </div>
  );
}

function FailureProbabilityGauge({ probability }: { probability: number }) {
  const pct = probability * 100;
  const color = pct < 2 ? '#4ade80' : pct < 5 ? '#facc15' : pct < 10 ? '#fb923c' : '#ef4444';
  const label = pct < 2 ? 'MINIMAL' : pct < 5 ? 'LOW' : pct < 10 ? 'MODERATE' : 'HIGH';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={2 * Math.PI * 15}
            strokeDashoffset={2 * Math.PI * 15 * (1 - pct / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[9px] font-bold" style={{ color }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div>
        <div className="font-mono text-[10px] font-bold" style={{ color }}>
          {label} RISK
        </div>
        <div className="text-[9px] text-slate-600">Failure probability</div>
      </div>
    </div>
  );
}

function ScalingRecommendation({
  rec,
}: {
  rec: { currentMin: number; currentMax: number; recommendedMin: number; recommendedMax: number };
}) {
  const hasChange = rec.currentMin !== rec.recommendedMin || rec.currentMax !== rec.recommendedMax;
  return (
    <div
      className="rounded p-3 border"
      style={{
        borderColor: hasChange ? 'rgba(201,162,39,0.25)' : 'rgba(255,255,255,0.05)',
        background: 'rgba(10,13,26,0.5)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-3 h-3" style={{ color: '#c9a227' }} />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          Scaling Recommendation
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center rounded p-2 bg-white/3">
          <div className="text-[10px] text-slate-500 mb-1">Current</div>
          <div className="font-mono text-xs text-slate-300">
            {rec.currentMin}–{rec.currentMax} replicas
          </div>
        </div>
        <div
          className="text-center rounded p-2"
          style={{
            background: hasChange ? 'rgba(201,162,39,0.06)' : 'rgba(255,255,255,0.02)',
            border: hasChange ? '1px solid rgba(201,162,39,0.2)' : 'none',
          }}
        >
          <div className="text-[10px] text-slate-500 mb-1">Recommended</div>
          <div className="font-mono text-xs" style={{ color: hasChange ? '#c9a227' : '#94a3b8' }}>
            {rec.recommendedMin}–{rec.recommendedMax} replicas
          </div>
        </div>
      </div>
    </div>
  );
}

function CenturionCard({ profile }: { profile: (typeof CENTURION_PROFILES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const color = getAquilaColor(profile.aquilaScore);

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/2 transition-all"
      >
        <div
          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-display text-lg font-bold"
          style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}
        >
          {profile.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm tracking-[0.12em] font-bold" style={{ color }}>
            {profile.name}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{profile.century}</div>
          <div className="text-[10px] text-slate-600">{profile.cohort}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold" style={{ color }}>
              {profile.aquilaScore}
            </span>
            <span className="text-[10px] text-slate-600">
              {getAquilaLabel(profile.aquilaScore)}
            </span>
          </div>
          <FailureProbabilityGauge probability={profile.failureProbability} />
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 ml-1" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          {/* Readiness report */}
          <div className="rounded p-3 bg-white/3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Battle Readiness Report
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{profile.readinessReport}</p>
          </div>

          {/* Recommendation */}
          <div
            className="rounded p-3 border"
            style={{ background: 'rgba(201,162,39,0.04)', borderColor: 'rgba(201,162,39,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5" style={{ color: '#c9a227' }} />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                AI Recommendation
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(226,215,180,0.8)' }}>
              {profile.recommendation}
            </p>
          </div>

          {/* Failure prediction */}
          <div className="rounded p-3 bg-white/3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Failure Prediction
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{profile.failurePrediction}</p>
          </div>

          {/* Metrics */}
          {profile.metrics && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                Live Metrics
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(profile.metrics).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    cpu: 'CPU Utilization',
                    memory: 'Memory Utilization',
                    replicaCount: 'Replica Count',
                    p95Latency: 'P95 Latency (ms)',
                    requestsPerSec: 'Requests/sec',
                    connectionPoolPct: 'Connection Pool',
                    backupAge: 'Backup Age (hrs)',
                    storagePct: 'Storage Used (%)',
                    hitRate: 'Cache Hit Rate',
                    evictedKeys: 'Evicted Keys',
                    connectedClients: 'Connected Clients',
                    activeApps: 'Active Apps',
                    avgLatency: 'Avg Latency (ms)',
                    cacheHitRate: 'CDN Cache Hit',
                    wafBlocks: 'WAF Blocks',
                    rateLimit: 'Rate Limit',
                    activeManagedRules: 'Active Rules',
                    sslDaysRemaining: 'SSL Validity',
                  };
                  const label = labels[key] || key;
                  const isPercent = [
                    'cpu',
                    'memory',
                    'connectionPoolPct',
                    'storagePct',
                    'hitRate',
                    'cacheHitRate',
                  ].includes(key);
                  return (
                    <MetricBar
                      key={key}
                      label={label}
                      value={val as number}
                      max={isPercent ? 100 : undefined}
                      unit={isPercent ? '%' : ''}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Scaling */}
          <ScalingRecommendation rec={profile.scalingRecommendation} />
        </div>
      )}
    </div>
  );
}

export default function CenturionAI() {
  const avgAquila = Math.round(
    CENTURION_PROFILES.reduce((a, p) => a + p.aquilaScore, 0) / CENTURION_PROFILES.length,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            AI Operations
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Autonomous AI agent profiles for each service cluster — readiness scoring, scaling
          recommendations, failure prediction
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Monitors', value: CENTURION_PROFILES.length, color: '#c9a227' },
          { label: 'Avg Health Score', value: avgAquila, color: getAquilaColor(avgAquila) },
          {
            label: 'Recommendations',
            value: CENTURION_PROFILES.filter((p) => p.recommendation.length > 0).length,
            color: '#facc15',
          },
          {
            label: 'Critical Alerts',
            value: CENTURION_PROFILES.filter((p) => p.failureProbability > 0.1).length,
            color: '#4ade80',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="imperial-card rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Centurion profiles */}
      <div className="space-y-3">
        {CENTURION_PROFILES.map((profile) => (
          <CenturionCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}
