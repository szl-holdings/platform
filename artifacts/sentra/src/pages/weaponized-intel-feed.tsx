import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Clock,
  Crosshair,
  DollarSign,
  Eye,
  Globe,
  Mail,
  Phone,
  Radio,
  Shield,
  Skull,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type APTCampaign = {
  id: string;
  name: string;
  alias: string[];
  nationState: string;
  status: 'active' | 'dormant' | 'emerging';
  targetSectors: string[];
  ttps: string[];
  lastActivity: string;
  description: string;
  confidence: number;
};

const APT_CAMPAIGNS: APTCampaign[] = [
  { id: 'apt-1', name: 'BRICKSTORM', alias: ['UNC5221', 'Volt Typhoon'], nationState: 'China', status: 'active', targetSectors: ['Critical Infrastructure', 'Government', 'Telecom'], ttps: ['T1190', 'T1059.001', 'T1071.001', 'T1548'], lastActivity: '2h ago', description: 'Active exploitation of Ivanti VPN zero-days with living-off-the-land persistence targeting US critical infrastructure', confidence: 97 },
  { id: 'apt-2', name: 'Contagious Interview', alias: ['Famous Chollima', 'DPRK IT Workers'], nationState: 'North Korea', status: 'active', targetSectors: ['Technology', 'Crypto', 'DeFi'], ttps: ['T1566.001', 'T1204.002', 'T1059.007'], lastActivity: '6h ago', description: 'Social engineering campaign targeting developers via fake job interviews, deploying BeaverTail and InvisibleFerret malware', confidence: 94 },
  { id: 'apt-3', name: 'Wagemole', alias: ['DPRK Freelancers'], nationState: 'North Korea', status: 'active', targetSectors: ['Technology', 'Fortune 500'], ttps: ['T1078', 'T1530', 'T1567'], lastActivity: '1d ago', description: 'North Korean IT workers infiltrating US companies as remote contractors, exfiltrating source code and cryptocurrency', confidence: 91 },
  { id: 'apt-4', name: 'Midnight Blizzard', alias: ['APT29', 'Cozy Bear'], nationState: 'Russia', status: 'active', targetSectors: ['Government', 'Diplomatic', 'Cloud'], ttps: ['T1195.002', 'T1078.004', 'T1550.001'], lastActivity: '4h ago', description: 'Ongoing campaign targeting Microsoft 365 tenants via OAuth application abuse and token theft', confidence: 96 },
  { id: 'apt-5', name: 'Scattered Spider', alias: ['UNC3944', 'Octo Tempest'], nationState: 'Multinational', status: 'active', targetSectors: ['Telecom', 'Hospitality', 'Finance'], ttps: ['T1566.004', 'T1621', 'T1078'], lastActivity: '12h ago', description: 'Sophisticated social engineering group using SIM swapping, MFA fatigue, and help desk manipulation', confidence: 93 },
];

type RansomwareTrend = {
  id: string;
  group: string;
  medianDemand: number;
  avgPayment: number;
  victims30d: number;
  trend: 'up' | 'down' | 'stable';
  sector: string;
};

const RANSOMWARE_TRENDS: RansomwareTrend[] = [
  { id: 'rw-1', group: 'LockBit 4.0', medianDemand: 2_500_000, avgPayment: 1_800_000, victims30d: 47, trend: 'up', sector: 'Healthcare' },
  { id: 'rw-2', group: 'ALPHV/BlackCat', medianDemand: 1_500_000, avgPayment: 1_200_000, victims30d: 31, trend: 'stable', sector: 'Finance' },
  { id: 'rw-3', group: 'Cl0p', medianDemand: 3_000_000, avgPayment: 2_100_000, victims30d: 23, trend: 'down', sector: 'Technology' },
  { id: 'rw-4', group: 'Play', medianDemand: 800_000, avgPayment: 450_000, victims30d: 38, trend: 'up', sector: 'Manufacturing' },
  { id: 'rw-5', group: 'Akira', medianDemand: 1_200_000, avgPayment: 700_000, victims30d: 19, trend: 'up', sector: 'Education' },
];

type SocialEngineeringDetection = {
  id: string;
  type: 'phishing' | 'vishing' | 'deepfake' | 'sms_phishing';
  method: string;
  detected: number;
  blocked: number;
  aiGenerated: boolean;
  description: string;
};

const SE_DETECTIONS: SocialEngineeringDetection[] = [
  { id: 'se-1', type: 'phishing', method: 'LLM-Generated Spear Phish', detected: 847, blocked: 841, aiGenerated: true, description: 'GPT-generated emails mimicking executive writing style with contextual urgency — 99.3% block rate' },
  { id: 'se-2', type: 'vishing', method: 'AI Voice Clone Attack', detected: 23, blocked: 19, aiGenerated: true, description: 'Real-time voice cloning targeting CFO/CEO for wire transfer authorization — detected via voice watermark analysis' },
  { id: 'se-3', type: 'deepfake', method: 'Video Deepfake Impersonation', detected: 7, blocked: 7, aiGenerated: true, description: 'Deepfake video calls impersonating executives during Zoom meetings for BEC fraud' },
  { id: 'se-4', type: 'sms_phishing', method: 'AI-Personalized SMS Campaign', detected: 2_341, blocked: 2_298, aiGenerated: true, description: 'Contextually personalized smishing using scraped social media data and AI text generation' },
  { id: 'se-5', type: 'phishing', method: 'Adversarial QR Code Phishing', detected: 156, blocked: 148, aiGenerated: false, description: 'QR codes in physical mail and office spaces redirecting to credential harvesting pages' },
];

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
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

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
          { label: 'Active APT Campaigns', value: APT_CAMPAIGNS.filter(c => c.status === 'active').length.toString(), sub: `${APT_CAMPAIGNS.length} total tracked`, color: '#f5f5f5', icon: Crosshair },
          { label: 'Median Ransom Demand', value: '$1.5M', sub: 'up 47% YoY', color: '#c9b787', icon: DollarSign },
          { label: 'AI Phishing Detected', value: SE_DETECTIONS.reduce((s, d) => s + d.detected, 0).toLocaleString(), sub: '99.1% blocked', color: '#c9b787', icon: Mail },
          { label: 'Deepfake Attacks (30d)', value: '7', sub: '100% detected and blocked', color: '#8a8a8a', icon: Eye },
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
          {APT_CAMPAIGNS.map((campaign) => {
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
            {RANSOMWARE_TRENDS.map((rw) => (
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
            {SE_DETECTIONS.map((det) => {
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
