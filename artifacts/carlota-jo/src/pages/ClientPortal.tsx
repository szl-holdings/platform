import { useState } from "react";
import { useLocation, Link } from "wouter";
import { LayoutDashboard, FileText, MessageSquare, Bell, Settings, LogOut } from "lucide-react";

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
          Good morning
        </h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light">Active engagement · Phase 2: Strategy</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: "Documents", count: "4", sub: "2 awaiting review" },
          { label: "Unread updates", count: "2", sub: "Last: 3 days ago" },
          { label: "Messages", count: "1", sub: "1 unread" },
          { label: "Next session", count: "Apr 3", sub: "2:00 PM London" },
        ].map((kpi) => (
          <div key={kpi.label} className="border border-[#f5f0e8]/6 p-5">
            <p className="text-[11px] text-[#f5f0e8]/25 font-light tracking-wider mb-1">{kpi.label}</p>
            <p className="text-[22px] font-light text-[#f5f0e8]"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>
              {kpi.count}
            </p>
            <p className="text-[11px] text-[#f5f0e8]/25 font-light mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}

export function ClientPortalDocuments() {
  const [location] = useLocation();
  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#f5f0e8]" style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>Documents</h1>
        <p className="text-[#f5f0e8]/35 text-[13px] font-light mt-1">Shared materials from active engagement</p>
      </div>
      <div className="space-y-3">
        {[
          { name: "Strategic positioning brief — Phase 2", date: "Mar 28, 2026", status: "Awaiting review" },
          { name: "Market analysis — Competitor landscape", date: "Mar 15, 2026", status: "Reviewed" },
          { name: "Engagement scope and objectives", date: "Mar 1, 2026", status: "Reviewed" },
          { name: "Onboarding materials", date: "Feb 22, 2026", status: "Reviewed" },
        ].map((doc) => (
          <div key={doc.name} className="border border-[#f5f0e8]/6 p-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-light text-[#f5f0e8]/75">{doc.name}</p>
              <p className="text-[11px] text-[#f5f0e8]/25 mt-0.5">{doc.date}</p>
            </div>
            <span className={`text-[10px] font-medium tracking-wider px-2.5 py-1 ${
              doc.status === "Awaiting review"
                ? "text-[#c8a96a] bg-[#c8a96a]/8 border border-[#c8a96a]/15"
                : "text-[#f5f0e8]/25 border border-[#f5f0e8]/8"
            }`}>{doc.status}</span>
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
          { date: "March 27, 2026", title: "Phase 2 brief delivered", body: "The strategic positioning brief has been shared in Documents. We'd appreciate your feedback ahead of the April 3 session." },
          { date: "March 14, 2026", title: "Competitor analysis complete", body: "We've completed the market and competitor landscape analysis. Document shared for review. Key insights to discuss on next call." },
        ].map((update) => (
          <div key={update.date} className="border-l border-[#c8a96a]/20 pl-5">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#c8a96a]/45 mb-1">{update.date}</p>
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
        <div className="bg-[#0c0e14] border border-[#f5f0e8]/6 p-4">
          <p className="text-[10px] text-[#c8a96a]/50 mb-1">Carlota Jo · Mar 27</p>
          <p className="text-[13px] font-light text-[#f5f0e8]/65">The brief is in your Documents. Looking forward to the April 3 session — let me know if you'd like to discuss anything before then.</p>
        </div>
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
          { label: "Notification preference", value: "Email — new documents and updates" },
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
