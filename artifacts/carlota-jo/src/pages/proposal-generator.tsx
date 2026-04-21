import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';
const BASE = import.meta.env.BASE_URL;

type GeneratedProposal = {
  prospectName: string;
  prospectCompany: string;
  engagementTitle: string;
  executiveSummary: string;
  situationAssessment: string;
  scopeOfWork: { phase: string; deliverables: string[]; duration: string }[];
  teamComposition: { role: string; name: string; responsibility: string }[];
  caseStudies: { client: string; challenge: string; outcome: string; relevance: string }[];
  investmentStructure: { option: string; description: string; fee: string; includes: string[] }[];
  timeline: string;
  nextSteps: string[];
};

type ProposalDraft = {
  id: number;
  title: string;
  prospectName: string;
  prospectCompany: string;
  template: string;
  formData: Record<string, string>;
  generatedProposal: GeneratedProposal | null;
  status: 'draft' | 'generated' | 'sent';
  updatedAt: string;
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}api${path}`, { credentials: 'include' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

let csrfTokenCache: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  const r = await fetch(`${BASE}api/csrf-token`, { credentials: 'include' });
  const b = (await r.json()) as { csrfToken?: string };
  csrfTokenCache = String(b.csrfToken ?? '');
  return csrfTokenCache;
}

async function apiMutation<T>(method: string, path: string, body?: unknown): Promise<T> {
  const csrfToken = await getCsrfToken();
  const res = await fetch(`${BASE}api${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 403) csrfTokenCache = null;
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

