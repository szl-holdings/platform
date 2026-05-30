import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

type Workshop = {
  id: string;
  title: string;
  client: string;
  industry: string;
  format: 'half-day' | 'full-day' | 'two-day' | 'series';
  participants: number;
  date: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'draft';
  objectives: string[];
  outcomes?: string[];
  rating?: number;
  nps?: number;
  aiSummary?: string;
};

const FORMAT_LABELS = {
  'half-day': 'Half Day (4h)',
  'full-day': 'Full Day (8h)',
  'two-day': '2-Day Intensive',
  series: 'Workshop Series',
};

const STATUS_META: Record<Workshop['status'], { color: string; label: string }> = {
  upcoming: { color: '#0284C7', label: 'Upcoming' },
  'in-progress': { color: '#D97706', label: 'In Progress' },
  completed: { color: '#059669', label: 'Completed' },
  draft: { color: '#94A3B8', label: 'Draft' },
};

const WORKSHOPS: Workshop[] = [
  {
    id: 'w1',
    title: 'Leadership Alignment: Q2 Strategy Crystallisation',
    client: 'Luminary Brands',
    industry: 'Consumer Goods',
    format: 'full-day',
    participants: 14,
    date: 'Apr 23, 2026',
    status: 'upcoming',
    objectives: [
      'Align executive team on Q2 growth priorities following board review',
      'Cascade digital transformation roadmap to functional leads',
      'Define accountability matrix and 90-day quick wins',
    ],
  },
  {
    id: 'w2',
    title: 'Change Leadership Bootcamp',
    client: 'Solaris Health Systems',
    industry: 'Healthcare',
    format: 'two-day',
    participants: 22,
    date: 'Apr 8–9, 2026',
    status: 'completed',
    objectives: [
      'Build change management capability in clinical operations leadership',
      'Develop unit-level transformation plans for EHR migration',
      'Create peer support and accountability mechanisms',
    ],
    outcomes: [
      '22 leaders completed change management certification',
      '11 unit transformation plans drafted and validated',
      'Stakeholder resistance dropped from 68% to 41% pre/post measure',
    ],
    rating: 4.7,
    nps: 72,
    aiSummary:
      "The 2-day bootcamp achieved strong alignment on change principles with particular resonance around stakeholder influence mapping. Key challenge: clinical managers struggled with the pace of the EHR roadmap. Recommend a 30-day follow-up coaching session focused on resistance management tactics. Three participants (Dr. Santos' direct reports) showed high potential as internal change champions — consider formalising their roles.",
  },
  {
    id: 'w3',
    title: 'Competitive Positioning Sprint',
    client: 'Kestrel Brands Group',
    industry: 'Consumer Goods',
    format: 'half-day',
    participants: 8,
    date: 'May 6, 2026',
    status: 'draft',
    objectives: [
      'Clarify differentiated positioning against top 3 competitors',
      'Develop brand messaging framework for premium repositioning',
    ],
  },
  {
    id: 'w4',
    title: 'Portfolio Strategy Masterclass',
    client: 'Aurelius Private Equity',
    industry: 'Financial Services',
    format: 'series',
    participants: 6,
    date: 'Mar 2026 (4 sessions)',
    status: 'completed',
    objectives: [
      'Build portfolio company value creation framework',
      'Develop deal origination thesis for mid-market industrials',
      'Create 100-day post-acquisition playbook',
    ],
    outcomes: [
      '4-session programme rated 4.9/5 by all participants',
      'Value creation framework adopted across 8 portfolio companies',
      '2 investment theses advanced to deal team for evaluation',
    ],
    rating: 4.9,
    nps: 84,
    aiSummary:
      'Exceptional engagement — the Partner team requested session 5 (not originally scoped) to deep-dive on operational KPI frameworks. The 4-session series format worked exceptionally well for building cumulative capability. Key insight: PE firms respond significantly better to pre-read materials than in-session frameworks. Recommend building a Carlota Jo PE playbook using content from these sessions for future clients.',
  },
];

