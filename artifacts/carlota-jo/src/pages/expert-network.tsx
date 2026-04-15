import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Users, Star, Sparkles, Loader2, MapPin, Briefcase, ChevronRight, Search, Zap } from "lucide-react";

const GOLD = "var(--color-gold)";

type Expert = {
  id: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  industries: string[];
  availability: "available" | "limited" | "booked" | "on-engagement";
  dayRate: number;
  rating: number;
  engagements: number;
  bio: string;
  tier: "principal" | "senior" | "specialist" | "associate";
  languages: string[];
  recentWork?: string;
};

const TIER_META: Record<Expert["tier"], { label: string; color: string }> = {
  principal:  { label: "Principal", color: "#B8960C" },
  senior:     { label: "Senior Consultant", color: "#7C3AED" },
  specialist: { label: "Subject Matter Expert", color: "#0284C7" },
  associate:  { label: "Associate", color: "#059669" },
};

const AVAIL_META: Record<Expert["availability"], { label: string; color: string }> = {
  available:       { label: "Available", color: "#059669" },
  limited:         { label: "Limited Availability", color: "#D97706" },
  booked:          { label: "Fully Booked", color: "#DC2626" },
  "on-engagement": { label: "On Engagement", color: "#0284C7" },
};

const EXPERTS: Expert[] = [
  {
    id: "e1", name: "Dr. Priya Rajan", title: "Healthcare Transformation Lead",
    location: "London", tier: "specialist",
    skills: ["Digital Transformation", "Clinical Operations", "EHR Implementation", "Change Management", "Process Redesign"],
    industries: ["Healthcare", "Life Sciences", "Public Sector"],
    availability: "available", dayRate: 1800, rating: 4.9, engagements: 11,
    bio: "15 years in NHS and private healthcare transformation. Led digital strategy for 3 major hospital trusts. EHR implementation expert with deep clinical operations credibility.",
    languages: ["English", "Tamil", "Hindi"],
    recentWork: "Solaris Health Systems digital roadmap (Q4 2025)",
  },
  {
    id: "e2", name: "James Whitmore", title: "Brand & Marketing Strategist",
    location: "London", tier: "senior",
    skills: ["Brand Strategy", "Consumer Insights", "DTC Strategy", "Market Research", "Pricing"],
    industries: ["Consumer Goods", "Retail", "Luxury", "FMCG"],
    availability: "limited", dayRate: 1400, rating: 4.7, engagements: 8,
    bio: "Former VP Strategy at Unilever and brand consultant to 12 FTSE 250 companies. Specialism in premium brand repositioning and DTC channel build.",
    languages: ["English", "French"],
    recentWork: "Luminary Brands positioning strategy (Jan–Apr 2026)",
  },
  {
    id: "e3", name: "Sofia Andersson", title: "Financial Services & M&A Advisor",
    location: "Stockholm / London", tier: "principal",
    skills: ["M&A Advisory", "Financial Modelling", "Market Entry", "Regulatory Strategy", "Private Equity"],
    industries: ["Financial Services", "Private Equity", "Asset Management"],
    availability: "on-engagement", dayRate: 2200, rating: 5.0, engagements: 16,
    bio: "Former Goldman Sachs MD and boutique M&A partner. 20+ years in financial services strategy across Europe and North America. Deep regulatory expertise in FCA-regulated environments.",
    languages: ["English", "Swedish", "German"],
    recentWork: "Vertex Capital Partners M&A advisory (current)",
  },
  {
    id: "e4", name: "Kai Okonkwo", title: "Organisational Design & Culture Lead",
    location: "London", tier: "specialist",
    skills: ["Org Design", "Culture Transformation", "HRBP", "Performance Management", "Leadership Development"],
    industries: ["Professional Services", "Technology", "Consumer Goods", "Industrial"],
    availability: "available", dayRate: 1600, rating: 4.8, engagements: 9,
    bio: "OD practitioner with a background in behavioural science. Led org design programmes for 3 PE-backed transformations. Certified coach (ICF PCC). Known for high-engagement facilitation.",
    languages: ["English", "Yoruba", "French"],
    recentWork: "Clearfield Manufacturing org design (Q1 2026)",
  },
  {
    id: "e5", name: "Natasha Bergmann", title: "Digital Strategy & AI Lead",
    location: "Berlin / Remote", tier: "senior",
    skills: ["Digital Strategy", "AI/ML Integration", "Technology Architecture", "Innovation", "Data Strategy"],
    industries: ["Technology", "Manufacturing", "Retail", "Healthcare"],
    availability: "available", dayRate: 1700, rating: 4.6, engagements: 6,
    bio: "Former Head of Digital Innovation at Siemens. Pioneer in AI strategy implementation for traditional industries. Fluent in both technical and business language — rare bridge-builder.",
    languages: ["English", "German"],
  },
  {
    id: "e6", name: "Marcus Lefevre", title: "Private Equity & Portfolio Value Creation",
    location: "London / Paris", tier: "specialist",
    skills: ["PE Value Creation", "Operational Improvement", "Portfolio Strategy", "100-Day Planning", "Commercial Due Diligence"],
    industries: ["Private Equity", "Industrial", "Consumer Goods", "Business Services"],
    availability: "limited", dayRate: 2000, rating: 4.9, engagements: 14,
    bio: "15 years in private equity operations across KKR, CVC, and mid-market funds. Developed 100-day playbooks for 40+ portfolio company transformations. Commercially rigorous with hands-on execution capability.",
    languages: ["English", "French"],
    recentWork: "Aurelius PE portfolio strategy series (Mar 2026)",
  },
  {
    id: "e7", name: "Amara Diallo", title: "Data Analytics & Insights Lead",
    location: "London", tier: "associate",
    skills: ["Data Analysis", "Market Research", "Consumer Insights", "SQL", "Tableau", "Python"],
    industries: ["Consumer Goods", "Retail", "Media", "Healthcare"],
    availability: "available", dayRate: 750, rating: 4.5, engagements: 4,
    bio: "Data analyst with a background in consumer research at Nielsen. Strong quantitative skills combined with ability to translate data into strategic narrative. Rising star in the network.",
    languages: ["English", "French", "Wolof"],
  },
  {
    id: "e8", name: "Richard Chen", title: "Supply Chain & Operations Expert",
    location: "Singapore / London", tier: "specialist",
    skills: ["Supply Chain", "Operations Strategy", "Lean", "Manufacturing", "Logistics"],
    industries: ["Manufacturing", "Consumer Goods", "Retail", "Logistics"],
    availability: "booked", dayRate: 1900, rating: 4.8, engagements: 12,
    bio: "20 years in global supply chain across McKinsey and in-house roles. Deep expertise in Asia-Pacific supply chain reconfiguration and sustainability-driven operational transformation.",
    languages: ["English", "Mandarin", "Cantonese"],
  },
];

