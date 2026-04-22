import {
  Eye,
  FileText,
  Rss,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const ACCENT = '#f59e0b';
const RED = '#ef4444';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface OsintSource {
  id: string;
  name: string;
  type: 'news' | 'government' | 'social' | 'regulatory' | 'academic' | 'patent' | 'dark_web';
  status: 'active' | 'delayed' | 'error';
  documentsToday: number;
  entitiesExtracted: number;
  credibilityScore: number;
  lastFetch: string;
}

interface ProcessedItem {
  id: string;
  sourceId: string;
  title: string;
  entities: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  credibility: number;
  relevance: number;
  category: string;
  timestamp: string;
  reviewed: boolean | null;
}

const SOURCES: OsintSource[] = [
  {
    id: 'OS-001',
    name: 'Reuters / AP Wire',
    type: 'news',
    status: 'active',
    documentsToday: 4_821,
    entitiesExtracted: 12_450,
    credibilityScore: 96,
    lastFetch: '2024-03-15T14:25:00Z',
  },
  {
    id: 'OS-002',
    name: 'SEC/FINRA Filings',
    type: 'regulatory',
    status: 'active',
    documentsToday: 342,
    entitiesExtracted: 1_890,
    credibilityScore: 99,
    lastFetch: '2024-03-15T14:20:00Z',
  },
  {
    id: 'OS-003',
    name: 'Government Publications',
    type: 'government',
    status: 'active',
    documentsToday: 187,
    entitiesExtracted: 920,
    credibilityScore: 97,
    lastFetch: '2024-03-15T14:15:00Z',
  },
  {
    id: 'OS-004',
    name: 'Social Sentiment Feed',
    type: 'social',
    status: 'active',
    documentsToday: 28_400,
    entitiesExtracted: 45_200,
    credibilityScore: 42,
    lastFetch: '2024-03-15T14:28:00Z',
  },
  {
    id: 'OS-005',
    name: 'Academic / arXiv Monitor',
    type: 'academic',
    status: 'delayed',
    documentsToday: 56,
    entitiesExtracted: 340,
    credibilityScore: 91,
    lastFetch: '2024-03-15T12:00:00Z',
  },
  {
    id: 'OS-006',
    name: 'Patent Filing Scanner',
    type: 'patent',
    status: 'active',
    documentsToday: 124,
    entitiesExtracted: 560,
    credibilityScore: 94,
    lastFetch: '2024-03-15T14:10:00Z',
  },
  {
    id: 'OS-007',
    name: 'Dark Web Intelligence',
    type: 'dark_web',
    status: 'active',
    documentsToday: 89,
    entitiesExtracted: 420,
    credibilityScore: 58,
    lastFetch: '2024-03-15T14:22:00Z',
  },
];

const PROCESSED: ProcessedItem[] = [
  {
    id: 'PI-001',
    sourceId: 'OS-001',
    title: "Red Sea shipping attacks force major rerouting — Lloyd's issues advisory",
    entities: ['Houthi', 'Red Sea', "Lloyd's of London", 'Maersk'],
    sentiment: 'negative',
    credibility: 94,
    relevance: 97,
    category: 'Maritime Security',
    timestamp: '2024-03-15T14:20:00Z',
    reviewed: null,
  },
  {
    id: 'PI-002',
    sourceId: 'OS-002',
    title: 'SEC Form 8-K: Pinnacle Technologies discloses China supply chain concentration risk',
    entities: ['Pinnacle Technologies', 'SEC', 'China', 'TSMC'],
    sentiment: 'negative',
    credibility: 99,
    relevance: 88,
    category: 'Regulatory Filing',
    timestamp: '2024-03-15T14:18:00Z',
    reviewed: null,
  },
  {
    id: 'PI-003',
    sourceId: 'OS-004',
    title:
      'Spike in social media discussion: Taiwan military exercises — sentiment strongly negative',
    entities: ['Taiwan', 'PLA', 'TSMC', 'semiconductor'],
    sentiment: 'negative',
    credibility: 38,
    relevance: 72,
    category: 'Geopolitical',
    timestamp: '2024-03-15T14:15:00Z',
    reviewed: null,
  },
  {
    id: 'PI-004',
    sourceId: 'OS-003',
    title: 'EU Commission publishes CBAM implementation timeline — scope expansion confirmed',
    entities: ['EU Commission', 'CBAM', 'carbon tax', 'maritime'],
    sentiment: 'neutral',
    credibility: 98,
    relevance: 85,
    category: 'Regulatory',
    timestamp: '2024-03-15T14:10:00Z',
    reviewed: null,
  },
  {
    id: 'PI-005',
    sourceId: 'OS-006',
    title: 'Chinese patent filing surge in autonomous shipping technology — 340% YoY increase',
    entities: ['China', 'autonomous shipping', 'COSCO', 'ZTE Maritime'],
    sentiment: 'neutral',
    credibility: 92,
    relevance: 65,
    category: 'Technology',
    timestamp: '2024-03-15T14:05:00Z',
    reviewed: null,
  },
  {
    id: 'PI-006',
    sourceId: 'OS-007',
    title: 'Ransomware-as-a-Service group advertising maritime logistics targeting capability',
    entities: ['LockBit 4.0', 'maritime', 'SCADA', 'port systems'],
    sentiment: 'negative',
    credibility: 61,
    relevance: 91,
    category: 'Cyber Threat',
    timestamp: '2024-03-15T14:00:00Z',
    reviewed: null,
  },
];

const typeColor = (t: string) =>
  t === 'news'
    ? BLUE
    : t === 'government'
      ? GREEN
      : t === 'social'
        ? PURPLE
        : t === 'regulatory'
          ? ACCENT
          : t === 'academic'
            ? '#06b6d4'
            : t === 'patent'
              ? '#f59e0b'
              : RED;
const statusColor = (s: string) => (s === 'active' ? GREEN : s === 'delayed' ? ACCENT : RED);
const sentColor = (s: string) =>
  s === 'positive' ? GREEN : s === 'negative' ? RED : DS.text.muted;

export default function OsintPipelinePage() {
  const [items, setItems] = useState(() => PROCESSED.map((p) => ({ ...p })));
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const handleReview = useCallback((id: string, relevant: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, reviewed: relevant } : i)));
  }, []);

  const totalDocs = SOURCES.reduce((s, src) => s + src.documentsToday, 0);
  const totalEntities = SOURCES.reduce((s, src) => s + src.entitiesExtracted, 0);
  const filteredItems =
    sourceFilter === 'all'
      ? items
      : items.filter((i) => SOURCES.find((s) => s.id === i.sourceId)?.type === sourceFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          OSINT Collection & Processing Pipeline
        </h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>
          Automated collection from news, government, regulatory, social, academic, patent, and dark
          web sources with NLP processing
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Documents Ingested Today',
            value: totalDocs.toLocaleString(),
            icon: FileText,
            color: BLUE,
          },
          {
            label: 'Entities Extracted',
            value: totalEntities.toLocaleString(),
            icon: Users,
            color: ACCENT,
          },
          {
            label: 'Active Sources',
            value: SOURCES.filter((s) => s.status === 'active').length.toString(),
            icon: Rss,
            color: GREEN,
          },
          {
            label: 'Pending Review',
            value: items.filter((i) => i.reviewed === null).length.toString(),
            icon: Eye,
            color: PURPLE,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              <span
                className="text-[9px] uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                {s.label}
              </span>
            </div>
            <p className="text-xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
      >
        <h3
          className="text-[10px] uppercase tracking-wider font-semibold mb-3"
          style={{ color: DS.text.muted }}
        >
          Source Health
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSourceFilter(sourceFilter === s.type ? 'all' : s.type)}
              aria-label={`Filter by ${s.name}`}
              className="rounded-lg p-3 text-left transition"
              style={{
                background:
                  sourceFilter === s.type ? `${typeColor(s.type)}10` : 'rgba(255,255,255,0.015)',
                border: `1px solid ${sourceFilter === s.type ? `${typeColor(s.type)}25` : DS.border}`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: statusColor(s.status) }}
                />
                <span
                  className="text-[8px] uppercase font-bold"
                  style={{ color: typeColor(s.type) }}
                >
                  {s.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[9px] text-white font-medium line-clamp-1">{s.name}</p>
              <p className="text-[8px] mt-1" style={{ color: DS.text.muted }}>
                {s.documentsToday.toLocaleString()} docs · {s.credibilityScore}% cred
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3
          className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: DS.text.muted }}
        >
          Processed Intelligence ({filteredItems.length})
        </h3>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-xl p-4"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                {item.id}
              </span>
              <span
                className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                style={{
                  background:
                    `${typeColor(SOURCES.find((s) => s.id === item.sourceId)?.type ?? 'news')}15`,
                  color: typeColor(SOURCES.find((s) => s.id === item.sourceId)?.type ?? 'news'),
                }}
              >
                {item.category}
              </span>
              <span
                className="text-[8px] font-semibold"
                style={{ color: sentColor(item.sentiment) }}
              >
                {item.sentiment}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[8px]" style={{ color: DS.text.muted }}>
                  Cred: <span className="font-semibold text-white">{item.credibility}%</span>
                </span>
                <span className="text-[8px]" style={{ color: DS.text.muted }}>
                  Rel:{' '}
                  <span className="font-semibold" style={{ color: ACCENT }}>
                    {item.relevance}%
                  </span>
                </span>
              </div>
            </div>
            <p className="text-[11px] font-medium text-white mb-2">{item.title}</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {item.entities.slice(0, 4).map((e) => (
                  <span
                    key={e}
                    className="text-[8px] px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${DS.border}`,
                      color: DS.text.secondary,
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
              {item.reviewed === null ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReview(item.id, true)}
                    aria-label={`Mark ${item.id} relevant`}
                    className="text-[8px] font-semibold rounded px-2 py-1 hover:brightness-125 transition"
                    style={{ background: `${GREEN}20`, color: GREEN }}
                  >
                    Relevant
                  </button>
                  <button
                    onClick={() => handleReview(item.id, false)}
                    aria-label={`Dismiss ${item.id}`}
                    className="text-[8px] font-semibold rounded px-2 py-1 hover:brightness-125 transition"
                    style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <span
                  className="text-[8px] font-semibold uppercase"
                  style={{ color: item.reviewed ? GREEN : DS.text.muted }}
                >
                  {item.reviewed ? 'Relevant' : 'Dismissed'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
