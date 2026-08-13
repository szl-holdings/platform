/* eslint-disable */
// SZL Holdings — Substack & Medium launch kit generator.
// Produces: deliverables/SZL-Substack-Launch-Plan.pdf,
//           deliverables/SZL-Medium-Launch-Plan.pdf,
//           deliverables/SZL-Newsletter-Screenshots.zip

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const archiver = require('archiver');

const { POSTS } = require('./posts.cjs');
const STRAT = require('./strategy.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const DELIVERABLES = path.join(ROOT, 'deliverables');
const BUILD = path.join(ROOT, 'tmp', 'launch-build');
const MOCKUPS_DIR = path.join(BUILD, 'mockups');
const REFERENCES_DIR = path.join(BUILD, 'references');

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

ensureDir(DELIVERABLES);
ensureDir(BUILD);
ensureDir(MOCKUPS_DIR);
ensureDir(REFERENCES_DIR);

// ────────────────────────────────────────────────
// Markdown-lite → HTML (we control the input)
// ────────────────────────────────────────────────
function mdToHtml(src) {
  if (!src) return '';
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inList = false;
  let inOl = false;
  let para = [];
  const flushPara = () => {
    if (para.length) {
      const joined = para.join(' ').trim();
      if (joined) out.push(`<p>${inline(joined)}</p>`);
      para = [];
    }
  };
  const closeLists = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (/^###\s+/.test(line)) {
      flushPara();
      closeLists();
      out.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushPara();
      closeLists();
      out.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushPara();
      closeLists();
      out.push(`<h1>${inline(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }
    if (line.trim() === '') {
      flushPara();
      closeLists();
      continue;
    }
    para.push(line);
  }
  flushPara();
  closeLists();
  return out.join('\n');
}

function inline(t) {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// ────────────────────────────────────────────────
// PDF styles (shared)
// ────────────────────────────────────────────────
const PDF_STYLES = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root {
    --bg: #060912;
    --bg2: #0b1220;
    --panel: #0f1629;
    --gold: #D4A054;
    --gold-light: #E3BB80;
    --text: #F2EFE8;
    --text-2: #C7CCD6;
    --text-3: #8A92A3;
    --border: rgba(255,255,255,0.09);
    --border-strong: rgba(255,255,255,0.16);
    --aegis: #3B82F6;
    --vessels: #1D90D1;
    --terra: #40856A;
    --lyte: #0FB3D4;
    --alloy: #3A63E0;
    --carlota: #C8913A;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--text);
    background: var(--bg);
    font-size: 10.5pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    page-break-after: always;
    padding: 56px 64px 60px;
    min-height: 100vh;
    position: relative;
  }
  .page:last-child { page-break-after: auto; }
  h1, h2, h3, h4 {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
    margin: 0 0 0.4em;
  }
  h1 { font-size: 28pt; line-height: 1.12; letter-spacing: -0.02em; }
  h2 { font-size: 16pt; line-height: 1.2; margin-top: 1.4em; color: var(--gold); }
  h3 { font-size: 12.5pt; line-height: 1.25; margin-top: 1.2em; }
  p { margin: 0 0 0.9em; color: var(--text-2); }
  strong { color: var(--text); font-weight: 600; }
  em { color: var(--gold-light); font-style: italic; }
  a { color: var(--gold-light); text-decoration: none; border-bottom: 1px dotted var(--gold); }
  code { font-family: 'JetBrains Mono', monospace; font-size: 9.5pt; color: var(--lyte); background: rgba(15,179,212,0.08); padding: 1px 5px; border-radius: 3px; }
  ul, ol { margin: 0 0 0.9em 1.2em; padding: 0; color: var(--text-2); }
  li { margin-bottom: 0.35em; }
  blockquote { border-left: 2px solid var(--gold); padding: 0.1em 0 0.1em 1em; margin: 0 0 1em; color: var(--text); font-family: 'Space Grotesk', sans-serif; font-style: italic; }

  .cover {
    background: radial-gradient(ellipse at 70% 15%, rgba(212,160,84,0.22), transparent 55%),
                radial-gradient(ellipse at 15% 85%, rgba(58,99,224,0.15), transparent 55%),
                linear-gradient(180deg, #060912 0%, #0a0f1e 100%);
    min-height: 100vh;
    padding: 120px 80px 80px;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .cover .brand {
    display: flex; align-items: center; gap: 14px;
    font-family: 'Space Grotesk', sans-serif; font-weight: 600;
    font-size: 11pt; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--gold);
  }
  .cover .brand-mark {
    width: 38px; height: 38px; border-radius: 9px;
    background: linear-gradient(135deg, var(--gold), #A67A3C);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700;
    color: #1a1208; font-size: 14pt; letter-spacing: 0;
    box-shadow: 0 2px 18px rgba(212,160,84,0.35);
  }
  .cover .eyebrow {
    font-family: 'JetBrains Mono', monospace; font-size: 9pt;
    color: var(--text-3); letter-spacing: 0.22em; text-transform: uppercase;
    margin-top: 60px;
  }
  .cover h1.title { font-size: 42pt; line-height: 1.02; color: var(--text); margin-top: 18px; max-width: 760px; }
  .cover h1.title em { color: var(--gold); font-style: normal; }
  .cover .sub { font-size: 14pt; color: var(--text-2); margin-top: 22px; max-width: 680px; line-height: 1.4; }
  .cover .footer {
    position: absolute; bottom: 60px; left: 80px; right: 80px;
    display: flex; justify-content: space-between; align-items: end;
    border-top: 1px solid var(--border); padding-top: 18px;
    font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: var(--text-3); letter-spacing: 0.12em; text-transform: uppercase;
  }
  .cover .footer .meta span { color: var(--gold); }

  .toc { }
  .toc h1 { color: var(--gold); }
  .toc ol { list-style: none; margin: 0; padding: 0; counter-reset: toc; }
  .toc li { counter-increment: toc; display: flex; justify-content: space-between; gap: 14px; padding: 10px 0; border-bottom: 1px dotted var(--border); font-family: 'Inter', sans-serif; }
  .toc li::before { content: counter(toc, decimal-leading-zero); font-family: 'JetBrains Mono', monospace; color: var(--gold); font-size: 9pt; min-width: 38px; }
  .toc li .tl { flex: 1; color: var(--text); }
  .toc li .tp { color: var(--text-3); font-family: 'JetBrains Mono', monospace; font-size: 9pt; }

  .pillar-chip, .tag-chip { display: inline-block; padding: 3px 10px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 6px 6px 0; border: 1px solid var(--border-strong); color: var(--text-2); background: rgba(255,255,255,0.02); }
  .pillar-chip.defense { color: var(--aegis); border-color: rgba(59,130,246,0.5); }
  .pillar-chip.maritime { color: var(--vessels); border-color: rgba(29,144,209,0.5); }
  .pillar-chip.real-estate, .pillar-chip.real-estate-intelligence { color: var(--terra); border-color: rgba(64,133,106,0.5); }
  .pillar-chip.ai, .pillar-chip.ai-platform-engineering { color: var(--lyte); border-color: rgba(15,179,212,0.5); }
  .pillar-chip.founder, .pillar-chip.founder-journey { color: var(--gold); border-color: rgba(212,160,84,0.5); }
  .pillar-chip.portfolio, .pillar-chip.portfolio-deep-dives { color: var(--alloy); border-color: rgba(58,99,224,0.5); }

  .section-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 10px; display: block; }

  .callout { border: 1px solid var(--border-strong); border-left: 3px solid var(--gold); background: rgba(212,160,84,0.04); padding: 14px 18px; margin: 16px 0 20px; border-radius: 4px; }
  .callout h4 { font-family: 'Space Grotesk', sans-serif; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.14em; color: var(--gold); margin: 0 0 8px; }

  .panel { border: 1px solid var(--border); background: rgba(255,255,255,0.015); border-radius: 6px; padding: 18px 22px; margin: 14px 0; }
  .panel h3 { margin-top: 0; color: var(--gold); }

  table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); color: var(--text-2); vertical-align: top; }
  th { font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 8.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold); border-bottom: 1px solid var(--border-strong); }

  .palette { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0 18px; }
  .swatch { border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; background: rgba(255,255,255,0.02); }
  .swatch .chip { width: 100%; height: 42px; border-radius: 4px; border: 1px solid var(--border-strong); }
  .swatch .name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 9.5pt; color: var(--text); margin-top: 8px; }
  .swatch .hex { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: var(--text-3); }
  .swatch .usage { font-size: 8.5pt; color: var(--text-2); margin-top: 3px; }

  .calendar { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 9.5pt; }
  .calendar th, .calendar td { border-bottom: 1px solid var(--border); padding: 7px 9px; vertical-align: top; }
  .calendar th { background: transparent; }
  .calendar td.w { font-family: 'JetBrains Mono', monospace; color: var(--gold); font-size: 9pt; }
  .calendar td.t { color: var(--text); font-weight: 500; }

  .post-header { border-bottom: 1px solid var(--border-strong); padding-bottom: 14px; margin-bottom: 20px; }
  .post-header .chips { margin-bottom: 10px; }
  .post-header .title { font-size: 22pt; line-height: 1.1; color: var(--text); margin: 0 0 10px; letter-spacing: -0.015em; }
  .post-header .sub { font-size: 11.5pt; color: var(--text-2); font-style: italic; margin: 0 0 8px; line-height: 1.4; }
  .post-header .meta { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: var(--text-3); letter-spacing: 0.1em; text-transform: uppercase; }
  .post-body p:first-child::first-letter { font-family: 'Space Grotesk', sans-serif; font-size: 32pt; font-weight: 600; color: var(--gold); float: left; line-height: 0.9; padding-right: 8px; padding-top: 3px; }

  .tags-row { margin: 12px 0 0; font-size: 9pt; color: var(--text-3); }
  .tags-row strong { color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; }

  .footer-stamp { position: fixed; bottom: 20px; left: 64px; right: 64px; display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: var(--text-3); letter-spacing: 0.14em; text-transform: uppercase; border-top: 1px solid var(--border); padding-top: 8px; }
</style>
`;

// ────────────────────────────────────────────────
// Build the Substack PDF HTML
// ────────────────────────────────────────────────
function pillarClass(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
}
function buildSwatches() {
  return STRAT.VISUAL_IDENTITY.palette
    .map(
      (c) => `
    <div class="swatch">
      <div class="chip" style="background:${c.hex}"></div>
      <div class="name">${c.name}</div>
      <div class="hex">${c.hex}</div>
      <div class="usage">${c.usage}</div>
    </div>`,
    )
    .join('');
}
function buildPostHtml(post, i) {
  const tagRow = post.tags.map((t) => `<span class="tag-chip">${t}</span>`).join('');
  const mTagRow = post.mediumTags.map((t) => `<span class="tag-chip">${t}</span>`).join('');
  return `
    <div class="page post">
      <div class="post-header">
        <div class="chips">
          <span class="pillar-chip ${pillarClass(post.pillar)}">${post.pillar}</span>
          <span class="tag-chip">Week ${post.week}</span>
          <span class="tag-chip">Post ${String(i + 1).padStart(2, '0')} of ${POSTS.length}</span>
          <span class="tag-chip">${post.readTime}</span>
        </div>
        <h1 class="title">${post.title}</h1>
        <div class="sub">${post.subtitle}</div>
        <div class="meta">SZL Command · szlcommand.substack.com · Copy-paste ready</div>
      </div>
      <div class="post-body">${mdToHtml(post.body)}</div>
      <div class="tags-row"><strong>Substack tags:</strong> ${tagRow}</div>
      <div class="tags-row"><strong>Medium tags (pick 5):</strong> ${mTagRow}</div>
    </div>
  `;
}

function buildCalendarTable() {
  return `
    <table class="calendar">
      <thead><tr><th style="width:60px;">Week</th><th style="width:90px;">Pillar</th><th>Title</th><th style="width:80px;">Post</th></tr></thead>
      <tbody>
      ${POSTS.map(
        (p, i) => `
        <tr>
          <td class="w">W${String(p.week).padStart(2, '0')}</td>
          <td><span class="pillar-chip ${pillarClass(p.pillar)}">${p.pillar.split(' ')[0]}</span></td>
          <td class="t">${p.title}</td>
          <td>#${String(i + 1).padStart(2, '0')}</td>
        </tr>
      `,
      ).join('')}
      </tbody>
    </table>
  `;
}

function buildCover(platform) {
  const label = platform === 'medium' ? 'MEDIUM LAUNCH PLAN' : 'SUBSTACK LAUNCH PLAN';
  const tint = platform === 'medium' ? '#1a7a4f' : '#D4A054';
  const titleTop = platform === 'medium' ? 'Medium' : 'Substack';
  return `
    <div class="cover">
      <div class="brand">
        <div class="brand-mark" style="background: linear-gradient(135deg, ${tint}, #A67A3C);">S</div>
        <div>SZL HOLDINGS · SZL COMMAND</div>
      </div>
      <div class="eyebrow">${label} · Q1 · COPY-PASTE READY</div>
      <h1 class="title">The <em>${titleTop}</em> launch kit for SZL Command.</h1>
      <div class="sub">Positioning, 90-day calendar, 24 fully drafted essays, welcome flow, growth plan, monetization, KPIs, and setup checklist — everything needed to publish from day one.</div>
      <div class="footer">
        <div class="meta">Prepared for <span>SZL Holdings</span> · Internal use · Version 1.0</div>
        <div>${new Date().toISOString().slice(0, 10)}</div>
      </div>
    </div>
  `;
}

function buildTocPage(platform) {
  const sections = [
    { t: 'Positioning, Audience & Voice', p: '03' },
    { t: 'Publication Identity & Bio', p: '05' },
    { t: 'About Page (copy-paste)', p: '07' },
    { t: 'Visual Identity Direction', p: '09' },
    { t: 'Editorial Pillars & Share Mix', p: '11' },
    { t: '90-Day Editorial Calendar (24 essays)', p: '12' },
    { t: 'Welcome Email / First Issue', p: '14' },
    { t: 'Full Essay Library — all 24 posts, fully drafted', p: '15' },
    { t: 'Growth Plan & Cross-posting Strategy', p: '—' },
    { t: 'LinkedIn & X Amplification Templates', p: '—' },
    { t: 'Monetization Plan & Founding-Member Offer', p: '—' },
    { t: 'KPIs & Tracking Sheet Specification', p: '—' },
    {
      t: `${platform === 'medium' ? 'Medium' : 'Substack'} Setup Checklist (step-by-step)`,
      p: '—',
    },
  ];
  return `
    <div class="page toc">
      <span class="section-eyebrow">Contents</span>
      <h1>${platform === 'medium' ? 'Medium' : 'Substack'} Launch Plan</h1>
      <p style="color:var(--text-3);max-width:640px;">Everything needed to launch SZL Command on ${platform === 'medium' ? 'Medium' : 'Substack'}, in order. Every section is copy-paste ready. Pair this document with the Newsletter Screenshots zip for mockups and reference captures.</p>
      <ol>
        ${sections.map((s) => `<li><span class="tl">${s.t}</span><span class="tp">${s.p}</span></li>`).join('')}
      </ol>
    </div>
  `;
}

function buildPositioningPage() {
  return `
    <div class="page">
      <span class="section-eyebrow">Section 01 · Positioning</span>
      <h1>Positioning, audience & voice.</h1>
      <p style="font-size:12pt;color:var(--text);max-width:720px;">${STRAT.POSITIONING.oneLine}</p>
      <h2>Target audiences</h2>
      ${STRAT.POSITIONING.audiences
        .map(
          (a) => `
        <div class="panel">
          <h3>${a.name}</h3>
          <p>${a.description}</p>
          <p style="margin:0;"><strong>What we publish for them:</strong> ${a.posts.join(' · ')}</p>
        </div>
      `,
        )
        .join('')}
      <h2>Voice</h2>
      <ul>
        <li><strong>Direct and specific.</strong> Named products, named markets, named mistakes. No hedging for optics.</li>
        <li><strong>Operator-first.</strong> Every essay is written for someone who could deploy the insight on Monday.</li>
        <li><strong>Numeric when possible, explicit when not.</strong> Real metrics labeled as real; aspirational numbers labeled as such.</li>
        <li><strong>Calm.</strong> No exclamation points, no hype, no "game-changer" vocabulary.</li>
        <li><strong>Seventh-grade readable, graduate-level substance.</strong> Shortest sentence that carries the load.</li>
      </ul>
    </div>
  `;
}

function buildIdentityPage() {
  return `
    <div class="page">
      <span class="section-eyebrow">Section 02 · Identity</span>
      <h1>Publication identity.</h1>
      <div class="panel">
        <h3>Publication name</h3>
        <p style="font-size:14pt;color:var(--gold);font-family:'Space Grotesk',sans-serif;font-weight:600;margin-bottom:6px;">${STRAT.POSITIONING.pubName}</p>
        <p style="margin:0;color:var(--text-3);">szlcommand.substack.com · @szlcommand (X) · SZL Command (LinkedIn page)</p>
      </div>
      <div class="panel">
        <h3>Tagline</h3>
        <p style="font-size:12pt;">${STRAT.POSITIONING.tagline}</p>
      </div>
      <div class="panel">
        <h3>Short bio (for profile fields, Twitter, LinkedIn)</h3>
        <p>${STRAT.POSITIONING.bio.short}</p>
      </div>
      <div class="panel">
        <h3>Long bio (for About page opener)</h3>
        ${mdToHtml(STRAT.POSITIONING.bio.long)}
      </div>
    </div>
    <div class="page">
      <span class="section-eyebrow">Section 03 · About page</span>
      <h1>About page — paste verbatim.</h1>
      ${mdToHtml(STRAT.POSITIONING.aboutPage)}
    </div>
  `;
}

function buildVisualIdentityPage() {
  return `
    <div class="page">
      <span class="section-eyebrow">Section 04 · Visual identity</span>
      <h1>Visual direction.</h1>
      <p>Palette: <strong>${STRAT.VISUAL_IDENTITY.paletteName}</strong>. Dark-first, gold as signal.</p>
      <div class="palette">${buildSwatches()}</div>
      <h2>Typography</h2>
      <div class="panel">
        <p><strong>Display:</strong> ${STRAT.VISUAL_IDENTITY.typography.display}</p>
        <p><strong>Body:</strong> ${STRAT.VISUAL_IDENTITY.typography.body}</p>
        <p><strong>Mono:</strong> ${STRAT.VISUAL_IDENTITY.typography.mono}</p>
        <p style="margin:0;"><strong>Exception:</strong> ${STRAT.VISUAL_IDENTITY.typography.serifException}</p>
      </div>
      <h2>Cover image direction</h2>
      ${mdToHtml(STRAT.VISUAL_IDENTITY.coverImageDirection)}
      <h2>UI principles</h2>
      <ul>
        ${STRAT.VISUAL_IDENTITY.uiPrinciples.map((p) => `<li>${p}</li>`).join('')}
      </ul>
    </div>
  `;
}

function buildPillarsAndCalendarPage() {
  return `
    <div class="page">
      <span class="section-eyebrow">Section 05 · Pillars</span>
      <h1>Editorial pillars.</h1>
      <p>${STRAT.EDITORIAL_CALENDAR_NOTES}</p>
      <table>
        <thead><tr><th>#</th><th>Pillar</th><th>Share</th><th>Signal color</th></tr></thead>
        <tbody>
          ${STRAT.PILLARS.map(
            (p) => `
            <tr>
              <td>${p.id}</td>
              <td><span class="pillar-chip ${pillarClass(p.name)}">${p.name}</span></td>
              <td>${Math.round(p.share * 100)}%</td>
              <td>${p.color}</td>
            </tr>
          `,
          ).join('')}
        </tbody>
      </table>
    </div>
    <div class="page">
      <span class="section-eyebrow">Section 06 · 90-day editorial calendar</span>
      <h1>90-day calendar.</h1>
      <p>Two essays per week · 12 weeks · 24 full drafts included (Section 08).</p>
      ${buildCalendarTable()}
    </div>
  `;
}

function buildWelcomeEmailPage() {
  return `
    <div class="page">
      <span class="section-eyebrow">Section 07 · Welcome email</span>
      <h1>Welcome email / first issue.</h1>
      <div class="panel">
        <h3>Subject</h3>
        <p style="margin:0;color:var(--text);">${STRAT.WELCOME_EMAIL.subject}</p>
      </div>
      <div class="panel">
        <h3>Preview text</h3>
        <p style="margin:0;color:var(--text);">${STRAT.WELCOME_EMAIL.preview}</p>
      </div>
      <div class="panel">
        <h3>Body (copy-paste)</h3>
        ${mdToHtml(STRAT.WELCOME_EMAIL.bodyMarkdown)}
      </div>
    </div>
  `;
}

function buildGrowthAndMoreSections(platform) {
  const checklist = platform === 'medium' ? STRAT.MEDIUM_CHECKLIST : STRAT.SUBSTACK_CHECKLIST;
  return `
    <div class="page">
      <span class="section-eyebrow">Section 09 · Growth plan</span>
      <h1>Growth plan.</h1>
      <h2>Cross-posting strategy</h2>
      <ul>${STRAT.GROWTH_PLAN.crossPosting.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h2>Amplification rhythm</h2>
      <ul>${STRAT.GROWTH_PLAN.amplification.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h2>GitHub / portfolio wiring</h2>
      <ul>${STRAT.GROWTH_PLAN.github.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h2>Partner cross-promos</h2>
      <ul>${STRAT.GROWTH_PLAN.partnerCrossPromos.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h2>Paid tier pricing</h2>
      <div class="panel">
        <p><strong>Free:</strong> ${STRAT.GROWTH_PLAN.paidTierPricing.free}</p>
        <p><strong>Paid:</strong> ${STRAT.GROWTH_PLAN.paidTierPricing.paid}</p>
        <p><strong>Founding member:</strong> ${STRAT.GROWTH_PLAN.paidTierPricing.foundingMember}</p>
        <p style="margin:0;"><strong>Launch offer:</strong> ${STRAT.GROWTH_PLAN.paidTierPricing.launchOffer}</p>
      </div>
    </div>
    <div class="page">
      <span class="section-eyebrow">Section 10 · Amplification templates</span>
      <h1>LinkedIn & X templates.</h1>
      <h2>LinkedIn short-form template</h2>
      <div class="panel"><pre style="white-space:pre-wrap;font-family:'JetBrains Mono',monospace;font-size:9pt;color:var(--text-2);margin:0;">${STRAT.LINKEDIN_TEMPLATE.replace(/</g, '&lt;')}</pre></div>
      <h2>X thread template</h2>
      <div class="panel"><pre style="white-space:pre-wrap;font-family:'JetBrains Mono',monospace;font-size:9pt;color:var(--text-2);margin:0;">${STRAT.X_TEMPLATE.replace(/</g, '&lt;')}</pre></div>
    </div>
    <div class="page">
      <span class="section-eyebrow">Section 11 · Monetization</span>
      <h1>Monetization plan.</h1>
      <h2>Free vs paid</h2>
      <div class="panel">
        <p><strong>Free tier:</strong> ${STRAT.MONETIZATION.freeVsPaid.free}</p>
        <p style="margin:0;"><strong>Paid tier includes:</strong></p>
        <ul>${STRAT.MONETIZATION.freeVsPaid.paid.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>
      <h2>Founding-member offer</h2>
      <div class="panel">
        <p><strong>Price:</strong> ${STRAT.MONETIZATION.foundingMemberOffer.price}</p>
        <p><strong>Cap:</strong> ${STRAT.MONETIZATION.foundingMemberOffer.cap}</p>
        <ul>${STRAT.MONETIZATION.foundingMemberOffer.benefits.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>
      <h2>Consulting funnel tie-in</h2>
      ${mdToHtml(STRAT.MONETIZATION.consultingFunnel)}
      <h2>Revenue mix target</h2>
      <table>
        <thead><tr><th>Stream</th><th>Year 1</th><th>Year 3</th></tr></thead>
        <tbody>
          ${Object.keys(STRAT.MONETIZATION.revenueMix.year1)
            .map(
              (k) =>
                `<tr><td>${k}</td><td>${STRAT.MONETIZATION.revenueMix.year1[k]}</td><td>${STRAT.MONETIZATION.revenueMix.year3[k]}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="page">
      <span class="section-eyebrow">Section 12 · KPIs & tracking</span>
      <h1>KPIs & tracking sheet spec.</h1>
      <h2>Subscriber targets</h2>
      <table>
        <thead><tr><th>Milestone</th><th>Free</th><th>Paid</th></tr></thead>
        <tbody>
          <tr><td>Month 1</td><td colspan="2">${STRAT.KPIS.subscribers.month1}</td></tr>
          <tr><td>Month 3</td><td colspan="2">${STRAT.KPIS.subscribers.month3}</td></tr>
          <tr><td>Month 6</td><td colspan="2">${STRAT.KPIS.subscribers.month6}</td></tr>
          <tr><td>Month 12</td><td colspan="2">${STRAT.KPIS.subscribers.month12}</td></tr>
        </tbody>
      </table>
      <h2>Engagement targets</h2>
      <div class="panel">
        <p><strong>Open rate:</strong> ${STRAT.KPIS.openRate.target} Minimum: ${STRAT.KPIS.openRate.minimum}</p>
        <p><strong>Clickthrough:</strong> ${STRAT.KPIS.clickthrough}</p>
        <p><strong>Free→Paid conversion:</strong> ${STRAT.KPIS.paidConversion}</p>
        <p style="margin:0;"><strong>Paid churn:</strong> ${STRAT.KPIS.churn}</p>
      </div>
      <h2>Inbound pipeline targets</h2>
      <div class="panel">
        <p><strong>Month 1:</strong> ${STRAT.KPIS.inboundLeads.month1}</p>
        <p><strong>Month 3:</strong> ${STRAT.KPIS.inboundLeads.month3}</p>
        <p style="margin:0;"><strong>Month 12:</strong> ${STRAT.KPIS.inboundLeads.month12}</p>
      </div>
      <h2>Tracking sheet columns (paste into Google Sheets)</h2>
      <div class="panel">
        <pre style="white-space:pre-wrap;font-family:'JetBrains Mono',monospace;font-size:9pt;color:var(--text-2);margin:0;">${STRAT.KPIS.trackingSheetSpec.columns.join('\t')}</pre>
      </div>
      <p style="margin-top:8px;"><strong>Cadence:</strong> ${STRAT.KPIS.trackingSheetSpec.cadence}</p>
    </div>
    <div class="page">
      <span class="section-eyebrow">Section 13 · Setup checklist</span>
      <h1>${platform === 'medium' ? 'Medium' : 'Substack'} setup checklist.</h1>
      <p>Step-by-step launch checklist. Follow in order.</p>
      ${checklist
        .map(
          (c) => `
        <div class="panel">
          <h3 style="margin:0 0 6px;"><span style="font-family:'JetBrains Mono',monospace;color:var(--gold);font-size:9pt;">STEP ${String(c.step).padStart(2, '0')}</span> · ${c.task}</h3>
          <p style="margin:0;">${c.detail}</p>
        </div>
      `,
        )
        .join('')}
    </div>
  `;
}

function buildLibraryIntro(platform) {
  const plat = platform === 'medium' ? 'Medium' : 'Substack';
  const other = platform === 'medium' ? 'Substack' : 'Medium';
  return `
    <div class="page">
      <span class="section-eyebrow">Section 08 · Full essay library</span>
      <h1>24 fully drafted essays.</h1>
      <p>Every essay below is copy-paste ready. Order matches the 90-day calendar (two posts per week for twelve weeks).</p>
      <div class="callout">
        <h4>${plat} usage notes</h4>
        <p style="margin:0;">Each essay carries two tag rows at the end: <strong>Substack tags</strong> (shorter, lowercase, 3–5) and <strong>Medium tags</strong> (pick any 5). ${
          platform === 'medium'
            ? 'When cross-posting from Substack, set the Medium canonical URL to the Substack original and publish 24 hours after the Substack version.'
            : 'Publish on Substack first; cross-post to Medium 24 hours later with canonical pointing back to the Substack URL.'
        } The ${other} version of this kit handles the inverse.</p>
      </div>
      <p style="color:var(--text-3);font-family:'JetBrains Mono',monospace;font-size:8.5pt;letter-spacing:0.1em;text-transform:uppercase;">Continue to Essay 01 →</p>
    </div>
  `;
}

function buildPdfHtml(platform) {
  const coverCss = `<html><head>${PDF_STYLES}</head><body>`;
  const body = [
    buildCover(platform),
    buildTocPage(platform),
    buildPositioningPage(),
    buildIdentityPage(),
    buildVisualIdentityPage(),
    buildPillarsAndCalendarPage(),
    buildWelcomeEmailPage(),
    buildLibraryIntro(platform),
    ...POSTS.map((p, i) => buildPostHtml(p, i)),
    buildGrowthAndMoreSections(platform),
  ].join('\n');
  return `${coverCss}${body}</body></html>`;
}

// ────────────────────────────────────────────────
// MOCKUP TEMPLATES (each produces a PNG)
// ────────────────────────────────────────────────
const MOCKUP_COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+Pro:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f4f1ea; }
`;

function mockupSubstackHome() {
  return `
  <html><head><style>
    ${MOCKUP_COMMON_CSS}
    body { background: #f6f3ec; color: #1a1a1a; }
    .browser { width: 100%; height: 100vh; display: flex; flex-direction: column; }
    .bar { height: 40px; background: #e8e3d7; display: flex; align-items: center; padding: 0 16px; gap: 8px; border-bottom: 1px solid #d4cfc1; }
    .bar .dot { width: 11px; height: 11px; border-radius: 50%; background: #d0cbbd; }
    .bar .url { margin-left: 18px; background: #fff; border: 1px solid #d4cfc1; border-radius: 6px; padding: 4px 12px; font-family: 'JetBrains Mono', mono; font-size: 11px; color: #555; flex: 1; max-width: 600px; }
    .nav { display: flex; align-items: center; justify-content: space-between; padding: 12px 40px; background: #fff; border-bottom: 1px solid #e8e3d7; }
    .nav .left { display: flex; align-items: center; gap: 14px; }
    .nav .mark { width: 32px; height: 32px; border-radius: 7px; background: linear-gradient(135deg,#D4A054,#A67A3C); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; }
    .nav .pub { font-family: 'Space Grotesk'; font-weight: 600; font-size: 15px; color: #1a1a1a; }
    .nav .menu { display: flex; gap: 28px; font-size: 13px; color: #555; font-weight: 500; }
    .nav .sub { background: #D4A054; color: #fff; padding: 7px 18px; border-radius: 6px; font-weight: 600; font-size: 13px; border: none; }

    .hero { background: linear-gradient(180deg, #060912 0%, #0a0f1e 100%); padding: 70px 40px 80px; position: relative; overflow: hidden; color: #fff; }
    .hero::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 40px 40px; }
    .hero::after { content: ""; position: absolute; right: -200px; top: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(212,160,84,0.25), transparent 60%); }
    .hero-inner { position: relative; max-width: 920px; margin: 0 auto; }
    .brand-row { display: flex; align-items: center; gap: 12px; color: #D4A054; font-family: 'JetBrains Mono', mono; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 32px; }
    .hero h1 { font-family: 'Space Grotesk'; font-size: 62px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.03; max-width: 780px; }
    .hero h1 em { color: #D4A054; font-style: normal; }
    .hero .tag { margin-top: 22px; font-size: 19px; color: #C7CCD6; max-width: 680px; line-height: 1.4; }
    .hero form { margin-top: 38px; display: flex; gap: 10px; max-width: 520px; }
    .hero input { flex: 1; padding: 14px 16px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; font-family: 'Inter'; }
    .hero button { padding: 14px 26px; border-radius: 7px; border: none; background: #D4A054; color: #1a1208; font-weight: 700; font-family: 'Space Grotesk'; font-size: 14px; letter-spacing: 0.02em; }
    .hero .social { margin-top: 14px; font-size: 12px; color: #8A92A3; font-family: 'JetBrains Mono', mono; letter-spacing: 0.1em; }

    .featured { max-width: 980px; margin: 60px auto; padding: 0 40px; }
    .eyebrow { font-family: 'JetBrains Mono', mono; font-size: 11px; color: #D4A054; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 22px; }
    .post-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 22px; }
    .post-card { background: #fff; border: 1px solid #e8e3d7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .post-card .img { height: 150px; background: linear-gradient(135deg, #0a0f1e, #1a2340); position: relative; }
    .post-card .img.a { background: linear-gradient(135deg, #0a0f1e 0%, #1e3a72 100%); }
    .post-card .img.b { background: linear-gradient(135deg, #060912 0%, #0e4a5c 100%); }
    .post-card .img.c { background: linear-gradient(135deg, #060912 0%, #1d5240 100%); }
    .post-card .img::after { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
    .post-card .img .mark { position: absolute; top: 14px; left: 14px; width: 26px; height: 26px; border-radius: 5px; background: linear-gradient(135deg,#D4A054,#A67A3C); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; font-size: 13px; }
    .post-card .img .pillar { position: absolute; bottom: 14px; left: 14px; font-family: 'JetBrains Mono', mono; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #D4A054; border: 1px solid rgba(212,160,84,0.5); padding: 3px 8px; border-radius: 999px; }
    .post-card .body { padding: 18px 20px 22px; }
    .post-card h3 { font-family: 'Space Grotesk'; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; color: #1a1a1a; margin-bottom: 9px; }
    .post-card p { font-size: 13px; color: #555; line-height: 1.5; }
    .post-card .meta { margin-top: 14px; font-size: 11px; color: #888; font-family: 'JetBrains Mono', mono; letter-spacing: 0.08em; }

    .recent { max-width: 980px; margin: 50px auto 60px; padding: 0 40px; }
    .recent-row { display: flex; gap: 18px; padding: 18px 0; border-bottom: 1px solid #e8e3d7; }
    .recent-row .chip { width: 70px; flex-shrink: 0; font-family: 'JetBrains Mono', mono; font-size: 10px; letter-spacing: 0.1em; color: #D4A054; text-transform: uppercase; }
    .recent-row h4 { font-family: 'Space Grotesk'; font-size: 17px; color: #1a1a1a; font-weight: 500; }
    .recent-row p { font-size: 13px; color: #666; margin-top: 3px; }
    .recent-row .date { font-family: 'JetBrains Mono', mono; font-size: 11px; color: #999; flex-shrink: 0; }
  </style></head><body>
    <div class="browser">
      <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="url">szlcommand.substack.com</div></div>
      <div class="nav">
        <div class="left"><div class="mark">S</div><div class="pub">SZL Command</div></div>
        <div class="menu"><span>Home</span><span>Archive</span><span>Pillars</span><span>About</span></div>
        <button class="sub">Subscribe</button>
      </div>
      <div class="hero"><div class="hero-inner">
        <div class="brand-row"><span>SZL HOLDINGS</span><span>·</span><span>NEWSLETTER</span></div>
        <h1>Command platforms, <em>written in public.</em></h1>
        <div class="tag">Inside the build of SZL Holdings — a portfolio of AI-native command platforms for defense, maritime, real estate, legal, and advisory. Two essays a week, six pillars, no fluff.</div>
        <form><input placeholder="your@email.com" value="" /><button>Subscribe</button></form>
        <div class="social">12,847 SUBSCRIBERS · 4 PAID TIER PLANS AVAILABLE</div>
      </div></div>
      <div class="featured">
        <div class="eyebrow">Latest essays</div>
        <div class="post-grid">
          <div class="post-card"><div class="img a"><div class="mark">S</div><div class="pillar">Defense</div></div><div class="body"><h3>Inside Aegis: Building a Command Surface for Modern Defense</h3><p>What it takes to ship software that survives accreditation, briefings, and 3am alerts.</p><div class="meta">APR 16 · 9 MIN READ</div></div></div>
          <div class="post-card"><div class="img b"><div class="mark">S</div><div class="pillar">Maritime</div></div><div class="body"><h3>The Shipping Industry Is a Software Desert</h3><p>90% of global trade runs on software built before the iPhone. Vessels is the correction.</p><div class="meta">APR 12 · 7 MIN READ</div></div></div>
          <div class="post-card"><div class="img c"><div class="mark">S</div><div class="pillar">Real Estate</div></div><div class="body"><h3>Inside Terra: Real Estate Intelligence for the Next Decade</h3><p>The operators who win the next cycle will have data surfaces the incumbents can't match.</p><div class="meta">APR 09 · 8 MIN READ</div></div></div>
        </div>
      </div>
      <div class="recent">
        <div class="eyebrow">Recent posts</div>
        <div class="recent-row"><div class="chip">AI ENG</div><div style="flex:1"><h4>Evals Are the Product</h4><p>Why the eval harness is the most underrated piece of any production AI system.</p></div><div class="date">APR 05</div></div>
        <div class="recent-row"><div class="chip">AI ENG</div><div style="flex:1"><h4>The Case for Vertical Command Platforms</h4><p>Horizontal AI is eating itself. The next decade belongs to operator-grade command surfaces.</p></div><div class="date">APR 02</div></div>
        <div class="recent-row"><div class="chip">FOUNDER</div><div style="flex:1"><h4>Why I'm Building SZL Holdings in Public</h4><p>A command-platform group for defense, maritime, real estate, and the AI layer underneath all of it.</p></div><div class="date">MAR 29</div></div>
      </div>
    </div>
  </body></html>`;
}

function mockupSubstackAbout() {
  return `<html><head><style>
    ${MOCKUP_COMMON_CSS}
    body { background: #f6f3ec; color: #1a1a1a; }
    .bar { height: 40px; background: #e8e3d7; display: flex; align-items: center; padding: 0 16px; gap: 8px; border-bottom: 1px solid #d4cfc1; }
    .bar .dot { width: 11px; height: 11px; border-radius: 50%; background: #d0cbbd; }
    .bar .url { margin-left: 18px; background: #fff; border: 1px solid #d4cfc1; border-radius: 6px; padding: 4px 12px; font-family: 'JetBrains Mono'; font-size: 11px; color: #555; flex: 1; max-width: 600px; }
    .nav { padding: 12px 40px; background: #fff; border-bottom: 1px solid #e8e3d7; display: flex; justify-content: space-between; align-items: center; }
    .mark { width: 32px; height: 32px; border-radius: 7px; background: linear-gradient(135deg,#D4A054,#A67A3C); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; }
    .nav .left { display: flex; gap: 14px; align-items: center; } .nav .pub { font-family: 'Space Grotesk'; font-weight: 600; font-size: 15px; }
    .nav .sub { background: #D4A054; color: #fff; padding: 7px 18px; border-radius: 6px; font-weight: 600; font-size: 13px; border: none; }

    .hdr { background: linear-gradient(180deg, #060912 0%, #0a0f1e 100%); padding: 60px 40px 60px; color: #fff; position: relative; overflow: hidden; }
    .hdr::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 40px 40px; }
    .hdr-in { position: relative; max-width: 780px; margin: 0 auto; }
    .hdr .eye { font-family: 'JetBrains Mono'; font-size: 11px; color: #D4A054; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 16px; }
    .hdr h1 { font-family: 'Space Grotesk'; font-size: 54px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; }
    .hdr h1 em { color: #D4A054; font-style: normal; }
    .hdr .sub { margin-top: 18px; font-size: 18px; color: #C7CCD6; line-height: 1.4; max-width: 640px; }

    .content { max-width: 780px; margin: 50px auto 80px; padding: 0 40px; }
    .content h2 { font-family: 'Space Grotesk'; color: #1a1a1a; font-size: 26px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; letter-spacing: -0.01em; }
    .content h3 { font-family: 'Space Grotesk'; color: #1a1a1a; font-size: 18px; font-weight: 600; margin-top: 22px; margin-bottom: 8px; }
    .content p, .content li { font-size: 16px; color: #333; line-height: 1.65; margin-bottom: 14px; }
    .content ul { padding-left: 22px; }
    .content .lede { font-family: 'Source Serif Pro', serif; font-size: 20px; line-height: 1.5; color: #1a1a1a; font-weight: 400; margin-bottom: 18px; }
    .card { background: #fff; border: 1px solid #e8e3d7; border-left: 4px solid #D4A054; padding: 20px 24px; border-radius: 6px; margin: 24px 0; }
    .card h3 { margin-top: 0; color: #D4A054; }
    .chip { display: inline-block; padding: 3px 10px; border-radius: 999px; font-family: 'JetBrains Mono'; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 6px 6px 0; border: 1px solid #d4cfc1; color: #555; background: #fff; }
  </style></head><body>
    <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="url">szlcommand.substack.com/about</div></div>
    <div class="nav"><div class="left"><div class="mark">S</div><div class="pub">SZL Command</div></div><button class="sub">Subscribe</button></div>
    <div class="hdr"><div class="hdr-in"><div class="eye">About this publication</div><h1>SZL Command is the writing home of the <em>SZL Holdings</em> build.</h1><div class="sub">Command platforms, written in public. Two long-form essays a week. Six pillars. No fluff.</div></div></div>
    <div class="content">
      <p class="lede">You just landed on a newsletter about building a portfolio of AI-native command platforms for defense, maritime, real estate, legal, and advisory — written by the founder, from inside the build.</p>
      <h2>What you'll get</h2>
      <ul>
        <li>Two long-form essays every week (Tuesday and Friday).</li>
        <li>Portfolio deep-dives, market-structure analysis, engineering essays, and a monthly investor-style update published in public.</li>
        <li>Quarterly state-of-market pieces covering defense, maritime, and real estate from an operator-tech perspective.</li>
        <li>Occasional interviews with operators, investors, and builders in adjacent spaces.</li>
      </ul>
      <h2>The six pillars</h2>
      <div>
        <span class="chip" style="color:#3B82F6;border-color:#3B82F6">Defense &amp; Intelligence</span>
        <span class="chip" style="color:#1D90D1;border-color:#1D90D1">Maritime</span>
        <span class="chip" style="color:#40856A;border-color:#40856A">Real Estate Intelligence</span>
        <span class="chip" style="color:#0FB3D4;border-color:#0FB3D4">AI Platform Engineering</span>
        <span class="chip" style="color:#D4A054;border-color:#D4A054">Founder Journey</span>
        <span class="chip" style="color:#3A63E0;border-color:#3A63E0">Portfolio Deep-Dives</span>
      </div>
      <div class="card"><h3>Paid tier</h3><p>Founding-member tier is open. Includes the quarterly investor-style memo, monthly office-hours call, private forum, and a founding-member badge. Every essay stays free — paid is for the <em>extras</em>, not the essentials.</p></div>
      <h2>Who this is for</h2>
      <p>Investors (vertical AI, industrial stack), enterprise buyers in defense / maritime / real-estate / legal, AI builders in regulated industries, and press covering the space. If you're one of those, you're the audience.</p>
    </div>
  </body></html>`;
}

function mockupSubstackWelcome() {
  return `<html><head><style>
    ${MOCKUP_COMMON_CSS}
    body { background: #e4e1d8; }
    .wrap { max-width: 640px; margin: 40px auto; background: #fff; box-shadow: 0 4px 30px rgba(0,0,0,0.08); border-radius: 6px; overflow: hidden; }
    .hdr { background: linear-gradient(180deg, #060912 0%, #0a0f1e 100%); padding: 46px 44px 44px; color: #fff; position: relative; overflow: hidden; }
    .hdr::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 36px 36px; }
    .hdr-in { position: relative; }
    .mark-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .mark { width: 34px; height: 34px; border-radius: 7px; background: linear-gradient(135deg,#D4A054,#A67A3C); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; font-size: 15px; }
    .mark-row .brand { font-family: 'Space Grotesk'; font-weight: 600; font-size: 14px; color: #D4A054; letter-spacing: 0.16em; text-transform: uppercase; }
    .hdr h1 { font-family: 'Space Grotesk'; font-size: 32px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; }
    .hdr h1 em { color: #D4A054; font-style: normal; }
    .hdr .preview { margin-top: 12px; color: #9CA3AF; font-size: 13px; font-family: 'JetBrains Mono'; letter-spacing: 0.06em; }
    .body { padding: 40px 44px 44px; color: #1a1a1a; }
    .body p { font-size: 15px; line-height: 1.65; color: #333; margin-bottom: 14px; }
    .body h3 { font-family: 'Space Grotesk'; font-size: 16px; margin-top: 22px; margin-bottom: 10px; color: #1a1a1a; font-weight: 600; }
    .body ol, .body ul { padding-left: 22px; margin-bottom: 14px; } .body li { font-size: 15px; color: #333; margin-bottom: 6px; line-height: 1.5; }
    .cta { background: #D4A054; color: #1a1208; display: inline-block; padding: 12px 22px; border-radius: 6px; font-weight: 700; font-family: 'Space Grotesk'; text-decoration: none; font-size: 14px; margin: 14px 0; letter-spacing: 0.02em; }
    .foot { border-top: 1px solid #e8e3d7; padding: 18px 44px; font-family: 'JetBrains Mono'; font-size: 11px; color: #999; letter-spacing: 0.08em; }
    .foot a { color: #D4A054; }
  </style></head><body>
    <div class="wrap">
      <div class="hdr"><div class="hdr-in">
        <div class="mark-row"><div class="mark">S</div><div class="brand">SZL COMMAND</div></div>
        <h1>Welcome to <em>SZL Command</em> — what's here, and what's next.</h1>
        <div class="preview">Two essays a week, six pillars, written from inside the build.</div>
      </div></div>
      <div class="body">
        <p>Hi — thanks for subscribing to <strong>SZL Command</strong>.</p>
        <p>You just bought a front-row seat on the build of SZL Holdings — a portfolio of AI-native command platforms for defense, maritime, real estate, legal, and advisory. Here's what you can expect.</p>
        <h3>The rhythm</h3>
        <ul>
          <li><strong>Tuesday</strong> — a long-form essay on one of the six pillars.</li>
          <li><strong>Friday</strong> — the second essay of the week.</li>
          <li><strong>Quarterly</strong> — an investor-style update, published in public.</li>
        </ul>
        <h3>Three places to start</h3>
        <ol>
          <li><strong>Why I'm Building SZL Holdings in Public</strong> — the founding post.</li>
          <li><strong>The Case for Vertical Command Platforms</strong> — the thesis.</li>
          <li><strong>Inside Aegis: Building a Command Surface for Modern Defense</strong> — the first product deep-dive.</li>
        </ol>
        <a href="#" class="cta">Read the archive →</a>
        <h3>One ask</h3>
        <p>Reply to this email and tell me one thing: which of the six pillars do you want me to prioritize in the next 30 days?</p>
        <p>— S</p>
      </div>
      <div class="foot">SZL COMMAND · <a href="#">szlcommand.substack.com</a> · UNSUBSCRIBE</div>
    </div>
  </body></html>`;
}

function mockupSubstackPost() {
  const post = POSTS[0];
  return `<html><head><style>
    ${MOCKUP_COMMON_CSS}
    body { background: #f6f3ec; color: #1a1a1a; }
    .bar { height: 40px; background: #e8e3d7; display: flex; align-items: center; padding: 0 16px; gap: 8px; border-bottom: 1px solid #d4cfc1; }
    .bar .dot { width: 11px; height: 11px; border-radius: 50%; background: #d0cbbd; }
    .bar .url { margin-left: 18px; background: #fff; border: 1px solid #d4cfc1; border-radius: 6px; padding: 4px 12px; font-family: 'JetBrains Mono'; font-size: 11px; color: #555; flex: 1; max-width: 640px; }
    .nav { padding: 12px 40px; background: #fff; border-bottom: 1px solid #e8e3d7; display: flex; justify-content: space-between; align-items: center; }
    .mark { width: 32px; height: 32px; border-radius: 7px; background: linear-gradient(135deg,#D4A054,#A67A3C); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; }
    .nav .left { display: flex; gap: 14px; align-items: center; } .nav .pub { font-family: 'Space Grotesk'; font-weight: 600; font-size: 15px; }
    .nav .sub { background: #D4A054; color: #fff; padding: 7px 18px; border-radius: 6px; font-weight: 600; font-size: 13px; border: none; }

    .cover { background: linear-gradient(180deg, #060912 0%, #0a0f1e 100%); padding: 70px 40px 90px; color: #fff; position: relative; overflow: hidden; }
    .cover::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 42px 42px; }
    .cover::after { content:""; position: absolute; right: -250px; top: -80px; width: 520px; height: 520px; background: radial-gradient(circle, rgba(212,160,84,0.28), transparent 60%); }
    .c-in { position: relative; max-width: 720px; margin: 0 auto; }
    .c-chip { display: inline-block; padding: 4px 12px; border-radius: 999px; font-family: 'JetBrains Mono'; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #D4A054; border: 1px solid rgba(212,160,84,0.5); margin-bottom: 18px; }
    .cover h1 { font-family: 'Space Grotesk'; font-size: 46px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.08; }
    .cover .sub { margin-top: 18px; font-size: 19px; color: #C7CCD6; line-height: 1.4; font-style: italic; }
    .cover .meta { margin-top: 24px; font-family: 'JetBrains Mono'; font-size: 11px; color: #8A92A3; letter-spacing: 0.1em; text-transform: uppercase; }

    .content { max-width: 680px; margin: -40px auto 80px; padding: 44px 50px 60px; background: #fff; border-radius: 8px; box-shadow: 0 2px 30px rgba(0,0,0,0.06); position: relative; }
    .content > p:first-of-type::first-letter { font-family: 'Space Grotesk'; font-size: 58px; font-weight: 600; float: left; color: #D4A054; line-height: 0.9; padding-right: 10px; padding-top: 5px; }
    .content p, .content li { font-family: 'Source Serif Pro', serif; font-size: 17px; line-height: 1.7; color: #1a1a1a; margin-bottom: 18px; }
    .content h2 { font-family: 'Space Grotesk'; font-size: 24px; margin-top: 32px; margin-bottom: 14px; color: #1a1a1a; font-weight: 600; letter-spacing: -0.01em; }
    .content strong { color: #0b1220; }
  </style></head><body>
    <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="url">szlcommand.substack.com/p/why-im-building-szl-in-public</div></div>
    <div class="nav"><div class="left"><div class="mark">S</div><div class="pub">SZL Command</div></div><button class="sub">Subscribe</button></div>
    <div class="cover"><div class="c-in">
      <div class="c-chip">${post.pillar}</div>
      <h1>${post.title}</h1>
      <div class="sub">${post.subtitle}</div>
      <div class="meta">S · MAR 29 · ${post.readTime} READ</div>
    </div></div>
    <div class="content">
      <p>I've spent the last few years building something that doesn't fit cleanly into a single category. It isn't a SaaS product. It isn't a consultancy. It isn't a fund. It's closer to what used to be called an <em>operating group</em> — a small portfolio of AI-native command platforms that share a spine.</p>
      <p>The holding company is called <strong>SZL Holdings</strong>. The platforms sit underneath it: <strong>Aegis</strong> for defense and intelligence, <strong>Vessels</strong> for maritime, <strong>Terra</strong> for real estate, <strong>Carlota Jo</strong> for executive advisory, <strong>Command Portal</strong> as the unified operator cockpit, <strong>CORTEX</strong> as the mobile surface, <strong>IMPERIUM</strong> as the governance layer, <strong>Forge</strong> for client delivery, <strong>Autopilot</strong> for agentic workflows, and <strong>Prism Counsel</strong> for legal and compliance tooling.</p>
      <h2>Why a newsletter, and why now</h2>
      <p>There are three reasons. First, the work is more legible when it's written down. Second, the people I want to meet read. Third, founders who build in public compound faster.</p>
      <p>This newsletter is where I'll write about building all of it — in public, in order, with the receipts.</p>
      <h2>What this newsletter is, concretely</h2>
      <p>Two posts a week. Tuesday and Friday. No fluff, no "thought leadership" that's really just a vendor pitch in a blazer.</p>
    </div>
  </body></html>`;
}

function mockupMediumPub() {
  return `<html><head><style>
    ${MOCKUP_COMMON_CSS}
    body { background: #fff; color: #242424; }
    .nav { border-bottom: 1px solid #f2f2f2; padding: 14px 44px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-family: 'Source Serif Pro', serif; font-weight: 700; font-size: 24px; letter-spacing: -0.02em; }
    .nav .right { display: flex; align-items: center; gap: 20px; font-size: 14px; color: #6b6b6b; }
    .nav .upg { background: #1a8917; color: #fff; padding: 7px 15px; border-radius: 999px; font-size: 13px; border: none; }

    .bar { height: 36px; background: #efefef; display: flex; align-items: center; padding: 0 14px; gap: 8px; border-bottom: 1px solid #e0e0e0; }
    .bar .dot { width: 10px; height: 10px; border-radius: 50%; background: #ccc; }
    .bar .url { margin-left: 18px; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 3px 12px; font-family: 'JetBrains Mono'; font-size: 11px; color: #555; flex: 1; max-width: 580px; }

    .pub-hero { background: linear-gradient(180deg, #060912 0%, #0a0f1e 100%); padding: 72px 44px 60px; color: #fff; position: relative; overflow: hidden; }
    .pub-hero::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 42px 42px; }
    .pub-in { position: relative; max-width: 1080px; margin: 0 auto; display: flex; align-items: center; gap: 38px; }
    .pub-mark { width: 110px; height: 110px; border-radius: 16px; background: linear-gradient(135deg,#D4A054,#A67A3C); display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; font-size: 54px; color:#1a1208; flex-shrink: 0; box-shadow: 0 8px 40px rgba(212,160,84,0.4); }
    .pub-in h1 { font-family: 'Space Grotesk'; font-size: 48px; font-weight: 600; letter-spacing: -0.02em; }
    .pub-in .tag { margin-top: 10px; font-size: 17px; color: #C7CCD6; max-width: 620px; line-height: 1.5; }
    .pub-in .stats { margin-top: 16px; font-family: 'JetBrains Mono'; font-size: 12px; color: #D4A054; letter-spacing: 0.12em; text-transform: uppercase; }

    .tabs { border-bottom: 1px solid #f2f2f2; background: #fff; padding: 0 44px; display: flex; gap: 32px; }
    .tab { padding: 16px 0; font-size: 14px; color: #6b6b6b; position: relative; } .tab.active { color: #242424; font-weight: 500; } .tab.active::after { content:""; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px; background: #242424; }

    .feed { max-width: 1080px; margin: 44px auto; padding: 0 44px; }
    .eye { font-family: 'JetBrains Mono'; font-size: 11px; color: #D4A054; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 14px; }

    .article-row { display: grid; grid-template-columns: 1fr 200px; gap: 30px; padding: 28px 0; border-bottom: 1px solid #f2f2f2; }
    .art-body h2 { font-family: 'Source Serif Pro', serif; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; color: #242424; }
    .art-body .dek { font-size: 15px; color: #6b6b6b; margin-top: 6px; line-height: 1.45; }
    .art-meta { margin-top: 12px; font-size: 13px; color: #6b6b6b; display: flex; gap: 10px; align-items: center; }
    .art-meta .author { display: flex; align-items: center; gap: 6px; } .art-meta .avatar { width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg,#D4A054,#A67A3C); }
    .art-meta .tag { background: #f2f2f2; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
    .art-img { background: linear-gradient(135deg,#060912,#1a2340); border-radius: 4px; position: relative; overflow: hidden; }
    .art-img.a { background: linear-gradient(135deg,#060912,#1e3a72); }
    .art-img.b { background: linear-gradient(135deg,#060912,#0e4a5c); }
    .art-img.c { background: linear-gradient(135deg,#060912,#1d5240); }
    .art-img::after { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 24px 24px; }
    .art-img .pillar { position: absolute; bottom: 10px; left: 10px; font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #D4A054; border: 1px solid rgba(212,160,84,0.5); padding: 2px 7px; border-radius: 999px; }
  </style></head><body>
    <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="url">medium.com/szl-command</div></div>
    <div class="nav"><div class="logo">Medium</div><div class="right"><span>Write</span><span>Notifications</span><button class="upg">Member benefits</button></div></div>
    <div class="pub-hero"><div class="pub-in">
      <div class="pub-mark">S</div>
      <div><h1>SZL Command</h1><div class="tag">Inside the build of SZL Holdings — a portfolio of AI-native command platforms for defense, maritime, real estate, legal, and advisory.</div><div class="stats">12.8K FOLLOWERS · 24 STORIES · MEMBER OF MEDIUM PARTNER PROGRAM</div></div>
    </div></div>
    <div class="tabs"><div class="tab active">Home</div><div class="tab">Defense</div><div class="tab">Maritime</div><div class="tab">Real Estate</div><div class="tab">AI Engineering</div><div class="tab">Founder</div><div class="tab">Portfolio</div><div class="tab">About</div></div>
    <div class="feed">
      <div class="eye">Latest</div>
      <div class="article-row"><div class="art-body"><h2>Inside Aegis: Building a Command Surface for Modern Defense</h2><div class="dek">What it takes to ship software that survives accreditation, briefings, and 3am alerts.</div><div class="art-meta"><span class="author"><span class="avatar"></span>S in SZL Command</span>·<span>Apr 16</span>·<span>9 min read</span>·<span class="tag">Defense Technology</span></div></div><div class="art-img a"><div class="pillar">Defense</div></div></div>
      <div class="article-row"><div class="art-body"><h2>The Shipping Industry Is a Software Desert</h2><div class="dek">90% of global trade runs on software built before the iPhone. Vessels is the correction.</div><div class="art-meta"><span class="author"><span class="avatar"></span>S in SZL Command</span>·<span>Apr 12</span>·<span>7 min read</span>·<span class="tag">Maritime</span></div></div><div class="art-img b"><div class="pillar">Maritime</div></div></div>
      <div class="article-row"><div class="art-body"><h2>Inside Terra: Real Estate Intelligence for the Next Decade</h2><div class="dek">The operators who win the next cycle will have data surfaces the incumbents can't match.</div><div class="art-meta"><span class="author"><span class="avatar"></span>S in SZL Command</span>·<span>Apr 09</span>·<span>8 min read</span>·<span class="tag">Real Estate</span></div></div><div class="art-img c"><div class="pillar">Real Estate</div></div></div>
      <div class="article-row"><div class="art-body"><h2>Evals Are the Product</h2><div class="dek">Why the eval harness is the most underrated piece of any production AI system.</div><div class="art-meta"><span class="author"><span class="avatar"></span>S in SZL Command</span>·<span>Apr 05</span>·<span>7 min read</span>·<span class="tag">Artificial Intelligence</span></div></div><div class="art-img"><div class="pillar">AI Engineering</div></div></div>
    </div>
  </body></html>`;
}

function mockupMediumArticle() {
  const post = POSTS[2];
  return `<html><head><style>
    ${MOCKUP_COMMON_CSS}
    body { background: #fff; color: #242424; font-family: 'Source Serif Pro', serif; }
    .bar { height: 36px; background: #efefef; display: flex; align-items: center; padding: 0 14px; gap: 8px; border-bottom: 1px solid #e0e0e0; }
    .bar .dot { width: 10px; height: 10px; border-radius: 50%; background: #ccc; }
    .bar .url { margin-left: 18px; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 3px 12px; font-family: 'JetBrains Mono'; font-size: 11px; color: #555; flex: 1; max-width: 600px; }
    .nav { border-bottom: 1px solid #f2f2f2; padding: 14px 44px; display: flex; justify-content: space-between; align-items: center; font-family: 'Inter', sans-serif; }
    .logo { font-family: 'Source Serif Pro', serif; font-weight: 700; font-size: 24px; letter-spacing: -0.02em; }
    .nav .upg { background: #1a8917; color: #fff; padding: 7px 15px; border-radius: 999px; font-size: 13px; border: none; }

    .pub-bar { max-width: 720px; margin: 44px auto 0; padding: 0 24px; display: flex; align-items: center; gap: 10px; font-family: 'Inter', sans-serif; }
    .pub-mark { width: 36px; height: 36px; border-radius: 7px; background: linear-gradient(135deg,#D4A054,#A67A3C); display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk'; font-weight: 700; color:#1a1208; }
    .pub-bar .pub { font-size: 14px; color: #6b6b6b; } .pub-bar .pub strong { color: #242424; font-weight: 500; }
    .pub-bar .follow { margin-left: auto; background: #242424; color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 13px; border: none; }

    .article { max-width: 720px; margin: 24px auto 0; padding: 0 24px; }
    .article h1 { font-family: 'Source Serif Pro', serif; font-size: 42px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.15; color: #242424; }
    .article h2 { font-family: 'Source Serif Pro', serif; font-size: 26px; margin-top: 34px; margin-bottom: 12px; color: #242424; font-weight: 700; letter-spacing: -0.01em; }
    .article .dek { font-size: 22px; color: #6b6b6b; margin-top: 14px; line-height: 1.4; font-weight: 400; }
    .byline { margin-top: 26px; display: flex; align-items: center; gap: 12px; font-family: 'Inter', sans-serif; }
    .byline .avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#D4A054,#A67A3C); display:flex;align-items:center;justify-content:center;color:#1a1208;font-family:'Space Grotesk';font-weight: 700; }
    .byline .name { font-size: 14px; color: #242424; font-weight: 500; }
    .byline .meta { font-size: 13px; color: #6b6b6b; }
    .hero-img { margin-top: 26px; height: 340px; background: linear-gradient(135deg,#060912,#1e3a72); border-radius: 2px; position: relative; overflow: hidden; }
    .hero-img::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 42px 42px; }
    .hero-img::after { content:""; position:absolute; right:-140px; top:-80px; width: 420px; height: 420px; background: radial-gradient(circle, rgba(212,160,84,0.32), transparent 60%); }
    .hero-caption { font-family: 'Inter', sans-serif; font-size: 12px; color: #6b6b6b; margin-top: 8px; text-align: center; font-style: italic; }
    .article p { font-size: 20px; line-height: 1.65; color: #292929; margin: 26px 0; }
    .article p strong { color: #050505; font-weight: 600; }
    .article p em { color: #292929; font-style: italic; }
    .article .tags { margin-top: 40px; display: flex; gap: 8px; flex-wrap: wrap; }
    .tag-chip { background: #f2f2f2; padding: 5px 14px; border-radius: 999px; font-family: 'Inter', sans-serif; font-size: 13px; color: #242424; }
  </style></head><body>
    <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="url">medium.com/szl-command/inside-aegis-building-a-command-surface</div></div>
    <div class="nav"><div class="logo">Medium</div><button class="upg">Member benefits</button></div>
    <div class="pub-bar"><div class="pub-mark">S</div><div class="pub">Published in <strong>SZL Command</strong></div><button class="follow">Follow</button></div>
    <div class="article">
      <h1>${post.title}</h1>
      <div class="dek">${post.subtitle}</div>
      <div class="byline"><div class="avatar">S</div><div><div class="name">S · SZL Holdings</div><div class="meta">${post.readTime} read · Apr 16 · Defense Technology</div></div></div>
      <div class="hero-img"></div>
      <div class="hero-caption">Aegis — Common Operating Picture, v1.0</div>
      <p>Aegis is the SZL platform for unified defense and intelligence command. If you want the short version: it's what a modern J2/J3 shop should have been using for the last ten years — fused signals, structured analyst workflows, AI-assisted tradecraft, and a command surface that doesn't look like it was designed in 2004.</p>
      <p>This post is the long version.</p>
      <h2>The problem Aegis solves</h2>
      <p>Modern defense and intelligence work has a structural mismatch. The threat environment is real-time, multi-domain, and increasingly autonomous. The tooling most analysts and operators actually use is not.</p>
      <p><strong>Signal fragmentation.</strong> ISR feeds, HUMINT reporting, OSINT, partner sharing, commercial imagery, and cyber telemetry live in different systems with different access controls. Fusion happens in a PowerPoint.</p>
      <h2>Where AI belongs — and where it doesn't</h2>
      <p>This is the part I get asked about most. AI belongs in entity extraction, cross-source linking, translation, transcription, and first-draft report generation. AI does not belong in targeting recommendations without a human in the loop.</p>
      <div class="tags">
        ${post.mediumTags.map((t) => `<span class="tag-chip">${t}</span>`).join('')}
      </div>
    </div>
  </body></html>`;
}

// ────────────────────────────────────────────────
// Reference captures
// ────────────────────────────────────────────────
const REFERENCE_TARGETS = [
  {
    file: '01-stratechery.png',
    url: 'https://stratechery.com/',
    label: 'Stratechery by Ben Thompson',
    why: 'Gold standard for paid tech-strategy long-form. Model for our voice, cadence, and paid tier.',
  },
  {
    file: '02-not-boring.png',
    url: 'https://www.notboring.co/',
    label: 'Not Boring by Packy McCormick',
    why: 'Model for narrative-heavy deep dives with strong visual identity. Reference for hero illustration style.',
  },
  {
    file: '03-lennys-newsletter.png',
    url: 'https://www.lennysnewsletter.com/',
    label: "Lenny's Newsletter",
    why: 'Best-in-class monetization and community motion on Substack. Reference for paid-tier structure.',
  },
  {
    file: '04-the-generalist.png',
    url: 'https://www.generalist.com/',
    label: 'The Generalist by Mario Gabriele',
    why: 'Strong investor-adjacent audience, company deep-dive format, clean visual system.',
  },
  {
    file: '05-every.png',
    url: 'https://every.to/',
    label: 'Every (Dan Shipper et al.)',
    why: 'Multi-pillar publication model — closest to our six-pillar structure. Good reference for calendar rhythm.',
  },
  {
    file: '06-platformer.png',
    url: 'https://www.platformer.news/',
    label: 'Platformer by Casey Newton',
    why: 'Beat-reporter Substack with sharp paid tier and tight cadence. Reference for industry-news rhythm.',
  },
  {
    file: '07-bens-bites.png',
    url: 'https://bensbites.com/',
    label: "Ben's Bites",
    why: 'High-velocity AI newsletter with strong visual identity and growth motion. Reference for fast-cadence ops.',
  },
  {
    file: '08-the-pragmatic-engineer.png',
    url: 'https://newsletter.pragmaticengineer.com/',
    label: 'The Pragmatic Engineer by Gergely Orosz',
    why: 'Top-grossing technical Substack. Reference for engineering-essay pillar pricing and structure.',
  },
];

// ────────────────────────────────────────────────
// Render helpers
// ────────────────────────────────────────────────
function resolveChromium() {
  const { execSync } = require('node:child_process');
  // 1. Explicit env var wins.
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH))
    return process.env.CHROMIUM_PATH;
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH))
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  // 2. Common system locations.
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // 3. Nix store discovery — prefer non-"ungoogled" upstream chromium builds, newest by mtime.
  try {
    const lines = execSync(
      'ls -dt /nix/store/*chromium*/bin/chromium-browser 2>/dev/null | grep -v ungoogled || ls -dt /nix/store/*chromium*/bin/chromium-browser 2>/dev/null',
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const f of lines) {
      if (fs.existsSync(f)) return f;
    }
  } catch (_) {}
  // 4. PATH lookup.
  try {
    const which = execSync(
      'command -v chromium-browser || command -v chromium || command -v google-chrome || true',
      { encoding: 'utf8' },
    ).trim();
    if (which && fs.existsSync(which)) return which;
  } catch (_) {}
  throw new Error('Chromium executable not found. Set CHROMIUM_PATH or install chromium.');
}

async function launchBrowser() {
  const exe = resolveChromium();
  return await chromium.launch({
    executablePath: exe,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });
}

async function renderPdf(browser, html, outPath) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.emulateMediaType('print');
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' },
    preferCSSPageSize: false,
  });
  await page.close();
}