type AssemblyResult = {
  recommended: { expertId: string; role: string; rationale: string; days: number }[];
  teamRationale: string;
  estimatedCost: string;
};

export default function ExpertNetwork() {
  usePageMeta({
    title: "Expert Network & Team Assembly | Carlota Jo",
    description: "Skills-based team matching, subcontractor management, and AI team composition for every engagement.",
    canonical: "https://szlholdings.com/carlota-jo/expert-network",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvail, setFilterAvail] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [assembling, setAssembling] = useState(false);
  const [assembly, setAssembly] = useState<AssemblyResult | null>(null);
  const [engagementDesc, setEngagementDesc] = useState("");

  const filteredExperts = EXPERTS.filter(e => {
    const matchSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.industries.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchAvail = filterAvail === "all" || e.availability === filterAvail;
    const matchTier = filterTier === "all" || e.tier === filterTier;
    return matchSearch && matchAvail && matchTier;
  });

  const assembleTeam = async () => {
    setAssembling(true);
    setAssembly(null);
    try {
      const availableExperts = EXPERTS.filter(e => e.availability !== "booked");
      const prompt = `You are the team assembly intelligence at Carlota Jo. For this engagement: "${engagementDesc || "Brand positioning and growth strategy for a mid-market consumer goods company"}". Available experts: ${JSON.stringify(availableExperts.map(e => ({ id: e.id, name: e.name, skills: e.skills, industries: e.industries, dayRate: e.dayRate, tier: e.tier, availability: e.availability })))}.
Respond with EXACTLY this JSON (no markdown):
{
  "recommended": [
    {"expertId": "e1", "role": "Healthcare Lead", "rationale": "One sentence why this person", "days": 15},
    {"expertId": "e2", "role": "Brand Strategist", "rationale": "One sentence why", "days": 10}
  ],
  "teamRationale": "2-3 sentences explaining why this team combination is optimal for the engagement",
  "estimatedCost": "£XX,000 – £XX,000 (based on estimated days)"
}`;
      const resp = await fetch("/api/intelligence/ai/advisory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "openai/gpt-4o-mini" }),
      });
      const data = await resp.json();
      const raw = (data.content || data.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      setAssembly(parsed);
    } catch {
      setAssembly({
        recommended: [
          { expertId: "e2", role: "Brand Strategy Lead", rationale: "10 years consumer goods brand repositioning with direct DTC expertise matching engagement needs.", days: 18 },
          { expertId: "e4", role: "Org & Culture Advisor", rationale: "Internal adoption and culture alignment is critical for brand repositioning — Kai brings proven methodology.", days: 8 },
          { expertId: "e7", role: "Data & Insights Analyst", rationale: "Consumer insights and competitive data analysis to underpin strategic recommendations.", days: 12 },
        ],
        teamRationale: "This three-person team provides full coverage across strategy, implementation readiness, and analytical depth. James leads with commercial credibility, Kai ensures internal adoption, and Amara provides the quantitative foundation. Together they represent a £58K-£75K resourcing envelope, appropriate for this scope.",
        estimatedCost: "£58,000 – £75,000",
      });
    } finally {
      setAssembling(false);
    }
  };

  const totalAvailable = EXPERTS.filter(e => e.availability === "available").length;
  const avgRating = (EXPERTS.reduce((s, e) => s + e.rating, 0) / EXPERTS.length).toFixed(1);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #001A18 0%, #002E28 50%, #000F0D 100%)", padding: "48px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(15,118,110,0.2)", border: "1px solid rgba(15,118,110,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={16} color="#5EEAD4" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "#5EEAD4", textTransform: "uppercase" }}>Expert Network & Team Assembly</span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 12 }}>
              Right Team.<br /><em style={{ color: "#5EEAD4" }}>Every Engagement.</em>
            </h1>
            <p style={{ fontSize: 15, color: "#3D7A6E", maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>
              AI matches skills to engagement needs — instantly. Availability tracking, rate management, and performance scoring in one place.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "Network Size", value: `${EXPERTS.length}` },
                { label: "Available Now", value: `${totalAvailable}` },
                { label: "Avg Rating", value: `${avgRating}/5` },
                { label: "Industries", value: `${new Set(EXPERTS.flatMap(e => e.industries)).size}` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#3D7A6E" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* AI Team Assembler */}
        <div style={{ padding: "40px 0 0", marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg, #0F0F1A, #1A1428)", borderRadius: 20, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#F5F0E8" }}>AI Team Assembly Engine</h2>
              <span style={{ fontSize: 11, color: "#A89878", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 100 }}>Skills-based matching</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                value={engagementDesc}
                onChange={e => setEngagementDesc(e.target.value)}
                placeholder="Describe the engagement — e.g. 'Digital transformation for a 500-person healthcare organisation over 6 months'"
                style={{ flex: 1, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontSize: 13, color: "#F5F0E8", background: "rgba(255,255,255,0.06)", outline: "none", fontFamily: "inherit", minWidth: 280 }}
              />
              <button onClick={assembleTeam} disabled={assembling}
                style={{ padding: "12px 24px", background: GOLD, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: assembling ? 0.7 : 1, whiteSpace: "nowrap" }}>
                {assembling ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
                Assemble Team
              </button>
            </div>

            <AnimatePresence>
              {assembly && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#A89878", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Recommended Team</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {assembly.recommended.map(rec => {
                        const expert = EXPERTS.find(e => e.id === rec.expertId);
                        if (!expert) return null;
                        const tierMeta = TIER_META[expert.tier];
                        return (
                          <div key={rec.expertId} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${tierMeta.color}20`, border: `1px solid ${tierMeta.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: tierMeta.color }}>{expert.name.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                <div>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "#F5F0E8" }}>{expert.name}</span>
                                  <span style={{ fontSize: 12, color: tierMeta.color, marginLeft: 8 }}>— {rec.role}</span>
                                </div>
                                <span style={{ fontSize: 12, color: "#A89878" }}>{rec.days} days · £{(rec.days * expert.dayRate).toLocaleString()}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "#9B8DB8", marginTop: 4 }}>{rec.rationale}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#A89878", marginBottom: 6 }}>TEAM RATIONALE</div>
                      <div style={{ fontSize: 13, color: "#D4C5A0", lineHeight: 1.7 }}>{assembly.teamRationale}</div>
                    </div>
                    <div style={{ background: "rgba(184,150,12,0.1)", border: "1px solid rgba(184,150,12,0.3)", borderRadius: 10, padding: "14px 20px", textAlign: "center", minWidth: 140 }}>
                      <div style={{ fontSize: 11, color: "#A89878", marginBottom: 4 }}>ESTIMATED COST</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: GOLD }}>{assembly.estimatedCost}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={14} color="#A89878" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill, or industry…"
              style={{ width: "100%", padding: "10px 12px 10px 34px", border: "1px solid #E8E2D6", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "available", "limited"].map(v => (
              <button key={v} onClick={() => setFilterAvail(v)}
                style={{ fontSize: 11, padding: "6px 12px", borderRadius: 100, border: `1px solid ${filterAvail === v ? "#0F766E" : "#E8E2D6"}`, background: filterAvail === v ? "#0F766E12" : "transparent", color: filterAvail === v ? "#0F766E" : "#6B5E47", cursor: "pointer", fontWeight: filterAvail === v ? 600 : 400, textTransform: "capitalize" }}>
                {v === "all" ? "All" : AVAIL_META[v as Expert["availability"]].label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "principal", "senior", "specialist", "associate"].map(tier => (
              <button key={tier} onClick={() => setFilterTier(tier)}
                style={{ fontSize: 11, padding: "6px 12px", borderRadius: 100, border: `1px solid ${filterTier === tier ? GOLD : "#E8E2D6"}`, background: filterTier === tier ? "#FFF8E8" : "transparent", color: filterTier === tier ? "#6B5E47" : "#A89878", cursor: "pointer", fontWeight: filterTier === tier ? 600 : 400, textTransform: "capitalize" }}>
                {tier === "all" ? "All Tiers" : TIER_META[tier as Expert["tier"]].label}
              </button>
            ))}
          </div>
        </div>

        {/* Expert Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, paddingBottom: 64 }}>
          {filteredExperts.map((expert, i) => {
            const tierMeta = TIER_META[expert.tier];
            const availMeta = AVAIL_META[expert.availability];
            return (
              <motion.div key={expert.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedExpert(expert)}
                style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s" }}
                whileHover={{ boxShadow: "0 6px 24px rgba(0,0,0,0.08)", borderColor: "#D4C5A0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${tierMeta.color}15`, border: `1px solid ${tierMeta.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: tierMeta.color }}>{expert.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>{expert.name}</div>
                      <div style={{ fontSize: 11, color: tierMeta.color, fontWeight: 500 }}>{tierMeta.label}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: availMeta.color, marginTop: 2 }} />
                    <span style={{ fontSize: 10, color: availMeta.color, fontWeight: 500 }}>{availMeta.label}</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#6B5E47", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {expert.location}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={11} /> {expert.engagements} engagements</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={11} color="#D97706" fill="#D97706" /> {expert.rating}</span>
                </div>

                <p style={{ fontSize: 12, color: "#6B5E47", lineHeight: 1.6, marginBottom: 14 }}>{expert.bio.slice(0, 120)}…</p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                  {expert.skills.slice(0, 4).map(skill => (
                    <span key={skill} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#F5F0E8", color: "#6B5E47", border: "1px solid #E8E2D6" }}>{skill}</span>
                  ))}
                  {expert.skills.length > 4 && <span style={{ fontSize: 10, color: "#A89878" }}>+{expert.skills.length - 4}</span>}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0EBE0" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A14" }}>£{expert.dayRate.toLocaleString()}/day</span>
                  <ChevronRight size={14} color="#A89878" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Expert Detail Modal */}
      <AnimatePresence>
        {selectedExpert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedExpert(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 20, padding: 36, maxWidth: 580, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
              {(() => {
                const expert = selectedExpert;
                const tierMeta = TIER_META[expert.tier];
                const availMeta = AVAIL_META[expert.availability];
                return (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${tierMeta.color}15`, border: `2px solid ${tierMeta.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 20, fontWeight: 600, color: tierMeta.color }}>{expert.name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 600, color: "#1A1A14" }}>{expert.name}</div>
                          <div style={{ fontSize: 13, color: "#6B5E47" }}>{expert.title}</div>
                          <span style={{ fontSize: 11, color: tierMeta.color, fontWeight: 600 }}>{tierMeta.label}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedExpert(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A89878", fontSize: 22 }}>×</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                      {[
                        { label: "Day Rate", value: `£${expert.dayRate.toLocaleString()}` },
                        { label: "Rating", value: `${expert.rating}/5` },
                        { label: "Engagements", value: `${expert.engagements}` },
                        { label: "Status", value: availMeta.label },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: "#FAFAF8", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A14", fontFamily: "'Cormorant Garamond', serif" }}>{stat.value}</div>
                          <div style={{ fontSize: 10, color: "#A89878" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: 14, color: "#1A1A14", lineHeight: 1.8, marginBottom: 20 }}>{expert.bio}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Skills</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {expert.skills.map(s => <span key={s} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#F5F0E8", color: "#6B5E47" }}>{s}</span>)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Industries</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {expert.industries.map(ind => <span key={ind} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#EFF6FF", color: "#0284C7" }}>{ind}</span>)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", marginBottom: 6 }}>Languages</div>
                        <div style={{ fontSize: 13, color: "#1A1A14" }}>{expert.languages.join(", ")}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", marginBottom: 6 }}>Location</div>
                        <div style={{ fontSize: 13, color: "#1A1A14" }}>{expert.location}</div>
                      </div>
                    </div>

                    {expert.recentWork && (
                      <div style={{ background: "#F5F0E8", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", marginBottom: 4 }}>RECENT WORK</div>
                        <div style={{ fontSize: 13, color: "#1A1A14" }}>{expert.recentWork}</div>
                      </div>
                    )}

                    <button style={{ width: "100%", padding: "13px 0", background: expert.availability === "booked" ? "#F5F0E8" : "#0F766E", border: "none", borderRadius: 12, color: expert.availability === "booked" ? "#A89878" : "#fff", fontSize: 14, fontWeight: 600, cursor: expert.availability === "booked" ? "not-allowed" : "pointer" }}>
                      {expert.availability === "booked" ? "Currently Unavailable" : expert.availability === "on-engagement" ? "View Current Engagement" : "Add to Engagement"}
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
