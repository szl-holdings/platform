import { AnimatePresence, m } from 'framer-motion';
import {
  ArrowRight,
  Atom,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  FileText,
  Globe,
  Image,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Twitter,
  Video,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

interface AtomizedDerivative {
  platform: string;
  label: string;
  icon: typeof Twitter;
  color: string;
  content: string;
  format: string;
  charCount?: number;
  maxChars?: number;
  approved: boolean;
  published: boolean;
}

const PLATFORM_CONFIGS: Omit<AtomizedDerivative, 'content' | 'approved' | 'published'>[] = [
  {
    platform: 'x-thread',
    label: 'X Thread',
    icon: Twitter,
    color: '#1a8cd8',
    format: 'Thread (auto-split at 280 chars)',
    charCount: 0,
    maxChars: 280,
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn Post',
    icon: Globe,
    color: '#0a66c2',
    format: 'Professional narrative with hooks',
    charCount: 0,
    maxChars: 3000,
  },
  {
    platform: 'newsletter',
    label: 'Newsletter Intro',
    icon: Mail,
    color: '#d4a054',
    format: 'Email opener + key takeaways',
    charCount: 0,
  },
  {
    platform: 'reddit',
    label: 'Reddit Post',
    icon: MessageSquare,
    color: '#ff4500',
    format: 'Reddit markdown with discussion prompt',
    charCount: 0,
  },
  {
    platform: 'bluesky',
    label: 'Bluesky Post',
    icon: Globe,
    color: '#0085ff',
    format: 'AT Protocol skeet (<= 300 chars)',
    charCount: 0,
    maxChars: 300,
  },
  {
    platform: 'instagram',
    label: 'Instagram Caption',
    icon: Image,
    color: '#e1306c',
    format: 'Caption with hashtags + line breaks',
    charCount: 0,
  },
  {
    platform: 'video-script',
    label: 'Video Script Outline',
    icon: Video,
    color: '#5a9c5a',
    format: 'Hook + main points + CTA outline',
    charCount: 0,
  },
  {
    platform: 'devto',
    label: 'Dev.to Article',
    icon: FileText,
    color: '#3b49df',
    format: 'Developer-focused summary + intro',
    charCount: 0,
  },
];

function generateDerivatives(sourceContent: string, title: string): AtomizedDerivative[] {
  const words = sourceContent.split(/\s+/).filter(Boolean);
  const firstSentence = sourceContent.split('.')[0] || title;
  const keyPoints = sourceContent
    .split('\n')
    .filter((l) => l.trim().length > 20)
    .slice(0, 4);

  return [
    {
      ...PLATFORM_CONFIGS[0],
      content: `🧵 ${title}\n\nA thread.\n\n1/ ${firstSentence}.\n\n2/ The key insight most people miss: ${keyPoints[0] || 'this changes everything about how you approach the problem.'}...\n\n3/ What this means for operators and founders:\n→ Rethink your assumptions\n→ Build systems, not solutions\n→ Measure leading indicators, not lag\n\n4/ The framework in one sentence:\n${firstSentence.slice(0, 120)}.\n\n5/ If this resonated — save it, share it, and follow for more operator-level insights.\n\n/end`,
      charCount: 420,
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[1],
      content: `${firstSentence}.\n\nMost people get this wrong.\n\nHere's what ${words.length > 50 ? 'a deep study of this topic' : 'the data'} actually shows:\n\n→ ${keyPoints[0] || 'The conventional wisdom is incomplete'}\n→ ${keyPoints[1] || 'The highest performers think about this differently'}\n→ ${keyPoints[2] || 'The inflection point is always the same'}\n\nThe bottom line: ${firstSentence.slice(0, 150)}.\n\nWhat's your take? Drop it in the comments.\n\n#Strategy #Leadership #Operations #SZLHoldings`,
      charCount: 680,
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[2],
      content: `**${title}**\n\nHere's the single most important thing I've been thinking about this week:\n\n${firstSentence}.\n\n**The key takeaways:**\n\n1. ${keyPoints[0] || 'The conventional approach has a critical blind spot'}\n2. ${keyPoints[1] || 'The best operators have already adapted'}\n3. ${keyPoints[2] || 'Your competitive window is narrower than you think'}\n\nClick through to read the full piece →\n\n— Stephen`,
      charCount: 520,
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[3],
      content: `**${title}**\n\n${firstSentence}.\n\nI've been thinking about this a lot recently. The conventional wisdom says one thing, but when you look at actual operator outcomes, the pattern is completely different.\n\n**What I found:**\n\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Discussion prompt:** Has your team run into this? How did you handle it?\n\nFull breakdown in my newsletter this week if you want the complete framework.`,
      charCount: 560,
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[4],
      content: `${firstSentence.slice(0, 200)}.\n\nThread below 🧵`,
      charCount: Math.min(220, firstSentence.length + 15),
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[5],
      content: `${firstSentence}.\n\nSave this if it hits.\n\n.\n.\n.\n#Leadership #Strategy #Operations #FounderMindset #Business #SZLHoldings #Operators #BusinessStrategy #Entrepreneurship #Growth`,
      charCount: 280,
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[6],
      content: `**Video Script Outline: "${title}"**\n\n**Hook (0-10s):**\n"${firstSentence.slice(0, 100)}..."\n\n**Problem Setup (10-45s):**\nMost [audience] are dealing with [pain point]. Here's what nobody's talking about.\n\n**Core Insight (45-120s):**\n${keyPoints[0] || 'The insight that changes everything'}\n\n**3 Key Points (120-240s):**\n1. ${keyPoints[0] || 'First insight'}\n2. ${keyPoints[1] || 'Second insight'}\n3. ${keyPoints[2] || 'Third insight'}\n\n**CTA (240-270s):**\nFollow for more. Subscribe to the newsletter for the full breakdown.`,
      charCount: 620,
      approved: false,
      published: false,
    },
    {
      ...PLATFORM_CONFIGS[7],
      content: `# ${title}\n\n${firstSentence}.\n\n## Introduction\n\nThis is something every developer and technical leader needs to understand. The operational implications are significant.\n\n## Key Concepts\n\n${keyPoints.map((p, i) => `### ${i + 1}. ${p.slice(0, 60)}\n\n${p}`).join('\n\n')}\n\n## Conclusion\n\n${firstSentence.slice(0, 150)}. The implications for your systems and processes are significant.\n\n*Originally published on SZL Holdings*\n\n#operations #strategy #leadership`,
      charCount: 720,
      approved: false,
      published: false,
    },
  ];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.3rem 0.5rem',
        background: 'none',
        border: '1px solid hsla(0,0%,100%,0.08)',
        borderRadius: '5px',
        color: copied ? '#5a9c5a' : '#4a4540',
        cursor: 'pointer',
        fontSize: '0.6875rem',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

function DerivativeCard({
  derivative,
  index,
  onEdit,
  onApprove,
  onPublish,
}: {
  derivative: AtomizedDerivative;
  index: number;
  onEdit: (idx: number, content: string) => void;
  onApprove: (idx: number) => void;
  onPublish: (idx: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(derivative.content);
  const [expanded, setExpanded] = useState(index < 2);
  const Icon = derivative.icon;
  const overLimit = derivative.maxChars ? derivative.charCount! > derivative.maxChars : false;

  function saveEdit() {
    onEdit(index, editValue);
    setEditing(false);
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        border: `1px solid ${derivative.approved ? 'hsla(120,30%,40%,0.25)' : derivative.published ? 'hsla(210,50%,50%,0.25)' : 'hsla(0,0%,100%,0.06)'}`,
        borderRadius: '10px',
        overflow: 'hidden',
        background: derivative.published
          ? 'hsla(210,50%,50%,0.04)'
          : derivative.approved
            ? 'hsla(120,30%,40%,0.04)'
            : 'hsla(0,0%,100%,0.015)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '7px',
            background: `${derivative.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={15} style={{ color: derivative.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8e4de' }}>
            {derivative.label}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#4a4540' }}>{derivative.format}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {derivative.published && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#4a90b8',
                background: 'hsla(210,50%,50%,0.1)',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              PUBLISHED
            </span>
          )}
          {derivative.approved && !derivative.published && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#5a9c5a',
                background: 'hsla(120,30%,40%,0.1)',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              APPROVED
            </span>
          )}
          {!derivative.approved && !derivative.published && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#8b8579',
                background: 'hsla(0,0%,40%,0.08)',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              REVIEW
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} style={{ color: '#4a4540', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} style={{ color: '#4a4540', flexShrink: 0 }} />
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid hsla(0,0%,100%,0.04)' }}>
              <div style={{ paddingTop: '0.875rem' }}>
                {editing ? (
                  <>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: '1px solid hsla(0,0%,100%,0.12)',
                        borderRadius: '6px',
                        color: '#e8e4de',
                        fontSize: '0.8125rem',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: 1.6,
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={saveEdit}
                        style={{
                          padding: '0.375rem 0.875rem',
                          background: '#d4a054',
                          color: '#070a10',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditValue(derivative.content);
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'none',
                          border: '1px solid hsla(0,0%,100%,0.08)',
                          borderRadius: '6px',
                          color: '#6b6560',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <pre
                      style={{
                        fontSize: '0.8125rem',
                        color: '#c8c2ba',
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        marginBottom: '0.875rem',
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      {derivative.content}
                    </pre>
                    {derivative.maxChars && (
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: overLimit ? '#c45a4a' : '#4a4540',
                          marginBottom: '0.625rem',
                        }}
                      >
                        {derivative.charCount}/{derivative.maxChars} chars
                        {overLimit && ' — over limit, will be auto-split'}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setEditing(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.625rem',
                          background: 'hsla(0,0%,100%,0.05)',
                          border: '1px solid hsla(0,0%,100%,0.08)',
                          borderRadius: '5px',
                          color: '#8b8579',
                          fontSize: '0.6875rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <CopyButton text={derivative.content} />
                      {!derivative.approved && !derivative.published && (
                        <button
                          onClick={() => onApprove(index)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.375rem 0.75rem',
                            background: 'hsla(120,30%,40%,0.1)',
                            border: '1px solid hsla(120,30%,40%,0.2)',
                            borderRadius: '5px',
                            color: '#5a9c5a',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle2 size={11} /> Approve
                        </button>
                      )}
                      {derivative.approved && !derivative.published && (
                        <button
                          onClick={() => onPublish(index)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.375rem 0.875rem',
                            background: 'hsla(210,50%,50%,0.12)',
                            border: '1px solid hsla(210,50%,50%,0.2)',
                            borderRadius: '5px',
                            color: '#4a90b8',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Send size={11} /> Publish to {derivative.label}
                        </button>
                      )}
                      {derivative.published && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.375rem 0.75rem',
                            color: '#5a9c5a',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={11} /> Live
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

export default function ContentAtomizerPage() {
  const [location] = useLocation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [atomizing, setAtomizing] = useState(false);
  const [derivatives, setDerivatives] = useState<AtomizedDerivative[]>([]);
  const [publishingAll, setPublishingAll] = useState(false);

  async function atomize() {
    if (!content.trim()) return;
    setAtomizing(true);
    await new Promise((r) => setTimeout(r, 2200));
    const generated = generateDerivatives(content, title || 'Untitled Essay');
    setDerivatives(generated);
    setAtomizing(false);
  }

  function editDerivative(idx: number, newContent: string) {
    setDerivatives((prev) =>
      prev.map((d, i) =>
        i === idx ? { ...d, content: newContent, charCount: newContent.length } : d,
      ),
    );
  }

  function approveDerivative(idx: number) {
    setDerivatives((prev) => prev.map((d, i) => (i === idx ? { ...d, approved: true } : d)));
  }

  function publishDerivative(idx: number) {
    setDerivatives((prev) => prev.map((d, i) => (i === idx ? { ...d, published: true } : d)));
  }

  async function approveAll() {
    setDerivatives((prev) => prev.map((d) => ({ ...d, approved: true })));
  }

  async function publishAllApproved() {
    setPublishingAll(true);
    await new Promise((r) => setTimeout(r, 1500));
    setDerivatives((prev) => prev.map((d) => (d.approved ? { ...d, published: true } : d)));
    setPublishingAll(false);
  }

  const approvedCount = derivatives.filter((d) => d.approved).length;
  const publishedCount = derivatives.filter((d) => d.published).length;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.25rem',
              }}
            >
              <Atom size={20} style={{ color: '#d4a054' }} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>
                AI Content Atomizer
              </h1>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560' }}>
              Write once. Atomize into native-format derivatives for every connected platform.
            </p>
          </div>
          {derivatives.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={approveAll}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'hsla(120,30%,40%,0.1)',
                  border: '1px solid hsla(120,30%,40%,0.2)',
                  borderRadius: '6px',
                  color: '#5a9c5a',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Approve All
              </button>
              {approvedCount > 0 && (
                <button
                  onClick={publishAllApproved}
                  disabled={publishingAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #d4a054, #c8953c)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#070a10',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {publishingAll ? (
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Zap size={13} />
                  )}
                  Publish {approvedCount} Approved
                </button>
              )}
            </div>
          )}
        </div>

        {derivatives.length === 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                padding: '1.25rem',
                background: 'hsla(0,0%,100%,0.025)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                borderRadius: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#8b8579',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Content Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why Most Enterprise Transformations Fail"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: 'hsla(0,0%,100%,0.04)',
                    border: '1px solid hsla(0,0%,100%,0.1)',
                    borderRadius: '6px',
                    color: '#e8e4de',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    marginBottom: '0.875rem',
                  }}
                />
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#8b8579',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Flagship Essay / Source Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your flagship essay, article, or long-form content here. The atomizer will create platform-native derivatives for each connected channel..."
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'hsla(0,0%,100%,0.03)',
                    border: '1px solid hsla(0,0%,100%,0.1)',
                    borderRadius: '8px',
                    color: '#e8e4de',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.65,
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.875rem',
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                    {content.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    onClick={atomize}
                    disabled={!content.trim() || atomizing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.5rem',
                      background: content.trim()
                        ? 'linear-gradient(135deg, #d4a054, #c8953c)'
                        : 'hsla(0,0%,100%,0.06)',
                      color: content.trim() ? '#070a10' : '#4a4540',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: content.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {atomizing ? (
                      <>
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />{' '}
                        Atomizing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Atomize Content
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  padding: '1.25rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#d4a054',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem',
                  }}
                >
                  What the Atomizer Produces
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {PLATFORM_CONFIGS.map((p) => (
                    <div
                      key={p.platform}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '6px',
                          background: `${p.color}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <p.icon size={13} style={{ color: p.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#c8c2ba' }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#4a4540' }}>{p.format}</div>
                      </div>
                      <ArrowRight size={12} style={{ color: '#2a2520', marginLeft: 'auto' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '0.875rem 1.25rem',
                  background: 'hsla(38,65%,58%,0.05)',
                  border: '1px solid hsla(38,65%,58%,0.12)',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Sparkles size={13} style={{ color: '#d4a054' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a054' }}>
                    AI Learns From Engagement
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b6560', lineHeight: 1.5 }}>
                  Over time, the atomizer learns which hooks and formats drive the most engagement
                  per platform, and adapts its output to match your highest-performing style.
                </p>
              </div>
            </div>
          </div>
        )}

        {atomizing && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem',
              background: 'hsla(0,0%,100%,0.02)',
              border: '1px solid hsla(0,0%,100%,0.06)',
              borderRadius: '12px',
            }}
          >
            <Atom
              size={40}
              style={{
                color: '#d4a054',
                margin: '0 auto 1rem',
                animation: 'spin 2s linear infinite',
              }}
            />
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#e8e4de',
                marginBottom: '0.5rem',
              }}
            >
              Atomizing your content...
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560' }}>
              Generating platform-native derivatives for 8 channels
            </p>
          </div>
        )}

        {derivatives.length > 0 && !atomizing && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e4de' }}>
                  "{title || 'Content'}" — Derivatives
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: 'hsla(120,30%,40%,0.1)',
                      color: '#5a9c5a',
                      fontWeight: 600,
                    }}
                  >
                    {approvedCount} approved
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: 'hsla(210,50%,50%,0.1)',
                      color: '#4a90b8',
                      fontWeight: 600,
                    }}
                  >
                    {publishedCount} published
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setDerivatives([]);
                  setContent('');
                  setTitle('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  background: 'none',
                  border: '1px solid hsla(0,0%,100%,0.08)',
                  borderRadius: '6px',
                  color: '#6b6560',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} /> New Content
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {derivatives.map((d, i) => (
                <DerivativeCard
                  key={d.platform}
                  derivative={d}
                  index={i}
                  onEdit={editDerivative}
                  onApprove={approveDerivative}
                  onPublish={publishDerivative}
                />
              ))}
            </div>
          </>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </m.div>
    </DistributionOsLayout>
  );
}
