import { ArrowRight, BarChart3, Bell, CheckCircle, Globe, Map } from 'lucide-react';

const capabilities = [
  {
    title: 'Fleet visibility',
    body: 'Track vessels and assets through a cleaner, more structured operational interface designed for real-time awareness and easier oversight.',
    icon: Globe,
  },
  {
    title: 'Route intelligence',
    body: 'Bring route and voyage details into a more usable workflow, with a stronger understanding of movement, timing, and state.',
    icon: Map,
  },
  {
    title: 'Operational alerts',
    body: 'Surface anomalies, events, or priority states in a way that supports quicker review and more confident action.',
    icon: Bell,
  },
  {
    title: 'Executive clarity',
    body: 'Translate complex operational movement into digestible dashboards and reporting views for leadership and stakeholders.',
    icon: BarChart3,
  },
];

const kpiStrip = [
  'Fleet visibility across a unified command layer',
  'Route and voyage awareness in one view',
  'Structured alerting for operational clarity',
  'A product experience built for modern maritime workflows',
];

const useCases = [
  'Fleet operations',
  'Voyage oversight',
  'Coordination workflows',
  'Executive reporting',
  'Commercial visibility',
  'Operational review',
];

export default function Platform() {
  return (
    <div
      className="min-h-screen overflow-auto text-sky-50"
      style={{ background: 'linear-gradient(180deg, #060e1a 0%, #0a1628 100%)' }}
    >
      <section className="py-20 lg:py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono text-sky-400/60 uppercase tracking-[0.2em] mb-6 border border-sky-500/20 rounded-full px-4 py-1.5">
            Vessels
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sky-50 leading-tight mb-6">
            Maritime visibility,
            <br />
            built for command.
          </h1>
          <p className="text-sky-300/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Vessels is designed to bring fleet, route, and voyage intelligence into one modern
            operating layer, helping teams see movement clearly, reduce uncertainty, and act with
            confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-7 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors">
              Request a private demo
            </button>
            <a
              href="/"
              className="px-7 py-3.5 rounded-lg border border-sky-500/30 text-sky-300 hover:border-sky-500/60 hover:text-sky-200 font-semibold text-sm transition-all flex items-center gap-2"
            >
              View platform capabilities <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-500/10 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {kpiStrip.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-sky-400/50 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-300/50 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 border-t border-sky-500/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-mono text-sky-400/50 uppercase tracking-[0.2em] mb-4 text-center">
            Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-sky-50 text-center mb-16">
            A command center for movement, coordination, and oversight.
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="p-7 rounded-2xl border border-sky-500/10 bg-sky-500/3 hover:border-sky-500/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center mb-5">
                    <Icon className="w-4.5 h-4.5 text-sky-400" size={18} />
                  </div>
                  <h3 className="font-bold text-sky-100 mb-3">{cap.title}</h3>
                  <p className="text-sm text-sky-300/55 leading-relaxed">{cap.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-sky-500/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-sky-50 mb-4">
            Designed like a real operating surface.
          </h2>
          <p className="text-sky-300/55 text-base max-w-2xl leading-relaxed mb-12">
            From map-based visibility to structured vessel detail views, Vessels is designed to feel
            less like a concept and more like a true command environment. Every interaction should
            improve understanding, not add noise.
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-semibold text-sky-100 mb-6">
                Built for teams that need cleaner operational awareness.
              </h3>
              <ul className="grid grid-cols-2 gap-3">
                {useCases.map((uc) => (
                  <li key={uc} className="flex items-center gap-2 text-sm text-sky-300/55">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400/40 shrink-0" />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-sky-100 mb-4">
                Product-grade architecture. Enterprise-ready direction.
              </h3>
              <p className="text-sm text-sky-300/55 leading-relaxed">
                Vessels is being shaped as a premium operating platform with the structure required
                for modern adoption: clear permissions, strong UX, commercial readiness, and a
                scalable product foundation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-sky-500/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-sky-50 mb-6">
            See the command center in context.
          </h2>
          <p className="text-sky-300/55 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Request a private walkthrough to explore the product direction, core capabilities, and
            how Vessels can evolve into a serious operational layer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-7 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors">
              Request a private walkthrough
            </button>
            <button className="px-7 py-3.5 rounded-lg border border-sky-500/30 text-sky-300 hover:border-sky-500/60 hover:text-sky-200 font-semibold text-sm transition-all">
              Contact the team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
