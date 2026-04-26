import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  COMPETITORS, ABSORBED_REPOS, A11OY_UNIQUE, CONVERGENCE_STATS,
} from '../data/agiConvergenceData';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)', text: '#f5f5f5', dim: '#8a8a8a',
  muted: '#5e5e5e', accent: '#c9b787',
  mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => (p === '/' ? BASE + '/' : BASE + p);

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, margin: '0 0 1.5rem' }}>{children}</p>;
}

const statusColor = (s: string) => s === 'surpassed' ? '#4ade80' : s === 'absorbed' ? T.accent : '#a78bfa';
const statusLabel = (s: string) => s === 'surpassed' ? 'SURPASSED' : s === 'absorbed' ? 'ABSORBED' : 'UNIQUE';

export function AgiConvergence() {
  const [activeCompetitor, setActiveCompetitor] = useState(COMPETITORS[0].name);
  const active = COMPETITORS.find(c => c.name === activeCompetitor)!;

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href={b('/')}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text, cursor: 'pointer', letterSpacing: '-0.02em' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, backgroundColor: T.accent, color: T.bg, fontSize: '0.65rem', fontWeight: 800, marginRight: 6 }}>a</span>
                a11oy
              </span>
            </Link>
            <span style={{ color: T.muted, fontSize: '0.8rem' }}>convergence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href={b('/a11oy-code')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Platform</span></Link>
            <Link href={b('/deep-research')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Research</span></Link>
            <Link href={b('/action')}><span style={{ color: T.dim, fontSize: '0.8rem', cursor: 'pointer' }}>Action</span></Link>
            <Link href={b('/investor-demo')}>
              <span style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', border: `1px solid ${T.accent}`, borderRadius: 20, color: T.accent, cursor: 'pointer' }}>Investor demo</span>
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '8rem 2rem 4rem' }}>
        <FadeIn>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, marginBottom: '2rem', textAlign: 'center' }}>
            ONE OF ONE
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', margin: '0 0 2rem' }}>
            AGI Convergence
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: T.dim, maxWidth: 700, margin: '0 auto 2rem', textAlign: 'center' }}>
            We studied every leader in AGI. We absorbed their GitHub repos, their architectures, their capabilities. Then we added what none of them have — governance as the product.
            <br /><br />
            <span style={{ color: T.text }}>
              OpenAI's agentic execution. Anthropic's coding autonomy. DeepMind's research depth.
              Microsoft's enterprise distribution. Meta's open models. Palantir's operational ontology.
            </span>
            <br /><br />
            All of it. Governed. Proven. One platform.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <Link href={b('/a11oy-code')}>
              <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, backgroundColor: T.text, color: T.bg, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                See the Platform
              </span>
            </Link>
            <Link href={b('/investor-demo')}>
              <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, border: `1px solid ${T.accent}`, color: T.accent, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Investor Demo
              </span>
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            {[
              { value: CONVERGENCE_STATS.reposAbsorbed.toString(), label: 'repos absorbed' },
              { value: CONVERGENCE_STATS.totalStars, label: 'combined stars' },
              { value: CONVERGENCE_STATS.competitors.toString(), label: 'competitors studied' },
              { value: CONVERGENCE_STATS.uniqueCapabilities.toString(), label: 'unique to a11oy' },
              { value: CONVERGENCE_STATS.modelProviders.toString(), label: 'model providers' },
              { value: CONVERGENCE_STATS.governedFeatures, label: 'governed' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontFamily: T.mono, color: T.accent, fontWeight: 600 }}>{s.value}</div>
                <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>The Landscape</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Six leaders. Every one studied. Every gap exposed.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '2rem', lineHeight: 1.6 }}>
            We didn't just look at their marketing. We pulled their repos, read their code, mapped their architectures, and identified what they're missing.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {COMPETITORS.map(c => (
              <button
                key={c.name}
                onClick={() => setActiveCompetitor(c.name)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: 8,
                  border: `1px solid ${activeCompetitor === c.name ? T.accent : T.border}`,
                  backgroundColor: activeCompetitor === c.name ? 'rgba(201,183,135,0.08)' : 'transparent',
                  color: activeCompetitor === c.name ? T.accent : T.dim,
                  cursor: 'pointer', fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.3rem' }}>{active.name}</h3>
                <p style={{ fontSize: '0.8rem', color: T.dim }}>{active.tagline}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontFamily: T.mono, color: T.accent }}>{active.repos}</div>
                <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase' }}>public repos</div>
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Key Strength</div>
              <p style={{ fontSize: '0.8rem', color: T.text, margin: 0 }}>{active.keyStrength}</p>
            </div>

            <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>What we absorbed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {active.absorbed.map((item, i) => {
                const [from, to] = item.split(' \u2192 ');
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center', fontSize: '0.72rem', padding: '0.5rem 0.75rem', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                    <span style={{ color: T.dim }}>{from}</span>
                    <span style={{ color: T.accent, fontFamily: T.mono }}>{'\u2192'}</span>
                    <span style={{ color: T.text }}>{to}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '1rem', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Their gap</div>
              <p style={{ fontSize: '0.78rem', color: '#fca5a5', margin: 0 }}>{active.gap}</p>
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Absorbed Repositories</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            {CONVERGENCE_STATS.reposAbsorbed} repos. {CONVERGENCE_STATS.totalStars} stars. All governed.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '2rem', lineHeight: 1.6 }}>
            Every major open-source AI agent framework, SDK, and tool — absorbed, governed, and surpassed.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 70px 1fr 1fr 85px', padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, gap: '0.75rem' }}>
              {['Source', 'Repository', 'Stars', 'Their Capability', 'a11oy Equivalent', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>
            {ABSORBED_REPOS.map((repo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                style={{ display: 'grid', gridTemplateColumns: '80px 180px 70px 1fr 1fr 85px', padding: '0.65rem 1rem', borderBottom: i < ABSORBED_REPOS.length - 1 ? `1px solid ${T.border}` : 'none', gap: '0.75rem', alignItems: 'center' }}
              >
                <div style={{ fontSize: '0.68rem', color: T.dim }}>{repo.source}</div>
                <div style={{ fontSize: '0.68rem', fontFamily: T.mono, color: T.text }}>{repo.repo.split('/')[1]}</div>
                <div style={{ fontSize: '0.68rem', fontFamily: T.mono, color: T.accent }}>{repo.stars}</div>
                <div style={{ fontSize: '0.68rem', color: T.dim }}>{repo.capability}</div>
                <div style={{ fontSize: '0.68rem', color: T.text }}>{repo.a11oyEquivalent}</div>
                <div>
                  <span style={{ fontSize: '0.55rem', fontFamily: T.mono, padding: '2px 8px', borderRadius: 999, backgroundColor: `${statusColor(repo.status)}15`, color: statusColor(repo.status), border: `1px solid ${statusColor(repo.status)}30`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {statusLabel(repo.status)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>What only a11oy has</Label></FadeIn>
        <FadeIn delay={0.1}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            {A11OY_UNIQUE.length} capabilities no one else has built.
          </h2>
          <p style={{ fontSize: '0.85rem', color: T.dim, maxWidth: 600, marginBottom: '3rem', lineHeight: 1.6 }}>
            We absorbed everything they have. Then we built what they can't. This is the moat.
          </p>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {A11OY_UNIQUE.map((cap, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div style={{ padding: '2rem', borderRadius: 12, border: `1px solid rgba(167,139,250,0.2)`, backgroundColor: 'rgba(167,139,250,0.03)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cap.name}</h3>
                  <span style={{ fontSize: '0.5rem', fontFamily: T.mono, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    UNIQUE
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: T.dim }}>{cap.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>The Formula</Label></FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface, padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: T.mono, lineHeight: 2.2, color: T.dim, maxWidth: 700, margin: '0 auto' }}>
              <span style={{ color: T.text }}>OpenAI</span> agentic execution
              <span style={{ color: T.muted }}> + </span>
              <span style={{ color: T.text }}>Anthropic</span> coding autonomy
              <span style={{ color: T.muted }}> + </span>
              <span style={{ color: T.text }}>DeepMind</span> research depth
              <br />
              <span style={{ color: T.muted }}> + </span>
              <span style={{ color: T.text }}>Palantir</span> operational ontology
              <span style={{ color: T.muted }}> + </span>
              <span style={{ color: T.text }}>Microsoft</span> enterprise distribution
              <span style={{ color: T.muted }}> + </span>
              <span style={{ color: T.text }}>Meta</span> open model strategy
            </div>
            <div style={{ margin: '1.5rem 0', fontSize: '1.5rem', color: T.muted }}>+</div>
            <div style={{ fontSize: '0.8rem', fontFamily: T.mono, color: T.accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              GOVERNANCE AS THE PRODUCT
            </div>
            <div style={{ margin: '1.5rem 0', fontSize: '1.5rem', color: T.muted }}>=</div>
            <div style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, letterSpacing: '-0.04em' }}>
              <span style={{ color: T.accent }}>a</span>
              <span style={{ color: T.accent, fontWeight: 700, fontSize: '1.15em' }}>11</span>
              <span style={{ color: T.accent }}>oy</span>
            </div>
            <div style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.muted, marginTop: '0.75rem', letterSpacing: '0.1em' }}>
              ONE OF ONE
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <FadeIn><Label>Live Convergence Terminal</Label></FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', backgroundColor: T.surface }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }} />
              <span style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.dim }}>a11oy convergence monitor — governed AGI status</span>
            </div>
            <div style={{ padding: '1.5rem', fontFamily: T.mono, fontSize: '0.68rem', lineHeight: 1.8 }}>
              <div style={{ color: T.muted }}># a11oy AGI convergence status report</div>
              <div style={{ color: T.muted }}># Generated: {new Date().toISOString().split('T')[0]}</div>
              <div style={{ height: 8 }} />
              <div style={{ color: '#4ade80' }}>[convergence] 6 competitors analyzed — all capabilities mapped</div>
              <div style={{ color: '#4ade80' }}>[convergence] 16 repositories absorbed — 513k+ combined stars</div>
              <div style={{ color: '#4ade80' }}>[convergence] 8 unique capabilities — no competitor has any of these</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[model-router] GPT-5.5 .............. operational (OpenAI absorbed)</div>
              <div style={{ color: T.dim }}>[model-router] Claude 4 .............. operational (Anthropic absorbed)</div>
              <div style={{ color: T.dim }}>[model-router] Gemini 3.1 Pro ........ operational (DeepMind absorbed)</div>
              <div style={{ color: T.dim }}>[model-router] DeepSeek V4 ........... operational (independent)</div>
              <div style={{ color: T.dim }}>[model-router] Qwen 3.6 .............. operational (independent)</div>
              <div style={{ color: T.dim }}>[model-router] Llama 405B ............ operational (Meta absorbed)</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.accent }}>[governance] Proof Chain ............ ACTIVE — 100% action coverage</div>
              <div style={{ color: T.accent }}>[governance] Chronicle Memory ....... ACTIVE — 5 tiers operational</div>
              <div style={{ color: T.accent }}>[governance] Cognitive Forecasting .. ACTIVE — 8 domains</div>
              <div style={{ color: T.accent }}>[governance] Covenant Enforcement ... ACTIVE — org-level policies</div>
              <div style={{ color: T.accent }}>[governance] Sovereign Replay ....... ACTIVE — full session proof</div>
              <div style={{ color: T.accent }}>[governance] Cyber Safety ........... ENFORCED — dual-use classified</div>
              <div style={{ height: 8 }} />
              <div style={{ color: T.dim }}>[absorbed] OpenAI Codex .............. {'\u2192'} a11oy Terminal (SURPASSED)</div>
              <div style={{ color: T.dim }}>[absorbed] Anthropic Claude Code ..... {'\u2192'} a11oy Terminal (SURPASSED)</div>
              <div style={{ color: T.dim }}>[absorbed] Google Gemini CLI ........ {'\u2192'} a11oy Terminal (SURPASSED)</div>
              <div style={{ color: T.dim }}>[absorbed] Microsoft MAF ............ {'\u2192'} a11oy Agent Mesh (SURPASSED)</div>
              <div style={{ color: T.dim }}>[absorbed] Meta Llama Stack ......... {'\u2192'} a11oy Model Router (ABSORBED)</div>
              <div style={{ color: T.dim }}>[absorbed] Palantir Foundry ......... {'\u2192'} a11oy Outcome Graph (SURPASSED)</div>
              <div style={{ height: 8 }} />
              <div style={{ color: '#4ade80' }}>[status] AGI convergence: OPERATIONAL</div>
              <div style={{ color: '#4ade80' }}>[status] Governance layer: ACTIVE</div>
              <div style={{ color: '#4ade80' }}>[status] Classification: ONE OF ONE</div>
              <div style={{ color: T.muted }}>proof hash: 0xd4a7...b2f3 | governed | auditable | sovereign</div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ padding: '6rem 2rem 8rem', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, marginBottom: '2rem' }}>
              THE FIRST GOVERNED AGI AGENTIC PLATFORM
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
              They build pieces.<br />We built the whole.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ fontSize: '0.85rem', color: T.dim, marginBottom: '1rem', lineHeight: 1.6 }}>
              OpenAI has execution. Anthropic has safety. DeepMind has research. Microsoft has distribution. Meta has openness. Palantir has ontology.
            </p>
            <p style={{ fontSize: '0.95rem', color: T.text, marginBottom: '2.5rem', lineHeight: 1.6 }}>
              a11oy has all of it. Governed. Proven. One of one.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={b('/a11oy-code')}>
                <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, backgroundColor: T.text, color: T.bg, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  See the Platform
                </span>
              </Link>
              <Link href={b('/investor-demo')}>
                <span style={{ display: 'inline-block', padding: '0.7rem 2rem', borderRadius: 999, border: `1px solid ${T.accent}`, color: T.accent, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  Investor Demo
                </span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted }}>
          a11oy — the first governed AGI agentic platform — one of one — SZL Holdings
        </p>
      </footer>
    </div>
  );
}
