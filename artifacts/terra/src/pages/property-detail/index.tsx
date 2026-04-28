import { ActivityFeed, CommentThread } from '@szl-holdings/shared-ui/collaboration';
import { type OperationalEntity, OperationalQueueRow } from '@szl-holdings/shared-ui/operational-primitives';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import {
  Activity, ArrowLeft, Building2, Clock, DollarSign, Download, Eye, FileText, Flame,
  LayoutDashboard, Loader2, MapPin, Shield, Tag, Target, TrendingUp, Users,
} from 'lucide-react';
import { type ComponentType, type CSSProperties, useCallback, useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { AtlasScenePanel } from '@/components/atlas-scene-panel';
import { alerts, properties, tenants } from '@/data/portfolio';
import { type GqlTerraActionItem, gqlFetch } from '@/lib/api';
import { ActionsTab } from './actions-tab';
import { DiligenceTab } from './diligence-tab';
import { OverviewTab } from './overview-tab';
import { OwnershipTab } from './ownership-tab';
import { WhyNowTab } from './why-now-tab';
import {
  ACTION_ITEMS,
  DILIGENCE_CHECKLISTS,
  OWNERSHIP_RECORDS,
  SOURCE_LABELS,
} from './data';
import {
  GQL_ACTION_ITEMS,
  GQL_SEED_ACTIONS,
  GQL_UPDATE_ACTION,
  downloadPropertyPDF,
  formatCurrency,
  statusConfig,
  type DetailTab,
  type WhyNowApiResponse,
  type WhyNowPanelData,
} from './utils';

function FreshnessTag({ label, confidence }: { label: string; confidence?: string }) {
  const confColor = confidence === 'High' ? '#10b981' : confidence === 'Medium' ? '#f59e0b' : 'rgba(255,255,255,0.3)';
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
      <Clock className="w-2.5 h-2.5" style={{ color: confColor }} />
      {label}
      {confidence && <span style={{ color: confColor, marginLeft: 2 }}>{confidence}</span>}
    </span>
  );
}

function ProvenanceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(200,160,96,0.04)', border: '1px solid rgba(200,160,96,0.1)', color: 'rgba(200,160,96,0.5)' }}>
      <Tag className="w-2.5 h-2.5" />{source}
    </span>
  );
}

