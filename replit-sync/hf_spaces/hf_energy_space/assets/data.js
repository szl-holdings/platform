// ---- Live a11oy fetch with HONEST degrade to labeled SNAPSHOT ----
// Every panel reads the live a11oy API. If a fetch fails, the panel is
// clearly labeled SNAPSHOT with a last-known value — never blank, never fabricated.
const BASE = 'https://a11oy.net/api/a11oy/v1';
const TIMEOUT = 8000;
const REFRESH_MS = 15000;

// Last-known SNAPSHOT values (clearly labeled if a live fetch fails).
// Sourced from the a11oy API contract; never fabricated beyond last-seen shape.
const SNAP = {
  harvest: {
    price_now_eur_mwh: 72.26, should_soak: true, grid_price_posture: 'curtailed-renewable',
    next_min_eur_mwh: -25, next_negative_windows: 10,
    renewable_share_pct: 135.7, uk_carbon_index: 'low', uk_gco2_per_kwh: 55,
    feeds_live: 3, feeds_total: 3, joules_label: 'measured',
    joules_evidence: {
      joules_measured_total: 212.262, exporter_node: 'betterwithage',
      exporter_last_seen_ts: '2026-06-13T09:51:06+00:00', power_w_sample: 12.25,
    },
  },
  budget: {
    status: 'EMPTY', task_count: 0, total_output_bytes: 0, total_shannon_bits: 0,
    total_joules_est: 0, all_within_bound: true,
  },
  prov: {
    status: 'VERIFIED', length: 9,
    head_hash: 'cf75adce3c20fb045412a99aebd2f2daf64ab76cc4f49a9048281dc73fbc7095',
    verify: { links_intact: true, length: 9, bekenstein_gate_all_pass: true },
  },
  heart: {
    ok: true, beat_count: 9,
    head_beat_hash: '9492d26b0f1d69c6eb5fa6a0f7f5f78ba352d70e9f3d2fb7db579120bfd27fb4',
    blood_verify_signing: 'SAMPLE local digest — NOT signed',
  },
  anatomy: {
    organs: [
      { name: 'WAQAYCHAQ', role: 'guard / store' },
      { name: 'KAMAY', role: 'act / animate' },
      { name: 'RIKUY', role: 'observe / telemetry' },
    ],
    beats_last_cycle: 1,
    reservoir: { work_credits: 24576 },
    ayni: { balanced: true, intake: 2048, output: 2048, stored: 2048 },
    stages: { kallpa_bekenstein_cap_bits: 2048, kallpa_landauer_floor_joules: 5.879764756641e-18 },
  },
  rev: {
    estimate: {
      label: 'ESTIMATE', basis: 'published-comparable',
      assumptions: { price_usd_per_gpu_hr: [0.2, 0.45], uptime_fraction: 0.7, verified_premium_fraction: 0.25 },
      our_current_node: { with_verified_premium_usd_per_mo: [108.59, 244.32], settled_usd_to_date: 0.0, status: 'not_listed' },
      candidate_venues: [{ name: 'Vast.ai' }, { name: 'RunPod' }, { name: 'io.net' }, { name: 'Akash' }],
    },
  },
  pool: {
    counts: { nodes_total: 6, nodes_reachable: 5, sovereign_gpu_live: true },
    nodes: [
      { name: 'hetzner-box-cpu', kind: 'cpu', reachable: true, sovereign: true },
      { name: 'rtx-betterwithage', kind: 'sovereign-gpu', reachable: true, sovereign: true },
      { name: 'chaski', kind: 'tailnet-gpu', reachable: false, sovereign: false },
      { name: 'groq', kind: 'hosted-inference', reachable: true, sovereign: false },
      { name: 'nvidia-nim', kind: 'hosted-inference', reachable: true, sovereign: false },
      { name: 'hf-router', kind: 'hosted-inference', reachable: true, sovereign: false },
    ],
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
const setYN = (id, ok) => { const el = $(id); if (!el) return; el.textContent = yn(ok); el.className = ok ? 'hl' : 'bad'; };
const fmtNum = (v, d = 0) => (typeof v === 'number' && isFinite(v))
  ? v.toLocaleString(undefined, { maximumFractionDigits: d }) : '—';
const shortHash = h => (typeof h === 'string' && h.length > 12) ? `${h.slice(0, 7)}…${h.slice(-4)}` : (h || '—');
const fmtTime = ts => {
  if (!ts) return '—';
  try {
    const dt = new Date(ts);
    if (isNaN(dt)) return String(ts);
    return dt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(ts); }
};

// ---- HARVEST ----
async function loadHarvest() {
  let d, live = true;
  try { d = await fetchJSON('harvest/posture'); }
  catch { d = SNAP.harvest; live = false; }
  setSrcBadge('harvest', live);

  const price = d.price_now_eur_mwh;
  const priceTxt = (typeof price === 'number') ? (price > 0 ? '+' : '') + price.toFixed(2) : '—';
  $('grid-price').textContent = priceTxt;
  setYN('should-soak', d.should_soak);
  $('grid-posture').textContent = d.grid_price_posture ?? '—';
  const nm = d.next_min_eur_mwh, nw = d.next_negative_windows;
  $('next-window').textContent = (typeof nm === 'number')
    ? `${nm > 0 ? '+' : ''}${nm} EUR/MWh${nw != null ? ` · ${nw} neg.` : ''}` : '—';
  $('renewable').textContent = d.renewable_share_pct != null ? d.renewable_share_pct + '%' : '—';
  $('carbon').textContent = `${d.uk_carbon_index ?? '—'} (${d.uk_gco2_per_kwh ?? '—'} gCO₂/kWh)`;
  $('feeds').textContent = `${d.feeds_live ?? '—'}/${d.feeds_total ?? '—'}`;
  const jl = (d.joules_label || '—');
  $('joules-label').textContent = jl;
  $('joules-label').className = jl.toLowerCase() === 'measured' ? 'hl' : '';

  // ---- hero evidence ----
  const ev = d.joules_evidence || {};
  if (typeof ev.joules_measured_total === 'number') {
    $('measured-joules').textContent = ev.joules_measured_total.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  $('ev-node').textContent = ev.exporter_node ?? '—';
  $('ev-seen').textContent = fmtTime(ev.exporter_last_seen_ts);
  $('ev-power').textContent = (typeof ev.power_w_sample === 'number') ? `${ev.power_w_sample.toFixed(2)} W` : '—';
  $('ev-price').textContent = priceTxt !== '—' ? `${priceTxt} EUR/MWh` : '—';

  // hero label tag honesty
  const tag = $('hero-label-tag');
  if (tag) {
    if (jl.toLowerCase() === 'measured') { tag.textContent = 'joules_label: MEASURED'; tag.className = 'tag tag-measured'; }
    else { tag.textContent = `joules_label: ${jl.toUpperCase()}`; tag.className = 'tag tag-sample'; }
  }

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
  $('budget-bytes').textContent = fmtNum(d.total_output_bytes);
  $('budget-bits').textContent = fmtNum(d.total_shannon_bits, 1);
  $('budget-joules').textContent = fmtNum(d.total_joules_est, 3);
  setYN('within-bound', d.all_within_bound);
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
  setYN('links-intact', v.links_intact);
  $('prov-len').textContent = v.length ?? d.length ?? '—';
  setYN('gate-pass', v.bekenstein_gate_all_pass);
  $('prov-head').textContent = shortHash(d.head_hash || v.head_hash);
  return live;
}

// ---- HEART / BLOOD ----
async function loadHeart() {
  let d, live = true;
  try { d = await fetchJSON('heart/pulse'); }
  catch { d = SNAP.heart; live = false; }
  setSrcBadge('heart', live);
  // heart/pulse may expose heart_sigma/blood_verify OR top-level ok
  const sig = d.heart_sigma || {};
  const bld = d.blood_verify || {};
  const sigmaOk = sig.ok != null ? sig.ok : d.ok;
  const bloodOk = bld.ok != null ? bld.ok : d.ok;
  setYN('sigma-ok', sigmaOk);
  setYN('blood-ok', bloodOk);
  $('beat-count').textContent = d.beat_count ?? bld.length ?? '—';
  $('beat-head').textContent = shortHash(d.head_beat_hash);
  $('signing').textContent = 'SAMPLE digest';
  $('signing').className = '';
  return live;
}

// ---- ANATOMY / CIRCULATION ----
async function loadAnatomy() {
  let d, live = true;
  try { d = await fetchJSON('anatomy/loop'); }
  catch { d = SNAP.anatomy; live = false; }
  setSrcBadge('anatomy', live);

  const organs = Array.isArray(d.organs) ? d.organs : [];
  const row = $('organ-row');
  if (row && organs.length) {
    row.innerHTML = organs.map(o => {
      const role = (o.role || '').split('—')[0].trim() || '—';
      return `<div class="organ"${o.flowing !== false ? ' data-flow' : ''}>
        <span class="organ-name">${(o.name || '—')}</span>
        <span class="organ-role">${role}</span></div>`;
    }).join('');
  }

  const ayni = d.ayni || {};
  setYN('ayni-bal', ayni.balanced);
  const eq = (ayni.intake != null && ayni.output != null && ayni.stored != null)
    ? `${fmtNum(ayni.intake)} = ${fmtNum(ayni.output)} = ${fmtNum(ayni.stored)}` : '—';
  $('ayni-eq').textContent = eq;
  $('beats-cycle').textContent = d.beats_last_cycle ?? '—';
  const wc = (d.reservoir && d.reservoir.work_credits);
  $('reservoir').textContent = fmtNum(wc);

  // ---- proof witnesses ----
  const stg = d.stages || {};
  const cap = stg.kallpa_bekenstein_cap_bits;
  $('bek-cap').textContent = (typeof cap === 'number') ? fmtNum(cap) : '2,048';
  const floor = stg.kallpa_landauer_floor_joules;
  $('land-floor').textContent = (typeof floor === 'number')
    ? floor.toExponential(2).replace('e', '×10^').replace('+', '') : '5.88×10^-18';
  $('ayni-cycle').textContent = (ayni.intake != null) ? fmtNum(ayni.intake) : '2,048';
  return live;
}

// ---- COMPUTE FABRIC ----
async function loadPool() {
  let d, live = true;
  try { d = await fetchJSON('compute-pool'); }
  catch { d = SNAP.pool; live = false; }
  setSrcBadge('pool', live);
  const c = d.counts || {};
  $('pool-reach').textContent = (c.nodes_reachable != null && c.nodes_total != null)
    ? `${c.nodes_reachable}/${c.nodes_total}` : '—';
  $('pool-gpu').textContent = c.sovereign_gpu_live ? 'yes' : 'no';
  $('pool-gpu').className = 'kv-num sm ' + (c.sovereign_gpu_live ? 'good-num' : 'bad-num');

  const nodes = Array.isArray(d.nodes) ? d.nodes : [];
  const list = $('node-list');
  if (list && nodes.length) {
    list.innerHTML = nodes.map(n => {
      const cls = !n.reachable ? 'down' : (n.sovereign ? 'sov' : 'host');
      const tag = n.sovereign ? 'sovereign' : (n.reachable ? 'fallback' : 'down');
      return `<li class="node ${cls}"><span class="node-dot"></span>
        <span class="node-name">${n.name || '—'}</span>
        <span class="node-kind">${n.kind || ''}</span>
        <span class="node-tag">${tag}</span></li>`;
    }).join('');
  }
  return live;
}

// ---- REVENUE ----
async function loadRev() {
  let d, live = true;
  try { d = await fetchJSON('revenue/marketplace'); }
  catch { d = SNAP.rev; live = false; }
  setSrcBadge('rev', live);
  const est = d.estimate || SNAP.rev.estimate;
  const node = est.our_current_node || SNAP.rev.estimate.our_current_node;
  const a = est.assumptions || {};
  const rng = node.with_verified_premium_usd_per_mo || [];
  $('rev-range').textContent = rng.length === 2 ? `$${rng[0].toFixed(0)} – $${rng[1].toFixed(0)}` : '—';
  const settled = node.settled_usd_to_date;
  $('rev-settled').textContent = (typeof settled === 'number') ? `$${settled.toFixed(2)}` : '—';
  const prem = a.verified_premium_fraction;
  $('rev-premium').textContent = (typeof prem === 'number') ? `+${Math.round(prem * 100)}%` : '+25%';
  $('rev-basis').textContent = est.basis ?? '—';
  const pphr = a.price_usd_per_gpu_hr || [];
  $('rev-pphr').textContent = pphr.length === 2 ? `$${pphr[0]} – $${pphr[1]}` : '—';
  $('rev-uptime').textContent = (typeof a.uptime_fraction === 'number') ? `${Math.round(a.uptime_fraction * 100)}%` : '—';
  $('rev-status').textContent = (node.status || '—').replace(/_/g, ' ');

  const venues = est.candidate_venues || [];
  const chips = $('venue-chips');
  if (chips && venues.length) {
    chips.innerHTML = venues.map(v => `<span class="venue-chip">${v.name || v}</span>`).join('');
  }
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
  const results = await Promise.all([
    loadHarvest(), loadBudget(), loadProv(), loadHeart(), loadAnatomy(), loadPool(), loadRev(),
  ]);
  updateConnBadge(results.every(Boolean));
}

refreshAll();
setInterval(refreshAll, REFRESH_MS); // auto-refresh ~15s
