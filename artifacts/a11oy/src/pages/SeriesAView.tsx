import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  SERIES_A_SOLUTIONS,
  type SeriesAEvidenceState,
  type SeriesASolution,
} from '../data/seriesASolutions';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const route = (path: string) => `${BASE}${path}`;

const STATE_STYLE: Record<
  SeriesAEvidenceState,
  { color: string; background: string; border: string }
> = {
  AVAILABLE: {
    color: '#b8e4d3',
    background: 'rgba(85, 185, 146, 0.10)',
    border: 'rgba(85, 185, 146, 0.28)',
  },
  DEMO: {
    color: '#e5d29e',
    background: 'rgba(201, 183, 135, 0.12)',
    border: 'rgba(201, 183, 135, 0.34)',
  },
  BLOCKED: {
    color: '#f1bd91',
    background: 'rgba(219, 139, 75, 0.10)',
    border: 'rgba(219, 139, 75, 0.30)',
  },
  UNAVAILABLE: {
    color: '#b7bac2',
    background: 'rgba(183, 186, 194, 0.08)',
    border: 'rgba(183, 186, 194, 0.22)',
  },
};

function StateBadge({ state }: { state: SeriesAEvidenceState }) {
  const style = STATE_STYLE[state];
  return (
    <span
      className="sa-state"
      style={{ color: style.color, background: style.background, borderColor: style.border }}
    >
      {state}
    </span>
  );
}

function TruthCard({
  label,
  state,
  detail,
}: {
  label: string;
  state: SeriesAEvidenceState;
  detail: string;
}) {
  return (
    <div className="sa-truth-card">
      <div className="sa-truth-heading">
        <span>{label}</span>
        <StateBadge state={state} />
      </div>
      <p>{detail}</p>
    </div>
  );
}

function SolutionPanel({ solution }: { solution: SeriesASolution }) {
  return (
    <div
      id={`solution-panel-${solution.id}`}
      role="tabpanel"
      aria-labelledby={`solution-tab-${solution.id}`}
      className="sa-panel"
    >
      <div className="sa-panel-head">
        <div>
          <p className="sa-eyebrow">{solution.buyer}</p>
          <h2>{solution.title}</h2>
          <p className="sa-thesis">{solution.thesis}</p>
        </div>
        <div className="sa-panel-proof">
          <span>Source UI</span>
          <StateBadge state={solution.sourceState} />
          <span>Scenario</span>
          <StateBadge state={solution.scenarioState} />
          <span>Live data</span>
          <StateBadge state={solution.liveState} />
        </div>
      </div>

      <section className="sa-loop" aria-label="Observe, Gate, Act, Prove evidence loop">
        {solution.loop.map((step, index) => (
          <article className="sa-step" key={step.phase}>
            <div className="sa-step-top">
              <span className="sa-step-number">0{index + 1}</span>
              <StateBadge state={step.state} />
            </div>
            <h3>{step.phase}</h3>
            <p>{step.summary}</p>
            <small>{step.evidence}</small>
          </article>
        ))}
      </section>

      <div className="sa-outcome-grid">
        <div className="sa-outcome">
          <p className="sa-eyebrow">Buyer value</p>
          <p>{solution.value}</p>
        </div>
        <div className="sa-outcome sa-boundary">
          <p className="sa-eyebrow">Execution boundary</p>
          <p>
            This source revision demonstrates a deterministic, governed decision path. External
            connector reads, production mutations, and deployed receipt parity remain unavailable
            until independently observed.
          </p>
        </div>
      </div>

      <div className="sa-actions">
        <Link className="sa-button sa-button-primary" href={route(solution.demoHref)}>
          {solution.demoLabel}
        </Link>
        <Link className="sa-button" href={route('/proof')}>
          Inspect Proof Ledger
        </Link>
        <Link className="sa-button" href={route('/governance')}>
          Inspect policy gates
        </Link>
      </div>
    </div>
  );
}

