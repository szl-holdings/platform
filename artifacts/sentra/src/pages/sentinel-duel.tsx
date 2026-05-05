import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle,
  ChevronRight,
  Cpu,
  Play,
  RefreshCw,
  Shield,
  Swords,
  Target,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  type DuelSession,
  engageSentinel,
  listDuelSessions,
} from '@/lib/sentra-api';

const PROFILE_COLORS: Record<string, string> = {
  human: 'text-emerald-400',
  scripted_automation: 'text-amber-400',
  llm_agent: 'text-red-400',
  unknown: 'text-slate-400',
};

const PROFILE_LABELS: Record<string, string> = {
  human: 'Human',
  scripted_automation: 'Scripted Automation',
  llm_agent: 'LLM Agent',
  unknown: 'Unknown',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  resolved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  escaped: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-red-500' : value >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-white/60 w-8 text-right">{value}%</span>
    </div>
  );
}

function SessionCard({ session }: { session: DuelSession }) {
  const last5 = session.timeline.slice(-5).reverse();
  return (
    <Card className="bg-[#1a1f2e] border border-white/10 hover:border-[#c9b787]/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#c9b787]" />
            <CardTitle className="text-sm font-mono text-white/90">{session.sessionKey}</CardTitle>
          </div>
          <Badge className={`text-xs ${STATUS_COLORS[session.status] ?? 'bg-white/10 text-white/60'}`}>
            {session.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs font-medium ${PROFILE_COLORS[session.attackerProfile] ?? 'text-white/60'}`}>
            {PROFILE_LABELS[session.attackerProfile] ?? session.attackerProfile}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-xs text-white/50">{session.counterMoveCount} counter-moves</span>
        </div>
        <ConfidenceBar value={session.attackerConfidence} />
      </CardHeader>
      <CardContent>
        {session.currentStrategy && (
          <div className="mb-3 flex items-center gap-2 px-2 py-1.5 rounded bg-[#c9b787]/10 border border-[#c9b787]/20">
            <Zap className="w-3 h-3 text-[#c9b787]" />
            <span className="text-xs text-[#c9b787]">Strategy: {session.currentStrategy.replace(/_/g, ' ')}</span>
          </div>
        )}
        <div className="space-y-1.5">
          {last5.map((evt, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {evt.actor === 'sentinel' ? (
                <Shield className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <Target className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={evt.actor === 'sentinel' ? 'text-emerald-400' : 'text-red-400'}>
                  {evt.actor === 'sentinel' ? 'Sentinel' : 'Attacker'}
                </span>
                <span className="text-white/40 mx-1">·</span>
                <span className="text-white/70">{evt.detail}</span>
              </div>
              <span className="text-white/30 flex-shrink-0">
                {new Date(evt.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
          {last5.length === 0 && (
            <p className="text-xs text-white/30 italic">No activity yet</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {Object.entries(session.policyEstimate)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([move, count]) => (
              <span key={move} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
                {move.replace(/_/g, ' ')} ×{count}
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SentinelDuelPage() {
  const [sessions, setSessions] = useState<DuelSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [engaging, setEngaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEngageResult, setLastEngageResult] = useState<{ session: DuelSession; counterMove: Record<string, unknown> | null } | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await listDuelSessions();
      setSessions(data.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load duel sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 8000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleEngageSimulation = async () => {
    setEngaging(true);
    try {
      const sessionKey = `sim-${Math.random().toString(36).slice(2, 10)}`;
      const result = await engageSentinel({
        sessionKey,
        sourceIp: '10.0.0.200',
        path: '/api/sentra/incidents',
        requestsPerMinute: 300 + Math.floor(Math.random() * 200),
        hasReasoningTraceMarkers: Math.random() > 0.5,
        timingRegularity: 0.85 + Math.random() * 0.15,
      });
      setLastEngageResult(result);
      await fetchSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Engagement failed');
    } finally {
      setEngaging(false);
    }
  };

  const total = sessions.length;
  const byProfile = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.attackerProfile] = (acc[s.attackerProfile] ?? 0) + 1;
    return acc;
  }, {});
  const totalMoves = sessions.reduce((sum, s) => sum + s.counterMoveCount, 0);

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#c9b787]" />
            Sentinel Duel — Active Defense
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            Real-time defender-vs-adversary engagement tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            className="border-white/20 text-white/70 hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleEngageSimulation}
            disabled={engaging}
            className="bg-[#c9b787] text-black hover:bg-[#d4c79a]"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            {engaging ? 'Engaging…' : 'Simulate Attacker'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Sessions', value: total, icon: Activity, color: 'text-emerald-400' },
          { label: 'Counter-Moves', value: totalMoves, icon: Zap, color: 'text-[#c9b787]' },
          { label: 'LLM Agents', value: byProfile.llm_agent ?? 0, icon: Bot, color: 'text-red-400' },
          { label: 'Automation', value: byProfile.scripted_automation ?? 0, icon: Cpu, color: 'text-amber-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-[#1a1f2e] border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lastEngageResult && (
        <Card className="bg-[#1a1f2e] border border-[#c9b787]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#c9b787] flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Latest Engagement Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/50">Profile:</span>
              <span className={`font-medium ${PROFILE_COLORS[lastEngageResult.session.attackerProfile] ?? 'text-white'}`}>
                {PROFILE_LABELS[lastEngageResult.session.attackerProfile] ?? lastEngageResult.session.attackerProfile}
              </span>
              <span className="text-white/50">Confidence:</span>
              <span className="font-mono text-white">{lastEngageResult.session.attackerConfidence}%</span>
            </div>
            {lastEngageResult.counterMove && (
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-3.5 h-3.5 text-[#c9b787]" />
                <span className="text-white/50">Counter-move:</span>
                <span className="text-[#c9b787] font-medium">
                  {String(lastEngageResult.counterMove.type ?? '').replace(/_/g, ' ')}
                </span>
                {lastEngageResult.counterMove.approved ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400" />
                )}
              </div>
            )}
            {!lastEngageResult.counterMove && (
              <p className="text-xs text-white/40 italic">No counter-move (profile classified as human or confidence too low)</p>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-medium text-white/70 mb-3">Active Duel Sessions</h2>
        {loading && sessions.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="bg-[#1a1f2e] border border-white/10">
            <CardContent className="py-12 text-center">
              <Shield className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">No active duel sessions</p>
              <p className="text-white/30 text-xs mt-1">Click "Simulate Attacker" to trigger a Sentinel engagement</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
