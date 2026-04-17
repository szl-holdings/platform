#!/usr/bin/env python3
"""Build Series-A-grade LinkedIn carousel slides (1080x1350) with branded chrome
from raw product screenshots. Outputs to LINKEDIN-LAUNCH/images/."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, glob, subprocess

W, H = 1080, 1350
BG = (8, 10, 14)
INK = (240, 244, 250)
DIM = (140, 150, 165)
ACCENT = (88, 200, 255)
GOLD = (212, 175, 90)
PANEL = (16, 20, 28)
LINE = (38, 44, 56)

OUT = "LINKEDIN-LAUNCH/images"
RAW = "LINKEDIN-LAUNCH/raw-screenshots"
os.makedirs(OUT, exist_ok=True)

def font(sz, bold=False):
    p = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if os.path.exists(p):
        return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

F_HERO = font(72, True)
F_H1   = font(54, True)
F_H2   = font(40, True)
F_BODY = font(26)
F_LBL  = font(20, True)
F_NUM  = font(18, True)
F_MONO = font(22)

def base_canvas():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # subtle grid
    for x in range(0, W, 60):
        d.line([(x,0),(x,H)], fill=(14,17,22), width=1)
    for y in range(0, H, 60):
        d.line([(0,y),(W,y)], fill=(14,17,22), width=1)
    return img, d

def chrome(d, slide_n, total, kicker):
    # top bar
    d.rectangle([0,0,W,68], fill=(6,8,12))
    d.line([(0,68),(W,68)], fill=LINE, width=1)
    # SZL mark
    d.rounded_rectangle([40,18,116,52], radius=6, outline=ACCENT, width=2)
    d.text((52, 24), "SZL", font=F_LBL, fill=ACCENT)
    d.text((132, 26), "SZL HOLDINGS", font=F_LBL, fill=INK)
    d.text((332, 26), "·  GOVERNED DECISION INFRASTRUCTURE", font=F_LBL, fill=DIM)
    # slide number
    d.text((W-110, 26), f"{slide_n:02d} / {total:02d}", font=F_NUM, fill=DIM)
    # bottom bar
    d.rectangle([0,H-56,W,H], fill=(6,8,12))
    d.line([(0,H-56),(W,H-56)], fill=LINE, width=1)
    d.text((40, H-40), "szlholdings.com", font=F_NUM, fill=DIM)
    d.text((W-380, H-40), "github.com/stephenlutar2-hash  ·  @stephen_38454", font=F_NUM, fill=DIM)
    if kicker:
        d.text((40, 100), kicker, font=F_LBL, fill=ACCENT)

def fit(img_path, max_w, max_h):
    im = Image.open(img_path).convert("RGB")
    iw, ih = im.size
    r = min(max_w/iw, max_h/ih)
    return im.resize((int(iw*r), int(ih*r)), Image.LANCZOS)

def screenshot_panel(img, x, y, w, h, src_path, label=None):
    """Place a screenshot inside a rounded panel with subtle shadow + title bar."""
    d = ImageDraw.Draw(img)
    # shadow
    sh = Image.new("RGBA", (w+40, h+40), (0,0,0,0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([20,20,w+20,h+20], radius=14, fill=(0,0,0,140))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    img.paste(sh, (x-20, y-10), sh)
    # panel
    d.rounded_rectangle([x,y,x+w,y+h], radius=14, fill=PANEL, outline=LINE, width=1)
    # browser chrome
    d.rectangle([x+1,y+1,x+w-1,y+38], fill=(22,26,34))
    for i,c in enumerate([(255,95,86),(255,189,46),(39,201,63)]):
        d.ellipse([x+18+i*22, y+13, x+30+i*22, y+25], fill=c)
    if label:
        d.text((x+92, y+13), label, font=F_NUM, fill=DIM)
    # screenshot fitted into the panel body
    body_w, body_h = w-20, h-50
    pic = fit(src_path, body_w, body_h)
    px = x + (w-pic.width)//2
    py = y + 40 + (body_h-pic.height)//2
    img.paste(pic, (px, py))

# ---- SLIDE 1: COVER ----
def slide_cover():
    img, d = base_canvas()
    chrome(d, 1, 11, None)
    # accent block
    d.rectangle([40, 130, 200, 138], fill=ACCENT)
    d.text((40, 162), "SERIES A   ·   PUBLIC LAUNCH", font=F_LBL, fill=ACCENT)
    d.text((40, 215), "The governed", font=F_HERO, fill=INK)
    d.text((40, 295), "infrastructure for", font=F_HERO, fill=INK)
    d.text((40, 375), "high-consequence", font=F_HERO, fill=INK)
    d.text((40, 455), "decisions.", font=F_HERO, fill=GOLD)
    d.text((40, 565), "Not a dashboard. Not an AI copilot.", font=F_BODY, fill=DIM)
    d.text((40, 600), "The structural layer between signal and action —", font=F_BODY, fill=DIM)
    d.text((40, 632), "with governance, attribution, and outcome tracking on every decision.", font=F_BODY, fill=DIM)
    # 6-pack chips
    chips = [("Lyte/Pulse","execution"),("Vessels","maritime"),("Terra","real estate"),
             ("PRISM/CJ","advisory"),("Aegis","defense"),("Imperium","platform")]
    cx, cy = 40, 740
    for i,(n,k) in enumerate(chips):
        col = i%3; row = i//3
        x = cx + col*330; y = cy + row*120
        d.rounded_rectangle([x,y,x+310,y+98], radius=10, outline=LINE, width=1, fill=PANEL)
        d.text((x+18, y+18), n, font=F_H2, fill=INK)
        d.text((x+18, y+66), k.upper(), font=F_LBL, fill=ACCENT)
    # by-line
    d.text((40, 1010), "BY  STEPHEN LUTAR  ·  FOUNDER + ARCHITECT, SZL HOLDINGS", font=F_LBL, fill=DIM)
    d.text((40, 1042), "1 month build  ·  9 deployable surfaces  ·  120+ tables  ·  TypeScript end-to-end", font=F_BODY, fill=INK)
    img.save(f"{OUT}/01-cover.jpg", quality=92)

# ---- SLIDE 2: WHAT IS THIS ----
def slide_thesis():
    img, d = base_canvas()
    chrome(d, 2, 11, "01  ·  THE THESIS")
    d.text((40, 160), "Enterprises don't need", font=F_H1, fill=INK)
    d.text((40, 222), "another AI copilot.", font=F_H1, fill=INK)
    d.text((40, 304), "They need an audit trail", font=F_H1, fill=GOLD)
    d.text((40, 366), "for every decision a model touches.", font=F_H1, fill=GOLD)
    # 8-step pipeline
    steps = ["Signal","Context","Recommendation","Simulation","Policy","Execution","Proof","Outcome"]
    sx, sy = 40, 520; gap = 8; cw = (W-80-gap*7)//8
    for i,s in enumerate(steps):
        x = sx + i*(cw+gap)
        d.rounded_rectangle([x,sy,x+cw,sy+90], radius=8, fill=PANEL, outline=ACCENT, width=1)
        d.text((x+10, sy+12), f"{i+1:02d}", font=F_LBL, fill=ACCENT)
        d.text((x+10, sy+50), s, font=F_LBL, fill=INK)
    d.text((40, 660), "→  every step is logged, attributed, replayable, and policy-gated", font=F_BODY, fill=DIM)
    # 3 columns
    cols = [
        ("GUARDIAN", "8-tier policy engine. Pre-flight, in-flight, post-flight checks. Block / warn / log on every model call."),
        ("TRACE GRAPH", "OpenTelemetry-native. Every signal → recommendation → action edge persisted as a queryable DAG."),
        ("EVAL OS", "Continuous eval gates promote prompts and tools. No silent regressions. No vibes-based shipping."),
    ]
    cx, cy = 40, 780; cw = (W-80-40)//3
    for i,(n,b) in enumerate(cols):
        x = cx + i*(cw+20)
        d.rounded_rectangle([x,cy,x+cw,cy+440], radius=10, fill=PANEL, outline=LINE, width=1)
        d.rectangle([x,cy,x+cw,cy+6], fill=ACCENT)
        d.text((x+22, cy+30), n, font=F_H2, fill=INK)
        # wrap body
        words = b.split(); line=""; ly = cy+90
        for w in words:
            t = (line+" "+w).strip()
            if d.textlength(t, font=F_BODY) > cw-44:
                d.text((x+22, ly), line, font=F_BODY, fill=DIM); ly += 36; line = w
            else: line = t
        if line: d.text((x+22, ly), line, font=F_BODY, fill=DIM)
    img.save(f"{OUT}/02-thesis.jpg", quality=92)

# ---- SLIDE 3..N: PRODUCT SHOTS ----
PRODUCT_SLIDES = [
    ("00-szl-holdings-home-FRESH.jpg", "02  ·  PARENT PLATFORM", "SZL HOLDINGS  ·  GOVERNED INFRASTRUCTURE",
     "The hub. Lyte, Pulse, Vessels, Terra, Carlota Jo, Aegis, and Imperium share one governance plane, one trace graph, one eval gate.",
     "szlholdings.com  ·  shipped today"),
    ("03-pulse-ai-briefing.jpg", "03  ·  EXECUTIVE BRIEFING", "PULSE  ·  AI EXECUTIVE BRIEFING",
     "Daily briefings that cite their sources. Every claim links back to a trace, a policy decision, and a named owner.",
     "/pulse  ·  evidence-tier briefings"),
    ("04-vessels-fleet-command.jpg", "04  ·  MARITIME OPS", "VESSELS  ·  MARITIME COMMAND",
     "Fleet operations with provenance. Route, fuel, ETA, exception — auditable from sensor to action to outcome.",
     "/vessels  ·  fleet operations"),
    ("07-terra-real-estate-intelligence.jpg", "05  ·  PROPERTY INTEL", "TERRA  ·  REAL ESTATE INTELLIGENCE",
     "Property scenarios stitched from MLS, parcel, comp, and policy feeds. Every projection is replayable end-to-end.",
     "/terra  ·  property intelligence"),
    ("08-carlota-jo-home.jpg", "06  ·  PRISM ADVISORY", "CARLOTA JO  ·  STRATEGIC ADVISORY",
     "PRISM framework: People, Revenue, Infrastructure, Security, Market — operationalized as a working surface, not a slide.",
     "/carlota-jo  ·  consulting practice"),
    ("13-aegis-defense-intelligence.jpg", "07  ·  DEFENSE", "AEGIS  ·  DEFENSE & INTELLIGENCE",
     "Threat fusion, scenario rehearsal, and policy-gated response — built for sovereign-grade environments.",
     "/aegis  ·  defense surface"),
    ("10-command-unified-command.jpg", "08  ·  OPERATOR CONSOLE", "UNIFIED COMMAND  ·  CROSS-DOMAIN",
     "Single pane across every domain pack. Trace any open exception back to its first detected signal in seconds.",
     "/command  ·  operator console"),
    ("11-mobile-cortex-home.jpg", "09  ·  ON-CALL", "CORTEX MOBILE  ·  ON-CALL OPS",
     "The same audit trail in your pocket. Approve, decline, or escalate — every action is signed and replayable.",
     "Expo  ·  iOS + Android"),
]

def slide_product(n_total_so_far, n, total, src, kicker, headline, caption, label):
    img, d = base_canvas()
    chrome(d, n_total_so_far, total, kicker)
    d.text((40, 160), headline, font=F_H2, fill=INK)
    # screenshot panel
    screenshot_panel(img, 40, 230, W-80, 720, os.path.join(RAW, src), label)
    # caption
    ly = 980
    words = caption.split(); line=""
    for w in words:
        t=(line+" "+w).strip()
        if d.textlength(t, font=F_BODY) > W-80:
            d.text((40, ly), line, font=F_BODY, fill=DIM); ly+=36; line=w
        else: line=t
    if line: d.text((40, ly), line, font=F_BODY, fill=DIM)
    slug = headline.split("·")[0].strip().lower().replace(" ", "-")
    img.save(f"{OUT}/{n_total_so_far:02d}-{slug}.jpg", quality=92)

# ---- LAST SLIDE: CTA ----
def slide_cta(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "·  WORK WITH US")
    d.text((40, 170), "If you ship", font=F_HERO, fill=INK)
    d.text((40, 250), "high-consequence", font=F_HERO, fill=INK)
    d.text((40, 330), "decisions —", font=F_HERO, fill=GOLD)
    d.text((40, 430), "let's talk.", font=F_HERO, fill=INK)

    rows = [
        ("Design partner", "10 enterprise pilots. Defense, maritime, real estate, financial services."),
        ("Series A", "Now raising. Operator-led. Evidence-first. No theater."),
        ("Hiring", "Founding engineers. Distributed systems, governance, applied ML."),
    ]
    ry = 580
    for n_, b in rows:
        d.rounded_rectangle([40, ry, W-40, ry+110], radius=10, fill=PANEL, outline=LINE, width=1)
        d.rectangle([40, ry, 46, ry+110], fill=ACCENT)
        d.text((70, ry+18), n_.upper(), font=F_LBL, fill=ACCENT)
        d.text((70, ry+50), b, font=F_BODY, fill=INK)
        ry += 130

    d.text((40, 990), "STEPHEN LUTAR  ·  FOUNDER + ARCHITECT", font=F_LBL, fill=ACCENT)
    d.text((40, 1024), "stephen@szlholdings.com", font=F_BODY, fill=INK)
    d.text((40, 1062), "linkedin.com/in/stephen-l-279315240", font=F_BODY, fill=INK)
    d.text((40, 1100), "github.com/stephenlutar2-hash  ·  medium.com/@stephen_38454  ·  szlholdings.substack.com", font=F_NUM, fill=DIM)
    d.text((40, 1138), "→  szlholdings.com", font=F_H2, fill=GOLD)
    img.save(f"{OUT}/{n:02d}-cta.jpg", quality=92)

# =====================================================================
#  FOUNDATION 07 SLIDES  —  the new substrate that just merged
# =====================================================================
import math

def slide_foundation_stack(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "10  ·  THE FOUNDATION  (07)")
    d.text((40, 160), "Six primitives.", font=F_HERO, fill=INK)
    d.text((40, 240), "One governed substrate.", font=F_HERO, fill=GOLD)
    d.text((40, 340), "Every domain pack composes the same six layers — so a maritime",
           font=F_BODY, fill=DIM)
    d.text((40, 372), "trace and a real-estate trace look identical to the audit log.",
           font=F_BODY, fill=DIM)

    layers = [
        ("CONSTELLATION", "Cross-domain entity graph. Property ↔ vessel ↔ matter ↔ incident ↔ signal."),
        ("TRACE GRAPH",   "Every signal → recommendation → action edge persisted as a queryable DAG."),
        ("GUARDIAN",      "8-tier policy engine on every model call. Block / warn / escalate / log."),
        ("EVAL OS",       "Continuous gates promote prompts and tools. No silent regressions."),
        ("MEMORY FABRIC", "Retrieval that knows what it's allowed to remember. PII-aware. Tenant-aware."),
        ("TOOL MESH",     "Every external action is approved, signed, audited, replayable."),
    ]
    ly = 460; rh = 100; gap = 12
    for i,(name, desc) in enumerate(layers):
        y = ly + i*(rh+gap)
        d.rounded_rectangle([40, y, W-40, y+rh], radius=10, fill=PANEL, outline=LINE, width=1)
        d.rectangle([40, y, 46, y+rh], fill=ACCENT)
        d.text((70, y+18), f"{i+1:02d}  ·  {name}", font=F_LBL, fill=ACCENT)
        d.text((70, y+50), desc, font=F_BODY, fill=INK)
    img.save(f"{OUT}/{n:02d}-foundation-stack.jpg", quality=92)

def slide_constellation_graph(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "11  ·  CONSTELLATION  ·  CROSS-DOMAIN GRAPH")
    d.text((40, 160), "One incident.", font=F_H1, fill=INK)
    d.text((40, 222), "Five domains.", font=F_H1, fill=INK)
    d.text((40, 304), "One audit trail.", font=F_H1, fill=GOLD)
    d.text((40, 384), "Live demo seed: \"Harbor View Tower\" — a real-estate property whose",
           font=F_BODY, fill=DIM)
    d.text((40, 416), "title dispute, vessel charter, security incident, and revenue drift",
           font=F_BODY, fill=DIM)
    d.text((40, 448), "are all linked in Constellation from day one.", font=F_BODY, fill=DIM)

    # Force-positioned 5-node graph
    cx, cy, r = W//2, 920, 280
    nodes = [
        ("TERRA",   "Harbor View Tower",    "property",         (cx,           cy - r)),
        ("VESSELS", "Charter MS-447",       "shipment",         (cx + int(r*0.95), cy - int(r*0.31))),
        ("LYTE",    "Revenue drift -18%",   "financial signal", (cx + int(r*0.59), cy + int(r*0.81))),
        ("AEGIS",   "Site incident #2207",  "security event",   (cx - int(r*0.59), cy + int(r*0.81))),
        ("PRISM",   "Title dispute M-019",  "legal matter",     (cx - int(r*0.95), cy - int(r*0.31))),
    ]
    edges = [(0,1,"supplies"),(0,2,"revenue"),(0,3,"site of"),(0,4,"matter of"),
             (3,4,"affects"),(2,4,"triggered by")]

    # edges first
    for a,b,lbl in edges:
        x1,y1 = nodes[a][3]; x2,y2 = nodes[b][3]
        d.line([(x1,y1),(x2,y2)], fill=(60,72,90), width=2)
        mx,my = (x1+x2)//2,(y1+y2)//2
        # tiny edge label chip
        tw = int(d.textlength(lbl, font=F_NUM)) + 16
        d.rounded_rectangle([mx-tw//2, my-13, mx+tw//2, my+13], radius=6, fill=BG, outline=(60,72,90), width=1)
        d.text((mx-tw//2+8, my-9), lbl, font=F_NUM, fill=DIM)

    # nodes on top
    for tag, name, kind, (x,y) in nodes:
        d.ellipse([x-78, y-78, x+78, y+78], fill=PANEL, outline=ACCENT, width=2)
        d.text((x - int(d.textlength(tag,  font=F_LBL))//2, y-30), tag,  font=F_LBL,  fill=ACCENT)
        d.text((x - int(d.textlength(name, font=F_NUM))//2, y-2),  name, font=F_NUM,  fill=INK)
        d.text((x - int(d.textlength(kind, font=F_NUM))//2, y+20), kind, font=F_NUM,  fill=DIM)

    d.text((40, 1230), "5 nodes  ·  6 cross-domain edges  ·  every edge carries provenance, confidence, and a source trace",
           font=F_NUM, fill=DIM)
    img.save(f"{OUT}/{n:02d}-constellation-graph.jpg", quality=92)

def slide_smoke_pipeline(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "12  ·  THE 12-STEP SMOKE  ·  SIGNAL → EXEC BRIEF")
    d.text((40, 160), "End-to-end, in 12 verifiable steps.", font=F_H2, fill=INK)
    d.text((40, 210), "Every release runs this. Every step is a passing test.", font=F_BODY, fill=DIM)

    steps = [
        ("01","Create entity",          "Constellation node with provenance"),
        ("02","Cross-domain edges",     "Link to other domain entities"),
        ("03","Agent run",              "Tool registered, handler invoked"),
        ("04","Trace capture",          "Run persisted to trace store"),
        ("05","Eval grade",             "Output scored by evals-core"),
        ("06","Policy: allow",          "Low-risk recommendation routes"),
        ("07","Policy: block",          "High-value action escalates"),
        ("08","Approved execution",     "Signed handler runs"),
        ("09","Audit entry",            "Verifiable, append-only"),
        ("10","Replay snapshot",        "Re-run against historical state"),
        ("11","Rollback deploy",        "Revert to previous stable version"),
        ("12","Executive brief",        "Auto-generated from live Constellation"),
    ]
    sx, sy = 40, 290
    cw = (W-80-12)//2; rh = 78; gap = 10
    for i,(num,title,sub) in enumerate(steps):
        col = i%2; row = i//2
        x = sx + col*(cw+12); y = sy + row*(rh+gap)
        d.rounded_rectangle([x, y, x+cw, y+rh], radius=8, fill=PANEL, outline=LINE, width=1)
        d.rectangle([x, y, x+44, y+rh], fill=(20,28,40))
        d.text((x+10, y+24), num, font=F_LBL, fill=ACCENT)
        d.text((x+58, y+10), title, font=F_LBL, fill=INK)
        d.text((x+58, y+40), sub,   font=F_NUM, fill=DIM)
    d.text((40, 1240), "405 tests passing  ·  24 test files  ·  green CI on every PR", font=F_NUM, fill=GOLD)
    img.save(f"{OUT}/{n:02d}-smoke-pipeline.jpg", quality=92)

def slide_api_surface(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "13  ·  CROSS-CUTTING API SURFACE")
    d.text((40, 160), "The substrate is HTTP-addressable.", font=F_H2, fill=INK)
    d.text((40, 210), "Every domain pack speaks the same four endpoints — RBAC-gated, audited, versioned.",
           font=F_BODY, fill=DIM)

    rows = [
        ("GET",  "/briefings",                  "Pulse executive briefings — list, approve, archive"),
        ("POST", "/briefings",                  "Generate from live Constellation state"),
        ("GET",  "/drift",                      "Drift reports across agents and prompts"),
        ("POST", "/drift/:id/acknowledge",      "Operator ack — closes the loop, logs to audit"),
        ("GET",  "/deployments",                "Deployment registry per artifact"),
        ("POST", "/deployments/:id/rollback",   "One-call rollback to the previous stable"),
        ("GET",  "/domains/:domain/graph",      "Constellation projection for any domain"),
        ("GET",  "/evals",                      "Eval gate results — promotions, regressions, blocks"),
    ]
    ry = 290; rh = 80
    method_w = 90
    for i,(m, path, desc) in enumerate(rows):
        y = ry + i*(rh+8)
        d.rounded_rectangle([40, y, W-40, y+rh], radius=8, fill=PANEL, outline=LINE, width=1)
        col = ACCENT if m=="GET" else GOLD
        d.rounded_rectangle([56, y+22, 56+method_w, y+22+36], radius=6, fill=col)
        d.text((56 + (method_w - int(d.textlength(m, font=F_LBL)))//2, y+28), m, font=F_LBL, fill=BG)
        d.text((170, y+18), path, font=F_MONO, fill=INK)
        d.text((170, y+48), desc, font=F_NUM, fill=DIM)
    d.text((40, 1240), "OpenAPI-described  ·  typed clients generated end-to-end  ·  401 by default", font=F_NUM, fill=DIM)
    img.save(f"{OUT}/{n:02d}-api-surface.jpg", quality=92)

def slide_numbers(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "14  ·  ONE MONTH IN")
    d.text((40, 160), "30 days.", font=F_HERO, fill=INK)
    d.text((40, 240), "One operator.", font=F_HERO, fill=INK)
    d.text((40, 320), "This is what shipped.", font=F_HERO, fill=GOLD)

    metrics = [
        ("9",     "production surfaces",   "web + mobile, all live"),
        ("17",    "deployable artifacts",  "monorepo, pnpm workspaces"),
        ("120+",  "database tables",       "drizzle-typed, migration-safe"),
        ("405",   "passing tests",         "24 files, green CI"),
        ("12",    "smoke steps",           "signal → executive brief"),
        ("8",     "Guardian tiers",        "policy on every model call"),
        ("6",     "domain packs",          "Lyte, Vessels, Terra, PRISM, Aegis, Imperium"),
        ("100%",  "TypeScript",            "no JS, no Python in core"),
        ("0",     "AI hallucinations",     "every claim has a trace ID"),
    ]
    sx, sy = 40, 480
    cw = (W-80-20)//3; rh = 220
    for i,(big, lbl, sub) in enumerate(metrics):
        col = i%3; row = i//3
        x = sx + col*(cw+10); y = sy + row*(rh+10)
        d.rounded_rectangle([x, y, x+cw, y+rh], radius=10, fill=PANEL, outline=LINE, width=1)
        d.rectangle([x, y, x+cw, y+4], fill=ACCENT if i%2==0 else GOLD)
        d.text((x+18, y+22), big, font=F_HERO, fill=INK)
        d.text((x+18, y+130), lbl, font=F_LBL, fill=ACCENT)
        d.text((x+18, y+158), sub, font=F_NUM, fill=DIM)
    img.save(f"{OUT}/{n:02d}-numbers.jpg", quality=92)

def slide_gates(n, total):
    img, d = base_canvas()
    chrome(d, n, total, "15  ·  GUARDIAN  ·  EVERY MODEL CALL, GATED")
    d.text((40, 160), "Every model call passes through 8 tiers.", font=F_H2, fill=INK)
    d.text((40, 210), "Anything sensitive can be blocked, escalated, or logged — by policy, not by prompt.",
           font=F_BODY, fill=DIM)

    tiers = [
        ("T1","Schema",      "input/output shape valid"),
        ("T2","Identity",    "tenant + actor verified"),
        ("T3","Budget",      "cost cap enforced"),
        ("T4","PII",         "redactor strips sensitive data"),
        ("T5","Injection",   "prompt-injection scan"),
        ("T6","Tool ACL",    "approval class checked"),
        ("T7","Eval gate",   "min score required to ship"),
        ("T8","Audit",       "signed entry written"),
    ]
    sx, sy = 40, 320; cw = (W-80-20)//4; rh = 220
    for i,(tag, name, desc) in enumerate(tiers):
        col = i%4; row = i//4
        x = sx + col*(cw+6); y = sy + row*(rh+10)
        d.rounded_rectangle([x, y, x+cw, y+rh], radius=10, fill=PANEL, outline=LINE, width=1)
        d.rectangle([x, y, x+cw, y+6], fill=ACCENT)
        d.text((x+16, y+24), tag,  font=F_H2,  fill=ACCENT)
        d.text((x+16, y+90), name, font=F_LBL, fill=INK)
        # wrap desc
        words = desc.split(); line=""; ly = y+128
        for w in words:
            t = (line+" "+w).strip()
            if d.textlength(t, font=F_NUM) > cw-32:
                d.text((x+16, ly), line, font=F_NUM, fill=DIM); ly+=24; line=w
            else: line=t
        if line: d.text((x+16, ly), line, font=F_NUM, fill=DIM)

    # bottom: continuous gates
    d.rounded_rectangle([40, 800, W-40, 1240], radius=10, fill=PANEL, outline=LINE, width=1)
    d.rectangle([40, 800, W-40, 806], fill=GOLD)
    d.text((60, 824), "EVAL OS  ·  CONTINUOUS GATES", font=F_LBL, fill=GOLD)
    d.text((60, 870), "Prompts and tools don't ship on vibes.", font=F_H2, fill=INK)
    d.text((60, 928), "Every change runs an eval suite. Score below baseline →  release blocked.", font=F_BODY, fill=DIM)
    d.text((60, 968), "Score above baseline →  promotion candidate. Operator approves with one click.", font=F_BODY, fill=DIM)
    d.text((60, 1024), "→  no silent regressions", font=F_BODY, fill=ACCENT)
    d.text((60, 1062), "→  no untracked prompt drift", font=F_BODY, fill=ACCENT)
    d.text((60, 1100), "→  no \"it worked yesterday\"", font=F_BODY, fill=ACCENT)
    d.text((60, 1180), "Receipts on every claim. That's the whole product.", font=F_LBL, fill=GOLD)
    img.save(f"{OUT}/{n:02d}-gates.jpg", quality=92)


# build
slide_cover()
slide_thesis()
total = 2 + len(PRODUCT_SLIDES) + 6 + 1   # cover + thesis + product + foundation07(6) + cta
n = 3
for src, kicker, headline, caption, label in PRODUCT_SLIDES:
    slide_product(n, n, total, src, kicker, headline, caption, label)
    n += 1
slide_foundation_stack(n, total);  n += 1
slide_constellation_graph(n, total); n += 1
slide_smoke_pipeline(n, total);    n += 1
slide_api_surface(n, total);       n += 1
slide_numbers(n, total);           n += 1
slide_gates(n, total);             n += 1
slide_cta(n, total)
print(f"Built {n} slides (total expected {total}) → {OUT}")
for f in sorted(os.listdir(OUT)): print(" ", f)
