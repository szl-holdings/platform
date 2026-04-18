#!/usr/bin/env python3
"""Generate OG social card images (1200x630 JPG) for SZL Holdings major pages."""

import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = "artifacts/szl-holdings/public/og"
W, H = 1200, 630

# Brand palette
BG_DEEP    = (8,  12, 20)     # #080c14
BG_SURFACE = (13, 19, 33)     # #0d1321
ACCENT     = (35, 196, 216)   # #23C4D8  hsl(192,72%,48%)
ACCENT2    = (56, 115, 255)   # #3873FF  blue accent
TEXT_WHITE = (240, 244, 248)  # #F0F4F8
TEXT_MUTED = (120, 140, 165)  # #788CA5
BORDER     = (30, 45, 70)     # subtle border
DIVIDER    = (25, 40, 65)

# Domain accent colours
DOMAIN_COLORS = {
    "default":      ACCENT,
    "aegis":        (255, 80,  80),   # red - security
    "vessels":      (35,  196, 216),  # teal - maritime
    "terra":        (80,  220, 120),  # green - real estate
    "prism-counsel":(180, 100, 255),  # purple - legal
    "lyte":         (255, 200, 50),   # amber - observability
    "alloy":        (56,  115, 255),  # blue - execution
}

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def generate_card(filename, title, subtitle, tagline, domain="default"):
    accent = DOMAIN_COLORS.get(domain, ACCENT)

    # Base image
    img = Image.new("RGB", (W, H), BG_DEEP)
    draw = ImageDraw.Draw(img, "RGBA")

    # Subtle gradient: slightly lighter at top
    for y in range(H):
        t = 1 - (y / H) * 0.4
        r = int(BG_DEEP[0] + (BG_SURFACE[0] - BG_DEEP[0]) * t)
        g = int(BG_DEEP[1] + (BG_SURFACE[1] - BG_DEEP[1]) * t)
        b = int(BG_DEEP[2] + (BG_SURFACE[2] - BG_DEEP[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Dot grid texture
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    step = 30
    for x in range(step // 2, W, step):
        for y in range(step // 2, H, step):
            od.ellipse([(x-1, y-1), (x+1, y+1)], fill=(255, 255, 255, 14))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")

    # Accent glow — top right
    draw.ellipse([(750, -100), (1350, 350)], fill=(accent[0], accent[1], accent[2], 18))
    # Bottom left secondary glow
    draw.ellipse([(-150, 300), (350, 750)], fill=(ACCENT2[0], ACCENT2[1], ACCENT2[2], 12))

    # Left accent bar
    draw.rectangle([(60, 60), (64, H - 60)], fill=(accent[0], accent[1], accent[2], 120))

    # Top accent line (full width)
    draw.rectangle([(0, 0), (W, 3)], fill=accent)

    # Bottom bar
    draw.rectangle([(0, H - 3), (W, H)], fill=(accent[0], accent[1], accent[2], 60))

    # Border frame
    draw.rectangle([(60, 60), (W - 60, H - 60)], outline=(*BORDER, 180), width=1)

    # ── Logo area (top-left inside frame) ──
    font_logo = load_font(FONT_BOLD, 22)

    # Logo mark — stylized "SZL" box
    lx, ly = 88, 88
    draw.rectangle([(lx, ly), (lx + 44, ly + 28)], fill=accent)
    draw.text((lx + 5, ly + 4), "SZL", font=load_font(FONT_BOLD, 18), fill=BG_DEEP)
    draw.text((lx + 52, ly + 6), "HOLDINGS", font=font_logo, fill=TEXT_WHITE)

    # Separator line under logo
    draw.rectangle([(88, ly + 40), (350, ly + 41)], fill=(*DIVIDER, 200))

    # ── Main content area ──
    font_tagline = load_font(FONT_REG, 20)

    content_y = 210

    # Subtitle / label
    if subtitle:
        draw.text((88, content_y), subtitle.upper(), font=load_font(FONT_BOLD, 14),
                  fill=(accent[0], accent[1], accent[2], 220))
        content_y += 32

    # Title — wrapped
    title_font = load_font(FONT_BOLD, 64 if len(title) < 20 else 52 if len(title) < 30 else 42)
    title_lines = wrap_text(title, title_font, W - 176, ImageDraw.Draw(Image.new("RGB", (1,1))))
    for line in title_lines[:2]:
        draw.text((88, content_y), line, font=title_font, fill=TEXT_WHITE)
        content_y += int(title_font.size * 1.15)

    content_y += 12

    # Accent divider
    draw.rectangle([(88, content_y), (88 + 60, content_y + 3)], fill=accent)
    content_y += 22

    # Tagline — wrapped
    if tagline:
        tag_lines = wrap_text(tagline, font_tagline, W - 250, ImageDraw.Draw(Image.new("RGB", (1,1))))
        for line in tag_lines[:2]:
            draw.text((88, content_y), line, font=font_tagline,
                      fill=(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]))
            content_y += 30

    # ── Bottom-right badge ──
    badge_text = "szlholdings.com"
    font_badge = load_font(FONT_REG, 15)
    bw = int(ImageDraw.Draw(Image.new("RGB",(1,1))).textlength(badge_text, font=font_badge)) + 28
    bh = 32
    bx = W - 80 - bw
    by = H - 80 - bh
    draw.rounded_rectangle([(bx, by), (bx + bw, by + bh)],
                            radius=6, fill=(*BG_SURFACE, 200),
                            outline=(*BORDER, 180))
    draw.text((bx + 14, by + 7), badge_text, font=font_badge,
              fill=(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]))

    # Save
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, filename)
    img.convert("RGB").save(path, "JPEG", quality=92, optimize=True)
    print(f"  ✓ {filename}")

# ─── Card definitions ──────────────────────────────────────────────────────────

CARDS = [
    dict(
        filename="og-home.jpg",
        title="Governed Decision Infrastructure",
        subtitle="SZL Holdings",
        tagline="Signal → Context → Recommendation → Simulation → Policy → Execution → Proof",
        domain="default",
    ),
    dict(
        filename="og-platform.jpg",
        title="The Governed Platform",
        subtitle="Platform Overview",
        tagline="Lyte observability, Alloy execution fabric, and six domain packs for enterprise operations.",
        domain="alloy",
    ),
    dict(
        filename="og-lyte.jpg",
        title="Lyte",
        subtitle="Business Observability",
        tagline="Command surface for operators. PRISM framework: signals, routing, priority action queue.",
        domain="lyte",
    ),
    dict(
        filename="og-alloy.jpg",
        title="Alloy Fabric",
        subtitle="Execution Fabric",
        tagline="Signal normalization, workflow orchestration, approval controls, and immutable audit trail.",
        domain="alloy",
    ),
    dict(
        filename="og-solutions.jpg",
        title="Solutions",
        subtitle="Domain Packs",
        tagline="Governed decision infrastructure for security, maritime, real estate, and professional services.",
        domain="default",
    ),
    dict(
        filename="og-aegis.jpg",
        title="Aegis",
        subtitle="Security & Defense Intelligence",
        tagline="SOC command, MITRE ATT&CK mapping, SOAR playbooks, AI triage with human approval gates.",
        domain="aegis",
    ),
    dict(
        filename="og-vessels.jpg",
        title="Vessels",
        subtitle="Maritime Intelligence",
        tagline="Fleet command, AIS telemetry, sanctions screening, dark vessel detection, exception-based workflows.",
        domain="vessels",
    ),
    dict(
        filename="og-terra.jpg",
        title="Terra",
        subtitle="Real Estate Intelligence",
        tagline="Distress property pipeline, ownership entity graph, deal tracking, and governed underwriting flows.",
        domain="terra",
    ),
    dict(
        filename="og-prism-counsel.jpg",
        title="PRISM Counsel",
        subtitle="Legal Intelligence",
        tagline="AI-assisted legal operations with approval gates, proof chain, and immutable audit trail.",
        domain="prism-counsel",
    ),
    dict(
        filename="og-pricing.jpg",
        title="Pricing",
        subtitle="SZL Holdings",
        tagline="Transparent pricing for Lyte, Alloy, and domain pack products. Design partner pricing available.",
        domain="default",
    ),
    dict(
        filename="og-contact.jpg",
        title="Contact Us",
        subtitle="SZL Holdings",
        tagline="Enterprise inquiries, design partner opportunities, and investment conversations.",
        domain="default",
    ),
    dict(
        filename="og-design-partners.jpg",
        title="Design Partners",
        subtitle="SZL Holdings",
        tagline="Shape the governed intelligence platform alongside the founding team.",
        domain="default",
    ),
    dict(
        filename="og-how-it-works.jpg",
        title="How It Works",
        subtitle="SZL Holdings",
        tagline="How governed decision infrastructure connects signals to accountable action.",
        domain="default",
    ),
]

if __name__ == "__main__":
    print(f"Generating {len(CARDS)} OG cards → {OUT_DIR}/")
    for card in CARDS:
        generate_card(**card)
    print(f"\nDone — {len(CARDS)} images written.")
