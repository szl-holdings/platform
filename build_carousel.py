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

# build
slide_cover()
slide_thesis()
total = 2 + len(PRODUCT_SLIDES) + 1
n = 3
for src, kicker, headline, caption, label in PRODUCT_SLIDES:
    slide_product(n, n, total, src, kicker, headline, caption, label)
    n += 1
slide_cta(n, total)
print(f"Built {n} slides → {OUT}")
for f in sorted(os.listdir(OUT)): print(" ", f)
