/**
 * Substrate MCP Gateway — MCP Apps Registry
 *
 * Five domain-specific MCP App UIs conforming to the MCP Apps extension spec.
 * Each app is a self-contained HTML bundle that communicates with the server
 * via the postMessage JSON-RPC bidirectional channel defined by the MCP Apps
 * extension protocol.
 *
 * Apps are served as `ui://` resources. Tool descriptors that produce
 * UI-renderable output reference these via `_meta.ui.resourceUri`.
 *
 * postMessage JSON-RPC protocol (from host → app):
 *   { type: 'mcp/initialize', data: { toolResult, context } }
 *   { type: 'mcp/toolResult', id, data: { result } }
 *
 * postMessage JSON-RPC protocol (from app → host):
 *   { type: 'mcp/callTool', id, data: { toolName, args } }
 *   { type: 'mcp/ready' }
 */

export interface McpAppDescriptor {
  uri: string;
  name: string;
  description: string;
  mimeType: 'text/html';
  csp: string;
  permissions?: string[];
  html: string;
}

// ─── Shared postMessage Bridge JS (inlined into every app) ───────────────────

const BRIDGE_JS = `
(function(){
  var _pending = {};
  var _idCounter = 0;
  window.__mcpBridge = {
    callTool: function(toolName, args) {
      return new Promise(function(resolve, reject) {
        var id = 'req-' + (++_idCounter);
        _pending[id] = { resolve: resolve, reject: reject };
        parent.postMessage({ type: 'mcp/callTool', id: id, data: { toolName: toolName, args: args || {} } }, '*');
        setTimeout(function() {
          if (_pending[id]) {
            delete _pending[id];
            reject(new Error('MCP tool call timed out: ' + toolName));
          }
        }, 30000);
      });
    },
    ready: function() {
      parent.postMessage({ type: 'mcp/ready' }, '*');
    }
  };
  window.addEventListener('message', function(ev) {
    var msg = ev.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'mcp/toolResult' && msg.id && _pending[msg.id]) {
      var p = _pending[msg.id];
      delete _pending[msg.id];
      if (msg.data && msg.data.error) {
        p.reject(new Error(msg.data.error));
      } else {
        p.resolve(msg.data ? msg.data.result : null);
      }
    }
    if (msg.type === 'mcp/initialize' && typeof window.__onMcpInit === 'function') {
      window.__onMcpInit(msg.data);
    }
  });
})();
`;

// ─── 1. DataTableApp ─────────────────────────────────────────────────────────

