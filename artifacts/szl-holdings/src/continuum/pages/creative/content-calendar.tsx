import { format } from 'date-fns';
import { Briefcase, Calendar, Linkedin, Loader2, type LucideProps, Twitter } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';
import { useCampaigns } from '@/continuum/hooks/use-campaigns';

type Platform = 'linkedin' | 'x' | 'hackajob';

interface CalendarPost {
  day: string;
  platform: Platform;
  title: string;
  status: 'published' | 'scheduled' | 'draft';
  type: string;
}

interface CalendarWeek {
  week: number;
  theme: string;
  posts: CalendarPost[];
}

const platformIcons: Record<Platform, React.ComponentType<LucideProps>> = {
  linkedin: Linkedin,
  x: Twitter,
  hackajob: Briefcase,
};

const platformColors: Record<Platform, string> = {
  linkedin: 'text-blue-400 bg-blue-400/10',
  x: 'text-white bg-white/10',
  hackajob: 'text-emerald-400 bg-emerald-400/10',
};

const PLATFORM_THEMES: Platform[][] = [
  ['linkedin', 'x', 'linkedin'],
  ['linkedin', 'x', 'hackajob'],
  ['linkedin', 'x', 'linkedin'],
  ['hackajob', 'linkedin', 'x'],
];

const POST_TYPES: Record<Platform, string[]> = {
  linkedin: ['Article', 'Carousel', 'Post'],
  x: ['Thread', 'Thread', 'Post'],
  hackajob: ['Article', 'Job Post', 'Article'],
};

const DAYS = ['Mon', 'Wed', 'Fri'];
const STATUSES: CalendarPost['status'][] = [
  'published',
  'published',
  'scheduled',
  'scheduled',
  'draft',
  'draft',
  'draft',
  'draft',
];

function buildCalendarFromCampaigns(
  campaigns: { name: string; status: string; deadline?: string; category?: string }[],
): CalendarWeek[] {
  const activeThemes = campaigns
    .filter((c) => c.status !== 'archived')
    .slice(0, 8)
    .map((c) => c.name);

  const fallbackThemes = [
    'Launch Announcement',
    'Product Deep Dives',
    'Technical Leadership',
    'Community & Hiring',
    'Customer Stories',
    'Innovation Spotlight',
    'Behind the Scenes',
    'Growth & Vision',
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const theme = activeThemes[i] ?? fallbackThemes[i] ?? `Week ${i + 1} Campaign`;
    const platformSet =
      PLATFORM_THEMES[i % PLATFORM_THEMES.length] ?? (['linkedin', 'x', 'linkedin'] as Platform[]);
    const status = STATUSES[i] ?? 'draft';
    return {
      week: i + 1,
      theme,
      posts: DAYS.map((day, j): CalendarPost => {
        const platform = platformSet[j % platformSet.length] as Platform;
        const types = POST_TYPES[platform];
        return {
          day,
          platform,
          title: `${theme} — ${day} Update`,
          status:
            j === 0 && status === 'published'
              ? 'published'
              : j < 2 && ['published', 'scheduled'].includes(status)
                ? 'scheduled'
                : 'draft',
          type: types[j % types.length] ?? 'Post',
        };
      }),
    };
  });
}

export default function ContentCalendar() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  const weeks: CalendarWeek[] =
    campaigns && campaigns.length > 0 ? buildCalendarFromCampaigns(campaigns) : [];

  const totalPosts = weeks.reduce((s, w) => s + w.posts.length, 0);
  const published = weeks.reduce(
    (s, w) => s + w.posts.filter((p) => p.status === 'published').length,
    0,
  );
  const scheduled = weeks.reduce(
    (s, w) => s + w.posts.filter((p) => p.status === 'scheduled').length,
    0,
  );

  const upcomingDeadlines = (campaigns ?? [])
    .filter((c) => c.deadline && c.status !== 'archived')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-400" />
          Content Calendar
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          8-week social media plan derived from active campaign deadlines — LinkedIn, X, and
          Hackajob
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns&hellip;
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0d1117] border border-white/8 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Posts</p>
          <p className="text-2xl font-bold text-white">{totalPosts}</p>
        </div>
        <div className="bg-[#0d1117] border border-white/8 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Published</p>
          <p className="text-2xl font-bold text-emerald-400">{published}</p>
        </div>
        <div className="bg-[#0d1117] border border-white/8 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-blue-400">{scheduled}</p>
        </div>
        <div className="bg-[#0d1117] border border-white/8 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Campaigns</p>
          <p className="text-2xl font-bold text-white">{campaigns?.length ?? 0}</p>
        </div>
      </div>

      {upcomingDeadlines.length > 0 && (
        <div className="bg-[#0d1117] border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Upcoming Campaign Deadlines</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingDeadlines.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-white/3 border border-white/8">
                <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                <p className="text-[10px] text-blue-400 mt-1">
                  {format(new Date(c.deadline!), 'MMM d, yyyy')}
                </p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                  {c.status.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {weeks.map((w) => {
          const isExpanded = expandedWeek === w.week;
          return (
            <div
              key={w.week}
              className="bg-[#0d1117] border border-white/8 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : w.week)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-400">
                    {w.week}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">
                      Week {w.week}: {w.theme}
                    </p>
                    <p className="text-xs text-slate-500">{w.posts.length} posts planned</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {w.posts.map((p, i) => {
                    const Icon = platformIcons[p.platform] ?? Briefcase;
                    const colorClass =
                      platformColors[p.platform]?.split(' ')[0] ?? 'text-slate-500';
                    return <Icon key={i} className={`w-4 h-4 ${colorClass}`} />;
                  })}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-white/8 p-4 space-y-2">
                  {w.posts.map((post, i) => {
                    const Icon = platformIcons[post.platform] ?? Briefcase;
                    const colorClasses =
                      platformColors[post.platform] ?? 'text-slate-500 bg-white/5';
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/2">
                        <span className="text-xs font-mono text-slate-500 w-8">{post.day}</span>
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClasses}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{post.title}</p>
                          <p className="text-xs text-slate-500">{post.type}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            post.status === 'published'
                              ? 'bg-emerald-400/10 text-emerald-400'
                              : post.status === 'scheduled'
                                ? 'bg-blue-400/10 text-blue-400'
                                : 'bg-amber-400/10 text-amber-400'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
