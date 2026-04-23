import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  ArrowRight,
  Globe,
  Package,
  Ship,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const commodities = [
  {
    id: 'crude',
    name: 'Crude Oil',
    icon: '🛢️',
    vessels: 847,
    volume: '312M bbl',
    change: +3.2,
    routes: ['Middle East→Asia', 'W.Africa→Europe', 'Americas→Europe'],
    price: '$81.40/bbl',
    trend: 'up',
  },
  {
    id: 'lng',
    name: 'LNG',
    icon: '🔵',
    vessels: 234,
    volume: '47M tons',
    change: -1.1,
    routes: ['Qatar→Asia', 'US→Europe', 'Australia→Japan'],
    price: '$12.40/MMBtu',
    trend: 'down',
  },
  {
    id: 'grains',
    name: 'Grains & Agri',
    icon: '🌾',
    vessels: 423,
    volume: '89M tons',
    change: +7.4,
    routes: ['BlackSea→MENA', 'US→Asia', 'Brazil→China'],
    price: '$218/ton',
    trend: 'up',
  },
  {
    id: 'coal',
    name: 'Coal',
    icon: '⬛',
    vessels: 312,
    volume: '145M tons',
    change: -4.2,
    routes: ['Australia→China', 'S.Africa→EU', 'Indonesia→India'],
    price: '$124/ton',
    trend: 'down',
  },
  {
    id: 'iron',
    name: 'Iron Ore',
    icon: '🪨',
    vessels: 289,
    volume: '203M tons',
    change: +1.8,
    routes: ['Australia→China', 'Brazil→China', 'W.Africa→Asia'],
    price: '$106/ton',
    trend: 'up',
  },
  {
    id: 'containers',
    name: 'Containers',
    icon: '📦',
    vessels: 1204,
    volume: '24M TEU',
    change: +5.1,
    routes: ['Asia→Europe', 'Asia→Americas', 'Intra-Asia'],
    price: '$1,840/TEU',
    trend: 'up',
  },
];

const flowData = [
  { month: 'Oct', crude: 312, lng: 44, grains: 82, coal: 142, containers: 22 },
  { month: 'Nov', crude: 298, lng: 47, grains: 87, coal: 138, containers: 23 },
  { month: 'Dec', crude: 325, lng: 52, grains: 75, coal: 135, containers: 21 },
  { month: 'Jan', crude: 307, lng: 48, grains: 80, coal: 140, containers: 22 },
  { month: 'Feb', crude: 318, lng: 45, grains: 86, coal: 143, containers: 23 },
  { month: 'Mar', crude: 312, lng: 47, grains: 89, coal: 145, containers: 24 },
];

const topRoutes = [
  {
    from: 'Ras Tanura, Saudi Arabia',
    to: 'Ningbo, China',
    commodity: 'Crude Oil',
    vessels: 143,
    volume: '52M bbl/month',
    transit: '18 days',
  },
  {
    from: 'Port Hedland, Australia',
    to: 'Qingdao, China',
    commodity: 'Iron Ore',
    vessels: 89,
    volume: '34M tons/month',
    transit: '9 days',
  },
  {
    from: 'Sabine Pass, USA',
    to: 'Zeebrugge, Belgium',
    commodity: 'LNG',
    vessels: 47,
    volume: '3.2M tons/month',
    transit: '14 days',
  },
  {
    from: 'Tubarão, Brazil',
    to: 'Rotterdam, Netherlands',
    commodity: 'Iron Ore',
    vessels: 56,
    volume: '22M tons/month',
    transit: '11 days',
  },
  {
    from: 'Novorossiysk, Russia',
    to: 'Istanbul, Turkey',
    commodity: 'Grains',
    vessels: 38,
    volume: '8M tons/month',
    transit: '2 days',
  },
];

const COLORS: Record<string, string> = {
  crude: '#f97316',
  lng: '#06b6d4',
  grains: '#22c55e',
  coal: '#64748b',
  iron: '#a78bfa',
  containers: '#3b82f6',
};

export default function CommoditiesTracking() {
  const [selected, setSelected] = useState('crude');
  const sel = commodities.find((c) => c.id === selected) || commodities[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          Commodities & Cargo Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trade flow analysis across 40+ commodity categories — correlated from vessel positions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {commodities.map((c) => (
          <Card
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`cursor-pointer transition-all hover:border-primary/50 ${selected === c.id ? 'border-primary ring-1 ring-primary/20' : ''}`}
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-1">{c.icon}</div>
              <p className="text-xs font-semibold">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.vessels} vessels</p>
              <div
                className={`flex items-center justify-center gap-0.5 text-[10px] mt-1 ${c.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {c.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {c.change > 0 ? '+' : ''}
                {c.change}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Monthly Trade Flow Volume (M tons / M TEU / M bbl)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={flowData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  {Object.entries(COLORS).map(([key, color]) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={color}
                      radius={key === 'containers' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Trade Routes — {sel.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topRoutes
                  .filter((r) => r.commodity === sel.name || true)
                  .slice(0, 5)
                  .map((route, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs min-w-0 flex-1">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{route.from}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{route.to}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
                        <Badge variant="outline" className="text-[10px]">
                          {route.commodity}
                        </Badge>
                        <span>{route.vessels} vessels</span>
                        <span>{route.transit}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-xl">{sel.icon}</span> {sel.name} — Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Active SEXTANT', value: sel.vessels.toLocaleString() },
                { label: 'Monthly Volume', value: sel.volume },
                { label: 'Market Price', value: sel.price },
                {
                  label: 'MoM Change',
                  value: `${sel.change > 0 ? '+' : ''}${sel.change}%`,
                  color: sel.trend === 'up' ? 'text-emerald-400' : 'text-red-400',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-semibold ${color || ''}`}>{value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Key Routes</p>
                {sel.routes.map((r) => (
                  <div key={r} className="flex items-center gap-1.5 text-xs py-0.5">
                    <Ship className="w-3 h-3 text-primary" />
                    {r}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Global Commodity Split</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {commodities.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>
                      {c.icon} {c.name}
                    </span>
                    <span className="text-muted-foreground">{c.vessels}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.vessels / 1204) * 100}%`, background: COLORS[c.id] }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
