import { MicroFeedbackWidget } from '@szl-holdings/shared-ui/micro-feedback-widget';
import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BellPlus,
  CheckCircle2,
  Clock,
  EyeOff,
  Filter,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Ship,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';

const darkVessels = [
  {
    id: 'DV-001',
    name: 'PACIFIC MERIDIAN',
    imo: '9821045',
    flag: 'Unknown',
    lat: 25.4,
    lon: 56.2,
    lastAIS: '14h ago',
    gapDuration: '14h 22m',
    suspicionScore: 94,
    reason: 'AIS disabled near Iran — sanctions zone transit',
    priorCalls: ['Bandar Abbas', 'Jebel Ali'],
    ownerChain: 'Obscured via 3 shell co.',
    status: 'Critical',
  },
  {
    id: 'DV-002',
    name: 'CASPIAN PIONEER',
    imo: '9654321',
    flag: 'Comoros',
    lat: 37.8,
    lon: 23.1,
    lastAIS: '9h ago',
    gapDuration: '9h 11m',
    suspicionScore: 81,
    reason: 'Repeated AIS gaps in Black Sea during wartime period',
    priorCalls: ['Novorossiysk', 'Batumi'],
    ownerChain: 'Seagate Maritime Ltd.',
    status: 'High',
  },
  {
    id: 'DV-003',
    name: 'FAR EASTERN PROGRESS',
    imo: '9112233',
    flag: 'Palau',
    lat: 3.1,
    lon: 103.4,
    lastAIS: '6h ago',
    gapDuration: '6h 55m',
    suspicionScore: 73,
    reason: 'AIS gap in South China Sea STS transfer zone',
    priorCalls: ['Zhoushan', 'Busan'],
    ownerChain: 'Pacific Ventures Pte.',
    status: 'Medium',
  },
  {
    id: 'DV-004',
    name: 'GULF VOYAGER',
    imo: '9987654',
    flag: 'Tanzania',
    lat: 12.7,
    lon: 44.9,
    lastAIS: '3h ago',
    gapDuration: '3h 40m',
    suspicionScore: 67,
    reason: 'AIS off near Yemen conflict zone',
    priorCalls: ['Hudaydah', 'Aden'],
    ownerChain: 'Red Sea Maritime LLC',
    status: 'Medium',
  },
  {
    id: 'DV-005',
    name: 'ATLANTIC HARVESTER',
    imo: '9445566',
    flag: 'Cameroon',
    lat: -1.3,
    lon: 8.7,
    lastAIS: '21h ago',
    gapDuration: '21h 05m',
    suspicionScore: 88,
    reason: 'Extended AIS blackout in Gulf of Guinea — piracy corridor',
    priorCalls: ['Lomé', 'Abidjan'],
    ownerChain: 'Atlantic Ridge Corp.',
    status: 'High',
  },
];

const shipToShipAlerts = [
  {
    id: 'STS-001',
    vessels: ['PACIFIC MERIDIAN', 'KAZAN SPIRIT'],
    location: 'Persian Gulf — 26.1°N 55.8°E',
    timestamp: '2h ago',
    cargo: 'Crude Oil (suspected)',
    confidence: 96,
    sanctionsLink: true,
  },
  {
    id: 'STS-002',
    vessels: ['ATLANTIC HARVESTER', 'CALABAR EXPRESS'],
    location: 'Gulf of Guinea — 1.2°N 8.4°E',
    timestamp: '6h ago',
    cargo: 'Unknown',
    confidence: 82,
    sanctionsLink: false,
  },
  {
    id: 'STS-003',
    vessels: ['FAR EASTERN PROGRESS', 'PACIFIC DAWN'],
    location: 'Malacca Strait — 3.4°N 103.2°E',
    timestamp: '11h ago',
    cargo: 'Petrochemicals (suspected)',
    confidence: 74,
    sanctionsLink: false,
  },
];

const iuuAlerts = [
  {
    id: 'IUU-001',
    vessel: 'SOUTHERN CROSS IV',
    area: 'Indian Ocean EEZ — Mozambique',
    type: 'Unlicensed Trawling',
    confidence: 89,
    reportedBy: 'Vessel Monitoring System',
  },
  {
    id: 'IUU-002',
    vessel: 'AZUL OCEANO',
    area: 'Pacific EEZ — Ecuador',
    type: 'Gear Type Mismatch',
    confidence: 76,
    reportedBy: 'Satellite AIS cross-ref',
  },
  {
    id: 'IUU-003',
    vessel: 'VIKING PEARL',
    area: 'Arctic Zone — Norwegian EEZ',
    type: 'Quota Violation Pattern',
    confidence: 71,
    reportedBy: 'Behavioral Analytics',
  },
];

