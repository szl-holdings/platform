import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { StatusPill, type StatusPillStatus } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface JourneyStep {
  title: string;
  description: string;
  href: string;
  state: StatusPillStatus;
}

interface Journey {
  eyebrow: string;
  title: string;
  description: string;
  steps: readonly JourneyStep[];
}

const journeys: readonly Journey[] = [
  {
    eyebrow: 'INVESTOR PATH',
    title: 'From product thesis to inspectable demonstration evidence',
    description:
      'Follow the company narrative into a seeded scenario, inspect its demonstration receipt model, and review the prototype trust posture without treating any of those surfaces as production evidence.',
    steps: [
      {
        title: '1. Company narrative',
        description: 'Understand the governed-execution thesis and the product family.',
        href: '#family-title',
        state: 'DEMO',
      },
      {
        title: '2. Interactive scenario',
        description: 'Step through repository-seeded signals, Workcells, and approval gates.',
        href: `${BASE}/demo`,
        state: 'DEMO',
      },
      {
        title: '3. Proof model',
        description: 'Inspect how demonstration reasoning nodes and receipts are presented.',
        href: `${BASE}/proof`,
        state: 'DEMO',
      },
      {
        title: '4. Diligence boundary',
        description: 'Review modeled controls, limitations, and roadmap posture.',
        href: `${BASE}/trust`,
        state: 'DEMO',
      },
    ],
  },
  {
    eyebrow: 'DEVELOPER PATH',
    title: 'From architecture to local verification',
    description:
      'Trace the designed system, inspect the SDK surface and demo Workcells, then verify the typed contracts and UI locally with repository-native commands.',
    steps: [
      {
        title: '1. Architecture',
        description: 'Review the designed components and their intended boundaries.',
        href: `${BASE}/architecture`,
        state: 'DEMO',
      },
      {
        title: '2. SDK and API surface',
        description: 'Explore prototype developer contracts and seeded examples.',
        href: `${BASE}/sdk`,
        state: 'DEMO',
      },
      {
        title: '3. Demo Workcells',
        description: 'Separate workflow status from typed evidence availability.',
        href: `${BASE}/workcells`,
        state: 'DEMO',
      },
      {
        title: '4. Governance controls',
        description: 'Inspect modeled approval and policy-gate interactions.',
        href: `${BASE}/governance`,
        state: 'DEMO',
      },
      {
        title: '5. Receipt contract',
        description: 'Inspect the seeded Proof-Carrying Execution registry.',
        href: `${BASE}/pce`,
        state: 'DEMO',
      },
      {
        title: '6. Run and verify',
        description: 'Use the commands below to reproduce the local source behavior.',
        href: '#local-verification',
        state: 'DEMO',
      },
    ],
  },
];

const productFamily: ReadonlyArray<{
  name: string;
  role: string;
  state: StatusPillStatus;
  boundary: string;
}> = [
  {
    name: 'A11oy',
    role: 'Governed execution fabric',
    state: 'DEMO',
    boundary: 'Active prototype and investor-demo surface.',
  },
  {
    name: 'KORA',
    role: 'Command surface',
    state: 'DEMO',
    boundary: 'Product-family interface demonstrated elsewhere in the repository.',
  },
  {
    name: 'FORGE',
    role: 'Execution and Workcell fabric',
    state: 'DEMO',
    boundary: 'Modeled here with repository-seeded Workcell fixtures.',
  },
  {
    name: 'APEX',
    role: 'Mobile command family',
    state: 'UNAVAILABLE',
    boundary: 'No APEX route is registered in this A11oy artifact.',
  },
];

export function ProductJourney() {
  return (
    <Layout>
      <section className="mx-auto w-full max-w-7xl py-4 sm:py-8" aria-labelledby="start-title">
        <p className="font-mono text-xs tracking-[0.22em] text-[#c9b787]">A11OY · START HERE</p>
        <h1
          id="start-title"
          className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          One active prototype. Two clear ways to inspect it.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-300 sm:text-lg">
          A11oy is designed to connect business signals, governed actions, human approval, and
          proof. Choose an investor or developer path while keeping the evidence state visible at
          every step.
        </p>
        <div
          className="mt-6 max-w-4xl rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6 text-neutral-300"
          role="note"
        >
          <strong className="text-white">Evidence boundary:</strong> these routes render an active
          prototype using repository fixtures. Route availability, seeded behavior, authenticated
          operations, public deployment, and production parity are distinct claims. This page
          establishes only the first two when reproduced locally.
        </div>
      </section>

      <section
        className="mx-auto mt-8 grid w-full max-w-7xl gap-5 xl:grid-cols-2"
        aria-label="Choose a product journey"
      >
        {journeys.map((journey) => (
          <article
            key={journey.eyebrow}
            className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"
          >
            <p className="font-mono text-xs tracking-[0.18em] text-[#c9b787]">{journey.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{journey.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300 sm:text-base">
              {journey.description}
            </p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {journey.steps.map((step) => (
                <li key={step.title} className="min-w-0">
                  <Link
                    href={step.href}
                    className="flex min-h-11 h-full min-w-0 flex-col justify-between gap-3 rounded-xl border border-white/15 p-4 no-underline transition-colors hover:bg-white/[0.06]"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-white">{step.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-neutral-400">
                        {step.description}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <StatusPill status={step.state} />
                      <span className="text-sm text-neutral-300" aria-hidden="true">
                        Open →
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-10 w-full max-w-7xl" aria-labelledby="family-title">
        <h2 id="family-title" className="text-2xl font-semibold text-white">
          Product-family boundary
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {productFamily.map((product) => (
            <article key={product.name} className="min-w-0 rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <StatusPill status={product.state} />
              </div>
              <p className="mt-2 text-sm font-medium text-neutral-300">{product.role}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{product.boundary}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="local-verification"
        className="mx-auto mt-10 w-full max-w-7xl rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-7"
        aria-labelledby="verification-title"
      >
        <StatusPill status="DEMO" />
        <h2 id="verification-title" className="mt-3 text-2xl font-semibold text-white">
          Reproduce the prototype locally
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
          Run from the monorepo root. These checks validate local source behavior; they do not prove
          a deployment or authenticated operational data source.
        </p>
        <pre
          className="mt-5 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black p-4 text-sm leading-7 text-neutral-200"
          tabIndex={0}
          aria-label="Local verification commands"
        >
          <code>{`pnpm --filter @workspace/a11oy dev
pnpm --filter @workspace/a11oy typecheck
pnpm --filter @workspace/a11oy-fabric test
pnpm --filter @workspace/a11oy-fabric typecheck`}</code>
        </pre>
      </section>
    </Layout>
  );
}
