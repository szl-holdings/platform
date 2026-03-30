import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

const advisoryMetrics = [
  { label: "Active Engagements", value: "12", change: "+3 this quarter" },
  { label: "Client Retention", value: "98%", change: "Industry leading" },
  { label: "Avg Engagement Score", value: "9.4/10", change: "+0.3 vs last quarter" },
  { label: "Revenue Growth", value: "+34%", change: "Year over year" },
];

const caseStudies = [
  { client: "Fortune 500 Tech Co.", challenge: "Digital transformation of legacy CRM system", outcome: "40% increase in customer retention, $2.3M annual savings", duration: "6 months", methodology: "Agile transformation with phased rollout", score: 9.8 },
  { client: "Healthcare Network", challenge: "Leadership alignment across 12 hospital locations", outcome: "Unified executive vision, 28% improvement in operational efficiency", duration: "4 months", methodology: "Stakeholder mapping and facilitated alignment workshops", score: 9.5 },
  { client: "FinTech Startup", challenge: "Scaling team from 15 to 120 while maintaining culture", outcome: "3x growth achieved with 92% employee satisfaction maintained", duration: "12 months", methodology: "Organizational design with embedded coaching", score: 9.7 },
  { client: "Manufacturing Corp", challenge: "C-suite succession planning and leadership development", outcome: "Seamless CEO transition, zero leadership attrition during transition", duration: "8 months", methodology: "Executive assessment, development plans, and shadowing program", score: 9.2 },
];

const insightCategories = [
  { name: "Leadership Intelligence", insights: 24, trending: "Emotional intelligence in remote-first organizations" },
  { name: "Strategic Advisory", insights: 18, trending: "AI-augmented decision making frameworks" },
  { name: "Organizational Design", insights: 15, trending: "Hybrid work architecture patterns" },
  { name: "Change Management", insights: 21, trending: "Resistance reduction through co-creation" },
];

export default function AdvisoryIntel() {
  usePageMeta({
    title: "Strategic Advisory Intelligence | Carlota Jo Consulting",
    description: "Real-time advisory analytics, active engagement tracking, and strategic intelligence for Carlota Jo Consulting clients.",
    canonical: "https://szlholdings.com/carlota-jo/advisory",
  });
  const [activeTab, setActiveTab] = useState<"overview" | "cases" | "insights">("overview");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Strategic Advisory Intelligence</h1>
          <p className="text-gray-400">Data-driven consulting insights and leadership intelligence</p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-800 pb-4">
          {(["overview", "cases", "insights"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {advisoryMetrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{m.label}</div>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.change}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightCategories.map((cat) => (
                <div key={cat.name} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{cat.name}</h3>
                    <span className="text-xs text-gray-500">{cat.insights} insights</span>
                  </div>
                  <p className="text-sm text-gray-400">Trending: {cat.trending}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cases" && (
          <div className="space-y-4">
            {caseStudies.map((cs) => (
              <div key={cs.client} className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{cs.client}</h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold">{cs.score}/10</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Challenge</span>
                    <p className="mt-1">{cs.challenge}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Outcome</span>
                    <p className="mt-1 text-emerald-400">{cs.outcome}</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-3 text-xs text-gray-500">
                  <span>Duration: {cs.duration}</span>
                  <span>Methodology: {cs.methodology}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="font-bold text-lg mb-4">Leadership Intelligence Feed</h2>
            <div className="space-y-4">
              {[
                { title: "The ROI of Emotional Intelligence in Executive Teams", date: "Mar 2026", reads: 1240, category: "Leadership" },
                { title: "AI-Augmented Strategic Planning: A Framework", date: "Mar 2026", reads: 890, category: "Strategy" },
                { title: "Building Anti-Fragile Organizations in Uncertain Markets", date: "Feb 2026", reads: 2100, category: "Organizational Design" },
                { title: "From Resistance to Co-Creation: Modern Change Management", date: "Feb 2026", reads: 1560, category: "Change Management" },
                { title: "The Succession Planning Playbook for Mid-Market Companies", date: "Jan 2026", reads: 980, category: "Leadership" },
              ].map((insight) => (
                <div key={insight.title} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 hover:bg-white/5 transition-colors cursor-pointer rounded-lg px-3 -mx-3">
                  <div>
                    <h3 className="text-sm font-medium">{insight.title}</h3>
                    <span className="text-xs text-gray-500">{insight.date} · {insight.category}</span>
                  </div>
                  <span className="text-xs text-gray-500">{insight.reads.toLocaleString()} reads</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
