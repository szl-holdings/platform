import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AnimatedCounter } from '@szl-holdings/shared-ui/animated-counter';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@szl-holdings/shared-ui/ui/select';
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Crosshair,
  FileText,
  Globe,
  MapPin,
  Radio,
  Search,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const threatTypeIcons: Record<string, string> = {
  malware: 'M',
  ransomware: 'R',
  phishing: 'P',
  ddos: 'D',
  apt: 'A',
  vulnerability: 'V',
  insider: 'I',
  supply_chain: 'S',
};

function ThreatMapCanvas({ threats }: { threats: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j < h; j += 30) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    const toX = (lon: number) => ((lon + 180) / 360) * w;
    const toY = (lat: number) => ((90 - lat) / 180) * h;

    threats.forEach((t, i) => {
      const x = toX(t.lon);
      const y = toY(t.lat);
      const isCritical = t.severity === 'critical';
      const color = isCritical
        ? 'rgba(239, 68, 68, 0.8)'
        : t.severity === 'high'
          ? 'rgba(249, 115, 22, 0.7)'
          : 'rgba(234, 179, 8, 0.6)';

      ctx.beginPath();
      ctx.arc(x, y, isCritical ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, isCritical ? 25 : 15);
      gradient.addColorStop(
        0,
        color.replace('0.8', '0.3').replace('0.7', '0.2').replace('0.6', '0.15'),
      );
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, isCritical ? 25 : 15, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    let frame = 0;
    const animationId = setInterval(() => {
      frame++;
      threats.forEach((t) => {
        if (t.severity !== 'critical') return;
        const x = toX(t.lon);
        const y = toY(t.lat);
        const radius = 8 + (frame % 30) * 0.8;
        const opacity = 0.4 - (frame % 30) * 0.013;
        if (opacity <= 0) return;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }, 100);

    return () => clearInterval(animationId);
  }, [threats]);

  return <canvas ref={canvasRef} className="w-full h-full rounded-lg" style={{ minHeight: 300 }} />;
}

export default function ThreatIntelligence() {
  const { data: threats = [] } = useStandardQuery({
    queryKey: ['intel-threats'],
    queryFn: () => apiFetch<any[]>('/intelligence/threats'),
    refetchInterval: 30000,
  });
  const { data: cves = [] } = useStandardQuery({
    queryKey: ['intel-cves'],
    queryFn: () => apiFetch<any[]>('/aegis/cves'),
    refetchInterval: 60000,
  });
  const { data: geoEvents = [] } = useStandardQuery({
    queryKey: ['intel-geo'],
    queryFn: () => apiFetch<any[]>('/intelligence/geopolitical'),
    refetchInterval: 60000,
  });
  const { data: briefing } = useStandardQuery({
    queryKey: ['intel-briefing'],
    queryFn: () =>
      apiFetch<any>('/intelligence/ai/threat-briefing', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    refetchInterval: 300000,
    retry: 1,
  });

  const [cveFilter, setCveFilter] = useState('');
  const [cveSeverity, setCveSeverity] = useState('all');

  const filteredCves = cves.filter((c: any) => {
    const matchesSearch =
      !cveFilter ||
      c.id.toLowerCase().includes(cveFilter.toLowerCase()) ||
      c.description.toLowerCase().includes(cveFilter.toLowerCase());
    const matchesSeverity = cveSeverity === 'all' || c.severity === cveSeverity;
    return matchesSearch && matchesSeverity;
  });

  const criticalThreats = threats.filter((t: any) => t.severity === 'critical').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Threat Intelligence Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            APT tracking, CVE intelligence, and geopolitical cyber risk indicators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse"
          >
            <Radio className="w-3 h-3 mr-1" /> Live Feed
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Active Threats
                </p>
                <p className="text-2xl font-bold font-display mt-1 text-red-400">
                  <AnimatedCounter value={threats.length} />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-orange-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
                <p className="text-2xl font-bold font-display mt-1 text-orange-400">
                  <AnimatedCounter value={criticalThreats} />
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${criticalThreats > 0 ? 'animate-pulse' : ''}`}
              >
                <Crosshair className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  CVE Advisories
                </p>
                <p className="text-2xl font-bold font-display mt-1">
                  <AnimatedCounter value={cves.length} />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Geo Events</p>
                <p className="text-2xl font-bold font-display mt-1">
                  <AnimatedCounter value={geoEvents.length} />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Global Cyber Threat Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative" style={{ minHeight: 300 }}>
              <ThreatMapCanvas threats={threats} />
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg p-2 border border-border">
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> High
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-purple-400" /> AI Threat Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {briefing ? (
              <>
                <div className="bg-purple-500/5 rounded-lg p-3 border border-purple-500/10">
                  <p className="text-xs text-purple-400 font-medium mb-1">Executive Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {briefing.analysis?.summary?.summary || 'Generating analysis...'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sentiment Analysis</p>
                  <Badge
                    variant="outline"
                    className={
                      briefing.analysis?.sentiment?.label === 'NEGATIVE'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }
                  >
                    {briefing.analysis?.sentiment?.label} (
                    {((briefing.analysis?.sentiment?.score || 0) * 100).toFixed(0)}%)
                  </Badge>
                </div>
                {briefing.analysis?.entities?.entities && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Key Entities Detected</p>
                    <div className="flex flex-wrap gap-1">
                      {briefing.analysis.entities.entities.slice(0, 8).map((e: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {e.word} <span className="text-muted-foreground ml-1">({e.entity})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/50">
                  Generated {new Date(briefing.generatedAt).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-amber-400" /> Live CVE Feed
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                NVD
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search CVEs..."
                  value={cveFilter}
                  onChange={(e) => setCveFilter(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={cveSeverity} onValueChange={setCveSeverity}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredCves.map((cve: any) => (
                <div
                  key={cve.id}
                  className="p-3 rounded-lg bg-background/50 border border-border hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-semibold text-primary group-hover:text-primary/80">
                      {cve.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${severityColors[cve.severity] || ''}`}
                      >
                        {cve.severity}
                      </Badge>
                      <span className="text-xs font-bold text-red-400">{cve.score}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{cve.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60">
                    <span>{cve.vendor}</span>
                    <span>{cve.product}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{' '}
                      {new Date(cve.published).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-blue-400" /> Geopolitical Threat Ticker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {geoEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-background/50 border border-border hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${severityColors[event.severity] || ''}`}
                    >
                      {event.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {event.region}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mt-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.impact}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> {event.source}
                    </span>
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-6">
        <CardHeader className="pb-2">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-amber-400" /> Active Threat Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {threats.map((threat: any) => (
              <div
                key={threat.id}
                className={`p-3 rounded-lg border transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${threat.severity === 'critical' ? 'border-red-500/20 bg-red-500/5 hover:shadow-red-500/5' : 'border-border bg-background/50 hover:shadow-primary/5'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}
                  >
                    {threatTypeIcons[threat.type] || '?'}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${severityColors[threat.severity] || ''}`}
                  >
                    {threat.severity === 'critical' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1 animate-pulse" />
                    )}
                    {threat.severity}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold font-display">{threat.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {threat.description}
                </p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {threat.country}
                  </span>
                  <span>{threat.indicators} IoCs</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
