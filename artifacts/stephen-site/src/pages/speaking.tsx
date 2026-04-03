import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Mic, Calendar, MapPin, Users, Video, ExternalLink, Star, Globe } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const upcomingEvents = [
  { name: "SaaStr Annual 2026", topic: "AIOps at Enterprise Scale: Lessons from 50+ Platform Integrations", date: "May 12-14, 2026", location: "San Mateo, CA", format: "Keynote", audience: "18,000+", status: "Confirmed" },
  { name: "Gartner IT Symposium/Xpo", topic: "The AI-Native Enterprise: A Blueprint for CIOs in 2026-2027", date: "Oct 21, 2026", location: "Orlando, FL", format: "Main Stage", audience: "10,000+", status: "Confirmed" },
  { name: "Web Summit 2026", topic: "Ecosystem Investing: How to Build 8 Companies Simultaneously", date: "Nov 3-6, 2026", location: "Lisbon, Portugal", format: "Panel + Session", audience: "45,000+", status: "Pending" },
];

const pastSpeaking = [
  { name: "AI Summit NYC 2025", topic: "Maritime AI: The $4T Industry Still Running on Fax Machines", date: "Sep 2025", audience: "2,400", rating: 4.9, video: true },
  { name: "TechCrunch Disrupt 2025", topic: "Building in the Open: The SZL Holdings Playbook", date: "Oct 2025", audience: "5,200", rating: 4.8, video: true },
  { name: "CXO Summit — Goldman Sachs", topic: "Enterprise AI Adoption: Separating Hype from ROI", date: "Nov 2025", audience: "380", rating: 4.9, video: false },
  { name: "SXSW 2025", topic: "The Next Chapter of Cybersecurity: AI-Native Defense", date: "Mar 2025", audience: "3,100", rating: 4.7, video: true },
];

const topics = [
  "AI Strategy & Enterprise Adoption",
  "Maritime & Supply Chain Intelligence",
  "Ecosystem Investing & Venture Building",
  "Cybersecurity in the AI Age",
  "AIOps & Platform Engineering",
  "Scaling Remote-First Teams",
];

export default function Speaking() {
  usePageMeta({
    title: "Speaking Engagements | Stephen Lutar – Keynotes & Conference Talks",
    description: "Book Stephen Lutar for keynotes and conference talks on AI strategy, enterprise architecture, and technology leadership. SaaStr, Gartner, Web Summit, and more.",
    canonical: "https://szlholdings.com/stephen/speaking",
  });
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" />
          Speaking Engagements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Conference keynotes, panels, and executive speaking appearances — upcoming and past engagements</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Confirmed 2026 Events", value: "2", color: "text-emerald-400" },
          { label: "Total Audience 2025", value: "11K+", color: "text-sky-400" },
          { label: "Avg Speaker Rating", value: "4.83", color: "text-amber-400" },
          { label: "Countries Spoken In", value: "8", color: "text-primary" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map((e) => (
            <Card key={e.name} className={e.status === "Confirmed" ? "border-primary/20" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-base">{e.name}</span>
                      <Badge variant="outline" className={`text-[10px] ${e.status === "Confirmed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{e.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{e.format}</Badge>
                    </div>
                    <p className="text-sm font-medium text-primary">"{e.topic}"</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{e.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{e.audience} attendees</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past Speaking</h3>
          <div className="space-y-3">
            {pastSpeaking.map((e) => (
              <Card key={e.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{e.name}</span>
                        {e.video && <Video className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <p className="text-xs text-primary mt-0.5">"{e.topic}"</p>
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{e.date}</span>
                        <span>{e.audience.toLocaleString()} attendees</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{e.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Speaking Topics</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topics.map((t) => (
                <div key={t} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-xs">{t}</div>
              ))}
              <button className="w-full mt-2 text-xs px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Request Speaking Engagement</button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