function exportToPDF(proposal: GeneratedProposal) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addText = (
    text: string,
    x: number,
    yPos: number,
    opts: { fontSize?: number; fontStyle?: 'normal' | 'bold' | 'italic'; color?: number[]; maxWidth?: number } = {},
  ): number => {
    const { fontSize = 10, fontStyle = 'normal', color = [44, 36, 22], maxWidth = contentWidth } = opts;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineH = fontSize * 0.35 + 1.5;
    const totalH = lines.length * lineH;
    if (yPos + totalH > 277) {
      doc.addPage();
      yPos = margin;
    }
    doc.text(lines, x, yPos);
    return yPos + totalH + 3;
  };

  const addDivider = (yPos: number): number => {
    doc.setDrawColor(184, 150, 12);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    return yPos + 4;
  };

  const addSection = (heading: string, yPos: number): number => {
    if (yPos > 240) {
      doc.addPage();
      yPos = margin;
    }
    yPos = addText(heading.toUpperCase(), margin, yPos, {
      fontSize: 8,
      fontStyle: 'bold',
      color: [184, 150, 12],
    });
    return yPos;
  };

  // Cover
  doc.setFillColor(0, 26, 24);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(184, 150, 12);
  doc.text('CARLOTA JO', margin, 22);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(61, 122, 110);
  doc.text('MANAGEMENT CONSULTING', margin, 28);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 240, 232);
  const titleLines = doc.splitTextToSize(proposal.engagementTitle, contentWidth);
  doc.text(titleLines, margin, 42);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(61, 122, 110);
  doc.text(
    `Prepared for ${proposal.prospectName} · ${proposal.prospectCompany}`,
    margin,
    55,
  );

  y = 70;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(181, 168, 152);
  doc.text(
    `${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Strictly Confidential`,
    margin,
    y,
  );

  y += 10;
  y = addDivider(y);
  y += 4;

  y = addSection('Executive Summary', y);
  y = addText(proposal.executiveSummary, margin, y);
  y += 4;

  y = addSection('Situation Assessment', y);
  y = addText(proposal.situationAssessment, margin, y);
  y += 4;

  y = addSection('Scope of Work', y);
  for (const phase of proposal.scopeOfWork) {
    y = addText(`${phase.phase}  (${phase.duration})`, margin, y, { fontStyle: 'bold', fontSize: 10 });
    for (const d of phase.deliverables) {
      y = addText(`• ${d}`, margin + 4, y, { fontSize: 9, color: [92, 77, 60] });
    }
    y += 2;
  }

  y = addSection('Team Composition', y);
  for (const member of proposal.teamComposition) {
    y = addText(
      `${member.role}  —  ${member.name}`,
      margin,
      y,
      { fontStyle: 'bold', fontSize: 10 },
    );
    y = addText(member.responsibility, margin + 4, y, { fontSize: 9, color: [92, 77, 60] });
    y += 2;
  }

  y = addSection('Relevant Case Studies', y);
  for (const cs of proposal.caseStudies) {
    y = addText(cs.client, margin, y, { fontStyle: 'bold', fontSize: 10 });
    y = addText(`Challenge: ${cs.challenge}`, margin + 4, y, { fontSize: 9, color: [92, 77, 60] });
    y = addText(`Outcome: ${cs.outcome}`, margin + 4, y, { fontSize: 9, color: [5, 150, 105] });
    y = addText(`Relevance: ${cs.relevance}`, margin + 4, y, { fontSize: 9, color: [92, 77, 60] });
    y += 3;
  }

  y = addSection('Investment Structure', y);
  for (const option of proposal.investmentStructure) {
    y = addText(`${option.option}  —  ${option.fee}`, margin, y, {
      fontStyle: 'bold',
      fontSize: 10,
      color: [184, 150, 12],
    });
    y = addText(option.description, margin + 4, y, { fontSize: 9, color: [92, 77, 60] });
    for (const inc of option.includes) {
      y = addText(`✓ ${inc}`, margin + 4, y, { fontSize: 9, color: [5, 150, 105] });
    }
    y += 2;
  }

  y = addSection('Timeline', y);
  y = addText(proposal.timeline, margin, y);
  y += 4;

  y = addSection('Next Steps', y);
  for (const [i, step] of proposal.nextSteps.entries()) {
    y = addText(`${i + 1}. ${step}`, margin, y, { fontSize: 10 });
  }

  y += 8;
  y = addDivider(y);
  y = addText(
    'This proposal is confidential and prepared exclusively for the named recipient. © Carlota Jo Consulting.',
    margin,
    y,
    { fontSize: 7, color: [181, 168, 152] },
  );

  const filename = `carlota-jo-proposal-${proposal.prospectCompany.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(filename);
}

export default function ProposalGenerator() {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Proposal Generator | Carlota Jo',
    description:
      'Governed consulting proposal generator — turn prospect enquiries into tailored, professional proposals in hours, not weeks.',
    canonical: 'https://szlholdings.com/carlota-jo/proposal-generator',
  });

  const TEMPLATES = [
    { id: 'standard', name: t('proposalGenerator.templates.standard.name'), description: t('proposalGenerator.templates.standard.desc'), icon: FileText },
    { id: 'rapid', name: t('proposalGenerator.templates.rapid.name'), description: t('proposalGenerator.templates.rapid.desc'), icon: Target },
    { id: 'retainer', name: t('proposalGenerator.templates.retainer.name'), description: t('proposalGenerator.templates.retainer.desc'), icon: Clock },
  ];
  const ENGAGEMENT_TYPES = t('proposalGenerator.engagementTypes', { returnObjects: true }) as string[];
  const BUDGETS = t('proposalGenerator.budgets', { returnObjects: true }) as string[];
  const TIMELINES = t('proposalGenerator.timelines', { returnObjects: true }) as string[];

  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [saving, setSaving] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<ProposalDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<number | null>(null);

  const [form, setForm] = useState({
    prospectName: '',
    prospectTitle: '',
    company: '',
    industry: '',
    engagementType: '',
    challenge: '',
    goals: '',
    budget: '',
    timeline: '',
    additionalContext: '',
  });

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const fetchDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const data = await apiGet<{ proposals: ProposalDraft[] }>('/carlota/proposals');
      setDrafts(data.proposals);
    } catch {
      // Silent fail — drafts are optional
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDrafts();
  }, [fetchDrafts]);

  const saveDraft = async (currentProposal?: GeneratedProposal) => {
    setSaving(true);
    try {
      const title =
        form.company && form.engagementType
          ? `${form.engagementType} — ${form.company}`
          : `Draft — ${new Date().toLocaleDateString('en-GB')}`;
      const body = {
        title,
        prospectName: form.prospectName,
        prospectCompany: form.company,
        template: selectedTemplate,
        formData: form,
        generatedProposal: currentProposal ?? proposal ?? null,
        status: (currentProposal ?? proposal) ? 'generated' : 'draft',
      };
      if (savedDraftId) {
        const updated = await apiMutation<ProposalDraft>(
          'PUT',
          `/carlota/proposals/${savedDraftId}`,
          body,
        );
        setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await apiMutation<ProposalDraft>('POST', '/carlota/proposals', body);
        setSavedDraftId(created.id);
        setDrafts((prev) => [created, ...prev]);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const loadDraft = (draft: ProposalDraft) => {
    if (draft.formData) {
      setForm(draft.formData as typeof form);
    }
    setSelectedTemplate(draft.template);
    setSavedDraftId(draft.id);
    if (draft.generatedProposal) {
      setProposal(draft.generatedProposal);
    } else {
      setProposal(null);
    }
    setShowDrafts(false);
  };

  const deleteDraft = async (id: number) => {
    setDeletingDraftId(id);
    try {
      await apiMutation('DELETE', `/carlota/proposals/${id}`);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (savedDraftId === id) {
        setSavedDraftId(null);
        setProposal(null);
        setForm({
          prospectName: '',
          prospectTitle: '',
          company: '',
          industry: '',
          engagementType: '',
          challenge: '',
          goals: '',
          budget: '',
          timeline: '',
          additionalContext: '',
        });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete draft');
    } finally {
      setDeletingDraftId(null);
    }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `You are Carlota Jo, a premium management consulting firm. Generate a tailored client proposal as JSON with EXACTLY this structure:
{
  "prospectName": "${form.prospectName}",
  "prospectCompany": "${form.company}",
  "engagementTitle": "A compelling, specific engagement title (5-8 words)",
  "executiveSummary": "3-4 sentence executive summary that shows deep understanding of the prospect's situation",
  "situationAssessment": "2-3 sentences demonstrating understanding of the prospect's challenge",
  "scopeOfWork": [
    {"phase": "Phase 1 name", "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"], "duration": "2-3 weeks"},
    {"phase": "Phase 2 name", "deliverables": ["deliverable 1", "deliverable 2"], "duration": "3-4 weeks"},
    {"phase": "Phase 3 name", "deliverables": ["deliverable 1", "deliverable 2"], "duration": "2 weeks"}
  ],
  "teamComposition": [
    {"role": "Lead Advisor", "name": "Carlota Jo", "responsibility": "Strategic direction and executive relationship"},
    {"role": "Senior Analyst", "name": "To be assigned", "responsibility": "Primary analytical work"}
  ],
  "caseStudies": [
    {"client": "Confidential — Consumer Goods", "challenge": "relevant challenge", "outcome": "specific outcome with metrics", "relevance": "why relevant to this prospect"},
    {"client": "Confidential — Professional Services", "challenge": "relevant challenge", "outcome": "specific outcome with metrics", "relevance": "why relevant to this prospect"}
  ],
  "investmentStructure": [
    {"option": "Essential", "description": "Core scope", "fee": "£X,XXX", "includes": ["deliverable 1", "deliverable 2"]},
    {"option": "Comprehensive", "description": "Full scope", "fee": "£XX,XXX", "includes": ["deliverable 1", "deliverable 2", "deliverable 3"]},
    {"option": "Partnership", "description": "Extended support", "fee": "From £X,XXX/month", "includes": ["all comprehensive", "monthly advisory", "priority access"]}
  ],
  "timeline": "X – Y weeks from engagement start",
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Prospect details:
Name: ${form.prospectName}, Title: ${form.prospectTitle}
Company: ${form.company}, Industry: ${form.industry}
Engagement type: ${form.engagementType}${selectedTemplate !== 'standard' ? ` (Template: ${selectedTemplate})` : ''}
Primary challenge: ${form.challenge}
Strategic goals: ${form.goals}
Budget: ${form.budget}
Timeline: ${form.timeline}
Additional context: ${form.additionalContext}