const statusColors: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-red-500' : score >= 70 ? 'bg-orange-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-bold">{score}</span>
    </div>
  );
}

interface VesselAnalysis {
  loading: boolean;
  content: string;
  error?: string;
}

type RaiseState = 'idle' | 'raising' | 'raised';

function severityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export default function DarkVesselDetection() {
  const [activeTab, setActiveTab] = useState<'dark' | 'sts' | 'iuu'>('dark');
  const [search, setSearch] = useState('');
  const [vesselAnalyses, setVesselAnalyses] = useState<Record<string, VesselAnalysis>>({});
  const [raiseState, setRaiseState] = useState<Record<string, RaiseState>>({});
  const qc = useQueryClient();

  const raiseAlert = async (vessel: (typeof darkVessels)[0]) => {
    setRaiseState((p) => ({ ...p, [vessel.id]: 'raising' }));
    try {
      const fleetVessels = (await api.vessels.list()) as Array<{ id: number }>;
      const anchorVesselId = fleetVessels[0]?.id ?? null;
      if (!anchorVesselId) {
        toast.error(
          'No fleet vessel available to attribute alert. Add a vessel before raising dark-vessel alerts.',
        );
        setRaiseState((p) => ({ ...p, [vessel.id]: 'idle' }));
        return;
      }
      const severity = severityFromScore(vessel.suspicionScore);
      const message = [
        `Suspicion score ${vessel.suspicionScore}/100 — ${vessel.reason}.`,
        `AIS gap: ${vessel.gapDuration} (last fix ${vessel.lastAIS}).`,
        `Last known position: ${vessel.lat.toFixed(2)}°N ${vessel.lon.toFixed(2)}°E.`,
        `Prior port calls: ${vessel.priorCalls.join(' → ')}.`,
        `Owner chain: ${vessel.ownerChain}.`,
      ].join(' ');
      await api.alerts.create({
        vesselId: anchorVesselId,
        title: `Dark Vessel: ${vessel.name} (IMO ${vessel.imo})`,
        message,
        severity,
        status: 'active',
        metadata: {
          source: 'dark-vessel-detection',
          darkVesselId: vessel.id,
          imo: vessel.imo,
          flag: vessel.flag,
          suspicionScore: vessel.suspicionScore,
          gapDuration: vessel.gapDuration,
          lastAIS: vessel.lastAIS,
          lat: vessel.lat,
          lon: vessel.lon,
          priorCalls: vessel.priorCalls,
          ownerChain: vessel.ownerChain,
          behaviour: vessel.reason,
        },
      });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      setRaiseState((p) => ({ ...p, [vessel.id]: 'raised' }));
      toast.success(`Alert raised for ${vessel.name} — visible in Alert Center`);
    } catch (err) {
      setRaiseState((p) => ({ ...p, [vessel.id]: 'idle' }));
      toast.error(err instanceof Error ? err.message : 'Failed to raise alert');
    }
  };

  const analyzeVessel = async (vessel: (typeof darkVessels)[0]) => {
    setVesselAnalyses((prev) => ({ ...prev, [vessel.id]: { loading: true, content: '' } }));
    try {
      const res = await fetch('/api/intelligence/ai/dark-vessel-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vessel: `${vessel.name} (IMO: ${vessel.imo}, Flag: ${vessel.flag})`,
          aiGapHours: parseFloat(vessel.gapDuration),
          lastKnownPosition: `${vessel.lat.toFixed(1)}°N ${vessel.lon.toFixed(1)}°E`,
          behaviorPatterns: [
            vessel.reason,
            `Prior port calls: ${vessel.priorCalls.join(', ')}`,
            `Owner: ${vessel.ownerChain}`,
          ],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVesselAnalyses((prev) => ({
        ...prev,
        [vessel.id]: {
          loading: false,
          content: data.data?.analysis ?? data.analysis ?? 'No analysis returned',
        },
      }));
    } catch (err) {
      setVesselAnalyses((prev) => ({
        ...prev,
        [vessel.id]: {
          loading: false,
          content: '',
          error: err instanceof Error ? err.message : 'Analysis failed',
        },
      }));
    }
  };

  const filtered = darkVessels.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.imo.includes(search) ||
      v.flag.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            <EyeOff className="w-6 h-6 text-red-400" />
            Dark Vessel Detection
            <HelpTip
              tipId="vessels.dark-vessel-detection"
              platform="vessels"
              title="Dark Vessel Detection"
              content="Behavioral models flag vessels that have disabled AIS transponders, performed suspicious ship-to-ship transfers, or show IUU-fishing patterns. Each alert includes the inferred behavior class and supporting track evidence."
              accentColor="var(--gi-accent-blue)"
              iconSize={14}
            />
            <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/8 text-amber-400/80 tracking-wider">
              SIMULATED · Behavioral-model data
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AIS manipulation, ship-to-ship transfers, and IUU fishing alerts — powered by behavioral
            AI · vessel records are scenario-seeded for demonstration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh Feed
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <Filter className="w-3 h-3" /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Dark Vessels Active',
            value: '5',
            icon: EyeOff,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
          },
          {
            label: 'STS Transfer Alerts',
            value: '3',
            icon: Ship,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
          },
          {
            label: 'IUU Fishing Alerts',
            value: '3',
            icon: AlertTriangle,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Avg Gap Duration',
            value: '10h 54m',
            icon: Clock,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: 'dark', label: 'Dark Vessels', count: darkVessels.length },
            { key: 'sts', label: 'STS Transfers', count: shipToShipAlerts.length },
            { key: 'iuu', label: 'IUU Fishing', count: iuuAlerts.length },
          ] as { key: 'dark' | 'sts' | 'iuu'; label: string; count: number }[]
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}{' '}
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'dark' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vessel name, IMO, or flag..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-3">
            {filtered.map((vessel) => (
              <Card
                key={vessel.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <EyeOff className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{vessel.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            IMO {vessel.imo}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            🏳️ {vessel.flag}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${statusColors[vessel.status]}`}
                          >
                            {vessel.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{vessel.reason}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Radio className="w-3 h-3" /> Last AIS: {vessel.lastAIS}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Gap: {vessel.gapDuration}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {vessel.lat.toFixed(1)}°N{' '}
                            {vessel.lon.toFixed(1)}°E
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {vessel.priorCalls.map((p) => (
                            <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Owner chain: {vessel.ownerChain}
                        </p>
                        {vesselAnalyses[vessel.id] && !vesselAnalyses[vessel.id].loading && (
                          <div className="mt-3 bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-1.5 text-[10px] text-muted-foreground">
                              <Sparkles className="w-3 h-3 text-primary" /> Helmsman AI ·
                              claude-sonnet-4-6
                            </div>
                            {vesselAnalyses[vessel.id].error ? (
                              <p className="text-xs text-red-400">
                                {vesselAnalyses[vessel.id].error}
                              </p>
                            ) : (
                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {vesselAnalyses[vessel.id].content}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="w-28">
                        <p className="text-[10px] text-muted-foreground mb-1">Suspicion Score</p>
                        <ScoreBar score={vessel.suspicionScore} />
                      </div>
                      <button
                        onClick={() => analyzeVessel(vessel)}
                        disabled={vesselAnalyses[vessel.id]?.loading}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
                      >
                        {vesselAnalyses[vessel.id]?.loading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> AI Analysis
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => raiseAlert(vessel)}
                        disabled={
                          raiseState[vessel.id] === 'raising' || raiseState[vessel.id] === 'raised'
                        }
                        data-testid={`raise-alert-${vessel.id}`}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
                      >
                        {raiseState[vessel.id] === 'raising' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Raising...
                          </>
                        ) : raiseState[vessel.id] === 'raised' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Alert Raised
                          </>
                        ) : (
                          <>
                            <BellPlus className="w-3 h-3" /> Raise Alert
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sts' && (
        <div className="space-y-3">
          {shipToShipAlerts.map((alert) => (
            <Card key={alert.id} className={alert.sanctionsLink ? 'border-red-500/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Ship className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{alert.vessels.join(' ↔ ')}</span>
                        {alert.sanctionsLink && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20"
                          >
                            Sanctions Link
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.cargo}</p>
                      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p
                      className={`text-lg font-bold ${alert.confidence >= 90 ? 'text-red-400' : 'text-orange-400'}`}
                    >
                      {alert.confidence}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'iuu' && (
        <div className="space-y-3">
          {iuuAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{alert.vessel}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.area}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Source: {alert.reportedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-lg font-bold text-amber-400">{alert.confidence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <MicroFeedbackWidget
          featureId="vessels-dark-vessel-detection"
          featureName="Dark Vessel Detection Alerts"
          app="vessels"
          compact
          prompt="Were these AIS alerts useful?"
        />
      </div>
    </div>
  );
}