async function renderMockup(browser, html, outPath, width = 1440, height = 900, fullPage = true) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.screenshot({ path: outPath, fullPage, type: 'png' });
  await page.close();
}

function referenceCardHtml(ref) {
  const host = new URL(ref.url).hostname.replace(/^www\./, '');
  return `<html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width: 1440px; height: 900px; font-family: 'Inter', sans-serif; background: linear-gradient(160deg, #060912 0%, #0a0f1e 60%, #0d1428 100%); color: #F2EFE8; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    body::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px); background-size: 48px 48px; }
    body::after { content:""; position:absolute; right:-260px; top:-160px; width: 760px; height: 760px; background: radial-gradient(circle, rgba(212,160,84,0.22), transparent 60%); }
    .card { position: relative; width: 1080px; padding: 70px 80px; border: 1px solid rgba(255,255,255,0.10); border-left: 4px solid #D4A054; border-radius: 12px; background: rgba(11,18,32,0.65); backdrop-filter: blur(8px); }
    .eye { font-family:'JetBrains Mono', monospace; font-size: 13px; color: #D4A054; letter-spacing: 0.24em; text-transform: uppercase; margin-bottom: 24px; display:flex; align-items:center; gap: 18px; }
    .eye .mark { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg,#D4A054,#A67A3C); color:#1a1208; font-family:'Space Grotesk',sans-serif; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:18px; letter-spacing:0; }
    h1 { font-family:'Space Grotesk', sans-serif; font-size: 56px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.06; }
    h1 em { color:#D4A054; font-style: normal; }
    .url { margin-top: 18px; font-family:'JetBrains Mono', monospace; font-size: 16px; color: #9CA3AF; }
    .why { margin-top: 32px; font-size: 19px; line-height: 1.55; color: #C7CCD6; max-width: 880px; }
    .why strong { color: #F2EFE8; font-weight: 500; }
    .foot { margin-top: 44px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display:flex; justify-content: space-between; align-items: center; font-family:'JetBrains Mono', monospace; font-size: 11px; color: #6B7280; letter-spacing: 0.16em; text-transform: uppercase; }
    .foot .right { color: #D4A054; }
  </style></head><body>
    <div class="card">
      <div class="eye"><div class="mark">S</div><span>SZL Command · Reference</span></div>
      <h1>${ref.label.replace(/ by /g, ' <em>by</em> ').replace(/ \(([^)]+)\)$/, ' <em>($1)</em>')}</h1>
      <div class="url">${host}</div>
      <div class="why"><strong>Why it's a reference:</strong> ${ref.why}</div>
      <div class="foot"><span>Visit ${host} to view live</span><span class="right">SZL HOLDINGS · LAUNCH KIT</span></div>
    </div>
  </body></html>`;
}

