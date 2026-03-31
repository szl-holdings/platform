import { useState } from "react";
import { useLocation, Link } from "wouter";
import { LayoutDashboard, FileText, MessageSquare, Bell, Settings, LogOut, CheckCircle2, Clock, ArrowRight, Download, Eye } from "lucide-react";

const portalNav = [
  { label: "Overview", href: "/client-portal", icon: LayoutDashboard },
  { label: "Documents", href: "/client-portal/documents", icon: FileText },
  { label: "Updates", href: "/client-portal/updates", icon: Bell },
  { label: "Messages", href: "/client-portal/messages", icon: MessageSquare },
  { label: "Settings", href: "/client-portal/settings", icon: Settings },
];

function PortalShell({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  return (
    <div className="min-h-screen bg-[#07090d] flex">
      <aside className="w-52 border-r border-[#f5f0e8]/6 flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-[#f5f0e8]/6">
          <div>
            <h1
              className="text-[15px] font-light text-[#f5f0e8] leading-none"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Carlota Jo
            </h1>
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#c8a96a]/50 mt-0.5">Client Portal</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {portalNav.map(({ label, href, icon: Icon }) => {
            const isActive = currentPath === href;
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-light transition-colors cursor-pointer ${
                  isActive ? "text-[#f5f0e8]/85 bg-[#f5f0e8]/4" : "text-[#f5f0e8]/28 hover:text-[#f5f0e8]/60 hover:bg-[#f5f0e8]/3"
                }`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-[#f5f0e8]/6">
          <Link href="/">
            <div className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-light text-[#f5f0e8]/20 hover:text-[#f5f0e8]/45 transition-colors cursor-pointer">
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Return to site
            </div>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8 max-w-3xl">
        {children}
      </main>
    </div>
  );
}

const engagementTimeline = [
  { phase: "Onboarding & Discovery", status: "complete" as const, dates: "Feb 15 – Feb 28, 2026" },
  { phase: "Phase 1: Market & Competitive Analysis", status: "complete" as const, dates: "Mar 1 – Mar 14, 2026" },
  { phase: "Phase 2: Strategic Positioning", status: "active" as const, dates: "Mar 15 – Apr 12, 2026" },
  { phase: "Phase 3: Go-to-Market Architecture", status: "upcoming" as const, dates: "Apr 14 – May 9, 2026" },
  { phase: "Phase 4: Execution Playbook & Handoff", status: "upcoming" as const, dates: "May 12 – May 30, 2026" },
];

export function ClientPortalOverview() {
  const [location] = useLocation();
  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#c8a96a]/60 mb-2">Client Portal</p>
        <h1
          className="text-2xl font-light text-[#f5f0e8] mb-2"
          style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
        >
          Good morning, Jane
        </h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light">Active engagement · Phase 2: Strategic Positioning</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: "Documents", count: "8", sub: "2 awaiting review" },
          { label: "Unread updates", count: "3", sub: "Last: 2 days ago" },
          { label: "Messages", count: "5", sub: "1 unread thread" },
          { label: "Next session", count: "Apr 3", sub: "2:00 PM London · Video" },
        ].map((kpi) => (
          <div key={kpi.label} className="border border-[#f5f0e8]/6 p-5 hover:border-[#c8a96a]/15 transition-colors">
            <p className="text-[11px] text-[#f5f0e8]/25 font-light tracking-wider mb-1">{kpi.label}</p>
            <p className="text-[22px] font-light text-[#f5f0e8]"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>
              {kpi.count}
            </p>
            <p className="text-[11px] text-[#f5f0e8]/25 font-light mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#c8a96a]/45 mb-4">Engagement Timeline</p>
        <div className="space-y-0">
          {engagementTimeline.map((phase, i) => (
            <div key={phase.phase} className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  phase.status === "complete" ? "bg-[#c8a96a]/20" :
                  phase.status === "active" ? "bg-[#c8a96a]/30 ring-1 ring-[#c8a96a]/40" :
                  "bg-[#f5f0e8]/5"
                }`}>
                  {phase.status === "complete" ? (
                    <CheckCircle2 className="w-3 h-3 text-[#c8a96a]" />
                  ) : phase.status === "active" ? (
                    <ArrowRight className="w-3 h-3 text-[#c8a96a]" />
                  ) : (
                    <Clock className="w-3 h-3 text-[#f5f0e8]/20" />
                  )}
                </div>
                {i < engagementTimeline.length - 1 && (
                  <div className={`w-px h-8 ${phase.status === "complete" ? "bg-[#c8a96a]/20" : "bg-[#f5f0e8]/6"}`} />
                )}
              </div>
              <div className="pb-4">
                <p className={`text-[13px] font-light ${
                  phase.status === "active" ? "text-[#f5f0e8]/85" :
                  phase.status === "complete" ? "text-[#f5f0e8]/50" :
                  "text-[#f5f0e8]/25"
                }`}>{phase.phase}</p>
                <p className="text-[10px] text-[#f5f0e8]/20 mt-0.5">{phase.dates}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#c8a96a]/45 mb-4">Your Advisory Team</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: "Carlota Jo Silveira", role: "Lead Strategist", focus: "Go-to-market, positioning, pricing" },
            { name: "Ava Tanaka", role: "Research Analyst", focus: "Competitive intelligence, market sizing" },
          ].map((member) => (
            <div key={member.name} className="border border-[#f5f0e8]/6 p-4">
              <p className="text-[13px] font-light text-[#f5f0e8]/75">{member.name}</p>
              <p className="text-[10px] text-[#c8a96a]/50 mt-0.5">{member.role}</p>
              <p className="text-[10px] text-[#f5f0e8]/20 mt-1">{member.focus}</p>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}

const documents = [
  { name: "Strategic positioning brief — Phase 2", date: "Mar 28, 2026", status: "Awaiting review", category: "Strategy" },
  { name: "Competitive landscape analysis (42 pages)", date: "Mar 15, 2026", status: "Reviewed", category: "Research" },
  { name: "Market sizing model — TAM/SAM/SOM", date: "Mar 12, 2026", status: "Reviewed", category: "Research" },
  { name: "Pricing framework & tier architecture", date: "Mar 8, 2026", status: "Awaiting review", category: "Strategy" },
  { name: "Customer interview synthesis (n=14)", date: "Mar 5, 2026", status: "Reviewed", category: "Research" },
  { name: "Engagement scope and objectives", date: "Mar 1, 2026", status: "Reviewed", category: "Governance" },
  { name: "Stakeholder mapping & influence grid", date: "Feb 26, 2026", status: "Reviewed", category: "Strategy" },
  { name: "Onboarding materials & NDA", date: "Feb 22, 2026", status: "Reviewed", category: "Governance" },
];

export function ClientPortalDocuments() {
  const [location] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const categories = ["all", ...Array.from(new Set(documents.map(d => d.category)))];
  const filtered = filter === "all" ? documents : documents.filter(d => d.category === filter);

  return (
    <PortalShell currentPath={location}>
      <div className="mb-6">
        <h1 className="text-2xl font-light text-[#f5f0e8]" style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>Documents</h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light mt-1">Shared materials from active engagement</p>
      </div>
      <div className="flex gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-[10px] tracking-wider uppercase px-3 py-1.5 transition-colors ${
              filter === cat
                ? "text-[#c8a96a] bg-[#c8a96a]/10 border border-[#c8a96a]/20"
                : "text-[#f5f0e8]/25 border border-[#f5f0e8]/6 hover:text-[#f5f0e8]/45"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((doc) => (
          <div key={doc.name} className="border border-[#f5f0e8]/6 p-4 flex items-center justify-between hover:border-[#c8a96a]/15 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] tracking-wider uppercase text-[#c8a96a]/35 border border-[#c8a96a]/10 px-1.5 py-0.5">{doc.category}</span>
              </div>
              <p className="text-[13px] font-light text-[#f5f0e8]/75">{doc.name}</p>
              <p className="text-[11px] text-[#f5f0e8]/25 mt-0.5">{doc.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-medium tracking-wider px-2.5 py-1 ${
                doc.status === "Awaiting review"
                  ? "text-[#c8a96a] bg-[#c8a96a]/8 border border-[#c8a96a]/15"
                  : "text-[#f5f0e8]/25 border border-[#f5f0e8]/8"
              }`}>{doc.status}</span>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-[#f5f0e8]/20 hover:text-[#f5f0e8]/50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 text-[#f5f0e8]/20 hover:text-[#f5f0e8]/50 transition-colors"><Download className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}

export function ClientPortalUpdates() {
  const [location] = useLocation();
  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#f5f0e8]" style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>Updates</h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light mt-1">Engagement progress and session notes</p>
      </div>
      <div className="space-y-8">
        {[
          { date: "March 29, 2026", title: "Phase 2 positioning brief delivered", body: "The strategic positioning brief has been shared in Documents. It covers three positioning options with trade-off analysis. We'd appreciate your feedback ahead of the April 3 session.", tag: "Deliverable" },
          { date: "March 22, 2026", title: "Pricing framework draft ready", body: "Initial pricing framework with three-tier architecture is available for review. Includes competitive price benchmarking data from 8 comparable platforms.", tag: "Deliverable" },
          { date: "March 14, 2026", title: "Competitive analysis complete", body: "42-page competitive landscape analysis covering 18 direct competitors and 12 adjacent players. Key insights flagged for discussion. Document shared for review.", tag: "Research" },
          { date: "March 8, 2026", title: "Session 3 — positioning hypotheses", body: "Explored three positioning angles: technical differentiation, outcome-based, and ecosystem play. Consensus to develop all three for comparison in Phase 2 brief.", tag: "Session Notes" },
          { date: "March 1, 2026", title: "Phase 1 kickoff complete", body: "Completed stakeholder interviews (n=14), established competitive watchlist, and began market sizing analysis. Research timeline on track.", tag: "Milestone" },
          { date: "February 22, 2026", title: "Engagement commenced", body: "Onboarding materials received and reviewed. NDA signed. Discovery sessions scheduled for Week 1. Team introductions complete.", tag: "Milestone" },
        ].map((update) => (
          <div key={update.date} className="border-l border-[#c8a96a]/20 pl-5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#c8a96a]/45">{update.date}</p>
              <span className="text-[9px] tracking-wider uppercase text-[#f5f0e8]/15 border border-[#f5f0e8]/6 px-1.5 py-0.5">{update.tag}</span>
            </div>
            <h3 className="text-[15px] font-light text-[#f5f0e8]/80 mb-1.5"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>
              {update.title}
            </h3>
            <p className="text-[#f5f0e8]/38 text-[13px] font-light leading-relaxed">{update.body}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}

export function ClientPortalMessages() {
  const [location] = useLocation();
  const [newMsg, setNewMsg] = useState("");
  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#f5f0e8]" style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>Messages</h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light mt-1">Private correspondence with your advisory team</p>
      </div>
      <div className="space-y-4 mb-6">
        {[
          { sender: "Carlota Jo", date: "Mar 29", body: "Hi Jane — the positioning brief is in your Documents. I've highlighted the three options we discussed. Looking forward to walking through the trade-offs on April 3. Let me know if you'd like to discuss anything before then." },
          { sender: "You", date: "Mar 27", body: "Thanks Carlota. Quick question — in the pricing framework, is the enterprise tier based on seat-based or usage-based pricing? Want to align with our sales team before the session." },
          { sender: "Carlota Jo", date: "Mar 27", body: "Great question. The framework models both — see Section 4.2. Short answer: we're recommending a hybrid (base platform fee + usage tiers) which tested better in our customer interviews. Happy to deep-dive on the 3rd." },
          { sender: "Ava Tanaka", date: "Mar 22", body: "Jane — I've uploaded the competitive pricing benchmarks. Key finding: 6 of 8 comparable platforms have moved away from pure seat-based models in the last 18 months. Full analysis in the pricing framework doc." },
          { sender: "You", date: "Mar 15", body: "The competitive analysis is very thorough. Two follow-ups: (1) Can we add Acme Corp to the direct competitor list? They just raised Series C. (2) The market sizing for APAC seems conservative — can we revisit?" },
        ].map((msg, i) => (
          <div key={i} className={`p-4 ${msg.sender === "You" ? "bg-[#c8a96a]/5 border border-[#c8a96a]/10" : "bg-[#0c0e14] border border-[#f5f0e8]/6"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <p className={`text-[10px] font-medium ${msg.sender === "You" ? "text-[#f5f0e8]/40" : "text-[#c8a96a]/50"}`}>{msg.sender}</p>
              <span className="text-[10px] text-[#f5f0e8]/15">·</span>
              <p className="text-[10px] text-[#f5f0e8]/15">{msg.date}</p>
            </div>
            <p className="text-[13px] font-light text-[#f5f0e8]/65 leading-relaxed">{msg.body}</p>
          </div>
        ))}
      </div>
      <div className="border border-[#f5f0e8]/8">
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Write a message..."
          rows={4}
          className="w-full bg-transparent px-4 py-3 text-[13px] text-[#f5f0e8] placeholder-[#f5f0e8]/18 font-light focus:outline-none resize-none border-b border-[#f5f0e8]/8"
        />
        <div className="px-4 py-2.5 flex justify-end">
          <button className="px-5 py-2 text-[12px] font-medium text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] transition-colors">
            Send
          </button>
        </div>
      </div>
    </PortalShell>
  );
}

export function ClientPortalSettings() {
  const [location] = useLocation();
  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#f5f0e8]" style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>Settings</h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light mt-1">Account and notification preferences</p>
      </div>
      <div className="space-y-5">
        {[
          { label: "Full name", value: "Jane Founder" },
          { label: "Email", value: "jane@startup.com" },
          { label: "Company", value: "Acme Ventures, Inc." },
          { label: "Engagement type", value: "Strategic Advisory — 16-week program" },
          { label: "Notification preference", value: "Email — new documents, updates, and session reminders" },
        ].map((field) => (
          <div key={field.label} className="border border-[#f5f0e8]/6 p-4">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#f5f0e8]/25 mb-1.5">{field.label}</p>
            <p className="text-[13px] font-light text-[#f5f0e8]/60">{field.value}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}

export default ClientPortalOverview;
