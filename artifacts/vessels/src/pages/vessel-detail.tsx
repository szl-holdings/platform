import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useState } from 'react';
import { ActivityFeed, CommentThread } from '@szl-holdings/shared-ui/collaboration';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@szl-holdings/shared-ui/ui/tabs';
import { ArrowLeft, CheckCircle2, Clock, EyeOff, Loader2, MapPin, Navigation, Package, Ship, XCircle } from 'lucide-react';
import { Link, useRoute } from 'wouter';
import { api } from '@/lib/api';

interface RouteRecord {
  id: number;
  originPort?: string;
  destinationPort?: string;
  departureAt?: string;
  arrivalAt?: string;
  distanceNm?: number;
  status?: string;
  waypoints?: { name?: string }[];
}
interface CargoRecord {
  id: number;
  cargoType?: string;
  quantity?: number;
  unit?: string;
  origin?: string;
  destination?: string;
  status?: string;
}
interface PositionRecord {
  id: number;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  course?: number;
  recordedAt?: string;
  source?: string;
}
const statusColors: Record<string, string> = {
  at_sea: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_port: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  anchored: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  maintenance: 'bg-red-500/10 text-red-400 border-red-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  planned: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_transit: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  loading: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  delivered: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="skeleton h-8 w-16 rounded" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-3 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-10 w-96 rounded" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

interface StealthPortSnapshot {
  policy: 'allowed' | 'blocked';
  reason?: string;
  portName?: string;
  vesselQueue?: number;
  congestion?: string;
  nextDeparture?: string;
  berthsOccupied?: string;
  fetchedUrl: string;
  auditId: string;
  bytes?: number;
  fetchedAt: string;
}

export default function VesselDetailPage() {
  const [, params] = useRoute('/vessel/:id');
  const vesselId = Number(params?.id);
  const [stealthLoading, setStealthLoading] = useState(false);
  const [stealthSnapshot, setStealthSnapshot] = useState<StealthPortSnapshot | null>(null);
  const [stealthOpen, setStealthOpen] = useState(false);

  const { data: vessel, isLoading } = useStandardQuery<any>({
    queryKey: ['vessel', vesselId],
    queryFn: () => api.vessels.get(vesselId),
    enabled: !!vesselId,
  });
  const { data: positions = [] } = useStandardQuery<PositionRecord[]>({
    queryKey: ['positions', vesselId],
    queryFn: () => api.vessels.positions(vesselId) as any,
    enabled: !!vesselId,
  });
  const { data: cargo = [] } = useStandardQuery<CargoRecord[]>({
    queryKey: ['cargo', vesselId],
    queryFn: () => api.vessels.cargo(vesselId) as any,
    enabled: !!vesselId,
  });
  const { data: routes = [] } = useStandardQuery<RouteRecord[]>({
    queryKey: ['vesselRoutes', vesselId],
    queryFn: () => api.vessels.routes(vesselId) as any,
    enabled: !!vesselId,
  });

  async function fetchPortSnapshot() {
    if (!vessel) return;
    setStealthLoading(true);
    setStealthOpen(true);
    const targetUrl = 'https://portofrotterdam.com/en/shipping/vessels';
    try {
      type StealthInvokeResponse = {
        ok: boolean;
        policyDecision: string;
        policyNote?: string;
        reason?: string;
        auditId?: string;
        requestHash?: string;
        bytes?: number;
        fetchedAt?: string;
        snapshot?: {
          portName?: string; vesselQueue?: number; congestion?: string;
          nextDeparture?: string; berthsOccupied?: string;
        };
      };
      const data = await apiFetch<StealthInvokeResponse>('/nexus/tools/web.stealth/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accessibility-snapshot', url: targetUrl, callerAgent: 'sextant' }),
      });
      if (!data.ok || data.policyDecision === 'blocked') {
        setStealthSnapshot({
          policy: 'blocked',
          reason: data.reason ?? data.policyNote ?? 'Domain not in Camofox allowlist. Add it in PRAXIS → Skills → Camofox.',
          fetchedUrl: targetUrl,
          auditId: data.auditId ?? data.requestHash ?? 'n/a',
          fetchedAt: new Date().toISOString(),
        });
      } else {
        const snap = data.snapshot ?? {};
        setStealthSnapshot({
          policy: 'allowed',
          portName: snap.portName,
          vesselQueue: snap.vesselQueue,
          congestion: snap.congestion,
          nextDeparture: snap.nextDeparture,
          berthsOccupied: snap.berthsOccupied,
          fetchedUrl: targetUrl,
          auditId: data.auditId ?? data.requestHash ?? 'n/a',
          bytes: data.bytes,
          fetchedAt: data.fetchedAt ?? new Date().toISOString(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStealthSnapshot({
        policy: 'blocked',
        reason: msg.includes('401') || msg.includes('Unauthorized')
          ? 'Authentication required — configure a Camofox credential in PRAXIS (a11oy), then retry.'
          : msg.includes('403') || msg.includes('blocked')
            ? 'Domain not in Camofox allowlist. Add it in PRAXIS → Skills → Camofox.'
            : `Request failed: ${msg}`,
        fetchedUrl: targetUrl,
        auditId: 'n/a',
        fetchedAt: new Date().toISOString(),
      });
    }
    setStealthLoading(false);
  }

  if (isLoading) return <DetailSkeleton />;
  if (!vessel)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Ship className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Vessel not found</p>
        </div>
      </div>
    );

  const lastPosition = positions[0];
  const isAtSea = vessel.status === 'at_sea';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 animate-fade-in-up">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{vessel.name}</h1>
            <Badge
              variant="outline"
              className={`${statusColors[vessel.status] || ''} ${isAtSea ? 'animate-pulse' : ''}`}
            >
              {isAtSea && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse-dot" />
              )}
              {vessel.status?.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            IMO: {vessel.imo} | MMSI: {vessel.mmsi || 'N/A'} | {vessel.flag}
          </p>
        </div>
        <button
          onClick={fetchPortSnapshot}
          disabled={stealthLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shrink-0"
          style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.25)', color: '#f472b6' }}
        >
          {stealthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
          {stealthLoading ? 'Fetching…' : 'Fetch Port Snapshot'}
        </button>
      </div>

      {stealthOpen && (
        <div className="rounded-xl overflow-hidden animate-fade-in-up" style={{ background: 'rgba(244,114,182,0.04)', border: '1px solid rgba(244,114,182,0.2)' }}>
          <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(244,114,182,0.15)' }}>
            <EyeOff className="w-3.5 h-3.5" style={{ color: '#f472b6' }} />
            <span className="text-xs font-semibold" style={{ color: '#f472b6' }}>web.stealth · Port Snapshot</span>
            <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">via Camofox · portofrotterdam.com · audit-logged</span>
            <button onClick={() => setStealthOpen(false)} className="ml-auto text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          {stealthLoading ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#f472b6' }} />
              <span className="text-xs text-muted-foreground">Running accessibility-snapshot via Camofox stealth browser…</span>
            </div>
          ) : stealthSnapshot?.policy === 'blocked' ? (
            <div className="px-4 py-3">
              <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 bg-destructive/5 border border-destructive/20">
                <XCircle className="w-4 h-4 text-destructive/70 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-destructive/80">Request blocked by policy</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{stealthSnapshot.reason}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/30 mt-1">{stealthSnapshot.auditId} · {stealthSnapshot.fetchedUrl}</p>
                </div>
              </div>
            </div>
          ) : stealthSnapshot?.policy === 'allowed' ? (
            <div className="px-4 py-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {([
                  { label: 'Port', value: stealthSnapshot.portName },
                  { label: 'Vessel Queue', value: stealthSnapshot.vesselQueue != null ? String(stealthSnapshot.vesselQueue) : undefined },
                  { label: 'Congestion', value: stealthSnapshot.congestion },
                  { label: 'Next Departure', value: stealthSnapshot.nextDeparture },
                  { label: 'Berths Occupied', value: stealthSnapshot.berthsOccupied },
                ] as { label: string; value: string | undefined }[]).map((f) => f.value ? (
                  <div key={f.label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.12)' }}>
                    <p className="text-[9px] uppercase tracking-wider mb-0.5 text-muted-foreground/50">{f.label}</p>
                    <p className="text-sm font-semibold truncate">{f.value}</p>
                  </div>
                ) : null)}
              </div>
              <div className="flex items-center gap-3 mt-2.5 text-[10px] font-mono text-muted-foreground/40">
                <CheckCircle2 className="w-3 h-3 text-emerald-400/70" />
                <span>{stealthSnapshot.fetchedUrl}</span>
                <span className="ml-auto">{stealthSnapshot.auditId}{stealthSnapshot.bytes ? ` · ${(stealthSnapshot.bytes / 1024).toFixed(1)} KB` : ''} · {new Date(stealthSnapshot.fetchedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Ship className={`w-5 h-5 text-primary ${isAtSea ? 'animate-wave-float' : ''}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-semibold capitalize">{vessel.vesselType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-2 hover:border-chart-2/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Position</p>
                <p className="text-sm font-semibold">
                  {lastPosition
                    ? `${Number(lastPosition.latitude).toFixed(4)}, ${Number(lastPosition.longitude).toFixed(4)}`
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-3/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Navigation className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Speed / Heading</p>
                <p className="text-sm font-semibold">
                  {lastPosition ? `${lastPosition.speed} kn / ${lastPosition.heading}°` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-4 hover:border-chart-4/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tonnage</p>
                <p className="text-sm font-semibold">
                  {vessel.grossTonnage
                    ? `${Number(vessel.grossTonnage).toLocaleString()} GT`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-5">
        <div className="lg:col-span-2">
          <ActivityFeed entityType="vessel" title="Recent Vessel Activity" compact />
        </div>
        <CommentThread
          entityType="vessel"
          entityId={vesselId}
          title="Discussion"
          collapsible={false}
        />
      </div>

      <Tabs defaultValue="routes" className="space-y-4 animate-fade-in-up stagger-5">
        <TabsList className="bg-muted">
          <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
          <TabsTrigger value="cargo">Cargo ({cargo.length})</TabsTrigger>
          <TabsTrigger value="positions">Position History ({positions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-3">
          {routes.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-12 text-center">
                <Navigation className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No routes assigned</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Assign routes via the Route Planning page
                </p>
              </CardContent>
            </Card>
          ) : (
            (routes as RouteRecord[]).map((route, i) => (
              <Card
                key={route.id}
                className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">
                          {route.originPort} → {route.destinationPort}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {route.departureAt
                            ? new Date(route.departureAt).toLocaleDateString()
                            : 'Unscheduled'}{' '}
                          —{' '}
                          {route.arrivalAt
                            ? new Date(route.arrivalAt).toLocaleDateString()
                            : 'Pending ETA'}
                          {route.distanceNm
                            ? ` | ${Number(route.distanceNm).toLocaleString()} nm`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={route.status ? (statusColors[route.status] ?? '') : ''}
                    >
                      {route.status}
                    </Badge>
                  </div>
                  {route.waypoints &&
                    Array.isArray(route.waypoints) &&
                    route.waypoints.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {route.waypoints.map((wp, idx) => (
                          <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {wp.name || `WP ${idx + 1}`}
                          </span>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="cargo" className="space-y-3">
          {cargo.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-12 text-center">
                <Package className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No cargo records</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Cargo manifests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            (cargo as CargoRecord[]).map((c, i) => (
              <Card
                key={c.id}
                className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{c.cargoType}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.quantity} {c.unit} | {c.origin} → {c.destination}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={c.status ? (statusColors[c.status] ?? '') : ''}
                    >
                      {c.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-3">
          {positions.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-12 text-center">
                <MapPin className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No position data</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Position history will be recorded automatically
                </p>
              </CardContent>
            </Card>
          ) : (
            (positions as PositionRecord[]).map((pos, i) => (
              <Card
                key={pos.id}
                className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-chart-2" />
                      <div>
                        <p className="text-sm font-mono">
                          {Number(pos.latitude).toFixed(4)}°, {Number(pos.longitude).toFixed(4)}°
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Speed: {pos.speed} kn | Heading: {pos.heading}°
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {pos.recordedAt ? new Date(pos.recordedAt).toLocaleString() : '—'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
