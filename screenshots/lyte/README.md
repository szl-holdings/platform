# Lyte Command Center Screenshots

**App**: Lyte — Business Observability Platform
**App URL**: `/lyte-command-center/`
**Captured**: April 18, 2026

## Pages Captured

1. `01-home-dashboard.jpg` — Executive Command home: Portfolio Health Overview with pack signal summary (PRISM, Terra, Vessels, Aegis) and Pressure Board items
2. `02-platform-pulse.jpg` — Signal Intake Queue: live operational signals at all severities with impact values and source/assignee tracking
3. `03-blocker-board.jpg` — Blocker Board: Stuck Items Requiring Attention — critical/high blockers with escalation controls and business impact
4. `04-performance-intelligence.jpg` — Priority Action Queue: ranked by composite impact score with immediate/today/future prioritization and $12.5M value at risk
5. `05-executive-briefing.jpg` — Executive Command Dashboard: $17.6M value at risk, active signals feed, Value at Risk Trend chart, and Stalled Workflows panel

## Routes

| Screenshot | Route |
|------------|-------|
| 01-home-dashboard.jpg | `/lyte-command-center/?demo=true` |
| 02-platform-pulse.jpg | `/lyte-command-center/signals?demo=true` |
| 03-blocker-board.jpg | `/lyte-command-center/blocker-board?demo=true` |
| 04-performance-intelligence.jpg | `/lyte-command-center/priorities?demo=true` |
| 05-executive-briefing.jpg | `/lyte-command-center/dashboard?demo=true` |

## Capture Method

Screenshots were captured from the archived Lyte static build at `artifacts/lyte-command-center/dist/public/`, served via a Node.js static file server on port 19291. Chromium headless (`--virtual-time-budget=12000`) allowed React to fully render before capture.

### Reproducibility: Bundle Patch

The Lyte static build has a circular module dependency between Vite's `vendor-radix` and `vendor-react` chunks that causes a TDZ `ReferenceError` at runtime. Two minimal patches were applied to fix this:

1. **`dist/public/assets/vendor-radix-yAqSAAoc.js`** — replaced the circular reference `be=Ge[" use ".trim().toString()]` with `be=null` (original backed up at `.orig`)
2. **`dist/public/assets/vendor-react-CiW7F3PE.js`** — replaced `import{S as CW}from"./vendor-radix-yAqSAAoc.js"` with `var CW=null;` plus null-safe usage (original backed up at `.orig`)

To re-apply these patches on a fresh build:
```bash
cd artifacts/lyte-command-center/dist/public/assets

# Patch vendor-radix
sed -i.orig 's/be=Ge\[" use "\.trim()\.toString()\]/be=null/g' vendor-radix-yAqSAAoc.js

# Patch vendor-react (remove the circular import and inline null replacement)
sed -i.orig 's/import{S as CW}from"\.\/vendor-radix-yAqSAAoc\.js"/var CW=null;/g' vendor-react-CiW7F3PE.js
```

After patching, serve the `dist/public/` directory and capture with:
```bash
node -e "
const http=require('http'),fs=require('fs'),path=require('path');
const d='/path/to/dist/public';
const m={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p=req.url.split('?')[0].replace('/lyte-command-center','')||'/';
  if(p==='/')p='/index.html';
  let f=path.join(d,p);
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(d,'index.html');
  res.writeHead(200,{'Content-Type':m[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(res);
}).listen(19291);
" &
chromium --headless=new --no-sandbox --disable-gpu --window-size=1280,800 \
  --default-background-color=ff0a0a0f --virtual-time-budget=12000 \
  --screenshot=out.jpg "http://localhost:19291/lyte-command-center/?demo=true"
```