const TEMPLATES = [
  {
    id: 't1',
    name: 'Leadership Alignment Workshop',
    icon: Target,
    uses: 12,
    description:
      'Full-day format for executive team alignment on strategy, priorities, and accountabilities.',
    industries: ['All'],
  },
  {
    id: 't2',
    name: 'Change Readiness Assessment',
    icon: Zap,
    uses: 8,
    description:
      'Half-day diagnostic workshop to measure change readiness and identify resistance patterns.',
    industries: ['Healthcare', 'Financial Services', 'Industrial'],
  },
  {
    id: 't3',
    name: 'Brand Positioning Sprint',
    icon: Star,
    uses: 6,
    description:
      'Intense half-day sprint to crystallise brand positioning, messaging, and differentiation.',
    industries: ['Consumer Goods', 'Retail', 'Luxury'],
  },
  {
    id: 't4',
    name: 'Digital Strategy Workshop',
    icon: BookOpen,
    uses: 9,
    description:
      'Full-day session mapping digital maturity, priority initiatives, and roadmap development.',
    industries: ['All'],
  },
  {
    id: 't5',
    name: 'Stakeholder Mapping Lab',
    icon: Users,
    uses: 15,
    description:
      '2-hour focused session building stakeholder influence maps and engagement strategies.',
    industries: ['All'],
  },
];

type GeneratedAgenda = {
  title: string;
  overview: string;
  prework: string[];
  sessions: { time: string; title: string; method: string; duration: string; materials: string }[];
  facilitatorNotes: string;
  followUp: string[];
};

