import { m } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Cloud,
  Database,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Mail,
  Map,
  MessageSquare,
  MousePointer,
  Navigation,
  Settings,
  Shield,
  SmilePlus,
  Star,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AzureTenantsPanel } from '@/admin/AzurePanel';
import { BackupPanel } from '@/admin/BackupPanel';
import { CmsPostsPanel } from '@/admin/CmsPostsPanel';
import {
  AnalyticsPanel,
  DashboardPanel,
  InquiriesPanel,
  SubmissionsPanel,
} from '@/admin/CmsTablePanel';
import {
  ArticlesPanel,
  CaseStudiesPanel,
  CtasPanel,
  FaqsPanel,
  NavigationPanel,
  PagesPanel,
  RoadmapPanel,
  ServicesPanel,
  TestimonialsPanel,
  UpdatesPanel,
  VenturesPanel,
} from '@/admin/ContentPanels';
import { FeedbackPanel } from '@/admin/FeedbackPanel';
import { OnboardingPanel } from '@/admin/OnboardingPanel';
import { ProvisioningPanel } from '@/admin/ProvisioningPanel';
import { RevenuePanel } from '@/admin/RevenuePanel';
import { CapitalReadinessOS } from '@/components/CapitalReadinessOS';
import { CertificationReadinessOS } from '@/components/CertificationReadinessOS';
import { CAPITAL_DOCUMENTS, getDocumentsByChannel } from '@/data/capital-arsenal';
import { cn } from '@/lib/utils';

const API = '/api';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

// ─── PIN Gate ────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API}/config/verify-admin-pin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        onUnlock();
      } else {
        const body = await res.json().catch(() => ({}));
        if (body?.error === 'admin_pin_not_configured') {
          setError('Admin PIN is not configured on this server.');
        } else {
          setError('Incorrect PIN. Try again.');
        }
        setPin('');
      }
    } catch {
      setError('Unable to verify PIN. Check your connection.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">SZL Holdings Content Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter access PIN"
              className={cn(
                'w-full bg-card border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                error ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-border',
              )}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!pin || verifying}
            className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
            Unlock Admin
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Contact the site administrator for access.
        </p>
      </m.div>
    </div>
  );
}

// ─── Site Sections ────────────────────────────────────────────────────────────