const DATA_TABLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Data Table — SZL</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0;font-size:13px}
.header{background:#0f1729;border-bottom:1px solid #1e3a5f;padding:10px 14px;display:flex;align-items:center;gap:8px}
.title{font-size:12px;font-weight:700;letter-spacing:1px;color:#60a5fa;text-transform:uppercase}
.badge{background:#1e3a5f;color:#93c5fd;font-size:9px;padding:1px 6px;border-radius:8px}
.toolbar{display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid #1a2a3a;align-items:center;flex-wrap:wrap}
.search{background:#0f1729;border:1px solid #1e3a5f;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:12px;flex:1;min-width:150px;outline:none}
.search:focus{border-color:#3b82f6}
.btn{background:#1e3a5f;border:none;color:#93c5fd;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px}
.btn:hover{background:#2e4a7f}
.btn.export{background:#0d3b1f;color:#4ade80}
.btn.export:hover{background:#1a5c2e}
.table-wrap{overflow-x:auto;max-height:320px;overflow-y:auto}
table{width:100%;border-collapse:collapse}
th{background:#0f1729;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;position:sticky;top:0;cursor:pointer;user-select:none;border-bottom:1px solid #1e3a5f;white-space:nowrap}
th:hover{color:#93c5fd}
th .sort-icon{margin-left:4px;opacity:0.5}
th.sorted .sort-icon{opacity:1;color:#3b82f6}
td{padding:6px 10px;border-bottom:1px solid #111827;color:#d1d5db;font-size:12px}
tr:hover td{background:#0f1729}
.badge-cell{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:600}
.badge-cell.info{background:#1e3a5f;color:#93c5fd}
.badge-cell.warn{background:#431407;color:#fdba74}
.badge-cell.danger{background:#450a0a;color:#f87171}
.badge-cell.success{background:#052e16;color:#4ade80}
.pager{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:11px;color:#6b7280;border-top:1px solid #1a2a3a}
.pager span{flex:1}
.empty{padding:32px;text-align:center;color:#4b5563;font-size:12px}
</style>
</head>
<body>
<div class="header"><div class="title" id="tableTitle">Data Table</div><div class="badge" id="rowCount">0 rows</div></div>
<div class="toolbar">
  <input class="search" id="searchInput" placeholder="Filter rows..." oninput="applyFilter()">
  <button class="btn export" onclick="exportCsv()">Export CSV</button>
</div>
<div class="table-wrap"><table id="mainTable"><thead id="thead"></thead><tbody id="tbody"></tbody></table></div>
<div class="pager"><span id="pageInfo">—</span><button class="btn" id="prevBtn" onclick="prevPage()">Prev</button><button class="btn" id="nextBtn" onclick="nextPage()">Next</button></div>
<script>
${BRIDGE_JS}
var _config = { columns:[], rows:[], pageSize:25, title:'Data Table' };
var _filtered = [];
var _page = 0;
var _sortKey = '';
var _sortAsc = true;

function badgeClass(v){
  var s = String(v).toLowerCase();
  if(['critical','danger','failed','rejected'].some(function(k){return s.includes(k)})) return 'danger';
  if(['warning','pending','medium'].some(function(k){return s.includes(k)})) return 'warn';
  if(['success','approved','ok','active'].some(function(k){return s.includes(k)})) return 'success';
  return 'info';
}

function render(){
  var cols = _config.columns;
  var thead = document.getElementById('thead');
  thead.innerHTML = '<tr>' + cols.map(function(c){
    var icon = (_sortKey===c.key) ? (_sortAsc?'▲':'▼') : '▲';
    var cls = (_sortKey===c.key) ? ' sorted' : '';
    return '<th class="' + cls + '" onclick="sortBy('' + c.key + '')"><span>' + escHtml(c.label) + '</span><span class="sort-icon">' + icon + '</span></th>';
  }).join('') + '</tr>';

  var ps = _config.pageSize || 25;
  var start = _page * ps;
  var pageRows = _filtered.slice(start, start + ps);
  var tbody = document.getElementById('tbody');
  if(pageRows.length === 0){
    tbody.innerHTML = '<tr><td colspan="' + cols.length + '" class="empty">No data</td></tr>';
  } else {
    tbody.innerHTML = pageRows.map(function(row){
      return '<tr>' + cols.map(function(c){
        var v = row[c.key];
        var disp = v === null || v === undefined ? '' : v;
        if(c.type === 'badge'){
          return '<td><span class="badge-cell ' + badgeClass(disp) + '">' + escHtml(String(disp)) + '</span></td>';
        }
        if(c.type === 'date' && disp){
          try{ disp = new Date(String(disp)).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }catch(e){}
        }
        return '<td>' + escHtml(String(disp)) + '</td>';
      }).join('') + '</tr>';
    }).join('');
  }
  document.getElementById('tableTitle').textContent = _config.title || 'Data Table';
  document.getElementById('rowCount').textContent = _filtered.length + ' rows';
  var totalPages = Math.max(1, Math.ceil(_filtered.length / ps));
  document.getElementById('pageInfo').textContent = 'Page ' + (_page+1) + ' of ' + totalPages;
  document.getElementById('prevBtn').disabled = _page === 0;
  document.getElementById('nextBtn').disabled = (_page + 1) >= totalPages;
}

function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function applyFilter(){
  var q = document.getElementById('searchInput').value.toLowerCase();
  _filtered = q ? _config.rows.filter(function(row){
    return Object.values(row).some(function(v){ return String(v||'').toLowerCase().includes(q); });
  }) : _config.rows.slice();
  _page = 0;
  render();
}

function sortBy(key){
  if(_sortKey === key){ _sortAsc = !_sortAsc; } else { _sortKey = key; _sortAsc = true; }
  _filtered.sort(function(a,b){
    var av = a[key], bv = b[key];
    if(av === bv) return 0;
    var less = _sortAsc ? -1 : 1;
    return (av < bv) ? less : -less;
  });
  render();
}

function prevPage(){ if(_page > 0){ _page--; render(); } }
function nextPage(){ var ps=_config.pageSize||25; if((_page+1)*ps < _filtered.length){ _page++; render(); } }

function exportCsv(){
  var cols = _config.columns;
  var header = cols.map(function(c){ return csvEsc(c.label); }).join(',');
  var rows = _filtered.map(function(row){
    return cols.map(function(c){ return csvEsc(row[c.key]); }).join(',');
  });
  var csv = [header].concat(rows).join('\\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = (_config.title || 'data') + '.csv';
  a.click();
}
function csvEsc(v){ var s=String(v===null||v===undefined?'':v); return /[,\\n"]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }

window.__onMcpInit = function(data){
  if(data && data.toolResult){ _config = Object.assign(_config, data.toolResult); }
  _filtered = _config.rows ? _config.rows.slice() : [];
  render();
};

window.__mcpBridge.ready();
render();
</script>
</body>
</html>`;

// ─── 2. ChartApp ─────────────────────────────────────────────────────────────

const CHART_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chart — SZL</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0;font-size:13px}
.header{background:#0f1729;border-bottom:1px solid #1e3a5f;padding:10px 14px;display:flex;align-items:center;gap:8px}
.title{font-size:12px;font-weight:700;letter-spacing:1px;color:#60a5fa;text-transform:uppercase}
.badge{background:#1e3a5f;color:#93c5fd;font-size:9px;padding:1px 6px;border-radius:8px}
.toolbar{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid #1a2a3a;flex-wrap:wrap;align-items:center}
.type-btn{background:#0f1729;border:1px solid #1e3a5f;color:#6b7280;padding:3px 9px;border-radius:4px;cursor:pointer;font-size:11px}
.type-btn.active{background:#1e3a5f;color:#60a5fa;border-color:#3b82f6}
canvas{display:block}
.chart-wrap{padding:14px;position:relative}
.legend{display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;border-top:1px solid #1a2a3a}
.legend-item{display:flex;align-items:center;gap:4px;font-size:11px;color:#9ca3af}
.legend-dot{width:8px;height:8px;border-radius:50%}
.empty{padding:40px;text-align:center;color:#4b5563;font-size:12px}
</style>
</head>
<body>
<div class="header"><div class="title" id="chartTitle">Chart</div><div class="badge" id="chartTypeBadge">bar</div></div>
<div class="toolbar" id="typeSelector"></div>
<div class="chart-wrap"><canvas id="canvas" width="520" height="240"></canvas></div>
<div class="legend" id="legend"></div>
<script>
${BRIDGE_JS}
var COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
var _config = { chartType:'bar', title:'Chart', series:[], data:[], xAxis:null, yAxis:null };
var _type = 'bar';

function flattenData(){
  if(_config.data && _config.data.length){
    if(_config.series && _config.series.length){
      return { labels: _config.data.map(function(d){ return _config.xAxis ? String(d[_config.xAxis.dataKey]||'') : ''; }), series: _config.series.map(function(s){ return { name:s.name, color:s.color, values:_config.data.map(function(d){ return Number(d[s.dataKey||s.name]||0); }) }; }) };
    }
  }
  if(_config.series && _config.series.length && _config.series[0].data){
    var labels = _config.series[0].data.map(function(p){ return String(p.label||p.x||''); });
    return { labels:labels, series: _config.series.map(function(s){ return { name:s.name, color:s.color, values:(s.data||[]).map(function(p){ return Number(p.y||0); }) }; }) };
  }
  return { labels:[], series:[] };
}

function renderChart(){
  var canvas = document.getElementById('canvas');
  var wrap = canvas.parentElement;
  var W = wrap.clientWidth - 28 || 520;
  canvas.width = W;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  var H = canvas.height;
  var t = _type;
  var flat = flattenData();
  if(!flat.labels.length && !flat.series.length){ ctx.fillStyle='#4b5563'; ctx.font='13px system-ui'; ctx.textAlign='center'; ctx.fillText('No data',W/2,H/2); return; }
  document.getElementById('chartTitle').textContent = _config.title || 'Chart';
  document.getElementById('chartTypeBadge').textContent = t;
  if(t==='pie'||t==='donut'){ renderPie(ctx,W,H,flat,t==='donut'); }
  else if(t==='bar'||t==='line'||t==='area'){ renderBarLine(ctx,W,H,flat,t); }
  else if(t==='scatter'){ renderScatter(ctx,W,H,flat); }
  else { renderBarLine(ctx,W,H,flat,'bar'); }
  renderLegend(flat.series);
}

function getColor(s,i){ return s.color || COLORS[i % COLORS.length]; }

function renderBarLine(ctx,W,H,flat,t){
  var PAD={top:20,right:16,bottom:36,left:44};
  var cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  var labels=flat.labels, series=flat.series;
  var n=Math.max(labels.length, series.length ? series[0].values.length : 0);
  if(!n) return;
  var allVals = series.reduce(function(a,s){ return a.concat(s.values); },[]);
  var maxV = Math.max.apply(null, allVals.concat([1]));
  var minV = Math.min(0, Math.min.apply(null, allVals));
  var range = maxV - minV || 1;
  var barW = n > 0 ? (cW / n) * 0.7 / series.length : 10;
  var gap = n > 0 ? cW / n : 0;
  ctx.strokeStyle='#1e3a5f'; ctx.lineWidth=1;
  for(var g=0;g<=4;g++){
    var y=PAD.top+cH - (g/4)*cH;
    ctx.beginPath(); ctx.moveTo(PAD.left,y); ctx.lineTo(PAD.left+cW,y); ctx.stroke();
    ctx.fillStyle='#4b5563'; ctx.font='9px system-ui'; ctx.textAlign='right';
    ctx.fillText(fmt(minV+(range*g/4)), PAD.left-4, y+3);
  }
  for(var i=0;i<n;i++){
    var lx=PAD.left+gap*(i+0.5);
    ctx.fillStyle='#4b5563'; ctx.font='9px system-ui'; ctx.textAlign='center';
    var lbl=(labels[i]||String(i+1)).slice(0,10);
    ctx.fillText(lbl,lx,H-PAD.bottom+14);
  }
  var baseY=PAD.top+cH-(0-minV)/range*cH;
  if(t==='line'||t==='area'){
    series.forEach(function(s,si){
      var col=getColor(s,si);
      if(t==='area'){
        ctx.beginPath(); ctx.moveTo(PAD.left+gap*0.5, baseY);
        s.values.forEach(function(v,i){ ctx.lineTo(PAD.left+gap*(i+0.5), PAD.top+cH-(v-minV)/range*cH); });
        ctx.lineTo(PAD.left+gap*(s.values.length-0.5), baseY); ctx.closePath();
        ctx.fillStyle=col+'33'; ctx.fill();
      }
      ctx.beginPath(); ctx.strokeStyle=col; ctx.lineWidth=2;
      s.values.forEach(function(v,i){
        var px=PAD.left+gap*(i+0.5), py=PAD.top+cH-(v-minV)/range*cH;
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      });
      ctx.stroke();
      s.values.forEach(function(v,i){ var px=PAD.left+gap*(i+0.5),py=PAD.top+cH-(v-minV)/range*cH; ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fillStyle=col;ctx.fill(); });
    });
  } else {
    var groupW=gap*0.8, bw=series.length?groupW/series.length:groupW;
    series.forEach(function(s,si){
      var col=getColor(s,si);
      s.values.forEach(function(v,i){
        var bx=PAD.left+gap*i+(gap-groupW)/2+si*bw;
        var by=v>=0?PAD.top+cH-(v-minV)/range*cH:baseY;
        var bh=Math.abs((v-minV)/range*cH - (0-minV)/range*cH);
        ctx.fillStyle=col; ctx.fillRect(bx,by,bw-1,bh||1);
      });
    });
  }
}

function renderPie(ctx,W,H,flat,donut){
  var cx=W/2, cy=H/2, r=Math.min(W,H)/2-20, ir=donut?r*0.55:0;
  var vals=flat.series.map(function(s){ return s.values.reduce(function(a,b){return a+b},0)||0; });
  var total=vals.reduce(function(a,b){return a+b},0)||1;
  var start=-Math.PI/2;
  vals.forEach(function(v,i){
    var slice=(v/total)*Math.PI*2;
    var col=getColor(flat.series[i],i);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+slice); ctx.closePath();
    ctx.fillStyle=col; ctx.fill();
    if(donut){ ctx.beginPath(); ctx.arc(cx,cy,ir,0,Math.PI*2); ctx.fillStyle='#0a0e1a'; ctx.fill(); }
    var midA=start+slice/2, lx=cx+Math.cos(midA)*(r*0.7), ly=cy+Math.sin(midA)*(r*0.7);
    var pct=Math.round(v/total*100);
    if(pct>5){ ctx.fillStyle='#fff'; ctx.font='bold 10px system-ui'; ctx.textAlign='center'; ctx.fillText(pct+'%',lx,ly+4); }
    start+=slice;
  });
}

function renderScatter(ctx,W,H,flat){
  var PAD={top:20,right:16,bottom:36,left:44};
  var cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  var pts=flat.series.reduce(function(a,s,si){ return a.concat(s.values.map(function(v,i){ return {x:i,y:v,col:getColor(s,si)}; })); },[]);
  var maxX=Math.max.apply(null,pts.map(function(p){return p.x;}).concat([1]));
  var maxY=Math.max.apply(null,pts.map(function(p){return p.y;}).concat([1]));
  pts.forEach(function(p){ var px=PAD.left+(p.x/maxX)*cW, py=PAD.top+cH-(p.y/maxY)*cH; ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fillStyle=p.col;ctx.fill(); });
}

function renderLegend(series){
  var l=document.getElementById('legend');
  l.innerHTML=series.map(function(s,i){ return '<div class="legend-item"><div class="legend-dot" style="background:'+getColor(s,i)+'"></div><span>'+escHtml(s.name)+'</span></div>'; }).join('');
}

function fmt(v){ if(Math.abs(v)>=1000) return (v/1000).toFixed(1)+'k'; return v%1===0?String(v):v.toFixed(1); }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

document.getElementById('typeSelector').innerHTML = ['bar','line','area','pie','donut','scatter'].map(function(t){
  return '<button class="type-btn' + (t===_type?' active':'') + '" onclick="setType(''+t+'')">' + t + '</button>';
}).join('');

function setType(t){
  _type=t;
  document.querySelectorAll('.type-btn').forEach(function(b){ b.classList.toggle('active', b.textContent===t); });
  renderChart();
}

window.__onMcpInit = function(data){
  if(data && data.toolResult){ _config = Object.assign(_config, data.toolResult); _type = _config.chartType || _type; }
  renderChart();
};

window.__mcpBridge.ready();
window.addEventListener('resize', renderChart);
renderChart();
</script>
</body>
</html>`;

// ─── 3. ApprovalApp ──────────────────────────────────────────────────────────

const APPROVAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Approval — SZL</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0;font-size:13px}
.header{background:#140e1a;border-bottom:1px solid #4c1d95;padding:10px 14px;display:flex;align-items:center;gap:8px}
.title{font-size:12px;font-weight:700;letter-spacing:1px;color:#c084fc;text-transform:uppercase}
.risk-badge{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700}
.risk-badge.low{background:#052e16;color:#4ade80}
.risk-badge.medium{background:#431407;color:#fdba74}
.risk-badge.high{background:#7c2d12;color:#fca5a5}
.risk-badge.critical{background:#450a0a;color:#f87171;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
.content{padding:14px}
.section{margin-bottom:12px}
.section-label{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.action-title{font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:4px}
.action-desc{font-size:12px;color:#9ca3af;line-height:1.5}
.impact{background:#1a0e2e;border:1px solid #4c1d95;border-radius:6px;padding:10px 12px;font-size:12px;color:#c4b5fd;line-height:1.5}
.params{background:#0f1320;border:1px solid #1e2a3a;border-radius:6px;padding:10px 12px}
.param-row{display:flex;justify-content:space-between;align-items:flex-start;padding:3px 0;border-bottom:1px solid #111827;font-size:11px}
.param-row:last-child{border:none}
.param-key{color:#6b7280;min-width:100px}
.param-val{color:#d1d5db;text-align:right;max-width:200px;word-break:break-all}
.rationale-input{width:100%;background:#0f1320;border:1px solid #1e2a3a;border-radius:4px;padding:8px;color:#e2e8f0;font-size:12px;resize:vertical;min-height:60px;outline:none;font-family:inherit}
.rationale-input:focus{border-color:#8b5cf6}
.actor-input{width:100%;background:#0f1320;border:1px solid #1e2a3a;border-radius:4px;padding:6px 8px;color:#e2e8f0;font-size:12px;outline:none}
.actor-input:focus{border-color:#8b5cf6}
.actions{display:flex;gap:8px;padding:12px 14px;border-top:1px solid #1a2a3a}
.btn{flex:1;padding:8px;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity 0.15s}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.btn.approve{background:#064e3b;color:#4ade80;border:1px solid #065f46}
.btn.approve:hover:not(:disabled){background:#065f46}
.btn.reject{background:#450a0a;color:#f87171;border:1px solid #7f1d1d}
.btn.reject:hover:not(:disabled){background:#7f1d1d}
.status{padding:20px;text-align:center;display:none}
.status.show{display:block}
.status.approved{color:#4ade80}
.status.rejected{color:#f87171}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid #4b5563;border-top-color:#8b5cf6;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
.expiry{font-size:10px;color:#4b5563;text-align:center;padding-bottom:8px}
</style>
</head>
<body>
<div class="header">
  <div class="title">Approval Required</div>
  <div class="risk-badge" id="riskBadge">—</div>
  <div style="margin-left:auto;font-size:9px;color:#4b5563" id="roleBadge"></div>
</div>
<div id="formArea">
  <div class="content">
    <div class="section">
      <div class="action-title" id="actionTitle">—</div>
      <div class="action-desc" id="actionDesc"></div>
    </div>
    <div class="section">
      <div class="section-label">Impact Summary</div>
      <div class="impact" id="impactSummary">—</div>
    </div>
    <div class="section" id="paramsSection" style="display:none">
      <div class="section-label">Proposed Parameters</div>
      <div class="params" id="paramsTable"></div>
    </div>
    <div class="section">
      <div class="section-label">Actor</div>
      <input class="actor-input" id="actorInput" placeholder="Your name or ID..." value="">
    </div>
    <div class="section">
      <div class="section-label">Rationale (required for rejection)</div>
      <textarea class="rationale-input" id="rationaleInput" placeholder="Provide reasoning for your decision..."></textarea>
    </div>
  </div>
  <div class="expiry" id="expiryText"></div>
  <div class="actions">
    <button class="btn approve" id="approveBtn" onclick="submitDecision('approve')">Approve</button>
    <button class="btn reject" id="rejectBtn" onclick="submitDecision('reject')">Reject</button>
  </div>
</div>
<div class="status" id="statusArea"></div>
<script>
${BRIDGE_JS}
var _config = { actionId:'', actionTitle:'', riskLevel:'high', requiredApproverRole:'operator', impactSummary:'', proposedParameters:{}, callbackUrl:'', expiresAt:'' };

function setLoading(loading){
  document.getElementById('approveBtn').disabled = loading;
  document.getElementById('rejectBtn').disabled = loading;
}

function showStatus(type, msg){
  document.getElementById('formArea').style.display = 'none';
  var s = document.getElementById('statusArea');
  s.className = 'status show ' + type;
  s.innerHTML = '<div style="font-size:20px;margin-bottom:8px">' + (type==='approved'?'✓':'✗') + '</div><div style="font-weight:700;margin-bottom:4px">' + (type==='approved'?'Approved':'Rejected') + '</div><div style="font-size:11px;color:#6b7280">' + escHtml(msg) + '</div>';
}

async function submitDecision(decision){
  var actor = document.getElementById('actorInput').value.trim() || 'mcp-user';
  var rationale = document.getElementById('rationaleInput').value.trim();
  if(decision === 'reject' && !rationale){ alert('A rationale is required for rejection.'); return; }
  setLoading(true);
  try {
    var toolName = decision === 'approve' ? 'substrate_approve' : 'substrate_reject';
    var args = { recommendationId: _config.actionId, actor: actor, domain: _config.domain || 'substrate' };
    if(rationale) args.note = rationale;
    if(decision === 'reject') args.note = rationale;
    var result = await window.__mcpBridge.callTool(toolName, args);
    showStatus(decision === 'approve' ? 'approved' : 'rejected', decision === 'approve' ? 'Action approved. Workflow will resume.' : 'Action rejected. Workflow has been terminated.');
    parent.postMessage({ type: 'mcp/approvalDecision', data: { decision: decision, actionId: _config.actionId, actor: actor, result: result } }, '*');
  } catch(e){
    setLoading(false);
    alert('Decision submission failed: ' + (e.message || String(e)));
  }
}

function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function render(){
  var c = _config;
  document.getElementById('actionTitle').textContent = c.actionTitle || c.actionId || 'Approval Required';
  document.getElementById('actionDesc').textContent = c.actionDescription || '';
  document.getElementById('impactSummary').textContent = c.impactSummary || '—';
  var rb = document.getElementById('riskBadge');
  rb.className = 'risk-badge ' + (c.riskLevel || 'high');
  rb.textContent = (c.riskLevel || 'HIGH').toUpperCase();
  document.getElementById('roleBadge').textContent = 'Requires: ' + (c.requiredApproverRole || 'operator').toUpperCase();
  var params = c.proposedParameters;
  var ps = document.getElementById('paramsSection');
  if(params && Object.keys(params).length > 0){
    ps.style.display = '';
    document.getElementById('paramsTable').innerHTML = Object.entries(params).map(function(kv){
      return '<div class="param-row"><span class="param-key">' + escHtml(kv[0]) + '</span><span class="param-val">' + escHtml(JSON.stringify(kv[1])) + '</span></div>';
    }).join('');
  } else { ps.style.display = 'none'; }
  if(c.expiresAt){ var d=new Date(c.expiresAt); document.getElementById('expiryText').textContent = 'Expires: ' + d.toLocaleString(); }
}

window.__onMcpInit = function(data){
  if(data && data.toolResult){ _config = Object.assign(_config, data.toolResult); }
  render();
};

window.__mcpBridge.ready();
render();
</script>
</body>
</html>`;

// ─── 4. MetricDashboardApp ───────────────────────────────────────────────────

const METRICS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Metrics — SZL</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0;font-size:13px}
.header{background:#0f1729;border-bottom:1px solid #1e3a5f;padding:10px 14px;display:flex;align-items:center;gap:8px}
.title{font-size:12px;font-weight:700;letter-spacing:1px;color:#60a5fa;text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;padding:14px}
.card{background:#0f1729;border:1px solid #1e3a5f;border-radius:8px;padding:12px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.card.success::before{background:#22c55e}
.card.warning::before{background:#f59e0b}
.card.danger::before{background:#ef4444}
.card.info::before{background:#3b82f6}
.metric-label{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
.metric-value{font-size:22px;font-weight:800;color:#f0f9ff;margin-bottom:2px;line-height:1}
.metric-unit{font-size:11px;color:#6b7280;margin-left:2px;font-weight:400}
.trend{display:flex;align-items:center;gap:3px;margin-top:6px;font-size:10px}
.trend.up{color:#4ade80}
.trend.down{color:#f87171}
.trend.stable{color:#9ca3af}
.trend-arrow{font-size:12px}
.trend-val{font-weight:600}
.empty{padding:32px;text-align:center;color:#4b5563;font-size:12px}
.updated{padding:6px 14px;font-size:9px;color:#374151;text-align:center;border-top:1px solid #1a2a3a}
</style>
</head>
<body>
<div class="header"><div class="title" id="dashTitle">Metrics Dashboard</div></div>
<div class="grid" id="grid"><div class="empty">No metrics</div></div>
<div class="updated" id="updatedAt"></div>
<script>
${BRIDGE_JS}
var _config = { title:'Metrics Dashboard', metrics:[], columns:3 };

function sev(m){ return m.severity || (m.trend==='down'?'danger': m.trend==='up'?'success':'info'); }
function trendIcon(t){ return t==='up'?'↑':t==='down'?'↓':'→'; }
function trendClass(t){ return t==='up'?'up':t==='down'?'down':'stable'; }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

function render(){
  document.getElementById('dashTitle').textContent = _config.title || 'Metrics Dashboard';
  var metrics = _config.metrics || [];
  var grid = document.getElementById('grid');
  if(!metrics.length){ grid.innerHTML = '<div class="empty">No metrics configured</div>'; return; }
  grid.innerHTML = metrics.map(function(m){
    var s = sev(m);
    var trend = m.trend ? '<div class="trend ' + trendClass(m.trend) + '"><span class="trend-arrow">' + trendIcon(m.trend) + '</span><span class="trend-val">' + escHtml(m.trendValue||'') + '</span></div>' : '';
    return '<div class="card ' + s + '"><div class="metric-label">' + escHtml(m.label) + '</div><div><span class="metric-value">' + escHtml(String(m.value)) + '</span>' + (m.unit?'<span class="metric-unit">'+escHtml(m.unit)+'</span>':'') + '</div>' + trend + '</div>';
  }).join('');
  document.getElementById('updatedAt').textContent = 'Updated: ' + new Date().toLocaleTimeString();
}

window.__onMcpInit = function(data){
  if(data && data.toolResult){ _config = Object.assign(_config, data.toolResult); }
  render();
};

window.__mcpBridge.ready();
render();
</script>
</body>
</html>`;

// ─── 5. TimelineApp ──────────────────────────────────────────────────────────

const TIMELINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Timeline — SZL</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#e2e8f0;font-size:13px}
.header{background:#0f1729;border-bottom:1px solid #1e3a5f;padding:10px 14px;display:flex;align-items:center;gap:8px}
.title{font-size:12px;font-weight:700;letter-spacing:1px;color:#60a5fa;text-transform:uppercase}
.badge{background:#1e3a5f;color:#93c5fd;font-size:9px;padding:1px 6px;border-radius:8px}
.toolbar{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid #1a2a3a;align-items:center}
.filter-btn{background:#0f1729;border:1px solid #1e3a5f;color:#6b7280;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px}
.filter-btn.active{background:#1e3a5f;color:#60a5fa}
.timeline{padding:14px;max-height:380px;overflow-y:auto}
.event{display:flex;gap:10px;margin-bottom:12px;cursor:pointer}
.dot-col{display:flex;flex-direction:column;align-items:center;min-width:14px}
.dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:2px}
.dot.info{background:#3b82f6}
.dot.warning{background:#f59e0b}
.dot.critical{background:#ef4444}
.dot.success{background:#22c55e}
.line{width:1px;background:#1e3a5f;flex:1;margin-top:2px}
.event-body{flex:1;padding-bottom:8px}
.event-header{display:flex;align-items:flex-start;gap:8px;margin-bottom:3px}
.sev-badge{font-size:8px;padding:1px 5px;border-radius:6px;font-weight:700;white-space:nowrap;flex-shrink:0}
.sev-badge.info{background:#1e3a5f;color:#93c5fd}
.sev-badge.warning{background:#431407;color:#fdba74}
.sev-badge.critical{background:#450a0a;color:#f87171}
.sev-badge.success{background:#052e16;color:#4ade80}
.event-label{font-size:12px;font-weight:600;color:#e2e8f0;line-height:1.3}
.event-meta{font-size:10px;color:#6b7280;margin-top:2px}
.event-desc{font-size:11px;color:#9ca3af;margin-top:4px;line-height:1.4}
.metadata-block{background:#0f1320;border:1px solid #1e2a3a;border-radius:4px;padding:8px;margin-top:6px;font-size:10px;color:#6b7280;font-family:monospace;display:none}
.metadata-block.open{display:block}
.empty{padding:32px;text-align:center;color:#4b5563;font-size:12px}
</style>
</head>
<body>
<div class="header"><div class="title" id="timelineTitle">Timeline</div><div class="badge" id="eventCount">0 events</div></div>
<div class="toolbar">
  <span style="font-size:10px;color:#6b7280;margin-right:4px">Filter:</span>
  <button class="filter-btn active" onclick="filterSev('')" id="f-all">All</button>
  <button class="filter-btn" onclick="filterSev('critical')" id="f-critical">Critical</button>
  <button class="filter-btn" onclick="filterSev('warning')" id="f-warning">Warning</button>
  <button class="filter-btn" onclick="filterSev('info')" id="f-info">Info</button>
  <button class="filter-btn" onclick="filterSev('success')" id="f-success">Success</button>
</div>
<div class="timeline" id="timeline"><div class="empty">No events</div></div>
<script>
${BRIDGE_JS}
var _config = { title:'Timeline', events:[], ascending:false };
var _filter = '';
var _expanded = {};

function filterSev(sev){
  _filter = sev;
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('f-' + (sev||'all')).classList.add('active');
  render();
}

function toggleMeta(idx){
  _expanded[idx] = !_expanded[idx];
  render();
}

function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function fmtTime(ts){
  try{
    var d=new Date(ts);
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' ' + d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }catch(e){ return ts||''; }
}

function render(){
  var events = (_config.events||[]).slice();
  if(!_config.ascending) events.reverse();
  var filtered = _filter ? events.filter(function(e){ return (e.severity||'info')===_filter; }) : events;
  document.getElementById('timelineTitle').textContent = _config.title || 'Timeline';
  document.getElementById('eventCount').textContent = filtered.length + ' events';
  var tl = document.getElementById('timeline');
  if(!filtered.length){ tl.innerHTML='<div class="empty">No events' + (_filter?' for filter: '+_filter:'') + '</div>'; return; }
  tl.innerHTML = filtered.map(function(ev,i){
    var sev = ev.severity || 'info';
    var meta = ev.metadata && Object.keys(ev.metadata).length > 0;
    var metaHtml = meta ? '<div class="metadata-block' + (_expanded[i]?' open':'') + '">' + escHtml(JSON.stringify(ev.metadata,null,2)) + '</div>' : '';
    var desc = ev.description ? '<div class="event-desc">' + escHtml(ev.description) + '</div>' : '';
    var actor = ev.actor ? ' · <span>' + escHtml(ev.actor) + '</span>' : '';
    return '<div class="event" onclick="toggleMeta(' + i + ')">' +
      '<div class="dot-col"><div class="dot ' + sev + '"></div>' + (i<filtered.length-1?'<div class="line"></div>':'') + '</div>' +
      '<div class="event-body"><div class="event-header"><span class="sev-badge ' + sev + '">' + sev.toUpperCase() + '</span><span class="event-label">' + escHtml(ev.label) + '</span></div>' +
      '<div class="event-meta">' + fmtTime(ev.timestamp) + actor + '</div>' + desc + metaHtml +
      '</div></div>';
  }).join('');
}

window.__onMcpInit = function(data){
  if(data && data.toolResult){ _config = Object.assign(_config, data.toolResult); }
  render();
};

window.__mcpBridge.ready();
render();
</script>
</body>
</html>`;

// ─── App Registry ─────────────────────────────────────────────────────────────

const STRICT_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  "connect-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

export const MCP_APP_REGISTRY: McpAppDescriptor[] = [
  {
    uri: 'ui://szl/data-table',
    name: 'SZL Data Table Explorer',
    description: 'Interactive data table with sorting, text filtering, pagination, and CSV export.',
    mimeType: 'text/html',
    csp: STRICT_CSP,
    html: DATA_TABLE_HTML,
  },
  {
    uri: 'ui://szl/chart',
    name: 'SZL Chart Visualizer',
    description:
      'Recharts-compatible chart renderer for line, bar, pie, area, scatter, and donut charts.',
    mimeType: 'text/html',
    csp: STRICT_CSP,
    html: CHART_HTML,
  },
  {
    uri: 'ui://szl/approval-form',
    name: 'SZL Approval Workflow Form',
    description:
      'Governed approval/rejection form that calls substrate_approve/substrate_reject via the MCP tool-call bridge.',
    mimeType: 'text/html',
    csp: STRICT_CSP,
    permissions: ['tools/call'],
    html: APPROVAL_HTML,
  },
  {
    uri: 'ui://szl/metrics',
    name: 'SZL Metric Dashboard',
    description: 'KPI card grid with trend indicators and severity-coded styling.',
    mimeType: 'text/html',
    csp: STRICT_CSP,
    html: METRICS_HTML,
  },
  {
    uri: 'ui://szl/timeline',
    name: 'SZL Timeline / Audit Trail',
    description:
      'Chronological event trail with severity badges, actor attribution, and expandable metadata.',
    mimeType: 'text/html',
    csp: STRICT_CSP,
    html: TIMELINE_HTML,
  },
];

/** Look up an app descriptor by its ui:// URI */
export function getMcpApp(uri: string): McpAppDescriptor | undefined {
  return MCP_APP_REGISTRY.find((a) => a.uri === uri);
}

/** Map from tool name to the ui:// resource URI it renders */
export const TOOL_UI_MAP: Record<string, string> = {
  substrate_list_workflows: 'ui://szl/data-table',
  substrate_list_approvals: 'ui://szl/approval-form',
  substrate_get_run: 'ui://szl/timeline',
  substrate_submit_run: 'ui://szl/metrics',
  substrate_counterfactual: 'ui://szl/chart',
};
