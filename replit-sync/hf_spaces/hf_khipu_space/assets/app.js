/* ===========================================================
   SZL Khipu Constellation — app logic
   - 3D witnessed-agreement mesh via 3d-force-graph (MIT)
   - Live fetch from a11oy compute-pool with honest-degrade
     to a labeled, bundled snapshot.
   Doctrine v11. Khipu BFT = Conjecture 2 (PROPOSED, NOT proven).
   =========================================================== */

import ForceGraph3D from 'https://esm.sh/3d-force-graph@1.73.4';

const API = 'https://a11oy.net/api/a11oy/v1/compute-pool';
const SNAPSHOT_URL = 'assets/snapshot-compute-pool.json';
const REFRESH_MS = 15000;

const COLORS = {
  sovereign: '#2bd9c8',
  hosted: '#9a6bff',
  cpu: '#38e0ff',
  down: '#e8736a',
  quorum: '#ffd76b',
};

let Graph = null;
let currentView = 'mesh'; // 'mesh' | 'quorum'
let lastData = null;

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const fmt = (n) => (n === null || n === undefined ? '—' : n);

function setSourceBadge(mode) {
  const pill = $('#source-pill');
  const dot = pill.querySelector('.dot');
  const label = pill.querySelector('.source-label');
  dot.className = 'dot ' + (mode === 'live' ? 'live' : mode === 'snapshot' ? 'snapshot' : 'down');
  label.textContent =
    mode === 'live' ? 'LIVE · a11oy compute-pool'
    : mode === 'snapshot' ? 'SNAPSHOT · live fetch unavailable'
    : 'OFFLINE';
  $('#data-source-note').textContent =
    mode === 'live'
      ? 'Reading the live a11oy compute-pool probe. Each value below reflects a real probe this load.'
      : 'Live fetch was unavailable (network or cross-origin restriction). Showing a clearly-labeled bundled snapshot — not live data. No values are fabricated.';
}

function stamp() {
  $('#updated-stamp').textContent = 'updated ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
}

/* ---------- data fetch with honest-degrade ---------- */
async function loadData() {
  try {
    const res = await fetch(API, { cache: 'no-store' });
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    setSourceBadge('live');
    return data;
  } catch (e) {
    try {
      const res = await fetch(SNAPSHOT_URL, { cache: 'no-store' });
      const data = await res.json();
      setSourceBadge('snapshot');
      return data;
    } catch (e2) {
      setSourceBadge('down');
      return null;
    }
  }
}

/* ---------- build graph model from compute-pool ---------- */
function buildGraphModel(data, view) {
  const nodes = [];
  const links = [];
  if (!data || !Array.isArray(data.nodes)) return { nodes, links };

  // A witnessed-agreement coordinator at the center (the khipu cord head)
  nodes.push({ id: '__cord__', kind: 'cord', label: 'khipu cord', val: 9, color: COLORS.quorum });

  data.nodes.forEach((n) => {
    let color = COLORS.hosted;
    if (!n.reachable) color = COLORS.down;
    else if (n.kind === 'cpu') color = COLORS.cpu;
    else if (n.sovereign) color = COLORS.sovereign;

    nodes.push({
      id: n.name,
      label: n.name,
      kind: n.kind,
      sovereign: !!n.sovereign,
      reachable: !!n.reachable,
      color,
      val: n.sovereign ? 6 : 3.5,
      detail: n.detail || n.note || '',
    });
    // attestation edge to the cord
    links.push({
      source: '__cord__',
      target: n.name,
      reachable: !!n.reachable,
      sovereign: !!n.sovereign,
    });
  });

  // Quorum view: highlight a 3-of-4 witness subset (reachable witnesses, capped at 4)
  if (view === 'quorum') {
    const witnesses = nodes.filter((n) => n.kind !== 'cord' && n.reachable).slice(0, 4);
    witnesses.forEach((w, i) => { w.__quorum = true; w.__qi = i; });
    // mesh edges among the quorum witnesses (mutual attestation)
    for (let i = 0; i < witnesses.length; i++) {
      for (let j = i + 1; j < witnesses.length; j++) {
        links.push({ source: witnesses[i].id, target: witnesses[j].id, quorum: true });
      }
    }
    // dim non-quorum
    nodes.forEach((n) => { if (n.kind !== 'cord' && !n.__quorum) n.color = 'rgba(120,140,170,0.35)'; });
  }

  return { nodes, links };
}