const ADMIN_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'capital-readiness', label: 'Capital Readiness', icon: DollarSign },
  { id: 'capital-arsenal', label: 'Capital Management', icon: BookOpen },
  { id: 'certification-readiness', label: 'Cert Readiness', icon: Shield },
  { id: 'onboarding-status', label: 'Onboarding Status', icon: ClipboardList },
  { id: 'azure-tenants', label: 'Azure Tenants', icon: Cloud },
  { id: 'scim-provisioning', label: 'SCIM Provisioning', icon: Shield },
  { id: 'powerbi', label: 'Power BI', icon: BarChart3 },
  { id: 'cms-posts', label: 'CMS Posts', icon: BookOpen },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'ventures', label: 'Ventures', icon: Building2 },
  { id: 'services', label: 'Services', icon: Star },
  { id: 'articles', label: 'Articles', icon: BookOpen },
  { id: 'case-studies', label: 'Case Studies', icon: ClipboardList },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
  { id: 'updates', label: 'Updates', icon: TrendingUp },
  { id: 'ctas', label: 'CTAs', icon: MousePointer },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'inquiries', label: 'Lead Inquiries', icon: Users },
  { id: 'submissions', label: 'Submissions', icon: Mail },
  { id: 'feedback', label: 'Feedback & NPS', icon: SmilePlus },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'backup', label: 'Backup & Recovery', icon: Database },
  { id: 'provisioning', label: 'Service Provisioning', icon: Layers },
];

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem('szl_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleUnlock = () => {
    setUnlocked(true);
    try {
      localStorage.setItem('szl_admin_unlocked', 'true');
    } catch {}
  };

  useEffect(() => {
    document.title = 'Admin — SZL Holdings';
  }, []);

  if (!unlocked) {
    return <PinGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back to site
            </Link>
            <span className="text-border/60">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Settings className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Content Management</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Admin Access
            </span>
            <Link
              href="/admin/command-center"
              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full"
            >
              <Terminal className="w-3 h-3" /> Command Center
            </Link>
            <button
              onClick={() => {
                setUnlocked(false);
                try {
                  localStorage.removeItem('szl_admin_unlocked');
                } catch {}
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        <aside className="w-48 shrink-0">
          <nav className="space-y-0.5 sticky top-20">
            {ADMIN_SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                    activeSection === s.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <m.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeSection === 'dashboard' && <DashboardPanel />}
            {activeSection === 'revenue' && <RevenuePanel />}
            {activeSection === 'capital-readiness' && <CapitalReadinessOS />}
            {activeSection === 'capital-arsenal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Capital Management
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Complete document library: investor materials, bank/SBA package, NY state
                      programs, and federal programs.
                    </p>
                  </div>
                  <Link href="/admin/capital-arsenal">
                    <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Full Arsenal View
                    </a>
                  </Link>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-600">Internal Use Only</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        All documents contain projections and assumptions. Not financial, legal, or
                        investment advice. Review with qualified counsel before external
                        distribution.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      channel: 'investor' as const,
                      label: 'Investor Materials',
                      color: '#3b82f6',
                      desc: 'One-pager, memo, deck, cap table',
                    },
                    {
                      channel: 'bank' as const,
                      label: 'Bank / SBA Package',
                      color: '#10b981',
                      desc: 'Business plan, use-of-funds, model, checklist',
                    },
                    {
                      channel: 'angel' as const,
                      label: 'Angel / Equity Package',
                      color: '#f59e0b',
                      desc: 'Narrative memo, traction, raise plan',
                    },
                    {
                      channel: 'ny_state' as const,
                      label: 'NY State Programs',
                      color: '#6366f1',
                      desc: 'MWBE, Excelsior, NYSTAR, SBS, ESD',
                    },
                    {
                      channel: 'federal' as const,
                      label: 'Federal Programs',
                      color: '#ef4444',
                      desc: 'SBA 8(a), SBIR/STTR, SAM.gov, FedRAMP',
                    },
                  ].map((card) => {
                    const count = getDocumentsByChannel(card.channel).length;
                    return (
                      <div
                        key={card.channel}
                        className="p-4 rounded-xl border border-border bg-card"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: card.color }}
                          />
                          <p className="text-sm font-semibold text-foreground">{card.label}</p>
                          <span className="ml-auto text-lg font-bold" style={{ color: card.color }}>
                            {count}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{card.desc}</p>
                      </div>
                    );
                  })}
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: '#8b5cf6' }}
                      />
                      <p className="text-sm font-semibold text-foreground">Total Documents</p>
                      <span className="ml-auto text-lg font-bold" style={{ color: '#8b5cf6' }}>
                        {CAPITAL_DOCUMENTS.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {
                        CAPITAL_DOCUMENTS.filter(
                          (d) => d.status === 'ready' || d.status === 'final',
                        ).length
                      }{' '}
                      ready, {CAPITAL_DOCUMENTS.filter((d) => d.printable).length} printable
                    </p>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <Link href="/admin/capital-arsenal">
                    <a className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                      <BookOpen className="w-4 h-4" /> Open Capital Management
                    </a>
                  </Link>
                </div>
              </div>
            )}
            {activeSection === 'certification-readiness' && <CertificationReadinessOS />}
            {activeSection === 'onboarding-status' && <OnboardingPanel />}
            {activeSection === 'azure-tenants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-primary" /> Azure AD Tenant Management
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Manage enterprise Azure AD tenants and SSO provisioning.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/admin/azure-onboarding">
                      <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors">
                        <UserCheck className="w-3.5 h-3.5" /> Onboard Wizard
                      </a>
                    </Link>
                    <Link href="/admin/azure-tenants">
                      <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Full Dashboard
                      </a>
                    </Link>
                  </div>
                </div>
                <AzureTenantsPanel />
              </div>
            )}
            {activeSection === 'scim-provisioning' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> SCIM 2.0 Provisioning
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Enterprise IdP user auto-sync — manage tokens, provisioned users, and sync
                      status per tenant.
                    </p>
                  </div>
                  <Link href="/admin/scim">
                    <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Open Dashboard
                    </a>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: '🔐',
                      label: 'Bearer Token Auth',
                      desc: 'Per-tenant SCIM tokens generated and stored securely. Revoke anytime.',
                    },
                    {
                      icon: '👥',
                      label: 'User Provisioning',
                      desc: 'Users created, updated, and deactivated via RFC 7644 PATCH/PUT/DELETE.',
                    },
                    {
                      icon: '🏷️',
                      label: 'Group → Role Mapping',
                      desc: 'IdP groups map to platform roles automatically on sync.',
                    },
                  ].map((r) => (
                    <div key={r.label} className="bg-card border border-border rounded-xl p-4">
                      <div className="text-2xl mb-2">{r.icon}</div>
                      <div className="text-sm font-semibold text-foreground mb-1">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === 'cms-posts' && <CmsPostsPanel />}
            {activeSection === 'powerbi' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" /> Power BI Embedded
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Configure Power BI workspace credentials to embed live analytics reports.
                    </p>
                  </div>
                  <Link href="/admin/powerbi">
                    <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Configure
                    </a>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      icon: '🛡️',
                      label: 'Security Posture Report',
                      app: 'PARAGON',
                      path: '/aegis/powerbi',
                      color: '#3b82f6',
                      desc: 'Real-time security posture metrics, incident trends, and compliance scores.',
                    },
                    {
                      icon: '🏢',
                      label: 'Portfolio Analytics Report',
                      app: 'DOMAINE',
                      path: '/terra/powerbi',
                      color: '#10b981',
                      desc: 'Property-level analytics including NOI, occupancy, IRR, and distress signals.',
                    },
                    {
                      icon: '⚡',
                      label: 'Operational KPIs Report',
                      app: 'KORA',
                      path: '/command/operations/powerbi',
                      color: '#f59e0b',
                      desc: 'Decision intelligence KPIs including SLA performance and PRAXIS health scores.',
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${r.color}22` }}
                      >
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="text-sm font-semibold text-foreground">{r.label}</div>
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            {r.app}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{r.desc}</div>
                      </div>
                      <Link href={r.path}>
                        <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-muted/10 p-5 text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <div className="text-sm font-medium text-foreground mb-1">
                    Configure Power BI credentials to activate embedded reports
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Requires a Power BI Pro or Premium license and an Azure App Registration.
                  </p>
                  <Link href="/admin/powerbi">
                    <a className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Open Configuration Page
                    </a>
                  </Link>
                </div>
              </div>
            )}
            {activeSection === 'pages' && <PagesPanel />}
            {activeSection === 'ventures' && <VenturesPanel />}
            {activeSection === 'services' && <ServicesPanel />}
            {activeSection === 'articles' && <ArticlesPanel />}
            {activeSection === 'case-studies' && <CaseStudiesPanel />}
            {activeSection === 'roadmap' && <RoadmapPanel />}
            {activeSection === 'updates' && <UpdatesPanel />}
            {activeSection === 'ctas' && <CtasPanel />}
            {activeSection === 'navigation' && <NavigationPanel />}
            {activeSection === 'testimonials' && <TestimonialsPanel />}
            {activeSection === 'faqs' && <FaqsPanel />}
            {activeSection === 'inquiries' && <InquiriesPanel />}
            {activeSection === 'submissions' && <SubmissionsPanel />}
            {activeSection === 'feedback' && <FeedbackPanel />}
            {activeSection === 'analytics' && <AnalyticsPanel />}
            {activeSection === 'backup' && <BackupPanel />}
            {activeSection === 'provisioning' && <ProvisioningPanel />}
          </m.div>
        </main>
      </div>
    </div>
  );
}