async function captureReference(browser, ref, outPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  let needFallback = false;
  let _reason = '';
  try {
    await page.goto(ref.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4000));
    // Sniff for Cloudflare / bot-challenge / blank pages
    const sniff = await page.evaluate(() => {
      const text = ((document.body?.innerText) || '').trim();
      const title = document.title || '';
      const html = document.documentElement.outerHTML || '';
      return {
        textLen: text.length,
        title,
        hasChallenge:
          /just a moment|cloudflare|enable javascript and cookies|attention required|verify you are human|checking your browser/i.test(
            `${text} ${title} ${html}`,
          ),
        bodyHeight: document.body ? document.body.scrollHeight : 0,
      };
    });
    if (sniff.hasChallenge) {
      needFallback = true;
      _reason = 'bot-challenge page';
    } else if (sniff.textLen < 200) {
      needFallback = true;
      _reason = `thin content (${sniff.textLen} chars)`;
    } else if (sniff.bodyHeight < 400) {
      needFallback = true;
      _reason = `short body (${sniff.bodyHeight}px)`;
    }
  } catch (err) {
    needFallback = true;
    _reason = err.message;
  }

  if (needFallback) {
    await page.setContent(referenceCardHtml(ref), { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
  } else {
  }
  await page.screenshot({ path: outPath, fullPage: false, type: 'png' });
  await page.close();
}

// ────────────────────────────────────────────────
// ZIP
// ────────────────────────────────────────────────
function buildReadme() {
  const mockupList = [
    [
      'substack-home.png',
      'Substack homepage mockup — shows how the SZL Command landing page should look, including hero gradient, gold brand mark, subscribe CTA, and three featured post cards.',
    ],
    [
      'substack-about.png',
      'Substack about-page mockup — shows the positioning, pillar chips, paid-tier callout, and audience section.',
    ],
    [
      'substack-welcome-email.png',
      'Welcome email mockup — exactly what a new subscriber receives, ready to paste into the Substack welcome-email editor.',
    ],
    [
      'substack-post.png',
      'Substack post mockup — long-form post layout with gradient cover, gold drop cap, Source Serif body. Use as a visual target when formatting posts.',
    ],
    [
      'medium-publication.png',
      'Medium publication-page mockup — how the SZL Command publication on Medium should appear, including tabs for each pillar.',
    ],
    [
      'medium-article.png',
      'Medium article mockup — single-post layout on Medium, including tag chips and member-program formatting.',
    ],
  ];
  const refList = REFERENCE_TARGETS.map((r) => [r.file, `${r.label} — ${r.why}`]);
  return `SZL COMMAND — NEWSLETTER SCREENSHOTS KIT
===========================================

Purpose
-------
Visual reference kit for the SZL Substack and Medium launch. Pair these
images with the two PDF strategy documents:
  - SZL-Substack-Launch-Plan.pdf
  - SZL-Medium-Launch-Plan.pdf

Folder contents
---------------

/mockups — branded mockups rendered in SZL Holdings brand language
(obsidian + gold, Space Grotesk / Inter / JetBrains Mono). Use these
when briefing a designer, when previewing visuals with investors, or
when setting up the live publications. Each mockup is 2x resolution
PNG for retina clarity.

${mockupList.map(([f, d]) => `  ${f}\n      ${d}`).join('\n\n')}

/references — screenshots of best-in-class Substack and Medium
publications in adjacent spaces. Use these as reference for
editorial voice, cadence, and visual direction. Screenshots are
captured at launch time; if a page has changed since capture,
the structural reference still holds.

${refList.map(([f, d]) => `  ${f}\n      ${d}`).join('\n\n')}

How to use this kit
-------------------
1. Read the Substack PDF first. Follow the setup checklist in order.
2. Use mockups/substack-home.png, substack-about.png, and
   substack-welcome-email.png as the visual target while you set up
   the publication.
3. When cross-posting to Medium, use mockups/medium-publication.png
   and medium-article.png as the visual target.
4. Reference /references/ for editorial voice and cadence
   calibration across the 90-day calendar.

Questions → reply to any SZL Command essay.

Version: 1.0 · Generated on ${new Date().toISOString().slice(0, 10)}
`;
}

async function bundleZip(zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(archive.pointer()));
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err);
    });
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(MOCKUPS_DIR, 'mockups');
    archive.directory(REFERENCES_DIR, 'references');
    archive.append(buildReadme(), { name: 'README.txt' });
    archive.finalize();
  });
}

