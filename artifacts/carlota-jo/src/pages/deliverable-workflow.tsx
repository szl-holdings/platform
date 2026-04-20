import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Filter,
  GitBranch,
  History,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Upload,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

type DeliverableStatus =
  | 'draft'
  | 'internal-review'
  | 'client-review'
  | 'revisions-requested'
  | 'approved'
  | 'archived';

type Comment = {
  id: string;
  author: string;
  authorType: 'internal' | 'client';
  text: string;
  timestamp: string;
  resolved: boolean;
};

type Version = {
  version: string;
  date: string;
  author: string;
  changes: string;
};

type Deliverable = {
  id: string;
  title: string;
  type: 'presentation' | 'report' | 'model' | 'memo' | 'proposal';
  engagement: string;
  client: string;
  status: DeliverableStatus;
  currentVersion: string;
  assignedTo: string;
  dueDate: string;
  reviewers: string[];
  clientReviewers: string[];
  comments: Comment[];
  versions: Version[];
  completeness: number;
};

const STATUS_META: Record<DeliverableStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: '#F8FAFC' },
  'internal-review': { label: 'Internal Review', color: '#D97706', bg: '#FFF7ED' },
  'client-review': { label: 'Client Review', color: '#0284C7', bg: '#EFF6FF' },
  'revisions-requested': { label: 'Revisions Requested', color: '#DC2626', bg: '#FEF2F2' },
  approved: { label: 'Approved', color: '#059669', bg: '#ECFDF5' },
  archived: { label: 'Archived', color: '#64748B', bg: '#F1F5F9' },
};

const TYPE_ICONS: Record<Deliverable['type'], typeof FileText> = {
  presentation: FileText,
  report: FileText,
  model: FileText,
  memo: FileText,
  proposal: FileText,
};

