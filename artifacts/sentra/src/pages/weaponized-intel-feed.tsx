import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  Bot,
  Clock,
  Crosshair,
  DollarSign,
  Eye,
  Loader2,
  Mail,
  Phone,
  Radio,
  Skull,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type WeaponizedIntelResponse,
  getWeaponizedIntelPage,
} from '../lib/sentra-api';

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const SE_TYPE_ICONS: Record<string, typeof Mail> = {
  phishing: Mail,
  vishing: Phone,
  deepfake: Eye,
  sms_phishing: Activity,
};

const SE_TYPE_COLORS: Record<string, string> = {
  phishing: '#c9b787',
  vishing: '#f5f5f5',
  deepfake: '#f5f5f5',
  sms_phishing: '#c9b787',
};

export default function WeaponizedIntelFeed() {
  const [data, setData] = useState<WeaponizedIntelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getWeaponizedIntelPage()
      .then((res) => {
        if (!active) return;
        if (!res) {
          setError('Unable to load Weaponized Intel data.');
        } else {
          setData(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading Weaponized Intel feed…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#f5f5f5]/30 bg-[#f5f5f5]/5 p-4 text-xs text-[#f5f5f5]">
          {error ?? 'Weaponized Intel feed unavailable.'}
        </div>
      </div>
    );
  }

  const { aptCampaigns, ransomwareTrends, socialEngineeringDetections, metrics } = data;
  const totalSeDetected = socialEngineeringDetections.reduce((s, d) => s + d.detected, 0);
  const totalSeBlocked = socialEngineeringDetections.reduce((s, d) => s + d.blocked, 0);
  const seBlockRate = totalSeDetected > 0 ? ((totalSeBlocked / totalSeDetected) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-[#f5f5f5]" />
            <h1 className="text-lg font-semibold text-white">Weaponized Intelligence Feed</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#f5f5f5]/30 bg-[#f5f5f5]/10 text-[#f5f5f5] font-mono uppercase animate-pulse">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Nation-state APT campaigns, ransomware demand tracking, AI-accelerated social engineering detection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active APT Campaigns', value: aptCampaigns.filter(c => c.status === 'active').length.toString(), sub: `${aptCampaigns.length} total tracked`, color: '#f5f5f5', icon: Crosshair },
          { label: 'Median Ransom Demand', value: metrics.medianRansomDemand, sub: metrics.medianRansomYoyChange, color: '#c9b787', icon: DollarSign },
          { label: 'AI Phishing Detected', value: totalSeDetected.toLocaleString(), sub: `${seBlockRate}% blocked`, color: '#c9b787', icon: Mail },
          { label: 'Deepfake Attacks (30d)', value: metrics.deepfakeAttacks30d.toString(), sub: metrics.deepfakeBlockRate, color: '#8a8a8a', icon: Eye },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-[#f5f5f5]" />
          Nation-State APT Campaign Tracker
        </h2>
        <div className="space-y-2">
          {aptCampaigns.map((campaign) => {
            const isSelected = selectedCampaign === campaign.id;
            return (
              <button key={campaign.id} onClick={() => setSelectedCampaign(isSelected ? null : campaign.id)} className={cn(
                'w-full rounded-xl border p-4 text-left transition-all',
                isSelected ? 'border-[#f5f5f5]/30 bg-[#f5f5f5]/5' : 'border-white/8 bg-white/3 hover:bg-white/5',
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{campaign.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20 font-mono">{campaign.nationState}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      campaign.status === 'active' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10 animate-pulse' : 'text-zinc-400 border-zinc-700 bg-zinc-800/50',
                    )}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-white">{campaign.confidence}%</span>
                    <span className="text-[9px] text-zinc-500 block">confidence</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mb-2">{campaign.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {campaign.lastActivity}</span>
                  {campaign.alias.map((a) => (
                    <span key={a} className="text-[9px] text-zinc-500">({a})</span>
                  ))}
                </div>
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-white/8">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[10px] text-zinc-500">Target Sectors:</span>
                      {campaign.targetSectors.map((s) => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">TTPs:</span>
                      {campaign.ttps.map((t) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Skull className="w-3.5 h-3.5 text-[#c9b787]" />
            Ransomware Demand Trends
          </h2>
          <div className="space-y-2">
            {ransomwareTrends.map((rw) => (
              <div key={rw.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white">{rw.group}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      rw.trend === 'up' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' :
                      rw.trend === 'down' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                      'text-zinc-400 border-zinc-700 bg-zinc-800/50',
                    )}>
                      {rw.trend === 'up' ? '↑ Rising' : rw.trend === 'down' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{rw.sector}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-sm font-bold text-[#c9b787] font-mono">{fmtUsd(rw.medianDemand)}</span>
                    <span className="text-[9px] text-zinc-500 block">Median Demand</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#c9b787] font-mono">{fmtUsd(rw.avgPayment)}</span>
                    <span className="text-[9px] text-zinc-500 block">Avg Payment</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white font-mono">{rw.victims30d}</span>
                    <span className="text-[9px] text-zinc-500 block">Victims (30d)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#c9b787]" />
            AI-Accelerated Social Engineering Detection
          </h2>
          <div className="space-y-2">
            {socialEngineeringDetections.map((det) => {
              const Icon = SE_TYPE_ICONS[det.type] ?? Activity;
              return (
                <div key={det.id} className={cn(
                  'rounded-xl border p-3',
                  det.aiGenerated ? 'border-[#c9b787]/20 bg-white/3' : 'border-white/8 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: SE_TYPE_COLORS[det.type] }} />
                      <span className="text-[11px] font-medium text-white">{det.method}</span>
                      {det.aiGenerated && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded border text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10">AI-Generated</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mb-1.5">{det.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{det.detected.toLocaleString()} detected</span>
                    <span className="text-[#c9b787]">{det.blocked.toLocaleString()} blocked</span>
                    <span className="font-mono">{det.detected > 0 ? ((det.blocked / det.detected) * 100).toFixed(1) : 0}% block rate</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