// ────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────
async function main() {

  const browser = await launchBrowser();
  const substackHtml = buildPdfHtml('substack');
  await renderPdf(browser, substackHtml, path.join(DELIVERABLES, 'SZL-Substack-Launch-Plan.pdf'));
  const mediumHtml = buildPdfHtml('medium');
  await renderPdf(browser, mediumHtml, path.join(DELIVERABLES, 'SZL-Medium-Launch-Plan.pdf'));
  const mockups = [
    ['substack-home.png', mockupSubstackHome(), 1440, 900, true],
    ['substack-about.png', mockupSubstackAbout(), 1440, 900, true],
    ['substack-welcome-email.png', mockupSubstackWelcome(), 800, 1100, true],
    ['substack-post.png', mockupSubstackPost(), 1440, 900, true],
    ['medium-publication.png', mockupMediumPub(), 1440, 900, true],
    ['medium-article.png', mockupMediumArticle(), 1440, 900, true],
  ];
  for (const [name, html, w, h, full] of mockups) {
    const p = path.join(MOCKUPS_DIR, name);
    await renderMockup(browser, html, p, w, h, full);
  }
  for (const ref of REFERENCE_TARGETS) {
    await captureReference(browser, ref, path.join(REFERENCES_DIR, ref.file));
  }

  await browser.close();
  const zipOut = path.join(DELIVERABLES, 'SZL-Newsletter-Screenshots.zip');
  const _sz = await bundleZip(zipOut);

  const _stats = {
    substackPdf: fs.statSync(path.join(DELIVERABLES, 'SZL-Substack-Launch-Plan.pdf')).size,
    mediumPdf: fs.statSync(path.join(DELIVERABLES, 'SZL-Medium-Launch-Plan.pdf')).size,
    zip: fs.statSync(zipOut).size,
  };
}

main().catch((_err) => {
  process.exit(1);
});
