import { useState } from "react";
import { Calendar, Linkedin, Twitter, Briefcase, Clock, CheckCircle2, Edit, Eye } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const weeks = [
  {
    week: 1, theme: "Launch Announcement",
    posts: [
      { day: "Mon", platform: "linkedin", title: "SZL Holdings Platform Launch", status: "published", type: "Article" },
      { day: "Wed", platform: "x", title: "Thread: Why we built SZL", status: "published", type: "Thread" },
      { day: "Fri", platform: "linkedin", title: "Meet the Ecosystem", status: "published", type: "Carousel" },
    ]
  },
  {
    week: 2, theme: "Product Deep Dives",
    posts: [
      { day: "Tue", platform: "linkedin", title: "Firestorm Security Operations", status: "published", type: "Post" },
      { day: "Thu", platform: "x", title: "INCA AI Research Thread", status: "published", type: "Thread" },
      { day: "Fri", platform: "hackajob", title: "Engineering Culture Post", status: "published", type: "Article" },
    ]
  },
  {
    week: 3, theme: "Technical Leadership",
    posts: [
      { day: "Mon", platform: "linkedin", title: "Building Multi-Tenant SaaS", status: "published", type: "Article" },
      { day: "Wed", platform: "x", title: "Architecture Decisions Thread", status: "published", type: "Thread" },
      { day: "Fri", platform: "linkedin", title: "Lessons from 14 Apps", status: "published", type: "Carousel" },
    ]
  },
  {
    week: 4, theme: "Community & Hiring",
    posts: [
      { day: "Tue", platform: "hackajob", title: "Join SZL Holdings", status: "published", type: "Job Post" },
      { day: "Thu", platform: "linkedin", title: "Our Tech Stack Breakdown", status: "published", type: "Post" },
      { day: "Fri", platform: "x", title: "Open Roles Thread", status: "published", type: "Thread" },
    ]
  },
  {
    week: 5, theme: "Customer Stories",
    posts: [
      { day: "Mon", platform: "linkedin", title: "Case Study: Maritime Intelligence", status: "scheduled", type: "Article" },
      { day: "Wed", platform: "x", title: "Real Estate AI in Action", status: "scheduled", type: "Thread" },
      { day: "Fri", platform: "linkedin", title: "Security Operations Success", status: "scheduled", type: "Post" },
    ]
  },
  {
    week: 6, theme: "Innovation Spotlight",
    posts: [
      { day: "Tue", platform: "linkedin", title: "AI-Powered Predictions with INCA", status: "draft", type: "Article" },
      { day: "Thu", platform: "x", title: "Creative Engine Behind Dreamscape", status: "draft", type: "Thread" },
      { day: "Sat", platform: "linkedin", title: "Weekend Read: Future of SaaS", status: "draft", type: "Post" },
    ]
  },
  {
    week: 7, theme: "Behind the Scenes",
    posts: [
      { day: "Mon", platform: "linkedin", title: "Day in the Life: SZL Engineer", status: "draft", type: "Article" },
      { day: "Wed", platform: "hackajob", title: "Engineering Blog Post", status: "draft", type: "Article" },
      { day: "Fri", platform: "x", title: "Dev Tools We Love Thread", status: "draft", type: "Thread" },
    ]
  },
  {
    week: 8, theme: "Growth & Vision",
    posts: [
      { day: "Tue", platform: "linkedin", title: "Q2 Vision & Roadmap", status: "draft", type: "Article" },
      { day: "Thu", platform: "x", title: "What's Next for SZL", status: "draft", type: "Thread" },
      { day: "Fri", platform: "linkedin", title: "8 Weeks of Growth", status: "draft", type: "Carousel" },
    ]
  },
];

const platformIcons: Record<string, any> = { linkedin: Linkedin, x: Twitter, hackajob: Briefcase };
const platformColors: Record<string, string> = {
  linkedin: "text-blue-400 bg-blue-400/10",
  x: "text-foreground bg-foreground/10",
  hackajob: "text-emerald-400 bg-emerald-400/10",
};

export function ContentCalendar() {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const totalPosts = weeks.reduce((s, w) => s + w.posts.length, 0);
  const published = weeks.reduce((s, w) => s + w.posts.filter(p => p.status === "published").length, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          Content Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">8-week social media campaign plan across LinkedIn, X, and Hackajob</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Posts</p>
          <p className="text-2xl font-bold text-foreground">{totalPosts}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Published</p>
          <p className="text-2xl font-bold text-emerald-400">{published}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Platforms</p>
          <p className="text-2xl font-bold text-foreground">3</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weeks</p>
          <p className="text-2xl font-bold text-foreground">8</p>
        </div>
      </div>

      <div className="space-y-3">
        {weeks.map(w => {
          const isExpanded = expandedWeek === w.week;
          return (
            <div key={w.week} className="bg-card/60 border border-border rounded-xl overflow-hidden">
              <button onClick={() => setExpandedWeek(isExpanded ? null : w.week)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{w.week}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Week {w.week}: {w.theme}</p>
                    <p className="text-xs text-muted-foreground">{w.posts.length} posts planned</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {w.posts.map((p, i) => {
                    const Icon = platformIcons[p.platform] || Briefcase;
                    return <Icon key={i} className={cn("w-4 h-4", platformColors[p.platform]?.split(" ")[0])} />;
                  })}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-2">
                  {w.posts.map((post, i) => {
                    const Icon = platformIcons[post.platform] || Briefcase;
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                        <span className="text-xs font-mono text-muted-foreground w-8">{post.day}</span>
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", platformColors[post.platform])}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{post.title}</p>
                          <p className="text-xs text-muted-foreground">{post.type}</p>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                          post.status === "published" ? "bg-emerald-400/10 text-emerald-400" :
                          post.status === "scheduled" ? "bg-cyan-400/10 text-cyan-400" :
                          "bg-amber-400/10 text-amber-400"
                        )}>{post.status}</span>
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

export default ContentCalendar;
