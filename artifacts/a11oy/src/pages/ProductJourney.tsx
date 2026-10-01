import { Link } from 'wouter';
import { Layout } from '../components/layout';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

const journeys = [
  {
    eyebrow: 'INVESTOR PATH',
    title: 'From thesis to inspectable proof',
    description:
      'Understand the product thesis, inspect the Series A view, enter the deterministic demo, and continue into proof and diligence without treating prototype evidence as production evidence.',
    links: [
      ['Review the Series A view', `${BASE}/series-a`],
      ['Open the guided demo', `${BASE}/demo`],
      ['Inspect the Proof Ledger', `${BASE}/proof`],
      ['Open the Trust Center', `${BASE}/trust`],
    ],
  },
  {
    eyebrow: 'DEVELOPER PATH',
    title: 'From architecture to verification',
    description:
      'Trace the source blueprint, inspect deterministic Workcells and governance gates, then review receipt shapes, API boundaries, and repository resources for local verification.',
    links: [
      ['Review the source blueprint', `${BASE}/architecture`],
      ['Explore the demo fabric', `${BASE}/fabric`],
      ['Inspect demo Workcells', `${BASE}/workcells`],
      ['Review governance', `${BASE}/governance`],
      ['Inspect demo receipts', `${BASE}/proof`],
      ['Review API & source resources', `${BASE}/resources`],
    ],
  },
] as const;

const executionModel = [
  ['SIGNAL MESH', 'Routes deterministic demo signals into inspectable context.'],
  ['CAUSAL CORE', 'Demonstrates evidence-linked reasoning for evaluation.'],
  ['ACTION RAIL', 'Shows recommendations crossing explicit approval gates.'],
  ['PROOF LEDGER', 'Preserves demo receipts for review and replay.'],
] as const;

export function ProductJourney() {
  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="max-w-4xl" aria-labelledby="product-journey-title">
          <p className="font-mono text-xs tracking-[0.22em] text-[#c9b787]">A11OY · START HERE</p>
          <h1
            id="product-journey-title"
            className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            One fabric. Two clear ways in.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-300 sm:text-lg">
            A11oy is an active prototype and investor demo platform designed to connect business
            signals, governed actions, human approval, and proof. Choose the path that matches what
            you need to verify.
          </p>
          <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/5 p-4 text-sm leading-6 text-neutral-300">
            <strong className="text-amber-100">Evidence boundary:</strong> Workcells shown in this
            experience use deterministic repository data. They do not represent authenticated
            production operations.
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2" aria-label="Choose a product journey">
          {journeys.map((journey) => (
            <article
              key={journey.eyebrow}
              className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
            >
              <p className="font-mono text-xs tracking-[0.18em] text-[#c9b787]">
                {journey.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{journey.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-neutral-300 sm:text-base">
                {journey.description}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {journey.links.map(([label, href], index) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex min-h-11 items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-medium no-underline transition-colors ${
                      index === 0
                        ? 'bg-[#c9b787] text-black hover:bg-[#ded0a7]'
                        : 'border border-white/15 text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section
          className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Execution model"
        >
          {executionModel.map(([title, copy]) => (
            <div key={title} className="min-w-0 rounded-xl border border-white/10 p-5">
              <h3 className="font-mono text-xs tracking-wider text-neutral-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </Layout>
  );
}
