// ---- Live a11oy fetch with HONEST degrade to SNAPSHOT ----
const BASE = 'https://a-11-oy.com/api/a11oy/v1';
const TIMEOUT = 8000;

// Last-known SNAPSHOT values (clearly labeled if a live fetch fails).
// Sourced from the a11oy API contract; never fabricated beyond last-seen shape.
const SNAP = {
  harvest: {
    price_now_eur_mwh: -27.42, should_soak: true, grid_price_posture: 'negative-price',
    renewable_share_pct: 129.7, uk_carbon_index: 'low', uk_gco2_per_kwh: 43,
    feeds_live: 3, feeds_total: 3, joules_label: 'measured',
  },
  budget: { status: 'EMPTY', task_count: 0, total_joules_est: 0, all_within_bound: true },
  prov: { status: 'VERIFIED', verify: { links_intact: true, length: 0, bekenstein_gate_all_pass: true } },
  heart: {
    heart_sigma: { ok: true }, blood_verify: { ok: true, length: 0 }, beat_count: 0,
    blood_verify_signing: 'SAMPLE local digest — NOT signed',
  },
  rev: {
    estimate: {
      our_current_node: { with_verified_premium_usd_per_mo: [108.59, 244.32], settled_usd_to_date: 0.0 },
    },
  },
};

let anyDegraded = false;

function fetchJSON(path) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  return fetch(`${BASE}/${path}`, { signal: ctrl.signal, mode: 'cors', cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .finally(() => clearTimeout(id));
}

function setSrcBadge(name, live) {
  const el = document.querySelector(`.src-badge[data-src="${name}"]`);
  if (!el) return;
  if (live) { el.textContent = 'LIVE'; el.classList.remove('snap'); }
  else { el.textContent = 'SNAPSHOT'; el.classList.add('snap'); anyDegraded = true; }
}

const $ = id => document.getElementById(id);
const yn = v => (v ? 'yes' : 'no');
const fmtJ = v => (typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—');

// ---- HARVEST ----
async function loadHarvest() {
  let d, live = true;
  try { d = await fetchJSON('harvest/posture'); }
  catch { d = SNAP.harvest; live = false; }
  setSrcBadge('harvest', live);

  const price = d.price_now_eur_mwh;
  $('grid-price').textContent = (typeof price === 'number' ? (price > 0 ? '+' : '') + price.toFixed(2) : '—');
  $('should-soak').textContent = yn(d.should_soak);
  $('should-soak').className = d.should_soak ? 'hl' : 'bad';
  $('grid-posture').textContent = d.grid_price_posture ?? '—';
  $('renewable').textContent = d.renewable_share_pct != null ? d.renewable_share_pct + '%' : '—';
  $('carbon').textContent = `${d.uk_carbon_index ?? '—'} (${d.uk_gco2_per_kwh ?? '—'} gCO₂/kWh)`;
  $('feeds').textContent = `${d.feeds_live ?? '—'}/${d.feeds_total ?? '—'}`;
  const jl = (d.joules_label || '—');
  $('joules-label').textContent = jl;
  $('joules-label').className = jl.toLowerCase() === 'measured' ? 'hl' : '';

  // drive the 3D loop speed
  if (window.__setLoopFlow) window.__setLoopFlow(!!d.should_soak);
  return live;
}

// ---- BUDGET ----
async function loadBudget() {
  let d, live = true;
  try { d = await fetchJSON('energy/budget'); }
  catch { d = SNAP.budget; live = false; }
  setSrcBadge('budget', live);
  $('budget-status').textContent = d.status ?? '—';
  $('task-count').textContent = d.task_count ?? '—';
  $('budget-joules').textContent = fmtJ(d.total_joules_est);
  $('within-bound').textContent = yn(d.all_within_bound);
  $('within-bound').className = d.all_within_bound ? 'hl' : 'bad';
  return live;
}

// ---- PROVENANCE ----
async function loadProv() {
  let d, live = true;
  try { d = await fetchJSON('energy/provenance'); }
  catch { d = SNAP.prov; live = false; }
  setSrcBadge('prov', live);
  const v = d.verify || {};
  $('prov-status').textContent = (d.status || '—').split(' ')[0];
  $('links-intact').textContent = yn(v.links_intact);
  $('links-intact').className = v.links_intact ? 'hl' : 'bad';
  $('prov-len').textContent = v.length ?? d.length ?? '—';
  $('gate-pass').textContent = yn(v.bekenstein_gate_all_pass);
  $('gate-pass').className = v.bekenstein_gate_all_pass ? 'hl' : 'bad';
  return live;
}

// ---- HEART / BLOOD ----
async function loadHeart() {
  let d, live = true;
  try { d = await fetchJSON('heart/pulse'); }
  catch { d = SNAP.heart; live = false; }
  setSrcBadge('heart', live);
  const sig = d.heart_sigma || {};
  const bld = d.blood_verify || {};
  $('sigma-ok').textContent = yn(sig.ok);
  $('sigma-ok').className = sig.ok ? 'hl' : 'bad';
  $('blood-ok').textContent = yn(bld.ok);
  $('blood-ok').className = bld.ok ? 'hl' : 'bad';
  $('beat-count').textContent = d.beat_count ?? bld.length ?? '—';
  $('signing').textContent = 'SAMPLE digest';
  return live;
}

// ---- REVENUE ----
async function loadRev() {
  let d, live = true;
  try { d = await fetchJSON('revenue/marketplace'); }
  catch { d = SNAP.rev; live = false; }
  setSrcBadge('rev', live);
  const node = (d.estimate && d.estimate.our_current_node) || SNAP.rev.estimate.our_current_node;
  const rng = node.with_verified_premium_usd_per_mo || [];
  $('rev-range').textContent = rng.length === 2
    ? `$${rng[0].toFixed(0)} – $${rng[1].toFixed(0)}` : '—';
  const settled = node.settled_usd_to_date;
  $('rev-settled').textContent = (typeof settled === 'number') ? `$${settled.toFixed(2)}` : '—';
  return live;
}

function updateConnBadge(allLive) {
  const badge = $('conn-badge');
  const label = $('conn-label');
  if (allLive && !anyDegraded) {
    badge.classList.remove('snapshot'); badge.classList.add('live'); label.textContent = 'LIVE';
  } else {
    badge.classList.remove('live'); badge.classList.add('snapshot'); label.textContent = 'PARTIAL SNAPSHOT';
  }
  $('conn-ts').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function refreshAll() {
  anyDegraded = false;
  const results = await Promise.all([loadHarvest(), loadBudget(), loadProv(), loadHeart(), loadRev()]);
  updateConnBadge(results.every(Boolean));
}

refreshAll();
setInterval(refreshAll, 30000); // refresh every 30s
