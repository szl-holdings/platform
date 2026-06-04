/**
 * gen-cortex-mobile-screenshots.mjs
 *
 * Generates HTML-mockup screenshots of CORTEX Mobile screens for environments
 * where the native Expo app cannot be captured directly (e.g. Replit CI).
 * On a real machine, prefer Expo Go, iOS Simulator, or Android Emulator instead
 * — see screenshots/cortex-mobile/README.md for the full capture process.
 *
 * Usage:
 *   node scripts/gen-cortex-mobile-screenshots.mjs
 *
 * Output:
 *   screenshots/cortex-mobile/<filename>.jpg  (390×844, iPhone 14 viewport)
 *
 * Adding a new screen:
 *   Add an entry to the SCREENS object below with the output filename as the
 *   key and a function that returns the full HTML string as the value.
 */

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'cortex-mobile');

// ─── Design tokens (must match the app's color system) ───────────────────────
const BG = '#0a0a0a';
const CARD = '#111111';
const BORDER = '#1f1f1f';
const FORE = '#f0ece3';
const MUTED = '#6b7280';
const ACCENT = '#c9a84c';
const W = 390;
const H = 844;

// ─── Resolve Chromium executable ─────────────────────────────────────────────
function findChromium() {
  // 1. Honour an explicit env override
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  // 2. System chromium / google-chrome on PATH
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    try {
      const resolved = execSync(`which ${bin}`, { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (resolved) return resolved;
    } catch {}
  }

  // 3. Nix-store fallback (Replit-specific, detected at runtime without hardcoding)
  try {
    const nixChromium = execSync(
      'ls /nix/store/*/bin/chromium 2>/dev/null | head -1',
      { shell: true, stdio: ['pipe', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();
    if (nixChromium) return nixChromium;
  } catch {}

  throw new Error(
    'Chromium not found. Set CHROMIUM_PATH env var or install chromium on your PATH.',
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function statusBar(time = '9:41') {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px 6px;font-size:13px;font-weight:600;color:${FORE};">
      <span>${time}</span>
      <div style="display:flex;gap:6px;align-items:center;">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="${FORE}">
          <rect x="0" y="3" width="3" height="9" rx="1"/>
          <rect x="4" y="2" width="3" height="10" rx="1"/>
          <rect x="8" y="0" width="3" height="12" rx="1"/>
          <rect x="12" y="0" width="3" height="12" rx="1" opacity=".3"/>
        </svg>
        <svg width="15" height="12" viewBox="0 0 24 12" fill="none">
          <path d="M1 4C5 0 9 0 12 2.5C15 0 19 0 23 4" stroke="${FORE}" stroke-width="2" fill="none"/>
          <path d="M4 7C7 4.5 9.5 4.5 12 6.5C14.5 4.5 17 4.5 20 7" stroke="${FORE}" stroke-width="2" fill="none"/>
          <circle cx="12" cy="10" r="2" fill="${FORE}"/>
        </svg>
        <div style="display:flex;align-items:center;gap:2px;">
          <span style="font-size:12px;font-weight:600;">87%</span>
          <div style="width:22px;height:11px;border:1.5px solid ${FORE};border-radius:2px;padding:1.5px;">
            <div style="width:75%;height:100%;background:${FORE};border-radius:1px;"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function tabBar(active) {
  const tabs = [
    { key: 'home',         icon: '⌂', label: 'Home'      },
    { key: 'intelligence', icon: '◉', label: 'Intel'     },
    { key: 'operations',   icon: '⊟', label: 'Ops'       },
    { key: 'portfolio',    icon: '◆', label: 'Portfolio'  },
    { key: 'properties',   icon: '⬢', label: 'Terra'     },
  ];
  return `
    <div style="position:absolute;bottom:0;left:0;right:0;height:82px;background:${CARD};border-top:1px solid ${BORDER};display:flex;align-items:flex-start;padding-top:10px;">
      ${tabs.map(t => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
          <span style="font-size:18px;color:${t.key === active ? ACCENT : MUTED};">${t.icon}</span>
          <span style="font-size:9px;font-weight:600;color:${t.key === active ? ACCENT : MUTED};letter-spacing:.5px;">${t.label.toUpperCase()}</span>
        </div>`).join('')}
    </div>`;
}

// ─── Screen definitions ───────────────────────────────────────────────────────
// Each key is the output filename; each value is a function returning HTML.
// Mirror the actual screen's layout, color system, and data content.
// Source: artifacts/szl-holdings-mobile/app/(shell)/

const SCREENS = {

  // intelligence.jpg — app/(shell)/intelligence/index.tsx
  'intelligence.jpg': () => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;}
  body{width:${W}px;height:${H}px;background:${BG};color:${FORE};overflow:hidden;position:relative;}
</style></head>
<body>
  ${statusBar()}
  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 20px 12px;border-bottom:1px solid ${BORDER};">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;border-radius:8px;border:1.5px solid ${ACCENT}40;background:${ACCENT}10;display:flex;align-items:center;justify-content:center;font-size:14px;">◉</div>
      <div>
        <div style="font-size:16px;font-weight:700;letter-spacing:.3px;">APEX Intelligence</div>
        <div style="font-size:10px;color:${MUTED};letter-spacing:.4px;">Cross-domain fusion engine</div>
      </div>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  </div>
  <div style="display:flex;border-bottom:1px solid ${BORDER};padding:0 20px;">
    ${[['Feed','4',true],['Drafts','2',false],['What-If','',false]].map(([label,badge,active]) => `
      <div style="padding:10px 16px;border-bottom:2px solid ${active ? ACCENT : 'transparent'};display:flex;align-items:center;gap:5px;">
        <span style="font-size:13px;font-weight:600;color:${active ? ACCENT : MUTED};">${label}</span>
        ${badge ? `<div style="background:${active ? ACCENT : MUTED+'60'};border-radius:10px;padding:1px 5px;"><span style="font-size:9px;font-weight:700;color:${active ? '#000' : FORE};">${badge}</span></div>` : ''}
      </div>`).join('')}
  </div>
  <div style="margin:14px 16px 0;padding:12px 14px;background:#0d0d0d;border:1px solid ${ACCENT}50;border-radius:10px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:9px;font-weight:700;letter-spacing:.8px;color:${MUTED};margin-bottom:3px;">AI EXECUTIVE BRIEFING</div>
      <div style="font-size:14px;font-weight:700;">Pulse Intelligence Brief</div>
      <div style="font-size:10px;color:${MUTED};margin-top:2px;">Today's strategic summary · Agent-attributed · Confidence-scored</div>
    </div>
    <div style="border:1px solid ${ACCENT};border-radius:6px;padding:4px 8px;background:${ACCENT}15;">
      <span style="font-size:10px;font-weight:700;color:${ACCENT};">OPEN →</span>
    </div>
  </div>
  <div style="margin:14px 16px 0;">
    <div style="font-size:9px;font-weight:700;letter-spacing:.8px;color:${MUTED};margin-bottom:8px;">COGNITIVE RUNTIME</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${[
        {label:'Cognitive Briefing',sub:'Top interventions · VaR',icon:'⊙',color:'#8b7ac8'},
        {label:'Decision Center',  sub:'Decisions, with receipts',icon:'◧',color:ACCENT},
        {label:'Approval Inbox',   sub:'Guardian-routed',         icon:'⊠',color:'#f97316'},
        {label:'Alert Center',     sub:'Escalations · world-model',icon:'⚠',color:'#ef4444'},
      ].map(c => `
        <div style="background:${CARD};border:1px solid ${BORDER};border-radius:10px;padding:12px 12px 10px;">
          <div style="width:28px;height:28px;border-radius:7px;background:${c.color}18;border:1px solid ${c.color}30;display:flex;align-items:center;justify-content:center;font-size:14px;margin-bottom:7px;">${c.icon}</div>
          <div style="font-size:12px;font-weight:600;margin-bottom:2px;">${c.label}</div>
          <div style="font-size:10px;color:${MUTED};">${c.sub}</div>
        </div>`).join('')}
    </div>
  </div>
  <div style="margin:14px 16px 0;">
    <div style="font-size:9px;font-weight:700;letter-spacing:.8px;color:${MUTED};margin-bottom:8px;">LIVE SIGNALS</div>
    ${[
      {sev:'CRITICAL',color:'#ef4444',title:'Port of Rotterdam congestion — 14 vessels rerouted',domains:['⚓ Vessels','⬡ Aegis'],time:'3m ago'},
      {sev:'HIGH',    color:'#f97316',title:'Sanctions entity match detected in supply chain node',domains:['◆ Portfolio','⚓ Vessels'],time:'12m ago'},
      {sev:'MEDIUM',  color:'#f59e0b',title:'Terra NYC distress score spike — Brooklyn cluster',domains:['⬢ Terra'],time:'28m ago'},
    ].map(s => `
      <div style="background:${CARD};border:1px solid ${BORDER};border-left:3px solid ${s.color};border-radius:10px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:7px;height:7px;border-radius:50%;background:${s.color};"></div>
            <span style="font-size:9px;font-weight:700;letter-spacing:.6px;color:${s.color};">${s.sev}</span>
          </div>
          <span style="font-size:10px;color:${MUTED};">${s.time}</span>
        </div>
        <div style="font-size:12px;font-weight:600;line-height:1.35;margin-bottom:7px;">${s.title}</div>
        <div style="display:flex;gap:5px;">
          ${s.domains.map(d => `<span style="font-size:9px;padding:2px 7px;border-radius:10px;background:${MUTED}12;border:1px solid ${MUTED}25;color:${MUTED};">${d}</span>`).join('')}
        </div>
      </div>`).join('')}
  </div>
  ${tabBar('intelligence')}
</body></html>`,

  // properties.jpg — app/(shell)/properties/(tabs)/index.tsx (NYC Distress Map)
  'properties.jpg': () => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;}
  body{width:${W}px;height:${H}px;background:${BG};color:${FORE};overflow:hidden;position:relative;}
</style></head>
<body>
  ${statusBar()}
  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 20px 12px;border-bottom:1px solid ${BORDER};">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;border-radius:8px;border:1.5px solid #22c55e40;background:#22c55e10;display:flex;align-items:center;justify-content:center;font-size:14px;color:#22c55e;">⬢</div>
      <div>
        <div style="font-size:16px;font-weight:700;">Terra Properties</div>
        <div style="font-size:10px;color:${MUTED};">Real Estate Intelligence</div>
      </div>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  </div>
  <div style="display:flex;border-bottom:1px solid ${BORDER};padding:0 16px;">
    ${['Map','Properties','Pipeline','Terra Modules'].map((t,i) => {
      const active = i === 0;
      return `<div style="padding:9px 12px;border-bottom:2px solid ${active?'#22c55e':'transparent'};"><span style="font-size:12px;font-weight:600;color:${active?'#22c55e':MUTED};">${t}</span></div>`;
    }).join('')}
  </div>
  <div style="margin:12px 16px 0;height:200px;background:#0f1a12;border:1px solid #22c55e25;border-radius:12px;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,#22c55e05 0,#22c55e05 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#22c55e05 0,#22c55e05 1px,transparent 1px,transparent 40px);"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
      <div style="font-size:24px;margin-bottom:4px;">🗺</div>
      <div style="font-size:11px;font-weight:600;color:#22c55e;">NYC Distress Map</div>
      <div style="font-size:9px;color:${MUTED};margin-top:2px;">5 Boroughs · Live</div>
    </div>
    ${[
      {top:'28%',left:'42%',c:'#c0503a'},{top:'55%',left:'58%',c:'#b8943c'},
      {top:'38%',left:'30%',c:'#c0503a'},{top:'62%',left:'46%',c:'#3a7ad4'},
      {top:'45%',left:'70%',c:'#40856a'},{top:'22%',left:'54%',c:'#b8943c'},
    ].map(m => `<div style="position:absolute;top:${m.top};left:${m.left};width:10px;height:10px;border-radius:50%;background:${m.c};border:1.5px solid #fff4;transform:translate(-50%,-50%);"></div>`).join('')}
    <div style="position:absolute;bottom:10px;left:10px;display:flex;gap:6px;">
      ${[['#c0503a','Distress'],['#b8943c','Opportunity'],['#3a7ad4','Watchlist'],['#40856a','Portfolio']].map(([c,l]) =>
        `<div style="display:flex;align-items:center;gap:3px;background:#0a0a0acc;border-radius:4px;padding:2px 6px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${c};"></div>
          <span style="font-size:8px;color:${FORE};">${l}</span>
        </div>`).join('')}
    </div>
  </div>
  <div style="margin:12px 16px 0;">
    <div style="font-size:9px;font-weight:700;letter-spacing:.8px;color:${MUTED};margin-bottom:8px;">RECENT SIGNALS</div>
    ${[
      {addr:'1420 Flatbush Ave, Brooklyn',  boro:'Brooklyn',  price:'$2.4M',score:87,color:'#c0503a'},
      {addr:'843 Nostrand Ave, Crown Hts',  boro:'Brooklyn',  price:'$1.8M',score:74,color:'#b8943c'},
      {addr:'221 E 23rd St, Manhattan',     boro:'Manhattan', price:'$5.1M',score:91,color:'#c0503a'},
      {addr:'56-12 Junction Blvd, Queens',  boro:'Queens',    price:'$890K',score:62,color:'#3a7ad4'},
    ].map(p => `
      <div style="background:${CARD};border:1px solid ${p.color}25;border-radius:10px;padding:11px 13px;margin-bottom:7px;display:flex;align-items:center;gap:10px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.addr}</div>
          <div style="font-size:10px;color:${MUTED};margin-top:1px;">${p.boro} · ${p.price}</div>
        </div>
        <div style="background:${p.color}15;border-radius:6px;padding:4px 8px;flex-shrink:0;">
          <span style="font-size:12px;font-weight:700;color:${p.color};">${p.score}</span>
        </div>
      </div>`).join('')}
  </div>
  ${tabBar('properties')}
</body></html>`,

  // founder.jpg — app/(shell)/founder/(tabs)/index.tsx
  'founder.jpg': () => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;}
  body{width:${W}px;height:${H}px;background:${BG};color:${FORE};overflow:hidden;position:relative;}
</style></head>
<body>
  ${statusBar()}
  <div style="padding:10px 20px 14px;border-bottom:1px solid ${BORDER};background:linear-gradient(180deg,#0f0f0f,${BG});">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <div style="width:44px;height:44px;border-radius:22px;background:linear-gradient(135deg,${ACCENT}80,${ACCENT}20);border:2px solid ${ACCENT}50;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:${ACCENT};">SL</div>
      <div>
        <div style="font-size:16px;font-weight:700;">Stephen Lutar</div>
        <div style="font-size:10px;color:${MUTED};">Founder & Principal · SZL Holdings</div>
      </div>
    </div>
    <div style="font-size:11px;color:${MUTED};line-height:1.4;font-style:italic;">"I build the systems that power enterprises — from fintech platforms processing millions in transactions to maritime intelligence tracking global fleets."</div>
  </div>
  <div style="display:flex;border-bottom:1px solid ${BORDER};padding:0 16px;overflow:hidden;">
    ${['Overview','Ventures','Articles','Tools','Profile'].map((t,i) => {
      const active = i === 0;
      return `<div style="padding:9px 12px;border-bottom:2px solid ${active?ACCENT:'transparent'};flex-shrink:0;"><span style="font-size:11px;font-weight:600;color:${active?ACCENT:MUTED};">${t}</span></div>`;
    }).join('')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 16px 0;">
    ${[
      {label:'Portfolio AUM', value:'$2.4B', color:ACCENT},
      {label:'Active Ventures',value:'8',    color:'#22c55e'},
      {label:'AI Agents',     value:'47',    color:'#8b7ac8'},
    ].map(s => `
      <div style="background:${CARD};border:1px solid ${BORDER};border-radius:10px;padding:10px 12px;text-align:center;">
        <div style="font-size:18px;font-weight:700;color:${s.color};margin-bottom:2px;">${s.value}</div>
        <div style="font-size:9px;color:${MUTED};">${s.label}</div>
      </div>`).join('')}
  </div>
  <div style="padding:12px 16px 0;">
    <div style="font-size:9px;font-weight:700;letter-spacing:.8px;color:${MUTED};margin-bottom:8px;">VENTURE PORTFOLIO</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${[
        {name:'Vessels', tag:'Maritime Intelligence', color:'#4d8fcc',icon:'⚓',stat:'50K+',  statLabel:'Vessels tracked'},
        {name:'Aegis',   tag:'Defense & Intelligence',color:'#ef4444',icon:'⬡',stat:'100+',  statLabel:'Threat vectors'},
        {name:'Terra',   tag:'Real Estate Intel',     color:'#22c55e',icon:'⬢',stat:'500K+', statLabel:'Properties'},
        {name:'Lyte',    tag:'Business Observability',color:'#f59e0b',icon:'⚡',stat:'10K+', statLabel:'Signals/hr'},
      ].map(v => `
        <div style="background:${CARD};border:1px solid ${v.color}25;border-radius:10px;padding:12px;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;right:0;width:50px;height:50px;background:${v.color}08;border-radius:0 10px 0 50px;"></div>
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
            <div style="width:24px;height:24px;border-radius:6px;background:${v.color}18;border:1px solid ${v.color}30;display:flex;align-items:center;justify-content:center;font-size:12px;">${v.icon}</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:${v.color};">${v.name}</div>
              <div style="font-size:9px;color:${MUTED};">${v.tag}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:16px;font-weight:700;">${v.stat}</div>
              <div style="font-size:9px;color:${MUTED};">${v.statLabel}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>`).join('')}
    </div>
  </div>
  <div style="margin:12px 16px 0;padding:11px 14px;background:${CARD};border:1px solid ${BORDER};border-radius:10px;display:flex;justify-content:space-around;">
    ${[{icon:'✉',label:'Email'},{icon:'📎',label:'LinkedIn'},{icon:'📞',label:'Call'},{icon:'↗',label:'Share'}].map(c => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="width:34px;height:34px;border-radius:17px;background:${ACCENT}12;border:1px solid ${ACCENT}25;display:flex;align-items:center;justify-content:center;font-size:14px;">${c.icon}</div>
        <span style="font-size:9px;color:${MUTED};">${c.label}</span>
      </div>`).join('')}
  </div>
  ${tabBar('home')}
</body></html>`,

  // settings.jpg — app/(shell)/settings/index.tsx
  'settings.jpg': () => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;}
  body{width:${W}px;height:${H}px;background:${BG};color:${FORE};overflow:hidden;position:relative;}
</style></head>
<body>
  ${statusBar()}
  <div style="display:flex;align-items:center;gap:10px;padding:10px 20px 14px;border-bottom:1px solid ${BORDER};">
    <div style="width:32px;height:32px;border-radius:8px;background:${MUTED}18;border:1.5px solid ${MUTED}30;display:flex;align-items:center;justify-content:center;font-size:14px;">⚙</div>
    <div>
      <div style="font-size:16px;font-weight:700;">Settings</div>
      <div style="font-size:10px;color:${MUTED};">CORTEX Mobile Configuration</div>
    </div>
  </div>
  ${[
    {section:'ACCOUNT', items:[
      {icon:'👤',label:'Profile & Identity',  sub:'Stephen Lutar · Founder'},
      {icon:'🔒',label:'Security',            sub:'Biometric · 2FA · Sessions', color:'#6366f1'},
    ]},
    {section:'NOTIFICATIONS', items:[
      {icon:'🔔',label:'Alert Preferences',   sub:'Severity thresholds · Channels'},
      {icon:'📋',label:'Digest Schedule',     sub:'Daily brief · Weekly rollup'},
    ]},
    {section:'DISPLAY', items:[
      {icon:'🕒',label:'Timezone',            sub:'America/New_York (EDT)'},
      {icon:'🧩',label:'Widgets',             sub:'Home screen widget configuration'},
    ]},
    {section:'PLATFORM', items:[
      {icon:'🔄',label:'Sync Status',         sub:'All domains synced · 2m ago'},
      {icon:'📊',label:'Usage',               sub:'API · Compute · Storage'},
      {icon:'💳',label:'Billing',             sub:'Enterprise plan · Renews Jun 1'},
    ]},
  ].map(g => `
    <div style="margin:12px 0 0;">
      <div style="font-size:9px;font-weight:700;letter-spacing:.8px;color:${MUTED};padding:0 16px;margin-bottom:6px;">${g.section}</div>
      <div style="margin:0 16px;">
        ${g.items.map((item, i, arr) => `
          <div style="background:${CARD};padding:13px 14px;display:flex;align-items:center;gap:12px;
            ${i === 0             ? 'border-radius:10px 10px 0 0;' : ''}
            ${i === arr.length-1 ? 'border-radius:0 0 10px 10px;' : ''}
            border-bottom:${i < arr.length-1 ? `1px solid ${BORDER}` : 'none'};">
            <div style="width:30px;height:30px;border-radius:7px;background:${(item.color||MUTED)}12;border:1px solid ${(item.color||MUTED)}25;display:flex;align-items:center;justify-content:center;font-size:13px;">${item.icon}</div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;">${item.label}</div>
              <div style="font-size:10px;color:${MUTED};margin-top:1px;">${item.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>`).join('')}
      </div>
    </div>`).join('')}
  ${tabBar('home')}
</body></html>`,

};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const executablePath = findChromium();
  console.log(`Using Chromium: ${executablePath}`);

  const browser = await chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  for (const [filename, htmlFn] of Object.entries(SCREENS)) {
    const outPath = path.join(OUT_DIR, filename);
    await page.setContent(htmlFn(), { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 92 });
    console.log(`✓  ${filename}`);
  }

  await browser.close();
  console.log(`\nDone — ${Object.keys(SCREENS).length} screenshots written to ${OUT_DIR}`);
}

run().catch(err => { console.error(err); process.exit(1); });