const DELIVERABLES: Deliverable[] = [
  {
    id: 'd1',
    title: 'Q2 Growth Strategy — Board Presentation',
    type: 'presentation',
    engagement: 'Growth Strategy Phase 2',
    client: 'Luminary Brands',
    status: 'client-review',
    currentVersion: 'v2.1',
    assignedTo: 'Carlota Jo',
    dueDate: 'Apr 18, 2026',
    reviewers: ['Carlota Jo', 'James Whitmore'],
    clientReviewers: ['Sarah M., CEO', 'Tom R., CFO'],
    completeness: 95,
    comments: [
      {
        id: 'c1',
        author: 'Tom R., CFO',
        authorType: 'client',
        text: 'Slide 12 — can we add the 3-year sensitivity analysis we discussed? The board will want to see downside scenarios.',
        timestamp: 'Apr 14, 2:34 PM',
        resolved: false,
      },
      {
        id: 'c2',
        author: 'Carlota Jo',
        authorType: 'internal',
        text: 'Sensitivity analysis added in v2.1. Three scenarios modelled: base, conservative (-15%), and optimistic (+20%).',
        timestamp: 'Apr 15, 9:12 AM',
        resolved: true,
      },
      {
        id: 'c3',
        author: 'Sarah M., CEO',
        authorType: 'client',
        text: 'Executive summary is excellent — very clear ask. The market opportunity section on slide 4 could be tightened.',
        timestamp: 'Apr 15, 11:45 AM',
        resolved: false,
      },
    ],
    versions: [
      {
        version: 'v1.0',
        date: 'Apr 8, 2026',
        author: 'Carlota Jo',
        changes: 'Initial draft — structure and section outlines',
      },
      {
        version: 'v1.1',
        date: 'Apr 10, 2026',
        author: 'James Whitmore',
        changes: 'Brand positioning section rewritten; competitor analysis expanded',
      },
      {
        version: 'v2.0',
        date: 'Apr 12, 2026',
        author: 'Carlota Jo',
        changes: 'Sent to client for first review. Full financial model integrated.',
      },
      {
        version: 'v2.1',
        date: 'Apr 15, 2026',
        author: 'Carlota Jo',
        changes: 'Sensitivity analysis added per CFO request; executive summary tightened',
      },
    ],
  },
  {
    id: 'd2',
    title: 'M&A Discovery Phase — Data Room Analysis Memo',
    type: 'memo',
    engagement: 'M&A Advisory',
    client: 'Vertex Capital Partners',
    status: 'internal-review',
    currentVersion: 'v1.2',
    assignedTo: 'Sofia Andersson',
    dueDate: 'Apr 19, 2026',
    reviewers: ['Carlota Jo', 'Sofia Andersson'],
    clientReviewers: ['Sarah Chen, CFO'],
    completeness: 78,
    comments: [
      {
        id: 'c4',
        author: 'Carlota Jo',
        authorType: 'internal',
        text: "Section 3 on regulatory exposure needs strengthening — I'd recommend referencing FCA CP23/20 explicitly and sizing the compliance cost.",
        timestamp: 'Apr 14, 4:20 PM',
        resolved: false,
      },
    ],
    versions: [
      {
        version: 'v1.0',
        date: 'Apr 11, 2026',
        author: 'Sofia Andersson',
        changes: 'Initial data room review — first 40 documents',
      },
      {
        version: 'v1.1',
        date: 'Apr 13, 2026',
        author: 'Sofia Andersson',
        changes: 'Financial model section completed; synergies analysis added',
      },
      {
        version: 'v1.2',
        date: 'Apr 14, 2026',
        author: 'Carlota Jo',
        changes: 'Executive summary and risk flags added; regulatory section flagged for expansion',
      },
    ],
  },
  {
    id: 'd3',
    title: 'Clearfield Manufacturing — 90-Day Transformation Roadmap',
    type: 'report',
    engagement: 'Organisational Design',
    client: 'Clearfield Manufacturing',
    status: 'approved',
    currentVersion: 'v3.0',
    assignedTo: 'Kai Okonkwo',
    dueDate: 'Apr 5, 2026',
    reviewers: ['Carlota Jo', 'Kai Okonkwo'],
    clientReviewers: ['Peter Walsh, CEO'],
    completeness: 100,
    comments: [
      {
        id: 'c5',
        author: 'Peter Walsh, CEO',
        authorType: 'client',
        text: 'This is exactly what we needed. Approved to move to implementation. Well done.',
        timestamp: 'Apr 5, 3:15 PM',
        resolved: true,
      },
    ],
    versions: [
      {
        version: 'v1.0',
        date: 'Mar 28, 2026',
        author: 'Kai Okonkwo',
        changes: 'Initial framework and assessment findings',
      },
      {
        version: 'v2.0',
        date: 'Apr 1, 2026',
        author: 'Carlota Jo',
        changes: 'Full roadmap with milestones, owners, and success metrics',
      },
      {
        version: 'v3.0',
        date: 'Apr 4, 2026',
        author: 'Kai Okonkwo',
        changes: 'Client revisions incorporated; CEO approved',
      },
    ],
  },
  {
    id: 'd4',
    title: 'Competitive Positioning Sprint — Session Materials',
    type: 'presentation',
    engagement: 'Brand Repositioning',
    client: 'Kestrel Brands Group',
    status: 'draft',
    currentVersion: 'v0.3',
    assignedTo: 'James Whitmore',
    dueDate: 'May 4, 2026',
    reviewers: ['Carlota Jo'],
    clientReviewers: [],
    completeness: 40,
    comments: [],
    versions: [
      {
        version: 'v0.1',
        date: 'Apr 12, 2026',
        author: 'James Whitmore',
        changes: 'Outline and competitor slides',
      },
      {
        version: 'v0.3',
        date: 'Apr 15, 2026',
        author: 'James Whitmore',
        changes: 'Brand perception analysis added',
      },
    ],
  },
];

const PIPELINE_COUNTS = {
  draft: DELIVERABLES.filter((d) => d.status === 'draft').length,
  'internal-review': DELIVERABLES.filter((d) => d.status === 'internal-review').length,
  'client-review': DELIVERABLES.filter((d) => d.status === 'client-review').length,
  'revisions-requested': DELIVERABLES.filter((d) => d.status === 'revisions-requested').length,
  approved: DELIVERABLES.filter((d) => d.status === 'approved').length,
};

