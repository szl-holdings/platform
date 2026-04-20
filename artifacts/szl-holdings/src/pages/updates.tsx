import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';

const updates = [
  {
    date: 'March 2026',
    tag: 'Platform',
    headline: 'Navigation & page architecture overhaul across all portfolio apps',
    summary:
      'Completed a comprehensive restructuring of the site architecture across SZL Holdings, Vessels, SZL Cortex, Carlota Jo, and Stephen Site. Each app now has clean marketing navigation, proper route structures, and expanded page coverage matching the master payload spec.',
  },
  {
    date: 'February 2026',
    tag: 'Vessels',
    headline: 'AI Route Optimization Engine — Q2 2026 development begins',
    summary:
      "Development started on Vessels' governed route optimization module. The engine will analyse historical voyage data, weather patterns, and port congestion to surface optimal routing recommendations for fleet operators.",
  },
  {
    date: 'February 2026',
    tag: 'SZL Holdings',
    headline: 'Portfolio Intelligence Dashboard — investor relations module launched',
    summary:
      'The SZL Holdings platform now includes a portfolio intelligence dashboard for investor visibility — tracking venture milestones, ecosystem metrics, and strategic progress across the portfolio.',
  },
  {
    date: 'January 2026',
    tag: 'SZL Cortex',
    headline: 'GPU Monitoring and LLM Evaluation Studio shipped',
    summary:
      "SZL Cortex's research infrastructure received two major additions: a GPU monitoring module for compute cost optimization and an LLM evaluation studio for benchmarking and comparing model performance across tasks.",
  },
  {
    date: 'January 2026',
    tag: 'Carlota Jo',
    headline: 'AI Brand Advisory and Engagement Workflow released',
    summary:
      "Carlota Jo's advisory platform expanded with AI-assisted brand analysis tooling and a structured engagement workflow system for managing multi-phase client engagements.",
  },
  {
    date: 'December 2025',
    tag: 'Aegis',
    headline: 'XDR Console and Threat Hunting Workbench launched',
    summary:
      'Aegis shipped the XDR (Extended Detection and Response) Console alongside the Threat Hunting Workbench — enabling security teams to correlate signals across endpoint, network, and cloud telemetry in a unified interface.',
  },
];

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-[hsl(215,45%,45%)] tracking-[0.15em] uppercase mb-3">
            Updates
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
            Latest developments
          </h1>
          <p className="text-neutral-500 text-[15px] leading-relaxed">
            Milestone updates, product launches, and ecosystem progress from across the SZL
            portfolio.
          </p>
        </div>

        <div className="space-y-px">
          {updates.map((u, i) => (
            <div key={i} className="py-7 border-b border-neutral-100 last:border-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[hsl(215,45%,96%)] text-[hsl(215,45%,40%)] border border-[hsl(215,45%,88%)]">
                  {u.tag}
                </span>
                <span className="text-[11px] text-neutral-400">{u.date}</span>
              </div>
              <h2 className="text-[15px] font-bold text-neutral-900 mb-2">{u.headline}</h2>
              <p className="text-neutral-500 text-[13.5px] leading-relaxed">{u.summary}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