export function SeriesAView() {
  const [selectedId, setSelectedId] = useState<SeriesASolution['id']>(SERIES_A_SOLUTIONS[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected =
    SERIES_A_SOLUTIONS.find((solution) => solution.id === selectedId) ?? SERIES_A_SOLUTIONS[0];

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowLeft')
      next = (index - 1 + SERIES_A_SOLUTIONS.length) % SERIES_A_SOLUTIONS.length;
    if (event.key === 'ArrowRight') next = (index + 1) % SERIES_A_SOLUTIONS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = SERIES_A_SOLUTIONS.length - 1;
    const target = SERIES_A_SOLUTIONS[next];
    setSelectedId(target.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <Layout fullscreen>
      <div className="sa-shell">
        <style>{`
          .sa-shell {
            --sa-bg: #080908;
            --sa-surface: rgba(255, 255, 255, 0.035);
            --sa-surface-strong: rgba(255, 255, 255, 0.055);
            --sa-border: rgba(255, 255, 255, 0.11);
            --sa-border-strong: rgba(201, 183, 135, 0.34);
            --sa-text: #f4f1e9;
            --sa-dim: #a09e98;
            --sa-muted: #73736f;
            --sa-accent: #c9b787;
            min-height: 100vh;
            width: 100%;
            overflow-x: clip;
            background:
              radial-gradient(circle at 82% -5%, rgba(201, 183, 135, 0.13), transparent 32rem),
              radial-gradient(circle at 12% 42%, rgba(62, 116, 103, 0.09), transparent 34rem),
              var(--sa-bg);
            color: var(--sa-text);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .sa-shell *, .sa-shell *::before, .sa-shell *::after { box-sizing: border-box; }
          .sa-header {
            position: sticky;
            top: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            min-height: 64px;
            padding: .7rem clamp(1rem, 4vw, 3rem);
            border-bottom: 1px solid var(--sa-border);
            background: rgba(8, 9, 8, .86);
            backdrop-filter: blur(18px);
          }
          .sa-brand, .sa-header nav { display: flex; align-items: center; gap: .75rem; }
          .sa-brand { min-height: 44px; color: var(--sa-text); text-decoration: none; font-weight: 680; letter-spacing: -.03em; }
          .sa-mark {
            display: inline-grid;
            place-items: center;
            width: 30px;
            height: 30px;
            border: 1px solid var(--sa-border-strong);
            border-radius: 9px;
            color: var(--sa-accent);
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .sa-header nav a {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            padding: .55rem .75rem;
            color: var(--sa-dim);
            text-decoration: none;
            font-size: .79rem;
            border-radius: 8px;
          }
          .sa-header nav a:hover, .sa-header nav a:focus-visible { color: var(--sa-text); background: var(--sa-surface); }
          .sa-main { width: min(100%, 1280px); margin: 0 auto; padding: clamp(2.5rem, 7vw, 6.5rem) clamp(1rem, 4vw, 3rem) 6rem; }
          .sa-hero { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(250px, .65fr); gap: clamp(2rem, 6vw, 5rem); align-items: end; }
          .sa-kicker, .sa-eyebrow {
            margin: 0;
            font: 650 .68rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
            letter-spacing: .17em;
            text-transform: uppercase;
            color: var(--sa-accent);
          }
          .sa-hero h1 { max-width: 850px; margin: 1.2rem 0 1.35rem; font-size: clamp(2.55rem, 7vw, 6.4rem); line-height: .94; letter-spacing: -.065em; text-wrap: balance; }
          .sa-hero-copy { max-width: 720px; margin: 0; color: var(--sa-dim); font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.7; }
          .sa-hero-aside { padding: 1.35rem; border: 1px solid var(--sa-border-strong); border-radius: 18px; background: linear-gradient(150deg, rgba(201,183,135,.10), rgba(255,255,255,.025)); }
          .sa-hero-aside strong { display: block; margin: .8rem 0 .6rem; font-size: 1.2rem; }
          .sa-hero-aside p { margin: 0; color: var(--sa-dim); font-size: .88rem; line-height: 1.65; }
          .sa-state { display: inline-flex; width: max-content; align-items: center; justify-content: center; min-height: 24px; padding: .24rem .5rem; border: 1px solid; border-radius: 999px; font: 700 .58rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; }
          .sa-truth-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: clamp(2.5rem, 6vw, 5rem) 0; }
          .sa-truth-card { min-width: 0; padding: 1rem; border: 1px solid var(--sa-border); border-radius: 14px; background: var(--sa-surface); }
          .sa-truth-heading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; font-size: .78rem; font-weight: 650; }
          .sa-truth-card p { margin: .7rem 0 0; color: var(--sa-muted); font-size: .75rem; line-height: 1.55; overflow-wrap: anywhere; }
          .sa-section-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
          .sa-section-head h2 { margin: .55rem 0 0; font-size: clamp(1.7rem, 4vw, 3rem); letter-spacing: -.04em; }
          .sa-section-head p:last-child { max-width: 520px; margin: 0; color: var(--sa-muted); font-size: .83rem; line-height: 1.6; }
          .sa-tabs { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .55rem; margin: 1.5rem 0 .8rem; }
          .sa-tab { min-width: 0; min-height: 52px; padding: .65rem .7rem; border: 1px solid var(--sa-border); border-radius: 10px; background: var(--sa-surface); color: var(--sa-dim); cursor: pointer; font: 650 .75rem/1.25 inherit; text-align: left; }
          .sa-tab:hover, .sa-tab:focus-visible { border-color: var(--sa-border-strong); color: var(--sa-text); }
          .sa-tab[aria-selected="true"] { border-color: var(--sa-border-strong); background: rgba(201,183,135,.11); color: var(--sa-text); box-shadow: inset 0 -2px var(--sa-accent); }
          .sa-panel { min-width: 0; padding: clamp(1.1rem, 3vw, 2rem); border: 1px solid var(--sa-border-strong); border-radius: 20px; background: linear-gradient(145deg, rgba(201,183,135,.055), rgba(255,255,255,.018) 52%); outline: none; }
          .sa-panel:focus-visible { box-shadow: 0 0 0 3px rgba(201,183,135,.22); }
          .sa-panel-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2rem; align-items: start; }
          .sa-panel-head h2 { margin: .5rem 0 .8rem; font-size: clamp(2rem, 5vw, 4.2rem); letter-spacing: -.055em; }
          .sa-thesis { max-width: 780px; margin: 0; color: var(--sa-dim); font-size: 1rem; line-height: 1.65; }
          .sa-panel-proof { display: grid; grid-template-columns: auto auto; align-items: center; gap: .55rem .8rem; padding: .8rem; border: 1px solid var(--sa-border); border-radius: 12px; color: var(--sa-muted); font-size: .68rem; }
          .sa-loop { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: 2rem 0; }
          .sa-step { min-width: 0; min-height: 270px; padding: 1rem; border: 1px solid var(--sa-border); border-radius: 14px; background: rgba(0,0,0,.20); }
          .sa-step-top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
          .sa-step-number { color: var(--sa-muted); font: 650 .64rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
          .sa-step h3 { margin: 1.8rem 0 .7rem; font-size: 1.22rem; }
          .sa-step p { margin: 0; color: var(--sa-dim); font-size: .83rem; line-height: 1.6; }
          .sa-step small { display: block; margin-top: 1.2rem; padding-top: .8rem; border-top: 1px solid var(--sa-border); color: var(--sa-muted); font-size: .69rem; line-height: 1.5; }
          .sa-outcome-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
          .sa-outcome { padding: 1.05rem; border: 1px solid var(--sa-border); border-radius: 14px; background: var(--sa-surface); }
          .sa-outcome > p:last-child { margin: .65rem 0 0; color: var(--sa-dim); line-height: 1.6; }
          .sa-boundary { border-color: rgba(219,139,75,.25); }
          .sa-actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1.2rem; }
          .sa-button { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; padding: .7rem 1rem; border: 1px solid var(--sa-border); border-radius: 10px; color: var(--sa-text); background: var(--sa-surface); text-decoration: none; font-size: .78rem; font-weight: 650; }
          .sa-button:hover, .sa-button:focus-visible { border-color: var(--sa-border-strong); background: var(--sa-surface-strong); }
          .sa-button-primary { background: var(--sa-accent); color: #11120f; border-color: var(--sa-accent); }
          .sa-diligence { margin-top: clamp(3.5rem, 8vw, 7rem); }
          .sa-diligence-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-top: 1.25rem; }
          .sa-diligence-card { min-height: 180px; display: flex; flex-direction: column; justify-content: space-between; gap: 1.5rem; padding: 1.2rem; border: 1px solid var(--sa-border); border-radius: 15px; background: var(--sa-surface); color: var(--sa-text); text-decoration: none; }
          .sa-diligence-card:hover, .sa-diligence-card:focus-visible { border-color: var(--sa-border-strong); transform: translateY(-2px); }
          .sa-diligence-card span:first-child { color: var(--sa-accent); font: 650 .65rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
          .sa-diligence-card strong { display: block; margin-top: .65rem; font-size: 1.25rem; }
          .sa-diligence-card p { margin: 0; color: var(--sa-muted); font-size: .78rem; line-height: 1.55; }
          .sa-footer { display: flex; justify-content: space-between; gap: 1rem; margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--sa-border); color: var(--sa-muted); font-size: .7rem; line-height: 1.5; }
          @media (max-width: 960px) {
            .sa-hero { grid-template-columns: 1fr; align-items: start; }
            .sa-hero-aside { max-width: 620px; }
            .sa-truth-grid, .sa-loop { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .sa-tabs { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .sa-panel-head { grid-template-columns: 1fr; }
            .sa-panel-proof { width: min(100%, 360px); }
          }
          @media (max-width: 700px) {
            .sa-header { align-items: flex-start; flex-direction: column; }
            .sa-header nav { width: 100%; overflow-x: auto; padding-bottom: .1rem; }
            .sa-header nav a { flex: 0 0 auto; }
            .sa-section-head { align-items: flex-start; flex-direction: column; }
            .sa-outcome-grid, .sa-diligence-grid { grid-template-columns: 1fr; }
            .sa-footer { flex-direction: column; }
          }
          @media (max-width: 520px) {
            .sa-main { padding-inline: .8rem; }
            .sa-header nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: visible; }
            .sa-header nav a { justify-content: center; text-align: center; }
            .sa-truth-grid, .sa-loop, .sa-tabs { grid-template-columns: 1fr; }
            .sa-step { min-height: 0; }
            .sa-tab { text-align: center; }
            .sa-actions { flex-direction: column; }
            .sa-button { width: 100%; }
          }
          @media (prefers-reduced-motion: reduce) {
            .sa-shell *, .sa-shell *::before, .sa-shell *::after { scroll-behavior: auto !important; transition: none !important; }
          }
        `}</style>

        <header className="sa-header">
          <Link className="sa-brand" href={route('/')} aria-label="A11oy home">
            <span className="sa-mark" aria-hidden="true">
              a
            </span>
            <span>A11oy</span>
          </Link>
          <nav aria-label="Series A view navigation">
            <a href="#solutions">Solutions</a>
            <a href="#evidence">Evidence</a>
            <a href="#diligence">Diligence</a>
            <Link href={route('/architecture')}>Developer view</Link>
          </nav>
        </header>

        <main className="sa-main" id="main-content" tabIndex={-1}>
          <section className="sa-hero" aria-labelledby="series-a-title">
            <div>
              <p className="sa-kicker">Series A product view · active prototype</p>
              <h1 id="series-a-title">
                See the governed decision loop. Inspect the proof boundary.
              </h1>
              <p className="sa-hero-copy">
                A11oy is designed to turn consequential enterprise signals into policy-gated,
                human-authorized actions with evidence attached. This view separates what the source
                demonstrates from what still requires a live, independently observed runtime.
              </p>
              <div className="sa-actions">
                <Link className="sa-button sa-button-primary" href={route('/demo')}>
                  Open deterministic demo
                </Link>
                <Link className="sa-button" href={route('/proof')}>
                  Inspect proof shape
                </Link>
              </div>
            </div>
            <aside className="sa-hero-aside" aria-label="Investor view status">
              <StateBadge state="DEMO" />
              <strong>Investor lens is the default.</strong>
              <p>
                Six buyer views share one execution grammar: Observe, Gate, Act, Prove. Missing
                production evidence is shown as unavailable, never silently promoted to live.
              </p>
            </aside>
          </section>

          <section className="sa-truth-grid" id="evidence" aria-label="Current evidence boundary">
            <TruthCard
              label="React surface"
              state="AVAILABLE"
              detail="This route and its six solution contracts exist in the current source tree."
            />
            <TruthCard
              label="Decision scenarios"
              state="DEMO"
              detail="Each view uses deterministic, non-customer scenario language and links to an existing source route."
            />
            <TruthCard
              label="External execution"
              state="BLOCKED"
              detail="The view stages governed recommendations; it does not issue real transactions, filings, or connector mutations."
            />
            <TruthCard
              label="GraphQL runtime"
              state="UNAVAILABLE"
              detail="No server resolver route for the declared GraphQL client contract was found at this revision."
            />
          </section>

          <section id="solutions" aria-labelledby="solutions-title">
            <div className="sa-section-head">
              <div>
                <p className="sa-kicker">One product · six investor-ready views</p>
                <h2 id="solutions-title">Choose the buyer problem.</h2>
              </div>
              <p>
                Every tab exposes the same governed loop and links into an existing A11oy demo
                surface. The operational state stays visible throughout the journey.
              </p>
            </div>

            <div className="sa-tabs" role="tablist" aria-label="Solution views">
              {SERIES_A_SOLUTIONS.map((solution, index) => (
                <button
                  key={solution.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`solution-tab-${solution.id}`}
                  className="sa-tab"
                  role="tab"
                  type="button"
                  aria-selected={selected.id === solution.id}
                  aria-controls={`solution-panel-${solution.id}`}
                  tabIndex={selected.id === solution.id ? 0 : -1}
                  onClick={() => setSelectedId(solution.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {solution.shortLabel}
                </button>
              ))}
            </div>
            <SolutionPanel solution={selected} />
          </section>

          <section className="sa-diligence" id="diligence" aria-labelledby="diligence-title">
            <div className="sa-section-head">
              <div>
                <p className="sa-kicker">Diligence path</p>
                <h2 id="diligence-title">Move from narrative to source evidence.</h2>
              </div>
              <p>
                No dead-end pitch deck: every diligence card resolves to a registered A11oy route.
              </p>
            </div>
            <div className="sa-diligence-grid">
              <Link className="sa-diligence-card" href={route('/architecture')}>
                <span>01 · ARCHITECTURE</span>
                <div>
                  <strong>Inspect the fabric</strong>
                  <p>Review the source-declared layers, boundaries, and product structure.</p>
                </div>
              </Link>
              <Link className="sa-diligence-card" href={route('/governance')}>
                <span>02 · GOVERNANCE</span>
                <div>
                  <strong>Inspect the gate</strong>
                  <p>Follow the Covenant policy and human-authorization path.</p>
                </div>
              </Link>
              <Link className="sa-diligence-card" href={route('/proof')}>
                <span>03 · PROOF</span>
                <div>
                  <strong>Inspect the evidence</strong>
                  <p>Review the demo Proof Packet shape without inferring deployed receipts.</p>
                </div>
              </Link>
            </div>
          </section>

          <footer className="sa-footer">
            <span>A11oy · Governed decision infrastructure prototype</span>
            <span>
              Source-qualified view · no customer, revenue, certification, or production claim
            </span>
          </footer>
        </main>
      </div>
    </Layout>
  );
}