export default function WorkshopPlatform() {
  usePageMeta({
    title: 'Workshop & Training Platform | Carlota Jo',
    description:
      'Template-driven workshop creation, AI-generated content, participant management, and session summaries — all in one platform.',
    canonical: 'https://szlholdings.com/carlota-jo/workshop-platform',
  });

  const [expandedWorkshop, setExpandedWorkshop] = useState<string | null>(null);
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
  const [agenda, setAgenda] = useState<GeneratedAgenda | null>(null);
  const [newWorkshop, setNewWorkshop] = useState({
    client: '',
    industry: 'Healthcare',
    objective: '',
    format: 'full-day' as Workshop['format'],
    participants: '12',
  });
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);
  const [liveSummaries, setLiveSummaries] = useState<Record<string, string>>({});

  const generateAgenda = async () => {
    setGeneratingAgenda(true);
    setAgenda(null);
    try {
      const prompt = `You are a senior facilitation expert at Carlota Jo consulting. Generate a detailed workshop agenda as JSON for: Client: ${newWorkshop.client || 'A consumer goods company'}, Industry: ${newWorkshop.industry}, Objective: ${newWorkshop.objective || 'strategic alignment and planning'}, Format: ${FORMAT_LABELS[newWorkshop.format]}, Participants: ${newWorkshop.participants}.
Respond with EXACTLY this JSON structure:
{
  "title": "Workshop title (compelling, specific)",
  "overview": "2 sentence summary of the workshop design philosophy",
  "prework": ["prework item 1", "prework item 2", "prework item 3"],
  "sessions": [
    {"time": "09:00", "title": "Opening & Context Setting", "method": "Presentation + Discussion", "duration": "30 min", "materials": "Slides: Market Context"},
    {"time": "09:30", "title": "Session title", "method": "Workshop method", "duration": "60 min", "materials": "Materials needed"},
    {"time": "10:30", "title": "Coffee Break", "method": "Break", "duration": "15 min", "materials": ""},
    {"time": "10:45", "title": "Session title", "method": "Workshop method", "duration": "75 min", "materials": "Materials needed"},
    {"time": "12:00", "title": "Lunch", "method": "Break", "duration": "60 min", "materials": ""},
    {"time": "13:00", "title": "Afternoon session", "method": "Workshop method", "duration": "90 min", "materials": "Materials needed"},
    {"time": "14:30", "title": "Final session", "method": "Workshop method", "duration": "60 min", "materials": "Materials needed"},
    {"time": "15:30", "title": "Close & Next Steps", "method": "Plenary", "duration": "30 min", "materials": "Action register"}
  ],
  "facilitatorNotes": "2-3 sentences of key facilitation guidance specific to this client and objective",
  "followUp": ["Follow-up action 1", "Follow-up action 2", "Follow-up action 3"]
}
Only respond with JSON, no markdown.`;
      const resp = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      const raw = (data.content || data.choices?.[0]?.message?.content || '{}')
        .replace(/```json|```/g, '')
        .trim();
      setAgenda(JSON.parse(raw));
    } catch {
      setAgenda({
        title: `${newWorkshop.industry} Leadership Alignment Workshop`,
        overview:
          'A structured full-day engagement designed to build executive consensus on strategic priorities and translate intent into actionable 90-day plans. Balances plenary discussion with small-group working sessions to maximise participant engagement and output quality.',
        prework: [
          'Complete pre-read: Q1 market context briefing (15 min)',
          'Individual priority ranking exercise (online, 10 min)',
          'Review previous strategy documents and bring key questions',
        ],
        sessions: [
          {
            time: '09:00',
            title: 'Opening — Setting the Scene',
            method: 'Facilitated Discussion',
            duration: '30 min',
            materials: 'Market context slides',
          },
          {
            time: '09:30',
            title: 'Strategic Landscape Assessment',
            method: 'World Café (3 tables)',
            duration: '60 min',
            materials: 'Large-format canvases, markers',
          },
          {
            time: '10:30',
            title: 'Coffee Break',
            method: 'Break',
            duration: '15 min',
            materials: '',
          },
          {
            time: '10:45',
            title: 'Priority Crystallisation',
            method: 'Dot voting + Plenary',
            duration: '75 min',
            materials: 'Priority cards, voting dots',
          },
          { time: '12:00', title: 'Lunch', method: 'Break', duration: '60 min', materials: '' },
          {
            time: '13:00',
            title: '90-Day Action Planning',
            method: 'Breakout groups + Report-back',
            duration: '90 min',
            materials: 'Action planning templates',
          },
          {
            time: '14:30',
            title: 'Accountability & Governance',
            method: 'RACI Workshop',
            duration: '60 min',
            materials: 'Accountability matrix template',
          },
          {
            time: '15:30',
            title: 'Close & Commitment',
            method: 'Individual commitment cards',
            duration: '30 min',
            materials: 'Commitment card template',
          },
        ],
        facilitatorNotes:
          'Ensure the CEO opens with a clear statement of ambition — this sets the tone for the day. Watch for dominant voices in small groups; use structured turn-taking for the priority crystallisation session. Save at least 20 minutes for the close to ensure each participant leaves with a clear personal commitment.',
        followUp: [
          'Send action register within 24 hours',
          'Schedule 30-day accountability check-in',
          'Distribute commitment cards to all participants',
          'Brief key stakeholders who were not in the room',
        ],
      });
    } finally {
      setGeneratingAgenda(false);
    }
  };

  const generateSummary = async (workshop: Workshop) => {
    setGeneratingSummary(workshop.id);
    try {
      const prompt = `Generate a brief Governed post-session synthesis for a consulting workshop: "${workshop.title}" with ${workshop.participants} participants from ${workshop.client} (${workshop.industry}). Objectives: ${workshop.objectives.join(', ')}. ${workshop.outcomes ? `Outcomes: ${workshop.outcomes.join(', ')}` : ''}. Write a 3-4 sentence synthesis covering: key achievements, standout moments, one risk or challenge to address, and one recommendation for the next engagement. Be specific and professional.`;
      const resp = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      const text = data.content || data.choices?.[0]?.message?.content || workshop.aiSummary || '';
      setLiveSummaries((prev) => ({ ...prev, [workshop.id]: text }));
    } catch {
      setLiveSummaries((prev) => ({
        ...prev,
        [workshop.id]:
          workshop.aiSummary || 'AI summary generation encountered an error. Please try again.',
      }));
    } finally {
      setGeneratingSummary(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A0A00 0%, #2D1800 50%, #0F0800 100%)',
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
                  background: 'rgba(217,119,6,0.2)',
                  border: '1px solid rgba(217,119,6,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={16} color="#FCD34D" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#FCD34D',
                  textTransform: 'uppercase',
                }}
              >
                Workshop & Training Platform
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
              Expert-Led Workshops.
              <br />
              <em style={{ color: '#FCD34D' }}>Effortlessly Delivered.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#A08040',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              AI generates customised agendas, materials, and post-session summaries. Template
              library. Participant management. All in one place.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Workshops Delivered', value: '18' },
                { label: 'Avg Rating', value: '4.8/5' },
                { label: 'Templates', value: '12' },
                { label: 'Avg NPS', value: '76' },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#F5F0E8',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#A08040' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* AI Agenda Generator */}
        <div style={{ padding: '40px 0 0', marginBottom: 40 }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 20,
              padding: 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                AI Workshop Agenda Generator
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
                marginBottom: 16,
              }}
            >
              {[
                {
                  label: 'Client Name',
                  key: 'client',
                  type: 'input',
                  placeholder: 'e.g. Luminary Brands',
                },
                {
                  label: 'Industry',
                  key: 'industry',
                  type: 'select',
                  options: [
                    'Healthcare',
                    'Consumer Goods',
                    'Financial Services',
                    'Technology',
                    'Industrial',
                    'Retail',
                    'Other',
                  ],
                },
                {
                  label: 'Format',
                  key: 'format',
                  type: 'select',
                  options: ['half-day', 'full-day', 'two-day', 'series'],
                },
                {
                  label: 'Participants',
                  key: 'participants',
                  type: 'input',
                  placeholder: 'e.g. 12',
                },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6B5E47',
                      display: 'block',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={newWorkshop[field.key as keyof typeof newWorkshop]}
                      onChange={(e) =>
                        setNewWorkshop((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    >
                      {field.options?.map((o) => (
                        <option key={o} value={o}>
                          {o === 'half-day'
                            ? 'Half Day'
                            : o === 'full-day'
                              ? 'Full Day'
                              : o === 'two-day'
                                ? '2-Day'
                                : o === 'series'
                                  ? 'Series'
                                  : o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={newWorkshop[field.key as keyof typeof newWorkshop]}
                      onChange={(e) =>
                        setNewWorkshop((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B5E47',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Primary Objective
              </label>
              <textarea
                value={newWorkshop.objective}
                onChange={(e) => setNewWorkshop((prev) => ({ ...prev, objective: e.target.value }))}
                placeholder="e.g. Align executive team on Q2 strategy and build 90-day action plans"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E8E2D6',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={generateAgenda}
              disabled={generatingAgenda}
              style={{
                padding: '12px 28px',
                background: GOLD,
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: generatingAgenda ? 0.7 : 1,
              }}
            >
              {generatingAgenda ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Sparkles size={14} />
              )}
              Generate Agenda
            </button>

            <AnimatePresence>
              {agenda && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 28, paddingTop: 28, borderTop: '1px solid #F0EBE0' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                      marginBottom: 20,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 18, fontWeight: 600, color: '#1A1A14', marginBottom: 4 }}
                      >
                        {agenda.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#6B5E47', lineHeight: 1.6 }}>
                        {agenda.overview}
                      </div>
                    </div>
                    <button
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        background: '#F5F0E8',
                        fontSize: 12,
                        color: '#6B5E47',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Download size={12} /> Export
                    </button>
                  </div>
                  {agenda.prework.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6B5E47',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 10,
                        }}
                      >
                        Pre-Work
                      </div>
                      {agenda.prework.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 6,
                            fontSize: 13,
                            color: '#6B5E47',
                          }}
                        >
                          <span style={{ color: GOLD }}>→</span> {p}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6B5E47',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 10,
                      }}
                    >
                      Programme
                    </div>
                    {agenda.sessions.map((session, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '60px 1fr 1fr',
                          gap: 12,
                          padding: '10px 0',
                          borderBottom:
                            i < agenda.sessions.length - 1 ? '1px solid #F0EBE0' : 'none',
                          alignItems: 'start',
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>
                          {session.time}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color:
                                session.title.includes('Break') || session.title.includes('Lunch')
                                  ? '#A89878'
                                  : '#1A1A14',
                            }}
                          >
                            {session.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#A89878' }}>
                            {session.method} · {session.duration}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#6B5E47' }}>{session.materials}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: '#FFFBF0',
                      border: '1px solid #F0D060',
                      borderRadius: 10,
                      padding: '14px 16px',
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{ fontSize: 11, fontWeight: 600, color: '#6B5E47', marginBottom: 6 }}
                    >
                      FACILITATOR NOTES
                    </div>
                    <div style={{ fontSize: 13, color: '#1A1A14', lineHeight: 1.7 }}>
                      {agenda.facilitatorNotes}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6B5E47',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 10,
                      }}
                    >
                      Follow-Up Actions
                    </div>
                    {agenda.followUp.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginBottom: 6,
                          fontSize: 13,
                          color: '#6B5E47',
                        }}
                      >
                        <CheckCircle
                          size={13}
                          color="#059669"
                          style={{ marginTop: 2, flexShrink: 0 }}
                        />{' '}
                        {f}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Workshop History */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Calendar size={16} color={GOLD} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>Workshops</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {WORKSHOPS.map((ws, i) => {
              const statusMeta = STATUS_META[ws.status];
              const isExpanded = expandedWorkshop === ws.id;
              const summary = liveSummaries[ws.id] || ws.aiSummary;
              return (
                <motion.div
                  key={ws.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: '#fff',
                    border: '1px solid #E8E2D6',
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '20px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                    }}
                    onClick={() => setExpandedWorkshop(isExpanded ? null : ws.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: '#1A1A14',
                              marginBottom: 3,
                            }}
                          >
                            {ws.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B5E47' }}>
                            {ws.client} · {ws.industry}
                          </div>
                        </div>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
                        >
                          {ws.rating && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#1A1A14',
                              }}
                            >
                              <Star size={13} color="#D97706" fill="#D97706" /> {ws.rating}
                            </div>
                          )}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 100,
                              background: `${statusMeta.color}12`,
                              color: statusMeta.color,
                            }}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 16,
                          fontSize: 12,
                          color: '#A89878',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} /> {ws.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={11} /> {ws.participants} participants
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {FORMAT_LABELS[ws.format]}
                        </span>
                        {ws.nps && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Target size={11} /> NPS {ws.nps}
                          </span>
                        )}
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
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                          borderTop: '1px solid #F0EBE0',
                          padding: '20px 24px',
                          background: '#FAFAF8',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 24,
                            marginBottom: 20,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#6B5E47',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: 10,
                              }}
                            >
                              Objectives
                            </div>
                            {ws.objectives.map((obj, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                <Target
                                  size={12}
                                  color={GOLD}
                                  style={{ marginTop: 2, flexShrink: 0 }}
                                />
                                <span style={{ fontSize: 13, color: '#6B5E47' }}>{obj}</span>
                              </div>
                            ))}
                          </div>
                          {ws.outcomes && (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#6B5E47',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  marginBottom: 10,
                                }}
                              >
                                Outcomes
                              </div>
                              {ws.outcomes.map((out, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                  <CheckCircle
                                    size={12}
                                    color="#059669"
                                    style={{ marginTop: 2, flexShrink: 0 }}
                                  />
                                  <span style={{ fontSize: 13, color: '#6B5E47' }}>{out}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {ws.status === 'completed' && (
                          <div>
                            {summary ? (
                              <div
                                style={{
                                  background: '#FFFBF0',
                                  border: '1px solid #F0D060',
                                  borderRadius: 10,
                                  padding: '16px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: 10,
                                  }}
                                >
                                  <Sparkles size={12} color={GOLD} />
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: '#6B5E47',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                    }}
                                  >
                                    AI Session Intelligence
                                  </span>
                                </div>
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: '#1A1A14',
                                    lineHeight: 1.8,
                                    margin: 0,
                                  }}
                                >
                                  {summary}
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={() => generateSummary(ws)}
                                disabled={generatingSummary === ws.id}
                                style={{
                                  padding: '10px 20px',
                                  border: '1px solid #E8E2D6',
                                  borderRadius: 8,
                                  background: '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#6B5E47',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {generatingSummary === ws.id ? (
                                  <Loader2
                                    size={12}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                  />
                                ) : (
                                  <Sparkles size={12} color={GOLD} />
                                )}
                                Generate AI Session Summary
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Templates */}
        <div style={{ paddingBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={16} color={GOLD} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
              Workshop Template Library
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {TEMPLATES.map((tmpl, i) => {
              const Icon = tmpl.icon;
              return (
                <motion.div
                  key={tmpl.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: '#fff',
                    border: '1px solid #E8E2D6',
                    borderRadius: 14,
                    padding: 22,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{ borderColor: `${GOLD}50`, boxShadow: `0 4px 20px ${GOLD}10` }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#FFF8E8',
                        border: '1px solid #F0D060',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={16} color={GOLD} />
                    </div>
                    <span style={{ fontSize: 11, color: '#A89878' }}>Used {tmpl.uses}×</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14', marginBottom: 6 }}>
                    {tmpl.name}
                  </div>
                  <div
                    style={{ fontSize: 12, color: '#6B5E47', lineHeight: 1.6, marginBottom: 12 }}
                  >
                    {tmpl.description}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tmpl.industries.map((ind) => (
                      <span
                        key={ind}
                        style={{
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: '#F5F0E8',
                          color: '#6B5E47',
                        }}
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
