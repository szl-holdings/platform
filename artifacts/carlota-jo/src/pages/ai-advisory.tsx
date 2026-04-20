import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { useRealtimeChannel } from '@szl-holdings/shared-ui/use-realtime-channel';
import {
  BookOpen,
  Brain,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Search,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CarlotaGraphQLPanel } from '@/components/graphql-data-panel';
import { usePageMeta } from '@/hooks/usePageMeta';

async function downloadEngagementSummary(
  insights: Array<{
    title: string;
    type: string;
    summary: string;
    confidence: number;
    tags: string[];
  }>,
  sessionMessages: Array<{ role: string; content: string }>,
): Promise<void> {
  const assistantMessages = sessionMessages.filter((m) => m.role === 'assistant');
  const userQuestions = sessionMessages.filter((m) => m.role === 'user');

  const derivedRecommendations: string[] = [];
  const derivedOverview =
    assistantMessages.length > 0
      ? `This engagement summary captures ${assistantMessages.length} AI advisory exchange${assistantMessages.length > 1 ? 's' : ''} and ${insights.length} AI-generated research insight${insights.length > 1 ? 's' : ''}. Topics covered: ${userQuestions.map((m) => m.content.slice(0, 60)).join('; ')}.`
      : 'This engagement summary compiles the key insights, strategic recommendations, and action items from recent advisory sessions.';

  if (assistantMessages.length > 0) {
    const lastResponse = assistantMessages[assistantMessages.length - 1].content;
    const sentences = lastResponse.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    derivedRecommendations.push(...sentences.slice(0, 3).map((s) => s.trim()));
  }
  if (derivedRecommendations.length < 3) {
    derivedRecommendations.push(
      'Accelerate GTM execution in the primary target segment before year-end.',
      'Initiate pricing architecture review with revenue team within 30 days.',
      'Establish clearer success metrics for each strategic initiative.',
      'Review org design to ensure capacity alignment with strategic priorities.',
    );
  }

  const res = await fetch('/api/documents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'carlota-engagement-summary',
      data: {
        client: 'Advisory Client',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        overview: derivedOverview,
        insights: insights.map((i) => ({
          title: i.title,
          type: i.type,
          summary: i.summary,
          confidence: i.confidence,
          tags: i.tags,
        })),
        recommendations: derivedRecommendations.slice(0, 5),
        nextSteps: [
          {
            action: 'Executive review of pricing architecture proposal',
            owner: 'Client CEO',
            deadline: '2 weeks',
          },
          {
            action: 'Market sizing validation for adjacent segment',
            owner: 'Strategy team',
            deadline: '30 days',
          },
          {
            action: 'Follow-up advisory session: Revenue architecture deep-dive',
            owner: 'Carlota Jo',
            deadline: '3 weeks',
          },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'carlota-jo-engagement-summary.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

const insightCards = [
  {
    title: 'Market Entry Strategy — Southeast Asia',
    type: 'Market Research',
    summary:
      "Consumer spending in SEA projected to reach $4.7T by 2028. Key opportunity in B2B SaaS with government digitization initiatives in Singapore, Indonesia, and Vietnam. Recommend phased entry starting with Singapore's regulatory sandbox.",
    tags: ['Market Entry', 'SEA', 'B2B SaaS'],
    confidence: 87,
  },
  {
    title: 'Supply Chain Resilience Assessment',
    type: 'Risk Analysis',
    summary:
      "Client's single-source procurement creates 73% concentration risk. Benchmarking against top-quartile peers suggests 3-5 supplier diversification reduces disruption risk by 62%. ROI on dual-source implementation: 340% over 3 years.",
    tags: ['Supply Chain', 'Risk', 'Procurement'],
    confidence: 92,
  },
  {
    title: 'Pricing Architecture Optimization',
    type: 'Revenue Strategy',
    summary:
      'Analysis of 12 comparable companies reveals client pricing is 18% below market. Value-based pricing model with 3-tier structure could yield $4.2M ARR uplift with <5% churn risk based on NPS cohort analysis.',
    tags: ['Pricing', 'Revenue', 'B2B'],
    confidence: 89,
  },
];

const initialHistory = [
  {
    role: 'user' as const,
    content: 'What are the key drivers of enterprise SaaS churn in the manufacturing vertical?',
  },
  {
    role: 'assistant' as const,
    content:
      'Based on analysis of 847 enterprise contracts across the manufacturing vertical, the top 3 churn drivers are: (1) Poor integration with legacy ERP systems — accounts for 34% of churns; (2) Insufficient ROI demonstration in the first 90 days — 28%; (3) Executive sponsor turnover — 19%. Mitigation: Prioritize native SAP/Oracle connectors, implement 30-60-90 day success milestones tied to KPIs, and build multi-threader relationships across VP+ level in Year 1.',
  },
  { role: 'user' as const, content: 'How does this compare to the healthcare vertical?' },
  {
    role: 'assistant' as const,
    content:
      "Healthcare shows meaningfully different churn patterns. The top drivers there are: (1) Regulatory/compliance concerns — 41% of churns post-HIPAA audit anxiety; (2) Clinical workflow disruption — 31%; (3) Budget freeze cycles tied to fiscal years — 22%. The actionable contrast: Manufacturing needs deep technical integration focus, while Healthcare needs dedicated compliance documentation and change management. Recommend structuring your client's CS team by vertical with specialized playbooks.",
  },
];

export default function AIAdvisory() {
  usePageMeta({
    title: 'AI Advisory | Carlota Jo Consulting – Strategy Intelligence',
    description:
      'Evidence-backed brand strategy advisory from Carlota Jo Consulting. Get instant market entry analysis, risk assessments, and competitive intelligence.',
    canonical: 'https://szlholdings.com/carlota-jo/ai-advisory',
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initialHistory);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [newInquiryAlert, setNewInquiryAlert] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { lastMessage: wsBookingMsg } = useRealtimeChannel('bookings');
  useEffect(() => {
    if (!wsBookingMsg) return;
    setNewInquiryAlert(true);
    const t = setTimeout(() => setNewInquiryAlert(false), 8000);
    return () => clearTimeout(t);
  }, [wsBookingMsg]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setStreaming(true);
    setStreamingContent('');

    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: 'Carlota Jo consulting platform — strategic advisory for enterprise clients',
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

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
            if (json.done) break;
            if (json.error) throw new Error(json.error);
            if (json.content) {
              fullContent += json.content;
              setStreamingContent(fullContent);
            }
          } catch {}
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant' as const, content: fullContent }]);
      setStreamingContent('');
    } catch (err) {
      const errMsg = `Error: ${err instanceof Error ? err.message : 'Advisory request failed'}`;
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: errMsg }]);
      setStreamingContent('');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Advisory Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-augmented strategic research and analysis — synthesizing market intelligence,
            competitive dynamics, and engagement data into conviction-grade recommendations
          </p>
          {newInquiryAlert && (
            <div
              className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border"
              style={{
                background: 'rgba(16,185,129,0.1)',
                borderColor: 'rgba(16,185,129,0.3)',
                color: '#10b981',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              New inquiry received via live booking channel
            </div>
          )}
        </div>
        <button
          onClick={async () => {
            setDownloadingPDF(true);
            try {
              await downloadEngagementSummary(insightCards, messages);
            } catch {
              console.error('PDF generation failed');
            } finally {
              setDownloadingPDF(false);
            }
          }}
          disabled={downloadingPDF}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
        >
          {downloadingPDF ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {downloadingPDF ? 'Generating...' : 'Export Engagement Summary'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[480px] flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-sm">Advisory Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 overflow-hidden pb-4">
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-xs ${m.role === 'user' ? 'bg-primary/15 text-primary-foreground' : 'bg-muted'}`}
                    >
                      {m.role === 'assistant' && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-semibold text-primary">Carlota AI</span>
                          <span className="text-[9px] text-muted-foreground ml-1">
                            claude-sonnet-4-6
                          </span>
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {streaming && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-3 rounded-lg text-xs bg-muted">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        <span className="text-[10px] font-semibold text-primary">Carlota AI</span>
                        <span className="text-[9px] text-muted-foreground ml-1">streaming...</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{streamingContent}</p>
                    </div>
                  </div>
                )}
                {streaming && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Carlota AI is thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask for strategic analysis, market research, or recommendations..."
                  disabled={streaming}
                  className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {streaming ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            AI-Generated Insights
          </h3>
          {insightCards.map((insight) => (
            <Card
              key={insight.title}
              className="hover:border-primary/30 transition-colors cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge variant="outline" className="text-[10px] mb-2">
                      {insight.type}
                    </Badge>
                    <p className="text-xs font-semibold">{insight.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-3">
                      {insight.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insight.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    Confidence: {insight.confidence}%
                  </span>
                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CarlotaGraphQLPanel />
    </div>
  );
}
