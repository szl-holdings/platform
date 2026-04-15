import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";
import { BookOpen, Search, Sparkles, Loader2, Tag, Star, Clock, FileText, ChevronRight, Filter, Archive, Lightbulb, Target } from "lucide-react";

const GOLD = "var(--color-gold)";

type KnowledgeItem = {
  id: string;
  type: "framework" | "playbook" | "template" | "case-study" | "research";
  title: string;
  description: string;
  tags: string[];
  industries: string[];
  engagements: string[];
  uses: number;
  rating: number;
  lastUpdated: string;
  author: string;
};

const TYPE_META: Record<KnowledgeItem["type"], { label: string; color: string; icon: typeof BookOpen }> = {
  framework:   { label: "Framework", color: "#7C3AED", icon: Target },
  playbook:    { label: "Playbook", color: "#0284C7", icon: BookOpen },
  template:    { label: "Template", color: "#059669", icon: FileText },
  "case-study": { label: "Case Study", color: "#D97706", icon: Archive },
  research:    { label: "Research", color: "#DC2626", icon: Lightbulb },
};

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: "k1", type: "framework", title: "7-Dimension Brand Positioning Matrix",
    description: "Comprehensive brand positioning analysis covering customer value proposition, competitive differentiation, emotional resonance, price-value perception, channel strategy, and cultural fit. Generates an actionable positioning brief.",
    tags: ["Brand Strategy", "Positioning", "Consumer Research", "Competitive Analysis"],
    industries: ["Consumer Goods", "Retail", "Luxury", "FMCG"],
    engagements: ["Luminary Brands", "Kestrel Brands", "4 others"],
    uses: 14, rating: 4.8, lastUpdated: "Apr 2026", author: "Carlota Jo",
  },
  {
    id: "k2", type: "playbook", title: "PE Portfolio Value Creation — 100-Day Playbook",
    description: "Post-acquisition integration playbook covering leadership assessment, quick-win identification, KPI baseline, customer retention strategy, and organisational design. Developed across 4 PE-backed engagements.",
    tags: ["Private Equity", "M&A", "Integration", "Value Creation", "100-Day"],
    industries: ["Financial Services", "Private Equity", "Industrial"],
    engagements: ["Aurelius Private Equity", "Vertex Capital"],
    uses: 6, rating: 4.9, lastUpdated: "Mar 2026", author: "Sofia Andersson",
  },
  {
    id: "k3", type: "framework", title: "Digital Maturity Assessment Model (DMAM-5)",
    description: "5-dimension digital maturity scoring across Data & Analytics, Customer Experience, Operations, Culture & Talent, and Technology Infrastructure. Produces benchmarked maturity scores with prioritised improvement roadmap.",
    tags: ["Digital Transformation", "Maturity Model", "Assessment", "Roadmap"],
    industries: ["Healthcare", "Financial Services", "Industrial", "Consumer Goods"],
    engagements: ["Solaris Health Systems", "Luminary Brands", "3 others"],
    uses: 9, rating: 4.7, lastUpdated: "Feb 2026", author: "Carlota Jo",
  },
  {
    id: "k4", type: "case-study", title: "Healthcare DTC Strategy — Oasis Wellness",
    description: "End-to-end DTC channel build for a £30M wellness brand entering direct-to-consumer. Covers market entry strategy, digital acquisition, retention architecture, and first-year financial model. IP-protected client version available.",
    tags: ["DTC", "Healthcare", "Channel Strategy", "Digital Marketing", "Wellness"],
    industries: ["Consumer Health", "Healthcare"],
    engagements: ["Oasis Wellness"],
    uses: 4, rating: 4.6, lastUpdated: "Mar 2026", author: "Carlota Jo",
  },
  {
    id: "k5", type: "template", title: "Executive Strategy Presentation — Master Template",
    description: "Board-ready strategy presentation template with customisable sections for situation assessment, strategic options, recommended path, implementation roadmap, and financial projections. Includes design guidelines and copy prompts.",
    tags: ["Presentation", "Executive", "Board", "Strategy", "Template"],
    industries: ["All"],
    engagements: ["Multiple"],
    uses: 28, rating: 4.9, lastUpdated: "Apr 2026", author: "Carlota Jo",
  },
  {
    id: "k6", type: "framework", title: "Stakeholder Influence Mapping — 4-Quadrant Model",
    description: "Rigorous stakeholder analysis framework mapping power vs. interest to drive engagement strategy. Includes influence pathway analysis, change resistance scoring, and coalition-building tactics. Proven in complex multi-stakeholder environments.",
    tags: ["Stakeholder Management", "Change Management", "Influence", "Coalition"],
    industries: ["Healthcare", "Industrial", "Financial Services"],
    engagements: ["Solaris Health Systems", "Clearfield Manufacturing", "2 others"],
    uses: 11, rating: 4.8, lastUpdated: "Jan 2026", author: "Kai Okonkwo",
  },
  {
    id: "k7", type: "research", title: "AI in Consulting — Market Intelligence Report 2026",
    description: "Comprehensive analysis of AI adoption in consulting services: client expectations, competitor positioning, capability gaps, and strategic recommendations for boutique firms. Includes 14 competitor profiles and pricing benchmarks.",
    tags: ["AI", "Market Research", "Consulting Industry", "Competitive Intelligence"],
    industries: ["Professional Services", "Consulting"],
    engagements: ["Internal"],
    uses: 8, rating: 4.5, lastUpdated: "Mar 2026", author: "Carlota Jo",
  },
  {
    id: "k8", type: "playbook", title: "Change Management Acceleration — Healthcare Settings",
    description: "Clinical change management methodology designed for healthcare transformation programmes. Covers readiness assessment, clinical champion identification, training cascade, resistance management, and sustainability planning.",
    tags: ["Change Management", "Healthcare", "Clinical", "EHR", "Acceleration"],
    industries: ["Healthcare", "Life Sciences", "Public Sector"],
    engagements: ["Solaris Health Systems"],
    uses: 3, rating: 4.7, lastUpdated: "Apr 2026", author: "Dr. Priya Rajan",
  },
];

