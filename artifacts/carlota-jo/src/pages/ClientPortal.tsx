import { useAuth } from '@szl-holdings/replit-auth-web';
import { RealtimeStatusIndicator } from '@szl-holdings/shared-ui/realtime-status-indicator';
import { useRealtimeChannel } from '@szl-holdings/shared-ui/use-realtime-channel';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';

const portalNav = [
  { label: 'Overview', href: '/client-portal', icon: LayoutDashboard },
  { label: 'Documents', href: '/client-portal/documents', icon: FileText },
  { label: 'Updates', href: '/client-portal/updates', icon: Bell },
  { label: 'Messages', href: '/client-portal/messages', icon: MessageSquare },
  { label: 'Invoices', href: '/client-portal/settings', icon: CreditCard },
];

function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f9f6f1' }}
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#f9f6f1' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm w-full text-center"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(154,125,82,0.1)', border: '1px solid rgba(154,125,82,0.2)' }}
          >
            <Lock className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
          </div>
          <p
            className="text-[10px] font-medium tracking-[0.3em] uppercase mb-3"
            style={{ color: 'var(--color-gold)' }}
          >
            Client Portal
          </p>
          <h1
            className="text-2xl font-light mb-3"
            style={{
              fontFamily: "Georgia, 'Palatino Linotype', serif",
              color: 'var(--color-ink-900)',
            }}
          >
            Private access only.
          </h1>
          <p
            className="text-[13px] font-light leading-relaxed mb-8"
            style={{ color: 'var(--color-ink-500)' }}
          >
            The Carlota Jo client portal is available exclusively to active clients. Sign in to
            access your documents, messages, and engagement status.
          </p>
          <button
            onClick={login}
            className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
            style={{ color: 'var(--color-cream)', background: 'var(--color-gold)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
          >
            Sign in
          </button>
          <div className="mt-8">
            <Link href="/">
              <span
                className="text-[12px] font-light transition-colors"
                style={{ color: 'var(--color-ink-400)' }}
              >
                ← Return to carlotajo.com
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

function PortalShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}) {
  const { logout } = useAuth();
  const { status: wsStatus } = useRealtimeChannel('bookings');

  return (
    <PortalAuthGuard>
      <div className="min-h-screen flex" style={{ background: '#0e0c09' }}>
        <aside
          className="w-56 border-r flex flex-col h-screen sticky top-0"
          style={{ borderColor: 'rgba(196,170,126,0.08)' }}
        >
          <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(196,170,126,0.08)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-[15px] font-light leading-none"
                  style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
                >
                  Carlota Jo
                </h1>
                <p
                  className="text-[9px] tracking-[0.25em] uppercase mt-0.5"
                  style={{ color: 'rgba(200,169,106,0.45)' }}
                >
                  Client Portal
                </p>
              </div>
              <RealtimeStatusIndicator status={wsStatus} compact />
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {portalNav.map(({ label, href, icon: Icon }) => {
              const isActive = currentPath === href;
              return (
                <Link key={href} href={href}>
                  <div
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-light transition-colors cursor-pointer rounded-none ${
                      isActive ? 'text-[#f5f0e8]' : 'hover:text-[rgba(245,240,232,0.65)]'
                    }`}
                    style={{
                      color: isActive ? '#f5f0e8' : 'rgba(245,240,232,0.3)',
                      background: isActive ? 'rgba(200,169,106,0.07)' : 'transparent',
                      borderLeft: isActive
                        ? '1px solid rgba(200,169,106,0.35)'
                        : '1px solid transparent',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(196,170,126,0.08)' }}>
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-light transition-colors w-full"
              style={{ color: 'rgba(245,240,232,0.2)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.45)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.2)';
              }}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto px-8 py-8 max-w-3xl">{children}</main>
      </div>
    </PortalAuthGuard>
  );
}

const engagementStages = [
  {
    phase: 'Discovery Call',
    status: 'complete' as const,
    dates: 'Feb 15, 2026',
    desc: 'Initial confidential conversation to understand the household, properties, and priorities.',
  },
  {
    phase: 'Needs Assessment',
    status: 'complete' as const,
    dates: 'Feb 22 – Mar 5, 2026',
    desc: 'Rosa visits the property, meets the household team, and conducts a full operational review.',
  },
  {
    phase: 'Service Plan',
    status: 'complete' as const,
    dates: 'Mar 8, 2026',
    desc: 'A tailored service plan is prepared, covering scope, protocols, and communication cadence.',
  },
  {
    phase: 'Onboarding',
    status: 'active' as const,
    dates: 'Mar 10 – Apr 4, 2026',
    desc: 'Rosa assumes operational oversight. Vendor relationships are confirmed, systems are documented.',
  },
  {
    phase: 'Active Management',
    status: 'upcoming' as const,
    dates: 'From Apr 7, 2026',
    desc: 'Ongoing residential management, monthly reporting, and quarterly review sessions.',
  },
];

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

function usePortalData<T>(endpoint: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(endpoint, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 401 || res.status === 403) {
        setIsAuthenticated(false);
        setStatus('success');
        return;
      }
      setIsAuthenticated(true);
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const json = await res.json();
      const rows = json?.data ?? json;
      if (Array.isArray(rows)) {
        setData(rows as T);
      }
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const isDemo = isAuthenticated === false;
  return { data, status, isDemo, reload: load };
}

export function ClientPortalOverview() {
  const [location] = useLocation();
  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <p
          className="text-[11px] font-medium tracking-[0.25em] uppercase mb-2"
          style={{ color: 'rgba(200,169,106,0.55)' }}
        >
          Client Portal
        </p>
        <h1
          className="text-2xl font-light mb-1"
          style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
        >
          Good morning, Lady Ashworth
        </h1>
        <p className="text-[13px] font-light" style={{ color: 'rgba(245,240,232,0.35)' }}>
          Active engagement · Onboarding phase
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {[
          { label: 'Documents', count: '11', sub: '3 awaiting review' },
          { label: 'Unread updates', count: '2', sub: 'Last: 3 days ago' },
          { label: 'New messages', count: '1', sub: 'From Rosa, Mar 31' },
          { label: 'Next review', count: 'Apr 7', sub: '10:00 AM · London' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 transition-colors"
            style={{ border: '1px solid rgba(245,240,232,0.06)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,169,106,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.06)';
            }}
          >
            <p
              className="text-[11px] font-light tracking-wider mb-1"
              style={{ color: 'rgba(245,240,232,0.25)' }}
            >
              {kpi.label}
            </p>
            <p
              className="text-[22px] font-light"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
            >
              {kpi.count}
            </p>
            <p
              className="text-[11px] font-light mt-0.5"
              style={{ color: 'rgba(245,240,232,0.25)' }}
            >
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p
          className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
          style={{ color: 'rgba(200,169,106,0.45)' }}
        >
          Engagement Timeline
        </p>
        <div className="space-y-0">
          {engagementStages.map((phase, i) => (
            <div key={phase.phase} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    background:
                      phase.status === 'complete'
                        ? 'rgba(200,169,106,0.18)'
                        : phase.status === 'active'
                          ? 'rgba(200,169,106,0.28)'
                          : 'rgba(245,240,232,0.05)',
                    outline:
                      phase.status === 'active' ? '1px solid rgba(200,169,106,0.38)' : undefined,
                  }}
                >
                  {phase.status === 'complete' ? (
                    <CheckCircle2 className="w-3 h-3" style={{ color: '#c8a96a' }} />
                  ) : phase.status === 'active' ? (
                    <ArrowRight className="w-3 h-3" style={{ color: '#c8a96a' }} />
                  ) : (
                    <Clock className="w-3 h-3" style={{ color: 'rgba(245,240,232,0.2)' }} />
                  )}
                </div>
                {i < engagementStages.length - 1 && (
                  <div
                    className="w-px h-10"
                    style={{
                      background:
                        phase.status === 'complete'
                          ? 'rgba(200,169,106,0.18)'
                          : 'rgba(245,240,232,0.05)',
                    }}
                  />
                )}
              </div>
              <div className="pb-2 pt-0.5">
                <p
                  className="text-[13px] font-light"
                  style={{
                    color:
                      phase.status === 'active'
                        ? 'rgba(245,240,232,0.88)'
                        : phase.status === 'complete'
                          ? 'rgba(245,240,232,0.5)'
                          : 'rgba(245,240,232,0.22)',
                  }}
                >
                  {phase.phase}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245,240,232,0.18)' }}>
                  {phase.dates}
                </p>
                {phase.status === 'active' && (
                  <p
                    className="text-[11px] mt-1 font-light"
                    style={{ color: 'rgba(200,169,106,0.5)' }}
                  >
                    {phase.desc}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p
          className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
          style={{ color: 'rgba(200,169,106,0.45)' }}
        >
          Your Properties
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Mayfair Residence', location: 'London, W1', status: 'Primary — Active' },
            {
              name: 'Oxfordshire Estate',
              location: 'Oxfordshire, UK',
              status: 'Secondary — Seasonal',
            },
          ].map((prop) => (
            <div
              key={prop.name}
              className="p-4"
              style={{ border: '1px solid rgba(245,240,232,0.06)' }}
            >
              <p className="text-[13px] font-light" style={{ color: 'rgba(245,240,232,0.75)' }}>
                {prop.name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(200,169,106,0.45)' }}>
                {prop.location}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(245,240,232,0.2)' }}>
                {prop.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}

type DocRow = {
  id: number;
  name?: string;
  title?: string;
  createdAt: string;
  status?: string;
  category?: string;
  visibility?: string;
  fileSize?: string;
  fileUrl?: string | null;
};

export function ClientPortalDocuments() {
  const [location] = useLocation();
  const [filter, setFilter] = useState<string>('all');
  const [uploadHovered, setUploadHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const { data: documents, isDemo, reload } = usePortalData<DocRow[]>('/api/portal/documents', []);
  const typedDocs: DocRow[] = documents;
  const categories: string[] = [
    'all',
    ...Array.from(new Set(typedDocs.map((d: DocRow) => d.category ?? 'Other'))),
  ];
  const filtered =
    filter === 'all'
      ? typedDocs
      : typedDocs.filter((d: DocRow) => (d.category ?? 'Other') === filter);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'Client Upload');
        formData.append('visibility', 'client');
        const res = await fetch('/api/portal/documents', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error((json as { message?: string }).message ?? 'Upload failed');
        }
        setUploadSuccess(`${file.name} uploaded successfully.`);
        reload();
      } catch (err) {
        setUploadError(
          err instanceof Error
            ? err.message
            : 'Upload failed — please try again or email the document to inquiries@carlotajo.com.',
        );
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    },
    [reload],
  );

  return (
    <PortalShell currentPath={location}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-light"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
          >
            Document Vault
          </h1>
          <p className="text-[13px] font-light mt-1" style={{ color: 'rgba(245,240,232,0.35)' }}>
            Shared materials, reports, and signed agreements
          </p>
          {isDemo && (
            <span
              className="inline-flex items-center mt-2 px-2 py-0.5 text-[9px] tracking-widest uppercase font-medium rounded"
              style={{
                background: 'rgba(200,169,106,0.08)',
                border: '1px solid rgba(200,169,106,0.18)',
                color: 'rgba(200,169,106,0.55)',
              }}
            >
              Sample data
            </span>
          )}
          {uploadSuccess && (
            <p className="text-[10px] mt-1 font-light" style={{ color: 'rgba(120,200,120,0.7)' }}>
              {uploadSuccess}
            </p>
          )}
          {uploadError && (
            <p className="text-[10px] mt-1 font-light" style={{ color: 'rgba(220,100,100,0.7)' }}>
              {uploadError}
            </p>
          )}
        </div>
        <label
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium tracking-wider uppercase transition-colors cursor-pointer"
          style={{
            background: uploadHovered ? 'rgba(200,169,106,0.15)' : 'rgba(200,169,106,0.08)',
            border: '1px solid rgba(200,169,106,0.2)',
            color: uploading ? 'rgba(200,169,106,0.5)' : '#c8a96a',
            pointerEvents: uploading ? 'none' : 'auto',
          }}
          onMouseEnter={() => setUploadHovered(true)}
          onMouseLeave={() => setUploadHovered(false)}
        >
          <Upload className="w-3 h-3" />
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading || isDemo}
          />
        </label>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="text-[10px] tracking-wider uppercase px-3 py-1.5 transition-colors"
            style={{
              color: filter === cat ? '#c8a96a' : 'rgba(245,240,232,0.25)',
              background: filter === cat ? 'rgba(200,169,106,0.08)' : 'transparent',
              border:
                filter === cat
                  ? '1px solid rgba(200,169,106,0.2)'
                  : '1px solid rgba(245,240,232,0.06)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((doc: DocRow) => {
          const docName = doc.name ?? doc.title ?? 'Untitled document';
          const docDate = doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—';
          const docStatus = doc.status ?? 'Available';
          const docCategory = doc.category ?? 'General';
          const docSize = doc.fileSize ?? '—';
          return (
            <div
              key={doc.id}
              className="p-4 flex items-center justify-between transition-colors group"
              style={{ border: '1px solid rgba(245,240,232,0.06)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,169,106,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.06)';
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[9px] tracking-wider uppercase px-1.5 py-0.5"
                    style={{
                      color: 'rgba(200,169,106,0.4)',
                      border: '1px solid rgba(200,169,106,0.12)',
                    }}
                  >
                    {docCategory}
                  </span>
                  {(docStatus === 'New' || docStatus === 'Awaiting review') && (
                    <span
                      className="text-[9px] tracking-wider uppercase px-1.5 py-0.5"
                      style={{ color: '#c8a96a', background: 'rgba(200,169,106,0.1)' }}
                    >
                      {docStatus}
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-light" style={{ color: 'rgba(245,240,232,0.75)' }}>
                  {docName}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245,240,232,0.2)' }}>
                  {docDate} · {docSize}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span
                  className="text-[10px] font-light tracking-wider px-2.5 py-1"
                  style={{
                    color:
                      docStatus === 'Awaiting review' || docStatus === 'New'
                        ? '#c8a96a'
                        : 'rgba(245,240,232,0.25)',
                    border:
                      docStatus === 'Awaiting review' || docStatus === 'New'
                        ? '1px solid rgba(200,169,106,0.18)'
                        : '1px solid rgba(245,240,232,0.08)',
                  }}
                >
                  {docStatus}
                </span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 transition-colors"
                    style={{ color: 'rgba(245,240,232,0.2)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.55)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.2)';
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 transition-colors"
                      style={{ color: 'rgba(245,240,232,0.2)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.55)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.2)';
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}

type UpdateRow = {
  id: number;
  title?: string;
  subject?: string;
  body?: string;
  content?: string;
  summary?: string;
  bodyRichtext?: string;
  tag?: string;
  category?: string;
  isNew?: boolean;
  isRead?: boolean;
  createdAt: string;
};

export function ClientPortalUpdates() {
  const [location] = useLocation();
  const { data: updates, isDemo } = usePortalData<UpdateRow[]>('/api/portal/updates', []);

  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <h1
          className="text-2xl font-light"
          style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
        >
          Updates
        </h1>
        <p className="text-[13px] font-light mt-1" style={{ color: 'rgba(245,240,232,0.35)' }}>
          Operational progress, delivery notes, and engagement milestones
        </p>
        {isDemo && (
          <span
            className="inline-flex items-center mt-2 px-2 py-0.5 text-[9px] tracking-widest uppercase font-medium rounded"
            style={{
              background: 'rgba(200,169,106,0.08)',
              border: '1px solid rgba(200,169,106,0.18)',
              color: 'rgba(200,169,106,0.55)',
            }}
          >
            Sample data
          </span>
        )}
      </div>
      <div className="space-y-8">
        {(updates as UpdateRow[]).map((update) => {
          const title = update.title ?? update.subject ?? 'Update';
          const body = update.body ?? update.bodyRichtext ?? update.summary ?? update.content ?? '';
          const tag = update.tag ?? update.category ?? 'Update';
          const isNew = update.isNew ?? !update.isRead;
          const dateStr = update.createdAt
            ? new Date(update.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '—';
          return (
            <div
              key={update.id}
              className="pl-5"
              style={{ borderLeft: '1px solid rgba(200,169,106,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <p
                  className="text-[10px] font-medium tracking-[0.18em] uppercase"
                  style={{ color: 'rgba(200,169,106,0.45)' }}
                >
                  {dateStr}
                </p>
                <span
                  className="text-[9px] tracking-wider uppercase px-1.5 py-0.5"
                  style={{
                    color: isNew ? '#c8a96a' : 'rgba(245,240,232,0.15)',
                    border: isNew
                      ? '1px solid rgba(200,169,106,0.2)'
                      : '1px solid rgba(245,240,232,0.06)',
                  }}
                >
                  {tag}
                </span>
              </div>
              <h3
                className="text-[15px] font-light mb-1.5"
                style={{
                  fontFamily: "Georgia, 'Palatino Linotype', serif",
                  color: 'rgba(245,240,232,0.82)',
                }}
              >
                {title}
              </h3>
              <p
                className="text-[13px] font-light leading-relaxed"
                style={{ color: 'rgba(245,240,232,0.38)' }}
              >
                {body}
              </p>
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}

type MessageRow = {
  id: number;
  senderName?: string;
  senderUserId?: number;
  fromRosa?: boolean;
  body?: string;
  content?: string;
  bodyRichtext?: string;
  subject?: string;
  direction?: string;
  createdAt: string;
};

export function ClientPortalMessages() {
  const [location] = useLocation();
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sentError, setSentError] = useState('');

  const {
    data: messages,
    isDemo,
    reload: loadMessages,
  } = usePortalData<MessageRow[]>('/api/portal/messages', []);

  const handleSend = async () => {
    if (!newMsg.trim() || isDemo) return;
    setSending(true);
    setSentError('');
    try {
      const res = await fetch('/api/portal/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyRichtext: newMsg.trim(),
          subject: 'Client message',
          direction: 'client-to-advisor',
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      setNewMsg('');
      loadMessages();
    } catch {
      setSentError('Unable to send — please email inquiries@carlotajo.com directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PortalShell currentPath={location}>
      <div className="mb-6">
        <h1
          className="text-2xl font-light"
          style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
        >
          Messages
        </h1>
        <p className="text-[13px] font-light mt-1" style={{ color: 'rgba(245,240,232,0.35)' }}>
          Private correspondence with Carlota Jo
        </p>
        {isDemo && (
          <span
            className="inline-flex items-center mt-2 px-2 py-0.5 text-[9px] tracking-widest uppercase font-medium rounded"
            style={{
              background: 'rgba(200,169,106,0.08)',
              border: '1px solid rgba(200,169,106,0.18)',
              color: 'rgba(200,169,106,0.55)',
            }}
          >
            Sample data
          </span>
        )}
      </div>
      <div className="space-y-3.5 mb-6">
        {(messages as MessageRow[]).map((msg, i) => {
          const isFromRosa = msg.fromRosa !== undefined ? msg.fromRosa : !msg.senderUserId;
          const senderLabel = isFromRosa
            ? (msg.senderName ?? 'Carlota Jo')
            : (msg.senderName ?? 'You');
          const dateStr = msg.createdAt
            ? new Date(msg.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })
            : '—';
          const body = msg.body ?? msg.bodyRichtext ?? msg.content ?? '';
          return (
            <div
              key={msg.id ?? i}
              className="p-4"
              style={{
                background: isFromRosa ? 'rgba(12,14,20,0.6)' : 'rgba(200,169,106,0.05)',
                border: isFromRosa
                  ? '1px solid rgba(245,240,232,0.06)'
                  : '1px solid rgba(200,169,106,0.1)',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <p
                  className="text-[10px] font-medium"
                  style={{ color: isFromRosa ? 'rgba(200,169,106,0.55)' : 'rgba(245,240,232,0.4)' }}
                >
                  {senderLabel}
                </p>
                <span style={{ color: 'rgba(245,240,232,0.12)' }}>·</span>
                <p className="text-[10px]" style={{ color: 'rgba(245,240,232,0.15)' }}>
                  {dateStr}
                </p>
              </div>
              <p
                className="text-[13px] font-light leading-relaxed"
                style={{ color: 'rgba(245,240,232,0.65)' }}
              >
                {body}
              </p>
            </div>
          );
        })}
      </div>
      <div style={{ border: '1px solid rgba(245,240,232,0.08)' }}>
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder={
            isDemo
              ? 'Sign in as a client to send messages to Rosa...'
              : 'Write a message to Rosa...'
          }
          rows={4}
          disabled={isDemo}
          className="w-full bg-transparent px-4 py-3 text-[13px] font-light focus:outline-none resize-none disabled:opacity-50"
          style={{
            color: '#f5f0e8',
            borderBottom: '1px solid rgba(245,240,232,0.08)',
          }}
        />
        <div className="px-4 py-2.5 flex items-center justify-between">
          {sentError && (
            <p className="text-[11px] font-light" style={{ color: 'rgba(200,100,100,0.6)' }}>
              {sentError}
            </p>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending || isDemo}
              className="px-5 py-2 text-[12px] font-medium transition-colors disabled:opacity-40"
              style={{ color: '#0e0c09', background: '#c8a96a' }}
              onMouseEnter={(e) => {
                if (!sending && !isDemo)
                  (e.currentTarget as HTMLElement).style.background = '#d4b87a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#c8a96a';
              }}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-light mt-3" style={{ color: 'rgba(245,240,232,0.15)' }}>
        All messages are handled in complete confidence by Rosa personally.
      </p>
    </PortalShell>
  );
}

export function ClientPortalSettings() {
  const [location] = useLocation();

  const invoices = [
    {
      id: 'INV-0012',
      desc: 'Residence Operations — March 2026',
      issued: 'Mar 1, 2026',
      due: 'Mar 31, 2026',
      amount: '£4,200',
      status: 'Paid',
    },
    {
      id: 'INV-0011',
      desc: 'Residence Operations — February 2026',
      issued: 'Feb 1, 2026',
      due: 'Feb 28, 2026',
      amount: '£4,200',
      status: 'Paid',
    },
    {
      id: 'INV-0010',
      desc: 'Onboarding & Needs Assessment',
      issued: 'Mar 8, 2026',
      due: 'Mar 22, 2026',
      amount: '£1,800',
      status: 'Paid',
    },
    {
      id: 'INV-0013',
      desc: 'Special Project — Oxfordshire Condition Report',
      issued: 'Mar 25, 2026',
      due: 'Apr 15, 2026',
      amount: '£950',
      status: 'Pending',
    },
  ];

  return (
    <PortalShell currentPath={location}>
      <div className="mb-8">
        <h1
          className="text-2xl font-light"
          style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: '#f5f0e8' }}
        >
          Invoices
        </h1>
        <p className="text-[13px] font-light mt-1" style={{ color: 'rgba(245,240,232,0.35)' }}>
          Payment history and outstanding invoices
        </p>
      </div>

      <div
        className="mb-8 p-5"
        style={{ background: 'rgba(200,169,106,0.05)', border: '1px solid rgba(200,169,106,0.12)' }}
      >
        <p
          className="text-[11px] font-medium tracking-[0.2em] uppercase mb-3"
          style={{ color: 'rgba(200,169,106,0.5)' }}
        >
          Account summary
        </p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Monthly retainer', value: '£4,200' },
            { label: 'YTD invoiced', value: '£11,150' },
            { label: 'Outstanding', value: '£950' },
          ].map((item) => (
            <div key={item.label}>
              <p
                className="text-[10px] font-light mb-1"
                style={{ color: 'rgba(245,240,232,0.25)' }}
              >
                {item.label}
              </p>
              <p
                className="text-lg font-light"
                style={{ fontFamily: 'Georgia, serif', color: '#f5f0e8' }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p
        className="text-[11px] font-medium tracking-[0.2em] uppercase mb-3"
        style={{ color: 'rgba(200,169,106,0.45)' }}
      >
        Invoice history
      </p>
      <div className="space-y-2.5">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="p-4 flex items-center justify-between transition-colors group"
            style={{ border: '1px solid rgba(245,240,232,0.06)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,169,106,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.06)';
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px]" style={{ color: 'rgba(200,169,106,0.4)' }}>
                  {inv.id}
                </span>
              </div>
              <p className="text-[13px] font-light" style={{ color: 'rgba(245,240,232,0.72)' }}>
                {inv.desc}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245,240,232,0.2)' }}>
                Issued {inv.issued} · Due {inv.due}
              </p>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <p
                className="text-[14px] font-light"
                style={{ fontFamily: 'Georgia, serif', color: '#f5f0e8' }}
              >
                {inv.amount}
              </p>
              <span
                className="text-[10px] tracking-wider px-2.5 py-1"
                style={{
                  color: inv.status === 'Pending' ? '#c8a96a' : 'rgba(245,240,232,0.25)',
                  border:
                    inv.status === 'Pending'
                      ? '1px solid rgba(200,169,106,0.2)'
                      : '1px solid rgba(245,240,232,0.08)',
                }}
              >
                {inv.status}
              </span>
              <button
                className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'rgba(245,240,232,0.3)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.6)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.3)';
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}>
        <p
          className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4"
          style={{ color: 'rgba(200,169,106,0.45)' }}
        >
          Account details
        </p>
        <div className="space-y-3">
          {[
            { label: 'Client', value: 'Lady Ashworth' },
            { label: 'Engagement', value: 'Residence Operations — Mayfair & Oxfordshire' },
            { label: 'Contact', value: 'inquiries@carlotajo.com' },
            { label: 'Billing currency', value: 'GBP' },
          ].map((field) => (
            <div
              key={field.label}
              className="flex items-start justify-between gap-6 py-3"
              style={{ borderBottom: '1px solid rgba(245,240,232,0.04)' }}
            >
              <p className="text-[11px] font-light" style={{ color: 'rgba(245,240,232,0.25)' }}>
                {field.label}
              </p>
              <p
                className="text-[11px] font-light text-right"
                style={{ color: 'rgba(245,240,232,0.6)' }}
              >
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}

export default ClientPortalOverview;