Template: ${selectedTemplate}. Use UK spelling. Return ONLY valid JSON.`;

      const res = await fetch(`${BASE}api/intelligence/ai/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'Proposal generator — Carlota Jo',
        }),
      });

      let fullContent = '';
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const json = JSON.parse(line.slice(6));
              if (json.content) fullContent += json.content;
            } catch {}
          }
        }
      }

      let generated: GeneratedProposal;
      try {
        generated = JSON.parse(
          (fullContent || '{}').replace(/```json|```/g, '').trim(),
        ) as GeneratedProposal;
      } catch {
        generated = buildFallback();
      }
      setProposal(generated);
      await saveDraft(generated);
    } catch {
      const fallback = buildFallback();
      setProposal(fallback);
      await saveDraft(fallback);
    } finally {
      setLoading(false);
    }
  };

  const buildFallback = (): GeneratedProposal => ({
    prospectName: form.prospectName || 'Alex Chen',
    prospectCompany: form.company || 'Meridian Technologies',
    engagementTitle: `${form.engagementType || 'Growth Strategy'} for ${form.company || 'Meridian Technologies'}`,
    executiveSummary: `${form.company || 'Meridian Technologies'} stands at a genuine inflection point. Carlota Jo proposes a focused ${form.engagementType || 'growth strategy'} engagement designed to translate your ambition into a concrete, prioritised roadmap. We have helped six comparable businesses in ${form.industry || 'your sector'} navigate similar inflection points, delivering an average 3.2× return on the consulting investment within 18 months.`,
    situationAssessment: `${form.company || 'Your company'} operates in a market undergoing structural change. ${form.challenge || 'The core challenge'} requires a response that is both analytically grounded and executable within your organisational context.`,
    scopeOfWork: [
      {
        phase: 'Discovery & Diagnostic',
        deliverables: ['Stakeholder interview programme', 'Current state assessment', 'Competitive landscape mapping', 'Situation diagnostic report'],
        duration: '2–3 weeks',
      },
      {
        phase: 'Strategy Development',
        deliverables: ['Strategic options analysis (3 scenarios)', 'Prioritised strategy with rationale', 'Financial model and business case', 'Executive strategy presentation'],
        duration: '3–4 weeks',
      },
      {
        phase: 'Roadmap & Handover',
        deliverables: ['90-day execution roadmap', 'KPI framework', 'Implementation guidance session'],
        duration: '1–2 weeks',
      },
    ],
    teamComposition: [
      { role: 'Lead Advisor', name: 'Carlota Jo', responsibility: 'Strategic direction, senior client relationship, and quality assurance' },
      { role: 'Senior Analyst', name: 'To be confirmed', responsibility: 'Primary analytical work, client interviews, and day-to-day delivery' },
      { role: 'Financial Modelling Specialist', name: 'Associate engagement', responsibility: 'Business case development and scenario modelling' },
    ],
    caseStudies: [
      { client: 'Confidential — Consumer Brands (£18M revenue)', challenge: 'Pricing strategy overhaul to defend margin', outcome: '£2.4M incremental margin recovered in Year 1', relevance: `Directly analogous to ${form.company || 'your'} need for strategic clarity` },
      { client: 'Confidential — Professional Services (£6M revenue)', challenge: 'Market entry into two new verticals', outcome: '£1.1M new ARR within 12 months of implementation', relevance: `Demonstrates our ability to build realistic, executable growth strategies for ${form.industry || 'professional'} businesses` },
    ],
    investmentStructure: [
      { option: 'Essential', description: 'Core diagnostic and strategy', fee: '£24,000', includes: ['Discovery & diagnostic phase', 'Strategy development', 'Written strategy report', 'Two executive presentations'] },
      { option: 'Comprehensive', description: 'Full engagement including execution roadmap', fee: '£42,000', includes: ['All Essential deliverables', '90-day execution roadmap', 'KPI framework', 'Four stakeholder workshops', '30-day post-delivery support'] },
      { option: 'Strategic Partnership', description: 'Ongoing advisory retainer', fee: 'From £6,500/month', includes: ['All Comprehensive deliverables', 'Monthly strategic advisory sessions', 'Unlimited email access', 'Quarterly business reviews'] },
    ],
    timeline: '7–9 weeks from engagement start',
    nextSteps: ['Review this proposal and share any questions or refinements', 'Align on preferred engagement option and scope adjustments', 'Sign engagement agreement and issue first invoice (50% upfront)', 'Agree kick-off date and stakeholder interview schedule'],
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E5E0D8',
    background: '#fff',
    color: '#2C2416',
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#8C7B6B',
    marginBottom: 6,
  };

  if (proposal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FileText size={18} color={GOLD} />
                <span
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase' }}
                >
                  {t('proposalGenerator.label', 'Engagement Proposal')}
                </span>
                {savedDraftId && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#059669',
                    }}
                  >
                    <Database size={9} />
                    {t('proposalGenerator.saved', 'Saved')}
                  </span>
                )}
              </div>
              <h1
                style={{
                  fontSize: 'clamp(20px, 3vw, 30px)',
                  fontWeight: 400,
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#2C2416',
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {proposal.engagementTitle}
              </h1>
              <p style={{ fontSize: 13, color: '#8C7B6B' }}>
                {t('proposalGenerator.preparedFor', 'Prepared for')} {proposal.prospectName} ·{' '}
                {proposal.prospectCompany} ·{' '}
                {new Date().toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setProposal(null); setSavedDraftId(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #E5E0D8',
                  background: 'transparent',
                  color: '#8C7B6B',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                {t('proposalGenerator.newProposal', 'New Proposal')}
              </button>
              <button
                onClick={() => void saveDraft(proposal)}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #E5E0D8',
                  background: 'transparent',
                  color: '#5C4D3C',
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
              </button>
              <button
                onClick={() => exportToPDF(proposal)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${GOLD}`,
                  background: GOLD,
                  color: '#1A1200',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                {t('proposalGenerator.exportPDF', 'Export PDF')}
              </button>
            </div>
          </div>

          {/* Proposal Sections */}
          {[
            {
              icon: Target,
              title: t('proposalGenerator.execSummary', 'Executive Summary'),
              content: proposal.executiveSummary,
            },
            {
              icon: Sparkles,
              title: t('proposalGenerator.situation', 'Situation Assessment'),
              content: proposal.situationAssessment,
            },
          ].map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #E5E0D8',
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon size={16} color={GOLD} />
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2C2416' }}>{section.title}</h2>
                </div>
                <p style={{ fontSize: 14, color: '#5C4D3C', lineHeight: 1.8 }}>{section.content}</p>
              </div>
            );
          })}

          {/* Scope of Work */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #E5E0D8',
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BookOpen size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2C2416' }}>
                {t('proposalGenerator.scopeOfWork', 'Scope of Work')}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proposal.scopeOfWork.map((phase, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 16 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `${GOLD}20`,
                      border: `2px solid ${GOLD}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#8C6200',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C2416' }}>{phase.phase}</h3>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: '#8C7B6B',
                        }}
                      >
                        <Clock size={11} />
                        {phase.duration}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {phase.deliverables.map((d) => (
                        <div
                          key={d}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#5C4D3C' }}
                        >
                          <CheckCircle size={12} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #E5E0D8',
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Users size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2C2416' }}>
                {t('proposalGenerator.team', 'Team Composition')}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {proposal.teamComposition.map((member) => (
                <div
                  key={member.role}
                  style={{
                    padding: '12px 16px',
                    background: '#FAFAF8',
                    borderRadius: 8,
                    border: '1px solid #F0EBE3',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#2C2416' }}>{member.role}</span>
                    <span style={{ fontSize: 12, color: '#8C7B6B' }}>{member.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#5C4D3C' }}>{member.responsibility}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Case Studies */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #E5E0D8',
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2C2416' }}>
                {t('proposalGenerator.caseStudies', 'Relevant Case Studies')}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proposal.caseStudies.map((cs, i) => (
                <div
                  key={i}
                  style={{ paddingLeft: 16, borderLeft: `3px solid ${GOLD}` }}
                >
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#2C2416', marginBottom: 4 }}>{cs.client}</p>
                  <p style={{ fontSize: 12, color: '#8C7B6B', marginBottom: 4 }}>
                    <strong>Challenge:</strong> {cs.challenge}
                  </p>
                  <p style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>
                    <strong>Outcome:</strong> {cs.outcome}
                  </p>
                  <p style={{ fontSize: 12, color: '#5C4D3C' }}>
                    <strong>Relevance:</strong> {cs.relevance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Investment */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #E5E0D8',
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <DollarSign size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2C2416' }}>
                {t('proposalGenerator.investment', 'Investment Structure')}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {proposal.investmentStructure.map((option, i) => (
                <div
                  key={option.option}
                  style={{
                    padding: '16px',
                    borderRadius: 10,
                    border: i === 1 ? `2px solid ${GOLD}` : '1px solid #E5E0D8',
                    background: i === 1 ? `${GOLD}08` : '#fff',
                    position: 'relative',
                  }}
                >
                  {i === 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -10,
                        left: 16,
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: GOLD,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#1A1200',
                      }}
                    >
                      {t('proposalGenerator.mostPopular', 'Most Popular')}
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#2C2416', marginBottom: 2 }}>
                    {option.option}
                  </div>
                  <div style={{ fontSize: 11, color: '#8C7B6B', marginBottom: 10 }}>
                    {option.description}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: GOLD,
                      fontFamily: "'Cormorant Garamond', serif",
                      marginBottom: 10,
                    }}
                  >
                    {option.fee}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {option.includes.map((inc) => (
                      <div
                        key={inc}
                        style={{ display: 'flex', gap: 6, fontSize: 12, color: '#5C4D3C', alignItems: 'flex-start' }}
                      >
                        <CheckCircle size={12} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
                        {inc}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline & Next Steps */}
          <div
            style={{
              background: 'linear-gradient(135deg, #001A18 0%, #002E28 100%)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 32,
            }}
          >
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Clock size={15} color="#5EEAD4" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#5EEAD4', letterSpacing: '0.08em' }}>
                    {t('proposalGenerator.timeline', 'TIMELINE')}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#F5F0E8',
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  {proposal.timeline}
                </div>
              </div>
              <div style={{ flex: 2, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <ChevronRight size={15} color="#5EEAD4" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#5EEAD4', letterSpacing: '0.08em' }}>
                    {t('proposalGenerator.nextSteps', 'NEXT STEPS')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {proposal.nextSteps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(94,234,212,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#5EEAD4',
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13, color: '#A0C4BD', lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 11, color: '#B5A898', marginBottom: 40 }}>
            {t(
              'proposalGenerator.confidential',
              'This proposal is confidential and prepared exclusively for the named recipient.',
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Form View
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001A18 0%, #002E28 50%, #000F0D 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(15,118,110,0.2)',
                  border: '1px solid rgba(15,118,110,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={16} color="#5EEAD4" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#5EEAD4',
                  textTransform: 'uppercase',
                }}
              >
                {t('proposalGenerator.title', 'Proposal Generator')}
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
              {t('proposalGenerator.headline', 'Proposal in')}
              <br />
              <em style={{ color: '#5EEAD4' }}>{t('proposalGenerator.headlineAccent', 'Hours, Not Weeks.')}</em>
            </h1>
            <p style={{ fontSize: 15, color: '#3D7A6E', maxWidth: 520, lineHeight: 1.7 }}>
              {t(
                'proposalGenerator.subtitle',
                'AI-generated, senior-reviewed proposals tailored to every prospect. Export to PDF. Save drafts.',
              )}
            </p>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 48px' }}>
        {/* Drafts Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#2C2416' }}>
            {t('proposalGenerator.newProposal', 'New Proposal')}
          </h2>
          <button
            onClick={() => setShowDrafts(!showDrafts)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #E5E0D8',
              background: '#fff',
              color: '#5C4D3C',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <FileText size={13} />
            {t('proposalGenerator.savedDrafts', 'Saved Drafts')}
            {drafts.length > 0 && (
              <span
                style={{
                  padding: '0 6px',
                  borderRadius: 20,
                  background: GOLD,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#1A1200',
                }}
              >
                {drafts.length}
              </span>
            )}
          </button>
        </div>

        {/* Drafts list */}
        <AnimatePresence>
          {showDrafts && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E5E0D8',
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#2C2416', marginBottom: 12 }}>
                {t('proposalGenerator.savedDrafts', 'Saved Drafts')}
              </h3>
              {draftsLoading && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#8C7B6B' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              )}
              {!draftsLoading && drafts.length === 0 && (
                <p style={{ fontSize: 13, color: '#B5A898', textAlign: 'center', padding: '16px 0' }}>
                  {t('proposalGenerator.noDrafts', 'No saved drafts yet. Generate a proposal to get started.')}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: '#FAFAF8',
                      borderRadius: 8,
                      border: '1px solid #F0EBE3',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2416' }}>{draft.title}</div>
                      <div style={{ fontSize: 11, color: '#8C7B6B', marginTop: 2 }}>
                        {draft.prospectCompany || '—'} · {draft.template} ·{' '}
                        <span
                          style={{
                            color:
                              draft.status === 'generated'
                                ? '#059669'
                                : draft.status === 'sent'
                                  ? '#0284C7'
                                  : '#D97706',
                            fontWeight: 600,
                          }}
                        >
                          {draft.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => loadDraft(draft)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        background: GOLD,
                        border: 'none',
                        color: '#1A1200',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {t('common.load', 'Load')}
                    </button>
                    <button
                      onClick={() => void deleteDraft(draft.id)}
                      disabled={deletingDraftId === draft.id}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        border: '1px solid #FECACA',
                        background: 'transparent',
                        color: '#DC2626',
                        cursor: deletingDraftId === draft.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deletingDraftId === draft.id ? (
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Selection */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#8C7B6B', marginBottom: 10 }}>
            {t('proposalGenerator.selectTemplate', 'Select Template')}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: '14px 16px',
                    borderRadius: 10,
                    border:
                      selectedTemplate === tpl.id ? `2px solid ${GOLD}` : '1px solid #E5E0D8',
                    background: selectedTemplate === tpl.id ? `${GOLD}10` : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon size={15} color={selectedTemplate === tpl.id ? GOLD : '#8C7B6B'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2C2416' }}>{tpl.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8C7B6B' }}>{tpl.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #E5E0D8',
            padding: 28,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#2C2416', marginBottom: 20 }}>
            {t('proposalGenerator.prospectDetails', 'Prospect Details')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formProspectName', 'Prospect Name')} *</label>
              <input
                style={inputStyle}
                value={form.prospectName}
                onChange={update('prospectName')}
                placeholder="e.g. Sarah Williams"
              />
            </div>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formProspectTitle', 'Prospect Title')}</label>
              <input
                style={inputStyle}
                value={form.prospectTitle}
                onChange={update('prospectTitle')}
                placeholder="e.g. CEO, Meridian Technologies"
              />
            </div>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formCompany', 'Company Name')} *</label>
              <input
                style={inputStyle}
                value={form.company}
                onChange={update('company')}
                placeholder="e.g. Meridian Technologies"
              />
            </div>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formIndustry', 'Industry')}</label>
              <input
                style={inputStyle}
                value={form.industry}
                onChange={update('industry')}
                placeholder="e.g. Technology, Healthcare"
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #E5E0D8',
            padding: 28,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#2C2416', marginBottom: 20 }}>
            {t('proposalGenerator.engagementDetails', 'Engagement Details')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t('proposalGenerator.formEngagementType', 'Engagement Type')}</label>
                <select style={inputStyle} value={form.engagementType} onChange={update('engagementType')}>
                  <option value="">Select type…</option>
                  {ENGAGEMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('proposalGenerator.formBudget', 'Budget Indication')}</label>
                <select style={inputStyle} value={form.budget} onChange={update('budget')}>
                  <option value="">Select budget…</option>
                  {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('proposalGenerator.formTimeline', 'Start Timeline')}</label>
                <select style={inputStyle} value={form.timeline} onChange={update('timeline')}>
                  <option value="">Select timeline…</option>
                  {TIMELINES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formChallenge', 'Primary Challenge')} *</label>
              <textarea
                style={{ ...inputStyle, resize: 'none' }}
                rows={3}
                value={form.challenge}
                onChange={update('challenge')}
                placeholder="e.g. We are losing market share to new digital entrants and need a clear strategy to defend and grow our position..."
              />
            </div>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formGoals', 'Strategic Goals')}</label>
              <textarea
                style={{ ...inputStyle, resize: 'none' }}
                rows={3}
                value={form.goals}
                onChange={update('goals')}
                placeholder="e.g. Double revenue within 3 years, enter two new markets, build a direct-to-consumer channel..."
              />
            </div>
            <div>
              <label style={labelStyle}>{t('proposalGenerator.formContext', 'Additional Context')}</label>
              <textarea
                style={{ ...inputStyle, resize: 'none' }}
                rows={2}
                value={form.additionalContext}
                onChange={update('additionalContext')}
                placeholder="Any other relevant context (stage of business, constraints, prior work...)..."
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => void saveDraft()}
            disabled={saving || !form.company}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid #E5E0D8',
              background: '#fff',
              color: '#5C4D3C',
              fontWeight: 600,
              fontSize: 14,
              cursor: saving || !form.company ? 'not-allowed' : 'pointer',
              opacity: saving || !form.company ? 0.5 : 1,
            }}
          >
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            {saving ? t('common.saving', 'Saving…') : t('proposalGenerator.saveDraft', 'Save Draft')}
          </button>
          <button
            onClick={generate}
            disabled={loading || !form.prospectName || !form.company || !form.challenge}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 32px',
              borderRadius: 10,
              background:
                loading || !form.prospectName || !form.company || !form.challenge
                  ? '#D4C5B0'
                  : GOLD,
              border: 'none',
              color: '#1A1200',
              fontWeight: 700,
              fontSize: 15,
              cursor:
                loading || !form.prospectName || !form.company || !form.challenge
                  ? 'not-allowed'
                  : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                {t('proposalGenerator.generating', 'Generating Proposal…')}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {t('proposalGenerator.generate', 'Generate Proposal')}
                <Plus size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