export default function PropertyDetailPage() {
  const [, params] = useRoute('/property/:id');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [liveActionItems, setLiveActionItems] = useState<GqlTerraActionItem[] | null>(null);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null);
  const [whyNowData, setWhyNowData] = useState<WhyNowPanelData | null>(null);
  const [whyNowLoading, setWhyNowLoading] = useState(false);
  const [whyNowError, setWhyNowError] = useState<string | null>(null);

  const property = properties.find((p) => p.id === params?.id);

  const loadActionItems = useCallback(async (propertyId: string) => {
    setActionItemsLoading(true);
    try {
      const data = await gqlFetch<{ terraActionItems: GqlTerraActionItem[] }>(GQL_ACTION_ITEMS, { propertyId });
      if (data.terraActionItems.length === 0) {
        const seeded = await gqlFetch<{ seedTerraActionItems: GqlTerraActionItem[] }>(GQL_SEED_ACTIONS, { propertyId });
        setLiveActionItems(seeded.seedTerraActionItems);
      } else {
        setLiveActionItems(data.terraActionItems);
      }
    } catch { setLiveActionItems(null); }
    finally { setActionItemsLoading(false); }
  }, []);

  const updateActionStatus = useCallback(async (id: string, status: string, propertyId: string) => {
    setUpdatingActionId(id);
    try {
      await gqlFetch<{ updateTerraActionItem: GqlTerraActionItem }>(GQL_UPDATE_ACTION, { id, status });
      await loadActionItems(propertyId);
    } catch { /* Silently fail */ }
    finally { setUpdatingActionId(null); }
  }, [loadActionItems]);

  useEffect(() => {
    if (params?.id && activeTab === 'actions') loadActionItems(params.id);
  }, [params?.id, activeTab, loadActionItems]);

  useEffect(() => {
    if (activeTab !== 'why-now' || !params?.id) return;
    if (whyNowData || whyNowLoading) return;
    setWhyNowLoading(true);
    setWhyNowError(null);
    fetch(`/api/terra/why-this-property/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'not-found' : 'error');
        const json = (await res.json()) as WhyNowApiResponse;
        const dd = json.distressDecomposition;
        setWhyNowData({
          distressScore: dd.total,
          distressTier: dd.tier.charAt(0).toUpperCase() + dd.tier.slice(1),
          dealNarrative: dd.headline,
          factors: dd.factors.map((f) => ({ name: f.factor, score: f.score, maxScore: f.maxScore, summary: f.summary })),
          computedAt: json.fetchedAt,
          partialOutage: json.partialOutage,
        });
      })
      .catch((err: Error) => setWhyNowError(err.message))
      .finally(() => setWhyNowLoading(false));
  }, [activeTab, params?.id, whyNowData, whyNowLoading]);

  if (!property) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Property not found</p>
          <Link href="/dashboard"><span className="text-sm mt-2 inline-block cursor-pointer hover:underline" style={{ color: '#40856a' }}>Back to Dashboard</span></Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[property.status];
  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);
  const propertyAlerts = alerts.filter((a) => a.propertyId === property.id);
  const appreciation = (((property.value - property.purchasePrice) / property.purchasePrice) * 100).toFixed(1);
  const ownership = OWNERSHIP_RECORDS[property.id as keyof typeof OWNERSHIP_RECORDS] ?? null;
  const diligence = DILIGENCE_CHECKLISTS[property.id as keyof typeof DILIGENCE_CHECKLISTS] || [];
  const staticActionItems = ACTION_ITEMS[property.id as keyof typeof ACTION_ITEMS] || [];
  const isLiveData = liveActionItems !== null;
  const actionItems: GqlTerraActionItem[] = liveActionItems ?? staticActionItems.map((a) => ({
    id: a.id, externalId: a.id, propertyId: property.id, issue: a.issue, severity: a.severity,
    ownerName: a.owner, ownerRole: a.ownerRole, dueDate: a.due, status: a.status.replace('-', '_'),
    recommendedAction: a.action, resolvedAt: null, createdAt: '', updatedAt: '',
  }));
  const sourceInfo = SOURCE_LABELS[property.id as keyof typeof SOURCE_LABELS];
  const seedMultipliers = [0.94, 0.97, 1.0, 0.96, 1.02, 1.04, 1.01, 0.98, 1.05, 1.03, 1.06, 1.08];
  const expenseRatios = [0.62, 0.6, 0.61, 0.63, 0.59, 0.6, 0.64, 0.62, 0.61, 0.63, 0.6, 0.59];
  const financialHistory = seedMultipliers.map((mult, i) => {
    const rev = Math.round(property.monthlyRevenue * mult);
    const exp = Math.round(rev * expenseRatios[i]);
    return { month: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i], revenue: rev, expenses: exp, noi: rev - exp };
  });
  const occupancyData = [{ name: 'Occupied', value: property.occupancy }, { name: 'Vacant', value: 100 - property.occupancy }];

  type LucideIcon = ComponentType<{ className?: string; style?: CSSProperties }>;
  const tabs: { id: DetailTab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'why-now', label: 'Why This Property Now', icon: Flame },
    { id: 'ownership', label: 'Ownership & Debt', icon: Shield },
    { id: 'diligence', label: 'Diligence', icon: FileText, count: diligence.filter((d) => d.status === 'flagged').length || undefined },
    { id: 'actions', label: 'Action Routing', icon: Target, count: actionItems.filter((a) => a.status !== 'resolved').length || undefined },
    { id: 'atlas', label: 'ATLAS Scene', icon: Activity },
  ];

  return (
    <div className="space-y-4 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-sm mb-4 cursor-pointer transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </span>
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{property.name}</h1>
              <span className={cn('text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide border', status.color, status.border)}>{status.label}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <MapPin className="w-3.5 h-3.5" />{property.address}, {property.city}, {property.state}
              </span>
              {sourceInfo && (<><ProvenanceTag source={sourceInfo.source} /><FreshnessTag label={sourceInfo.freshness} confidence={sourceInfo.confidence} /></>)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/evidence?entity=${encodeURIComponent(property.id)}`}>
              <button data-testid="link-view-evidence" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(139,122,200,0.1)', border: '1px solid rgba(139,122,200,0.25)', color: '#8b7ac8' }}>
                <Eye className="w-3.5 h-3.5" /> View Evidence
              </button>
            </Link>
            <Link href="/lender-report">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(64,133,106,0.1)', border: '1px solid rgba(64,133,106,0.2)', color: '#40856a' }}>
                <FileText className="w-3.5 h-3.5" /> Reporting Pack
              </button>
            </Link>
            <button
              onClick={async () => {
                setDownloading(true);
                const distressScore = property.status === 'critical' ? 78 : property.status === 'watch' ? 45 : 18;
                const tenantDelinquency = propertyTenants.filter((t) => t.status === 'delinquent').length;
                const leaseExpiring = propertyTenants.filter((t) => t.status === 'expiring').length;
                const investmentThesis = property.status === 'critical'
                  ? `${property.name} exhibits elevated distress signals. Below-market occupancy (${property.occupancy}%), ${tenantDelinquency > 0 ? `${tenantDelinquency} delinquent tenant(s), ` : ''}and a cap rate of ${property.capRate}% imply repricing opportunity.`
                  : `${property.name} is a ${property.status} asset with ${property.occupancy}% occupancy and ${property.capRate}% cap rate generating ${formatCurrency(property.annualNOI)} annual NOI.`;
                const distressFactors = [`Occupancy rate: ${property.occupancy}%`, `Cap rate: ${property.capRate}%`, ...(tenantDelinquency > 0 ? [`${tenantDelinquency} delinquent tenant(s)`] : []), ...(leaseExpiring > 0 ? [`${leaseExpiring} expiring lease(s)`] : [])];
                try { await downloadPropertyPDF(property as unknown as Record<string, unknown>, { distressScore, investmentThesis, distressFactors }); }
                catch { setDownloadError('PDF generation failed.'); }
                finally { setDownloading(false); }
              }}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6' }}
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {downloading ? 'Generating...' : 'Export PDF'}
            </button>
          </div>
        </div>
        {downloadError && <p className="text-[10px] text-rose-400 mt-1">{downloadError}</p>}
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Property Value', value: formatCurrency(property.value), icon: Building2 },
          { label: 'Monthly Revenue', value: formatCurrency(property.monthlyRevenue), icon: DollarSign },
          { label: 'Annual NOI', value: formatCurrency(property.annualNOI), icon: TrendingUp },
          { label: 'Cap Rate', value: `${property.capRate}%`, icon: TrendingUp },
          { label: 'Occupancy', value: `${property.occupancy}%`, icon: Users },
          { label: 'Appreciation', value: `+${appreciation}%`, icon: TrendingUp },
        ].map((metric, i) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <metric.icon className="w-4 h-4 mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{metric.label}</p>
            <p className="text-lg font-bold text-white">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative"
            style={{ color: activeTab === tab.id ? '#40856a' : 'rgba(255,255,255,0.4)', borderBottom: activeTab === tab.id ? '2px solid #40856a' : '2px solid transparent' }}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab property={property} propertyTenants={propertyTenants} propertyAlerts={propertyAlerts} financialHistory={financialHistory} occupancyData={occupancyData} />
      )}
      {activeTab === 'ownership' && <OwnershipTab ownership={ownership} />}
      {activeTab === 'diligence' && <DiligenceTab diligence={diligence} />}
      {activeTab === 'actions' && (
        <ActionsTab
          actionItems={actionItems}
          actionItemsLoading={actionItemsLoading}
          isLiveData={isLiveData}
          updatingActionId={updatingActionId}
          propertyId={property.id}
          onUpdateStatus={updateActionStatus}
        />
      )}
      {activeTab === 'atlas' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4">
          <AtlasScenePanel propertyId={params?.id} isDemo={true} />
        </motion.div>
      )}
      {activeTab === 'why-now' && (
        <WhyNowTab
          propertyId={property.id}
          whyNowLoading={whyNowLoading}
          whyNowError={whyNowError}
          whyNowData={whyNowData}
          onRetry={() => { setWhyNowError(null); setWhyNowData(null); }}
        />
      )}
    </div>
  );
}
