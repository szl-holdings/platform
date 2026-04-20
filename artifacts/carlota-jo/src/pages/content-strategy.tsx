import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Calendar, FileText, Layers, PenTool, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePageMeta } from '@/hooks/usePageMeta';

const pillars = [
  {
    name: 'Brand Authority',
    color: '#ec4899',
    allocation: 30,
    description: 'Thought leadership, founder story, mission-driven content',
  },
  {
    name: 'Product Storytelling',
    color: '#8b5cf6',
    allocation: 25,
    description: 'Feature narratives, use cases, customer journeys',
  },
  {
    name: 'Social Proof',
    color: '#06b6d4',
    allocation: 20,
    description: 'Case studies, testimonials, results showcases',
  },
  {
    name: 'Community & Culture',
    color: '#10b981',
    allocation: 15,
    description: 'Behind-the-scenes, team highlights, values',
  },
  {
    name: 'Educational Content',
    color: '#f59e0b',
    allocation: 10,
    description: 'How-tos, trends, industry insights',
  },
];

const contentCalendar = [
  {
    date: 'Apr 1',
    type: 'Blog',
    title: 'The Brand Clarity Framework: 5 Steps',
    pillar: 'Brand Authority',
    status: 'Scheduled',
    channel: 'Web + LinkedIn',
  },
  {
    date: 'Apr 3',
    type: 'Reel',
    title: 'Behind our Luminary rebrand',
    pillar: 'Social Proof',
    status: 'In Review',
    channel: 'Instagram',
  },
  {
    date: 'Apr 5',
    type: 'Newsletter',
    title: 'Q1 Brand Trends Report',
    pillar: 'Educational Content',
    status: 'Draft',
    channel: 'Email',
  },
  {
    date: 'Apr 8',
    type: 'Podcast',
    title: 'Interview: How Oasis Found Their Voice',
    pillar: 'Community & Culture',
    status: 'Scheduled',
    channel: 'Spotify + Apple',
  },
  {
    date: 'Apr 10',
    type: 'Case Study',
    title: 'Kova Spirits: From Chaotic to Coherent',
    pillar: 'Social Proof',
    status: 'In Production',
    channel: 'Web',
  },
  {
    date: 'Apr 12',
    type: 'Thread',
    title: '7 signs your brand is confusing customers',
    pillar: 'Brand Authority',
    status: 'Idea',
    channel: 'Twitter/X',
  },
  {
    date: 'Apr 15',
    type: 'Video',
    title: 'Brand Positioning Masterclass (60 min)',
    pillar: 'Educational Content',
    status: 'Scheduled',
    channel: 'YouTube + Web',
  },
];

const performanceData = [
  { month: 'Oct', impressions: 84000, engagement: 3200, leads: 12 },
  { month: 'Nov', impressions: 91000, engagement: 4100, leads: 18 },
  { month: 'Dec', impressions: 72000, engagement: 3800, leads: 14 },
  { month: 'Jan', impressions: 110000, engagement: 5200, leads: 24 },
  { month: 'Feb', impressions: 128000, engagement: 6800, leads: 31 },
  { month: 'Mar', impressions: 154000, engagement: 8400, leads: 38 },
];

const typeColor: Record<string, string> = {
  Blog: 'text-blue-400 bg-blue-500/10',
  Reel: 'text-pink-400 bg-pink-500/10',
  Newsletter: 'text-amber-400 bg-amber-500/10',
  Podcast: 'text-emerald-400 bg-emerald-500/10',
  'Case Study': 'text-violet-400 bg-violet-500/10',
  Thread: 'text-cyan-400 bg-cyan-500/10',
  Video: 'text-red-400 bg-red-500/10',
};

const statusColor: Record<string, string> = {
  Scheduled: 'text-emerald-400 bg-emerald-500/10',
  'In Review': 'text-amber-400 bg-amber-500/10',
  Draft: 'text-muted-foreground bg-muted',
  'In Production': 'text-blue-400 bg-blue-500/10',
  Idea: 'text-violet-400 bg-violet-500/10',
};

export default function ContentStrategy() {
  usePageMeta({
    title: 'Content Strategy | Carlota Jo Consulting – Brand Content Planning',
    description:
      'AI-assisted content strategy from Carlota Jo Consulting. Build content calendars, track performance, and align content with brand pillars and business goals.',
    canonical: 'https://szlholdings.com/carlota-jo/content-strategy',
  });
  const [activeView, setActiveView] = useState<'calendar' | 'performance'>('calendar');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <PenTool className="w-7 h-7 text-primary" />
            Content Strategy Engine
          </h1>
          <p className="text-muted-foreground mt-2">
            Editorial planning, content pillar allocation, and performance tracking across all brand
            touchpoints.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Monthly Impressions',
              value: '154K',
              sub: '+20% MoM',
              color: 'text-foreground',
            },
            {
              label: 'Avg Engagement Rate',
              value: '5.4%',
              sub: 'Industry avg: 2.1%',
              color: 'text-emerald-400',
            },
            {
              label: 'Leads Generated',
              value: '38',
              sub: 'Q1 total: 85 leads',
              color: 'text-primary',
            },
            {
              label: 'Content Pieces (Mar)',
              value: '24',
              sub: 'Across 5 channels',
              color: 'text-foreground',
            },
          ].map(({ label, value, sub, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Content Pillars
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pillars.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between mb-1">
                    <p className="text-xs font-medium" style={{ color: p.color }}>
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.allocation}%</p>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.allocation * 2}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="col-span-2 space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeView === 'calendar' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Editorial Calendar
              </button>
              <button
                onClick={() => setActiveView('performance')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeView === 'performance' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Performance Trends
              </button>
            </div>

            {activeView === 'calendar' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {contentCalendar.map((item) => (
                      <div
                        key={item.title}
                        className="p-3 flex items-center gap-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-12 text-center shrink-0">
                          <p className="text-[10px] text-muted-foreground">Apr</p>
                          <p className="text-base font-bold text-foreground">
                            {item.date.split(' ')[1]}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${typeColor[item.type]}`}
                        >
                          {item.type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{item.channel}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${statusColor[item.status]}`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Content Performance (6 months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={performanceData}>
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="impressions"
                        fill="#ec4899"
                        fillOpacity={0.7}
                        radius={[3, 3, 0, 0]}
                        name="Impressions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