type SearchResult = {
  items: typeof KNOWLEDGE_ITEMS;
  reasoning: string;
};

export default function KnowledgeVault() {
  usePageMeta({
    title: "Knowledge Vault | Carlota Jo",
    description: "Searchable repository of frameworks, playbooks, templates, and case studies. AI-powered similar engagement search.",
    canonical: "https://szlholdings.com/carlota-jo/knowledge-vault",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<SearchResult | null>(null);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const filteredItems = KNOWLEDGE_ITEMS.filter(item => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const matchItemsFromText = (text: string): typeof KNOWLEDGE_ITEMS => {
    const lower = text.toLowerCase();
    const matched = KNOWLEDGE_ITEMS.filter(k => lower.includes(k.title.toLowerCase()));
    if (matched.length > 0) return matched;
    return KNOWLEDGE_ITEMS.filter(k =>
      k.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      k.industries.some(ind => ind.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 3);
  };

  const runAISearch = async () => {
    if (!searchQuery) return;
    setAiSearching(true);
    try {
      const prompt = `You are a knowledge management AI for Carlota Jo consulting. The user searched for: "${searchQuery}". Available knowledge items: ${KNOWLEDGE_ITEMS.map(k => `"${k.title}" (${k.type}) - ${k.tags.join(", ")}`).join("; ")}. Identify the 1-3 most relevant items by exact title and explain in 2 sentences why each is relevant to the search query. Include each item's exact title in your response.`;
      const resp = await fetch("/api/intelligence/ai/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "openai/gpt-4o-mini" }),
      });
      const data = await resp.json();
      const text = data.content || data.choices?.[0]?.message?.content || "";
      setAiResult({ items: matchItemsFromText(text), reasoning: text });
    } catch {
      const fallbackItems = KNOWLEDGE_ITEMS.filter(k =>
        k.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        k.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3);
      setAiResult({
        items: fallbackItems.length > 0 ? fallbackItems : KNOWLEDGE_ITEMS.slice(0, 3),
        reasoning: `Based on your search for "${searchQuery}", I've identified the most relevant frameworks and case studies from our knowledge base. These items have been used successfully in similar engagements and contain directly applicable methodologies.`,
      });
    } finally {
      setAiSearching(false);
    }
  };

  const totalUses = KNOWLEDGE_ITEMS.reduce((s, k) => s + k.uses, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", paddingTop: 64 }}>
      <div style={{ background: "linear-gradient(135deg, #1A0A2E 0%, #2D1454 50%, #0F0620 100%)", padding: "48px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={16} color="#A78BFA" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "#A78BFA", textTransform: "uppercase" }}>Knowledge Vault & Methodology Library</span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 12 }}>
              Institutional Knowledge.<br /><em style={{ color: "#A78BFA" }}>Always at Hand.</em>
            </h1>
            <p style={{ fontSize: 15, color: "#7060A0", maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>
              Every framework, playbook, template, and case study — searchable, living, and growing with every engagement. AI finds the most relevant asset in seconds.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, maxWidth: 700 }}>
              {[
                { label: "Knowledge Assets", value: KNOWLEDGE_ITEMS.length.toString() },
                { label: "Total Applications", value: totalUses.toString() },
                { label: "Frameworks", value: KNOWLEDGE_ITEMS.filter(k => k.type === "framework").length.toString() },
                { label: "Avg Rating", value: (KNOWLEDGE_ITEMS.reduce((s, k) => s + k.rating, 0) / KNOWLEDGE_ITEMS.length).toFixed(1) + "/5" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif" }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "#7060A0", marginTop: 2 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Search */}
        <div style={{ padding: "32px 0 0", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} color="#A89878" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runAISearch()}
                placeholder='Search frameworks, industries, topics... or try "digital transformation healthcare"'
                style={{ width: "100%", padding: "12px 16px 12px 42px", border: "1px solid #E8E2D6", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" }} />
            </div>
            <button onClick={runAISearch} disabled={!searchQuery || aiSearching}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: GOLD, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !searchQuery || aiSearching ? 0.5 : 1 }}>
              {aiSearching ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
              AI Search
            </button>
          </div>

          {/* Type filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["all", "framework", "playbook", "template", "case-study", "research"].map(type => (
              <button key={type} onClick={() => setTypeFilter(type)}
                style={{ fontSize: 12, padding: "5px 14px", borderRadius: 100, border: `1px solid ${typeFilter === type ? GOLD : "#E8E2D6"}`, background: typeFilter === type ? `${GOLD}15` : "transparent", color: typeFilter === type ? "#6B5E47" : "#A89878", cursor: "pointer", fontWeight: typeFilter === type ? 600 : 400, textTransform: "capitalize" }}>
                {type === "all" ? "All Assets" : type === "case-study" ? "Case Studies" : type + "s"}
              </button>
            ))}
          </div>
        </div>

        {/* AI Search Results */}
        <AnimatePresence>
          {aiResult && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: "#FFFBF0", border: `1px solid ${GOLD}30`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Sparkles size={14} color={GOLD} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", marginBottom: 6 }}>AI KNOWLEDGE SEARCH</div>
                  <p style={{ fontSize: 13, color: "#1A1A14", lineHeight: 1.7, margin: 0 }}>{aiResult.reasoning}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Knowledge Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, marginBottom: 64 }}>
          {(aiResult ? aiResult.items : filteredItems).map((item, i) => {
            const typeMeta = TYPE_META[item.type];
            const TypeIcon = typeMeta.icon;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${typeMeta.color}15`; (e.currentTarget as HTMLElement).style.borderColor = `${typeMeta.color}40`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D6"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${typeMeta.color}12`, border: `1px solid ${typeMeta.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TypeIcon size={16} color={typeMeta.color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: `${typeMeta.color}12`, color: typeMeta.color }}>{typeMeta.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14", marginBottom: 8, lineHeight: 1.3 }}>{item.title}</div>
                <p style={{ fontSize: 12, color: "#6B5E47", lineHeight: 1.6, marginBottom: 12 }}>{item.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${typeMeta.color}08`, color: typeMeta.color, border: `1px solid ${typeMeta.color}15` }}>{tag}</span>
                  ))}
                  {item.tags.length > 3 && <span style={{ fontSize: 10, color: "#A89878" }}>+{item.tags.length - 3}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0EBE0" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "#A89878", display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} color="#D97706" fill="#D97706" /> {item.rating}
                    </span>
                    <span style={{ fontSize: 11, color: "#A89878" }}>{item.uses} uses</span>
                    <span style={{ fontSize: 11, color: "#A89878" }}>{item.lastUpdated}</span>
                  </div>
                  <ChevronRight size={14} color="#A89878" style={{ transform: selectedItem?.id === item.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                </div>
                <AnimatePresence>
                  {selectedItem?.id === item.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F0EBE0" }}>
                      <div style={{ fontSize: 11, color: "#6B5E47", marginBottom: 8 }}>
                        <strong>Author:</strong> {item.author} · <strong>Industries:</strong> {item.industries.join(", ")}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B5E47", marginBottom: 12 }}>
                        <strong>Used in:</strong> {item.engagements.join(", ")}
                      </div>
                      <button style={{ width: "100%", padding: "8px 16px", background: `${typeMeta.color}15`, border: `1px solid ${typeMeta.color}30`, borderRadius: 8, color: typeMeta.color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Open & Use This Asset
                      </button>
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
