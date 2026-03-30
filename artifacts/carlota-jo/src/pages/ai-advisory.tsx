import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Brain, Send, BookOpen, TrendingUp, Lightbulb, Search, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const insightCards = [
  { title: "Market Entry Strategy — Southeast Asia", type: "Market Research", summary: "Consumer spending in SEA projected to reach $4.7T by 2028. Key opportunity in B2B SaaS with government digitization initiatives in Singapore, Indonesia, and Vietnam. Recommend phased entry starting with Singapore's regulatory sandbox.", tags: ["Market Entry", "SEA", "B2B SaaS"], confidence: 87 },
  { title: "Supply Chain Resilience Assessment", type: "Risk Analysis", summary: "Client's single-source procurement creates 73% concentration risk. Benchmarking against top-quartile peers suggests 3-5 supplier diversification reduces disruption risk by 62%. ROI on dual-source implementation: 340% over 3 years.", tags: ["Supply Chain", "Risk", "Procurement"], confidence: 92 },
  { title: "Pricing Architecture Optimization", type: "Revenue Strategy", summary: "Analysis of 12 comparable companies reveals client pricing is 18% below market. Value-based pricing model with 3-tier structure could yield $4.2M ARR uplift with <5% churn risk based on NPS cohort analysis.", tags: ["Pricing", "Revenue", "B2B"], confidence: 89 },
];

const conversationHistory = [
  { role: "user", content: "What are the key drivers of enterprise SaaS churn in the manufacturing vertical?" },
  { role: "assistant", content: "Based on analysis of 847 enterprise contracts across the manufacturing vertical, the top 3 churn drivers are: (1) Poor integration with legacy ERP systems — accounts for 34% of churns; (2) Insufficient ROI demonstration in the first 90 days — 28%; (3) Executive sponsor turnover — 19%. Mitigation: Prioritize native SAP/Oracle connectors, implement 30-60-90 day success milestones tied to KPIs, and build multi-threader relationships across VP+ level in Year 1." },
  { role: "user", content: "How does this compare to the healthcare vertical?" },
  { role: "assistant", content: "Healthcare shows meaningfully different churn patterns. The top drivers there are: (1) Regulatory/compliance concerns — 41% of churns post-HIPAA audit anxiety; (2) Clinical workflow disruption — 31%; (3) Budget freeze cycles tied to fiscal years — 22%. The actionable contrast: Manufacturing needs deep technical integration focus, while Healthcare needs dedicated compliance documentation and change management. Recommend structuring your client's CS team by vertical with specialized playbooks." },
];

export default function AIAdvisory() {
  usePageMeta({
    title: "AI Advisory | Carlota Jo Consulting – Strategy Intelligence",
    description: "AI-powered brand strategy advisory from Carlota Jo Consulting. Get instant market entry analysis, risk assessments, and competitive intelligence.",
    canonical: "https://szlholdings.com/carlota-jo/ai-advisory",
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(conversationHistory);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: "Cross-referencing your query against 140+ completed engagements, proprietary valuation models, and current market datasets. Initial analysis suggests three strategic vectors worth exploring — I'm synthesizing comparable deal structures and sector benchmarks to refine the recommendation set. Confidence scoring and supporting evidence will follow." }]);
    setInput("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI Advisory Assistant
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-augmented strategic research and analysis — synthesizing market intelligence, competitive dynamics, and engagement data into conviction-grade recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-96">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Advisory Conversation</CardTitle></CardHeader>
            <CardContent className="flex flex-col h-full pb-4">
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-xs ${m.role === "user" ? "bg-primary/15 text-primary-foreground" : "bg-muted"}`}>
                      {m.role === "assistant" && <div className="flex items-center gap-1 mb-1.5"><Sparkles className="w-3 h-3 text-primary" /><span className="text-[10px] font-semibold text-primary">Carlota AI</span></div>}
                      <p>{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask for strategic analysis, market research, or recommendations..." className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={sendMessage} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Send className="w-3.5 h-3.5" /></button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI-Generated Insights</h3>
          {insightCards.map((insight) => (
            <Card key={insight.title} className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge variant="outline" className="text-[10px] mb-2">{insight.type}</Badge>
                    <p className="text-xs font-semibold">{insight.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-3">{insight.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insight.tags.map(t => <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">Confidence: {insight.confidence}%</span>
                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${insight.confidence}%` }} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
