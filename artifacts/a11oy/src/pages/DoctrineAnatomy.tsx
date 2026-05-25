/**
 * A11oy /doctrine/anatomy — V8 anatomy figure viewer.
 *
 * Renders the 8 SZL Agent Anatomy figures shipped in
 * `.local/payload-v8/05_anatomy/figures/` (vendored under
 * `/doctrine-anatomy/`). Each card carries the canonical title and
 * thesis module from `@szl-holdings/szl-doctrine::ANATOMY_FIGURES`,
 * shows the PNG preview, and exposes PDF + PNG download links.
 *
 * The page is the deep-link target for GovernancePanels' anatomy row,
 * so each figure section is anchored by its slug (e.g.
 * `/doctrine/anatomy#anatomy_brain`).
 */
import { useEffect } from 'react';
import { ANATOMY_FIGURES, BYLINE } from '@szl-holdings/szl-doctrine';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const GOLD = '#c9b787';
const SUBTLE = 'rgba(255,255,255,0.55)';
const BORDER = 'rgba(201,183,135,0.18)';

function figurePngUrl(slug: string): string {
  return `${BASE}/doctrine-anatomy/${slug}.png`;
}

function figurePdfUrl(slug: string): string {
  return `${BASE}/doctrine-anatomy/${slug}.pdf`;
}

export default function DoctrineAnatomy() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    }
  }, []);

  return (
    <Layout>
      <PageHeader
        label="Doctrine V6 · Payload v8"
        title="Agent Anatomy — the 8 canonical figures"
        subtitle={
          `Vector figures from .local/payload-v8/05_anatomy/figures/. ` +
          `CC-BY-4.0 by ${BYLINE.name} (ORCID ${BYLINE.orcid}). ` +
          `GovernancePanels chips deep-link to the figure that justifies each artifact's primary theses.`
        }
      />
      <SectionTitle>Figures · PDF is the primary vector artifact; PNG is a 300 dpi raster export.</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {ANATOMY_FIGURES.map((figure, index) => (
          <Card key={figure.slug}>
            <article id={figure.slug} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: GOLD,
                  }}
                >
                  {String(index + 1).padStart(2, '0')} · {figure.module}
                </span>
                <h3 style={{ margin: 0, color: '#f5f1e6', fontSize: 18 }}>{figure.title}</h3>
                <code style={{ fontSize: 11, color: SUBTLE }}>{figure.slug}</code>
              </header>
              <a
                href={figurePdfUrl(figure.slug)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  border: `1px solid ${BORDER}`,
                  background: '#000',
                  padding: 6,
                  textDecoration: 'none',
                }}
              >
                <img
                  src={figurePngUrl(figure.slug)}
                  alt={figure.title}
                  loading="lazy"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </a>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href={figurePdfUrl(figure.slug)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: GOLD,
                    border: `1px solid ${BORDER}`,
                    padding: '6px 12px',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  Download PDF
                </a>
                <a
                  href={figurePngUrl(figure.slug)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: GOLD,
                    border: `1px solid ${BORDER}`,
                    padding: '6px 12px',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  Download PNG
                </a>
              </div>
            </article>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