export default function DeliverableWorkflow() {
  usePageMeta({
    title: 'Deliverable Approval Workflow | Carlota Jo',
    description:
      'Version-controlled deliverable pipeline with review stages, client approval tracking, comment threads, and full change history.',
    canonical: 'https://szlholdings.com/carlota-jo/deliverable-workflow',
  });

  const [expandedId, setExpandedId] = useState<string | null>('d1');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered =
    filterStatus === 'all' ? DELIVERABLES : DELIVERABLES.filter((d) => d.status === filterStatus);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0A0A1A 0%, #14142D 50%, #060620 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GitBranch size={16} color="#A78BFA" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#A78BFA',
                  textTransform: 'uppercase',
                }}
              >
                Deliverable Approval Workflow
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 300,
                color: '#F5F0E8',
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              Every Deliverable.
              <br />
              <em style={{ color: '#A78BFA' }}>Perfect Every Time.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#5A4A80',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Version-controlled deliverable pipeline with staged review, client approval tracking,
              comment threads, and full change history. Quality, guaranteed.
            </p>

            {/* Pipeline overview */}
            <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
              {Object.entries(PIPELINE_COUNTS).map(([status, count], i, arr) => {
                const meta = STATUS_META[status as DeliverableStatus];
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius:
                          i === 0 ? '8px 0 0 8px' : i === arr.length - 1 ? '0 8px 8px 0' : 0,
                        borderLeft: i > 0 ? 'none' : undefined,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#F5F0E8',
                          fontFamily: "'Cormorant Garamond', serif",
                        }}
                      >
                        {count}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: meta.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ color: '#3A3A5A', fontSize: 16, padding: '0 4px' }}>›</div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Filters */}
        <div
          style={{
            padding: '24px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                fontSize: 12,
                padding: '5px 14px',
                borderRadius: 100,
                border: `1px solid ${filterStatus === 'all' ? GOLD : '#E8E2D6'}`,
                background: filterStatus === 'all' ? `${GOLD}15` : 'transparent',
                color: filterStatus === 'all' ? '#6B5E47' : '#A89878',
                cursor: 'pointer',
                fontWeight: filterStatus === 'all' ? 600 : 400,
              }}
            >
              All Deliverables
            </button>
            {Object.entries(STATUS_META)
              .slice(0, 4)
              .map(([status, meta]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    fontSize: 12,
                    padding: '5px 14px',
                    borderRadius: 100,
                    border: `1px solid ${filterStatus === status ? meta.color : '#E8E2D6'}`,
                    background: filterStatus === status ? `${meta.color}12` : 'transparent',
                    color: filterStatus === status ? meta.color : '#A89878',
                    cursor: 'pointer',
                    fontWeight: filterStatus === status ? 600 : 400,
                  }}
                >
                  {meta.label}
                </button>
              ))}
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              background: GOLD,
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> New Deliverable
          </button>
        </div>

        {/* Deliverable cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 64 }}>
          {filtered.map((del, i) => {
            const statusMeta = STATUS_META[del.status];
            const isExpanded = expandedId === del.id;
            const openComments = del.comments.filter((c) => !c.resolved).length;

            return (
              <motion.div
                key={del.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  background: '#fff',
                  border: '1px solid #E8E2D6',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '20px 24px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : del.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1A14' }}>
                        {del.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: statusMeta.bg,
                          color: statusMeta.color,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#F5F0E8',
                          color: '#6B5E47',
                        }}
                      >
                        {del.currentVersion}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B5E47' }}>
                      {del.client} · {del.engagement}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#A89878',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <User size={11} /> {del.assignedTo}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#A89878',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={11} /> Due {del.dueDate}
                      </div>
                      {openComments > 0 && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <MessageSquare size={11} /> {openComments} open comment
                          {openComments > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completeness */}
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: del.completeness === 100 ? '#059669' : GOLD,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      {del.completeness}%
                    </div>
                    <div style={{ fontSize: 9, color: '#A89878', textTransform: 'uppercase' }}>
                      Complete
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp size={16} color="#A89878" />
                  ) : (
                    <ChevronDown size={16} color="#A89878" />
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ borderTop: '1px solid #F0EBE0' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                        {/* Comments */}
                        <div style={{ padding: '20px 24px', borderRight: '1px solid #F0EBE0' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 16,
                            }}
                          >
                            <MessageSquare size={14} color={GOLD} />
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#6B5E47',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Review Comments
                            </div>
                          </div>
                          {del.comments.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#A89878', fontStyle: 'italic' }}>
                              No comments yet.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {del.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  style={{
                                    padding: '12px 14px',
                                    background: comment.resolved
                                      ? '#F9FBF9'
                                      : comment.authorType === 'client'
                                        ? '#EFF6FF'
                                        : '#FFFBF0',
                                    border: `1px solid ${comment.resolved ? '#E8E2D6' : comment.authorType === 'client' ? '#BFDBFE' : `${GOLD}30`}`,
                                    borderRadius: 10,
                                    opacity: comment.resolved ? 0.65 : 1,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      marginBottom: 6,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color:
                                          comment.authorType === 'client' ? '#0284C7' : '#6B5E47',
                                      }}
                                    >
                                      {comment.author}
                                    </span>
                                    <span style={{ fontSize: 10, color: '#A89878' }}>
                                      {comment.timestamp}
                                    </span>
                                    {comment.resolved && (
                                      <CheckCircle
                                        size={11}
                                        color="#059669"
                                        style={{ marginLeft: 'auto' }}
                                      />
                                    )}
                                    {!comment.resolved && comment.authorType === 'client' && (
                                      <AlertCircle
                                        size={11}
                                        color="#DC2626"
                                        style={{ marginLeft: 'auto' }}
                                      />
                                    )}
                                  </div>
                                  <p
                                    style={{
                                      fontSize: 12,
                                      color: '#1A1A14',
                                      lineHeight: 1.5,
                                      margin: 0,
                                    }}
                                  >
                                    {comment.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Version History */}
                        <div style={{ padding: '20px 24px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 16,
                            }}
                          >
                            <History size={14} color={GOLD} />
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#6B5E47',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Version History
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {del.versions
                              .slice()
                              .reverse()
                              .map((v, j) => (
                                <div
                                  key={j}
                                  style={{
                                    display: 'flex',
                                    gap: 12,
                                    paddingBottom: 12,
                                    marginBottom: 12,
                                    borderBottom:
                                      j < del.versions.length - 1 ? '1px solid #F0EBE0' : 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: j === 0 ? GOLD : '#E8E2D6',
                                        border: `2px solid ${j === 0 ? GOLD : '#E8E2D6'}`,
                                        flexShrink: 0,
                                      }}
                                    />
                                    {j < del.versions.length - 1 && (
                                      <div
                                        style={{
                                          width: 1,
                                          flex: 1,
                                          background: '#F0EBE0',
                                          margin: '3px 0',
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div style={{ paddingBottom: 4 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: j === 0 ? GOLD : '#6B5E47',
                                        }}
                                      >
                                        {v.version}
                                      </span>
                                      <span style={{ fontSize: 11, color: '#A89878' }}>
                                        {v.date} · {v.author}
                                      </span>
                                    </div>
                                    <div
                                      style={{ fontSize: 12, color: '#6B5E47', lineHeight: 1.5 }}
                                    >
                                      {v.changes}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                            {del.status !== 'approved' && del.status !== 'client-review' && (
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 14px',
                                  background: GOLD,
                                  border: 'none',
                                  borderRadius: 8,
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Send size={11} /> Send for Review
                              </button>
                            )}
                            {del.status === 'approved' && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 14px',
                                  background: '#ECFDF5',
                                  border: '1px solid #D1FAE5',
                                  borderRadius: 8,
                                  color: '#059669',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                <CheckCircle size={11} /> Client Approved
                              </div>
                            )}
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                background: '#F5F0E8',
                                border: '1px solid #E8E2D6',
                                borderRadius: 8,
                                color: '#6B5E47',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={11} /> Preview
                            </button>
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                background: '#F5F0E8',
                                border: '1px solid #E8E2D6',
                                borderRadius: 8,
                                color: '#6B5E47',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              <Upload size={11} /> New Version
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
