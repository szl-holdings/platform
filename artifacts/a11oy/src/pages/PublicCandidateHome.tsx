import { REVIEWED_PUBLIC_ROUTES, routeHref } from '../candidateRoutes';
import { Layout } from '../components/layout';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

const BOUNDARIES = [
  ['Runtime API binding', 'UNAVAILABLE'],
  ['External effectors', 'NONE'],
  ['Operational evidence', 'UNAVAILABLE'],
  ['Interface evidence', 'DEMO'],
] as const;

const NOT_ESTABLISHED = [
  'production deployment or production readiness',
  'customer use, revenue, retention, or independently observed outcomes',
  'live connectors, external model calls, or authenticated operations',
  'compliance certification or an audit opinion',
  'performance, comparative, or market-leadership claims',
  'durable signed execution or cryptographic attestation',
] as const;

export function PublicCandidateHome() {
  return (
    <Layout>
      <main id="main-content" className="mx-auto max-w-5xl pb-24">
        <div
          className="mb-5 font-mono text-xs uppercase tracking-[0.22em]"
          style={{ color: '#d9c58f' }}
        >
          PUBLIC CANDIDATE · DEMO
        </div>
        <h1
          className="mb-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl"
          style={{ color: '#f5f5f5' }}
        >
          A source-bound interface preview with explicit evidence limits
        </h1>
        <p className="mb-9 max-w-3xl text-base leading-8" style={{ color: '#b8b8b8' }}>
          A11oy is an active prototype. This preview contains deterministic interface fixtures and
          makes no runtime API or external-service request. The hosting manifest binds the served
          files to one exact reviewed source revision.
        </p>

        <section aria-labelledby="candidate-state" className="mb-8">
          <h2
            id="candidate-state"
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: '#d9c58f' }}
          >
            Candidate state
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BOUNDARIES.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <dt className="mb-2 text-xs" style={{ color: '#8a8a8a' }}>
                  {label}
                </dt>
                <dd className="font-mono text-sm" style={{ color: '#f5f5f5' }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section
            aria-labelledby="reviewed-routes"
            className="rounded-xl p-6"
            style={{
              background: 'rgba(201,183,135,0.045)',
              border: '1px solid rgba(201,183,135,0.22)',
            }}
          >
            <h2
              id="reviewed-routes"
              className="mb-3 text-xl font-semibold"
              style={{ color: '#fff' }}
            >
              Reviewed routes
            </h2>
            <p className="mb-5 text-sm leading-6" style={{ color: '#b8b8b8' }}>
              Only these routes are admitted. Every other client route renders a publication hold.
            </p>
            <nav aria-label="Reviewed candidate routes" className="grid gap-3">
              {REVIEWED_PUBLIC_ROUTES.map((route) => (
                <a
                  key={route.path}
                  href={routeHref(BASE, route.path)}
                  className="rounded-lg px-4 py-3 text-sm font-medium"
                  style={{
                    color: '#f5f5f5',
                    background: 'rgba(10,10,10,0.45)',
                    border: '1px solid rgba(201,183,135,0.2)',
                  }}
                >
                  {route.label}
                </a>
              ))}
            </nav>
          </section>

          <section
            aria-labelledby="not-established"
            className="rounded-xl p-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            <h2
              id="not-established"
              className="mb-3 text-xl font-semibold"
              style={{ color: '#fff' }}
            >
              Not established by this preview
            </h2>
            <ul className="grid gap-3 text-sm leading-6" style={{ color: '#b8b8b8' }}>
              {NOT_ESTABLISHED.map((boundary) => (
                <li key={boundary} className="flex gap-3">
                  <span aria-hidden="true" style={{ color: '#d9c58f' }}>
                    —
                  </span>
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  );
}