function nodeThreeLabel(n) {
  if (n.kind === 'cord') return 'khipu cord (agreement head)';
  return `${n.label}\n${n.sovereign ? 'sovereign' : 'hosted fallback'} · ${n.reachable ? 'reachable' : 'unreachable'}`;
}

function renderGraph(data) {
  const model = buildGraphModel(data, currentView);
  if (!Graph) {
    const el = $('#graph');
    Graph = ForceGraph3D({ rendererConfig: { antialias: true, alpha: true } })(el)
      .backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .nodeLabel(nodeThreeLabel)
      .nodeColor((n) => n.color)
      .nodeVal((n) => n.val)
      .nodeOpacity(0.95)
      .nodeResolution(16)
      .linkColor((l) => l.quorum ? COLORS.quorum : (l.reachable === false ? 'rgba(232,115,106,0.5)' : 'rgba(43,217,200,0.35)'))
      .linkWidth((l) => l.quorum ? 1.6 : 0.6)
      .linkDirectionalParticles((l) => (l.quorum ? 4 : l.reachable === false ? 0 : 2))
      .linkDirectionalParticleWidth(1.6)
      .linkDirectionalParticleSpeed(0.006)
      .linkOpacity(0.5)
      .width(el.clientWidth)
      .height(el.clientHeight);

    Graph.graphData(model);

    // gentle auto-orbit unless reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let angle = 0;
      const dist = 240;
      Graph.cameraPosition({ z: dist });
      setInterval(() => {
        angle += Math.PI / 900;
        Graph.cameraPosition({ x: dist * Math.sin(angle), z: dist * Math.cos(angle) });
      }, 40);
    }

    window.addEventListener('resize', () => {
      Graph.width(el.clientWidth).height(el.clientHeight);
    });
  } else {
    Graph.graphData(model);
  }
}

/* ---------- KPI + table render ---------- */
function renderStats(data) {
  if (!data) {
    $('#kpi-nodes').textContent = '—';
    $('#kpi-reachable').textContent = '—';
    $('#kpi-gpu').textContent = '—';
    $('#kpi-sov').textContent = '—';
    return;
  }
  const c = data.counts || {};
  $('#kpi-nodes').textContent = fmt(c.nodes_total);
  $('#kpi-reachable').textContent = fmt(c.nodes_reachable);
  $('#kpi-gpu').textContent = fmt(c.gpu_nodes_reachable);
  $('#kpi-sov').textContent = c.sovereign_gpu_live ? 'LIVE' : 'down';

  // quorum readout: reachable witnesses present, n-of-m
  const reach = c.nodes_reachable ?? 0;
  $('#quorum-readout').textContent = `${Math.min(3, reach)}-of-4 reachable in witness set`;

  // table
  const tbody = $('#witness-body');
  tbody.innerHTML = '';
  (data.nodes || []).forEach((n) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(n.name)}</td>
      <td class="mono">${escapeHtml(n.kind)}</td>
      <td><span class="tag ${n.sovereign ? 'sov' : 'host'}">${n.sovereign ? 'sovereign' : 'hosted'}</span></td>
      <td><span class="tag ${n.reachable ? 'ok' : 'down'}">${n.reachable ? 'reachable' : 'unreachable'}</span></td>
      <td class="mono">${escapeHtml((n.capabilities || []).join(', ') || '—')}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- view toggle ---------- */
function setView(v) {
  currentView = v;
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.view === v ? 'true' : 'false');
  });
  if (lastData) renderGraph(lastData);
}

/* ---------- main cycle ---------- */
async function cycle() {
  const data = await loadData();
  lastData = data;
  renderGraph(data);
  renderStats(data);
  stamp();
}

document.querySelectorAll('[data-view]').forEach((b) => {
  b.addEventListener('click', () => setView(b.dataset.view));
});

cycle();
setInterval(cycle, REFRESH_MS);
