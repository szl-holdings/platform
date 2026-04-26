import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AnomalySparkline,
  SeverityMeter,
  TypewriterText,
} from '@szl-holdings/shared-ui/ai-components';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { PageDataSkeleton } from '@szl-holdings/shared-ui/page-data-skeleton';
import {
  Activity,
  AlertTriangle,
  Brain,
  Crosshair,
  FileText,
  Loader2,
  Radio,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export default function ThreatIntelAI() {
  const { data: cves = [], isLoading: cvesLoading } = useStandardQuery({
    queryKey: ['threat-cves'],
    queryFn: () => apiFetch<any[]>('/intelligence/cves'),
  });
  const { data: threats = [], isLoading: threatsLoading } = useStandardQuery({
    queryKey: ['threat-data'],
    queryFn: () => apiFetch<any[]>('/intelligence/threats'),
  });
  const { data: anomalies = [], isLoading: anomaliesLoading } = useStandardQuery({
    queryKey: ['threat-anomalies'],
    queryFn: () => apiFetch<any[]>('/intelligence/anomalies'),
  });
  const isLoading = cvesLoading || threatsLoading || anomaliesLoading;

  const [briefingText, setBriefingText] = useState('');
  const [briefingDone, setBriefingDone] = useState(false);

  const generateBriefing = async () => {
    setBriefingText('');
    setBriefingDone(false);
    try {
      const result = await apiFetch<any>('/intelligence/ai/threat-briefing', { method: 'POST' });
      const summary = result.analysis?.summary?.summary || result.analysis?.summary || '';
      const threatNames = (result.threats || [])
        .map((t: any) => `${t.name} (${t.severity})`)
        .join(', ');
      setBriefingText(summary || `Active threats: ${threatNames}` || 'Briefing generated.');
    } catch {
      setBriefingText('Unable to generate briefing at this time.');
    }
    setBriefingDone(true);
  };

  const criticalCves = cves.filter((c: any) => c.severity === 'CRITICAL');
  const highCves = cves.filter((c: any) => c.severity === 'HIGH');

  if (isLoading) return <PageDataSkeleton rows={6} accentColor="#f5f5f5" />;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Crosshair className="w-7 h-7 text-[#f5f5f5]" /> AI Threat Command Wall
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Streaming intelligence briefings, CVE auto-classification, and attack surface analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{threats.length} active threats</span>
          <span className="inline-flex items-center gap-2 text-xs text-[#f5f5f5] bg-[#f5f5f5]/10 px-3 py-1.5 rounded-full border border-[#f5f5f5]/20">
            <Radio className="w-3 h-3 animate-pulse" /> DEFCON Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.03] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#8a8a8a]" /> AI Threat Briefing
            </h3>
            <button
              onClick={generateBriefing}
              className="text-xs px-4 py-2 rounded-lg bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 hover:bg-[#8a8a8a]/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-3 h-3" /> Generate Briefing
            </button>
          </div>
          <div className="bg-black/30 rounded-xl p-5 border border-white/5 min-h-[200px]">
            {briefingText ? (
              briefingDone ? (
                <TypewriterText
                  text={briefingText}
                  speed={15}
                  className="text-sm text-slate-300 leading-relaxed"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing threat landscape...
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-slate-500">
                <FileText className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">
                  Click "Generate Briefing" for an AI-analyzed threat report
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8a8a8a]" /> Anomaly Detection
          </h3>
          <div className="space-y-4">
            {anomalies.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">
                    {a.type || a.name || `Anomaly ${i + 1}`}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      a.severity === 'critical'
                        ? 'bg-[#f5f5f5]/10 text-[#f5f5f5]'
                        : a.severity === 'high'
                          ? 'bg-[#c9b787]/10 text-[#c9b787]'
                          : 'bg-[#c9b787]/10 text-[#c9b787]'
                    }`}
                  >
                    {a.severity}
                  </span>
                </div>
                <AnomalySparkline
                  data={Array.from({ length: 20 }, () => Math.random() * 100)}
                  anomalyIndices={[Math.floor(Math.random() * 10) + 10]}
                  width={200}
                  height={30}
                  color={a.severity === 'critical' ? '#f5f5f5' : '#c9b787'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#c9b787]" /> CVE Auto-Classification
        </h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-xl bg-[#f5f5f5]/5 border border-[#f5f5f5]/10">
            <div className="text-2xl font-bold text-[#f5f5f5]">{criticalCves.length}</div>
            <div className="text-xs text-slate-500">Critical</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#c9b787]/5 border border-[#c9b787]/10">
            <div className="text-2xl font-bold text-[#c9b787]">{highCves.length}</div>
            <div className="text-xs text-slate-500">High</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#c9b787]/5 border border-[#c9b787]/10">
            <div className="text-2xl font-bold text-[#c9b787]">
              {cves.filter((c: any) => c.severity === 'MEDIUM').length}
            </div>
            <div className="text-xs text-slate-500">Medium</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#c9b787]/5 border border-[#c9b787]/10">
            <div className="text-2xl font-bold text-[#c9b787]">
              {cves.filter((c: any) => c.severity === 'LOW').length}
            </div>
            <div className="text-xs text-slate-500">Low</div>
          </div>
        </div>
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {cves.slice(0, 8).map((cve: any, i: number) => (
            <SeverityMeter
              key={i}
              level={
                (cve.severity?.toLowerCase() || 'medium') as 'critical' | 'high' | 'medium' | 'low'
              }
              score={
                cve.severity === 'CRITICAL'
                  ? 95
                  : cve.severity === 'HIGH'
                    ? 75
                    : cve.severity === 'MEDIUM'
                      ? 50
                      : 25
              }
              label={cve.id || cve.cveId || `CVE-${i}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#c9b787]" /> Attack Surface Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'External Exposure', score: 42, detail: '12 public endpoints, 3 need review' },
            { name: 'Internal Threats', score: 28, detail: 'Low insider risk, monitoring active' },
            { name: 'Supply Chain Risk', score: 61, detail: '4 dependencies with known CVEs' },
          ].map((surface) => (
            <div key={surface.name} className="p-4 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">{surface.name}</span>
                <span
                  className={`text-xs font-mono font-bold ${surface.score >= 60 ? 'text-[#c9b787]' : surface.score >= 40 ? 'text-[#c9b787]' : 'text-[#c9b787]'}`}
                >
                  {surface.score}/100
                </span>
              </div>
              <SeverityMeter
                level={surface.score >= 60 ? 'high' : surface.score >= 40 ? 'medium' : 'low'}
                score={surface.score}
              />
              <p className="text-xs text-slate-500 mt-2">{surface.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
