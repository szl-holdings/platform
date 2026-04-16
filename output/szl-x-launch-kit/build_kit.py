#!/usr/bin/env python3
"""Build the SZL X (Twitter) launch kit.

Generates avatar, header banners (+variants), product screenshot crops (16:9 and 1:1),
desktop & mobile profile mockups. Companion markdown files (bio, content calendar,
inspiration-research) and the README are authored directly in the output folder.
"""
from __future__ import annotations

import math
import os
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "screenshots" / "raw"
OUT_SHOTS = ROOT / "screenshots"
VARIANTS = ROOT / "header-variants"
OUT_SHOTS.mkdir(parents=True, exist_ok=True)
VARIANTS.mkdir(parents=True, exist_ok=True)

# ---------- Brand palette ----------
GOLD = (212, 160, 84)
GOLD_SOFT = (232, 195, 128)
PLATINUM = (199, 205, 212)
INK = (7, 10, 14)         # near-black, SZL base
INK_2 = (13, 17, 23)
INK_3 = (19, 25, 33)
GRID = (255, 255, 255, 14)
TEXT_HI = (242, 238, 230)
TEXT_LO = (150, 158, 170)
CYAN = (22, 199, 217)     # Lyte accent
AMBER = (249, 115, 22)    # Aegis
GREEN = (74, 176, 112)    # Terra
BLUE = (60, 140, 210)     # Vessels

FONT_PATHS = {
    "sans_bold": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "sans": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "mono_reg": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATHS[kind], size)


# ---------- Helpers ----------
def vgradient(w: int, h: int, top, bottom):
    img = Image.new("RGB", (w, h), top)
    base = Image.new("RGB", (1, h), top)
    px = base.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
    return base.resize((w, h))


def radial_glow(size, color, intensity=180):
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    max_r = int(min(w, h) * 0.7)
    cx, cy = w // 2, h // 2
    for r in range(max_r, 0, -6):
        a = int(intensity * (1 - r / max_r) ** 2)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, a))
    return img.filter(ImageFilter.GaussianBlur(28))


def draw_grid(img: Image.Image, step: int = 48, color=(255, 255, 255, 10)):
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=color, width=1)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=color, width=1)
    img.alpha_composite(overlay)


def draw_dot_field(img: Image.Image, density=0.0006, color=(212, 160, 84, 100)):
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    rng = random.Random(42)
    for _ in range(int(w * h * density)):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        r = rng.choice([1, 1, 1, 2])
        a = rng.randint(40, color[3])
        d.ellipse((x, y, x + r, y + r), fill=(*color[:3], a))
    img.alpha_composite(overlay)


def draw_topography(img: Image.Image, color=(212, 160, 84, 45)):
    """Concentric rings suggesting command/target lock."""
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    cx, cy = int(w * 0.82), int(h * 0.5)
    for r in range(60, min(w, h), 70):
        a = max(0, color[3] - r // 8)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(*color[:3], a), width=1)
    # crosshair
    d.line([(cx - 40, cy), (cx + 40, cy)], fill=(*color[:3], color[3]), width=1)
    d.line([(cx, cy - 40), (cx, cy + 40)], fill=(*color[:3], color[3]), width=1)
    img.alpha_composite(overlay)


def text_wh(draw, text, f):
    bbox = draw.textbbox((0, 0), text, font=f)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


# ---------- Avatar ----------
def build_avatar():
    size = 400
    # gradient background (dark → gold-tinted dark)
    bg = vgradient(size, size, (8, 11, 16), (26, 21, 14)).convert("RGBA")
    # add radial gold glow off-center
    glow = radial_glow((size, size), GOLD, intensity=140)
    bg.alpha_composite(glow.resize((size, size)))
    # subtle grid
    draw_grid(bg, step=40, color=(255, 255, 255, 8))
    d = ImageDraw.Draw(bg)

    # outer circular mask: avatar is cropped to circle on X anyway, but compose square
    # draw monogram "SZL"
    f_mark = font("sans_bold", 170)
    label = "SZL"
    tw, th = text_wh(d, label, f_mark)
    tx = (size - tw) // 2
    ty = (size - th) // 2 - 22
    # gold glow behind text
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.text((tx, ty), label, font=f_mark, fill=(*GOLD, 150))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(8))
    bg.alpha_composite(glow_layer)
    d.text((tx, ty), label, font=f_mark, fill=(245, 234, 212))

    # tagline bar
    f_tag = font("mono", 20)
    tag = "HOLDINGS"
    tw, th = text_wh(d, tag, f_tag)
    bar_y = ty + 175
    d.rectangle((0, bar_y - 6, size, bar_y + th + 10), fill=(0, 0, 0, 120))
    d.text(((size - tw) // 2, bar_y), tag, font=f_tag, fill=GOLD)

    # gold hairline ring (decoration, X will still crop to circle)
    d.ellipse((6, 6, size - 6, size - 6), outline=(*GOLD, 180), width=2)

    bg.convert("RGB").save(ROOT / "avatar-400x400.png", "PNG")


# ---------- Header banner ----------
def _header_base(w=1500, h=500, top=(5, 8, 12), bottom=(16, 13, 8)):
    bg = vgradient(w, h, top, bottom).convert("RGBA")
    # gold radial glow in right third
    glow = radial_glow((900, 900), GOLD, intensity=130)
    bg.alpha_composite(glow, (int(w * 0.55), int(h * -0.4)))
    # faint cyan glow on far left
    cglow = radial_glow((700, 700), CYAN, intensity=60)
    bg.alpha_composite(cglow, (-200, int(h * -0.3)))
    draw_grid(bg, step=72, color=(255, 255, 255, 10))
    draw_dot_field(bg, density=0.00035, color=(*PLATINUM, 110))
    draw_topography(bg, color=(*GOLD, 55))
    return bg


def _header_text(bg, headline, eyebrow, subline, accent=GOLD):
    w, h = bg.size
    d = ImageDraw.Draw(bg)
    # Safe area: X overlays avatar bottom-left ~220px circle; bio info below.
    # Keep key elements within horizontal 80..1100 and vertical 90..380 roughly.
    left = 80
    f_eye = font("mono", 22)
    d.text((left, 110), eyebrow, font=f_eye, fill=accent)
    # accent rule
    d.rectangle((left, 146, left + 64, 149), fill=accent)

    f_head = font("sans_bold", 74)
    # multi-line support
    lines = headline.split("\n")
    y = 168
    for ln in lines:
        d.text((left, y), ln, font=f_head, fill=(245, 240, 230))
        y += 78

    f_sub = font("sans", 22)
    d.text((left, y + 14), subline, font=f_sub, fill=TEXT_LO)

    # right-side product chips
    chips = ["AEGIS", "VESSELS", "TERRA", "LYTE", "PRISM"]
    f_chip = font("mono", 18)
    cx = w - 60
    cy = h - 60
    for label in reversed(chips):
        tw, th = text_wh(d, label, f_chip)
        pad_x, pad_y = 14, 8
        x2 = cx
        x1 = x2 - tw - pad_x * 2
        y1 = cy - th - pad_y * 2
        y2 = cy
        d.rounded_rectangle((x1, y1, x2, y2), radius=4, outline=(*accent, 160), width=1, fill=(0, 0, 0, 110))
        d.text((x1 + pad_x, y1 + pad_y - 2), label, font=f_chip, fill=accent)
        cx = x1 - 10

    # bottom-left wordmark + ticker
    f_mark = font("sans_bold", 28)
    f_mono = font("mono", 18)
    d.text((80, h - 70), "SZL", font=f_mark, fill=(240, 236, 224))
    d.text((140, h - 62), "HOLDINGS", font=f_mono, fill=accent)
    d.text((260, h - 62), "·  OBSERVE  ·  UNDERSTAND  ·  DECIDE  ·  EXECUTE", font=f_mono, fill=TEXT_LO)


def build_headers():
    # Primary
    bg = _header_base()
    _header_text(
        bg,
        headline="Governed decision\ninfrastructure.",
        eyebrow="SZL HOLDINGS  /  2026",
        subline="Defense • Maritime • Real Estate • Legal • Capital — one operating layer.",
    )
    bg.convert("RGB").save(ROOT / "header-1500x500.png", "PNG")

    # Variant 1 — cooler, cyan-forward (Lyte-led)
    bg = _header_base(top=(4, 8, 14), bottom=(8, 18, 26))
    _header_text(
        bg,
        headline="High-consequence\ndecisions, governed.",
        eyebrow="UNIFIED COMMAND  ·  SZL",
        subline="Signal → Surface → Govern. The nerve center for enterprise operations.",
        accent=(180, 205, 230),
    )
    bg.convert("RGB").save(VARIANTS / "header-variant-1-command.png", "PNG")

    # Variant 2 — tactical amber (Aegis-led)
    bg = _header_base(top=(8, 6, 4), bottom=(22, 14, 6))
    _header_text(
        bg,
        headline="Four workspaces.\nOne intelligence layer.",
        eyebrow="AEGIS  ·  DEFENSE + INTELLIGENCE",
        subline="SOC · Legal · Command · Labs — one correlation engine, one operating model.",
        accent=(245, 180, 110),
    )
    bg.convert("RGB").save(VARIANTS / "header-variant-2-aegis.png", "PNG")

    # Variant 3 — editorial / minimal (gold on deep black)
    w, h = 1500, 500
    bg = Image.new("RGBA", (w, h), (3, 4, 6))
    draw_grid(bg, step=72, color=(255, 255, 255, 8))
    draw_topography(bg, color=(*GOLD, 40))
    glow = radial_glow((1100, 1100), GOLD, intensity=90)
    bg.alpha_composite(glow, (200, -300))
    d = ImageDraw.Draw(bg)
    d.text((80, 150), "SZL", font=font("sans_bold", 140), fill=(240, 234, 220))
    d.text((350, 195), "HOLDINGS", font=font("mono", 40), fill=GOLD)
    d.rectangle((80, 300, 144, 303), fill=GOLD)
    d.text((80, 318), "The governed infrastructure for high-consequence decisions.", font=font("sans", 26), fill=TEXT_HI)
    d.text((80, 360), "szlholdings.com  /  @szlholdings", font=font("mono", 18), fill=TEXT_LO)
    bg.convert("RGB").save(VARIANTS / "header-variant-3-editorial.png", "PNG")


# ---------- Screenshot crops ----------
SHOT_PLAN = [
    ("aegis-dashboard.jpg", "aegis-16x9.png", "aegis-1x1.png"),
    ("aegis-command-center.jpg", "aegis-command-16x9.png", None),
    ("command-overview.jpg", "command-16x9.png", "command-1x1.png"),
    ("command-overview-v2.jpg", "command-loop-16x9.png", None),
    ("terra-intelligence.jpg", "terra-16x9.png", "terra-1x1.png"),
    ("terra-platform.jpg", "terra-platform-16x9.png", None),
    ("vessels-maritime.jpg", "vessels-16x9.png", "vessels-1x1.png"),
    ("vessels-platform.jpg", "vessels-platform-16x9.png", None),
    ("szl-holdings-landing.jpg", "szl-holdings-16x9.png", "szl-holdings-1x1.png"),
    ("szl-operating-doctrine.jpg", "szl-doctrine-16x9.png", None),
    ("carlota-jo-consulting.jpg", "carlota-jo-16x9.png", "carlota-jo-1x1.png"),
]


def frame_screenshot(src: Image.Image, aspect=(16, 9), target_w=1600, pad_bottom_frac=0.10) -> Image.Image:
    """Crop the screenshot to the target aspect ratio, excluding the bottom area
    where the cookie banner tends to sit, and compose on a dark brand frame with
    a thin gold hairline + subtle chrome shadow for a "product-card" feel.
    """
    w, h = src.size
    # trim bottom where cookie banner sits
    usable_h = int(h * (1 - pad_bottom_frac))
    # desired crop rect matching aspect
    ar_w, ar_h = aspect
    # crop a rectangle of max size from top of image
    crop_w = w
    crop_h = int(w * ar_h / ar_w)
    if crop_h > usable_h:
        crop_h = usable_h
        crop_w = int(crop_h * ar_w / ar_h)
    x0 = (w - crop_w) // 2
    y0 = 0
    cropped = src.crop((x0, y0, x0 + crop_w, y0 + crop_h))
    # resize to target width
    target_h = int(target_w * ar_h / ar_w)
    cropped = cropped.resize((target_w, target_h), Image.LANCZOS)

    # frame it
    frame_pad = 28
    out_w = target_w + frame_pad * 2
    out_h = target_h + frame_pad * 2
    frame = Image.new("RGB", (out_w, out_h), INK)
    frame_rgba = frame.convert("RGBA")
    draw_grid(frame_rgba, step=64, color=(255, 255, 255, 6))
    # drop shadow
    shadow = Image.new("RGBA", (target_w + 60, target_h + 60), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((30, 30, 30 + target_w, 30 + target_h), radius=10, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    frame_rgba.alpha_composite(shadow, (frame_pad - 30, frame_pad - 24))
    # screenshot
    frame_rgba.paste(cropped, (frame_pad, frame_pad))
    # gold hairline
    d = ImageDraw.Draw(frame_rgba)
    d.rectangle((frame_pad - 1, frame_pad - 1, frame_pad + target_w, frame_pad + target_h), outline=(*GOLD, 140), width=1)
    return frame_rgba.convert("RGB")


def build_screenshots():
    for src_name, out_169, out_11 in SHOT_PLAN:
        src_path = RAW / src_name
        if not src_path.exists():
            print("skip missing", src_name)
            continue
        src = Image.open(src_path).convert("RGB")
        if out_169:
            frame_screenshot(src, (16, 9), 1600).save(OUT_SHOTS / out_169)
        if out_11:
            frame_screenshot(src, (1, 1), 1200).save(OUT_SHOTS / out_11)


# ---------- Profile mockups ----------
def build_profile_mockups():
    """Render a flat mockup mimicking the X/Twitter profile header + bio area."""
    # Desktop: 1200 x 900 card
    w, h = 1200, 900
    bg_rgb = Image.new("RGB", (w, h), (22, 24, 28))
    bg = bg_rgb.convert("RGBA")
    d = ImageDraw.Draw(bg)

    # browser chrome bar
    d.rectangle((0, 0, w, 48), fill=(30, 33, 38))
    for i, c in enumerate([(237, 106, 94), (244, 191, 79), (98, 197, 84)]):
        d.ellipse((20 + i * 24, 16, 36 + i * 24, 32), fill=c)
    d.rounded_rectangle((140, 12, w - 120, 36), radius=6, fill=(20, 22, 26))
    d.text((160, 16), "x.com/szlholdings", font=font("mono_reg", 14), fill=TEXT_LO)

    # X profile card: black bg with header banner, avatar, bio text
    card_x, card_y = 60, 80
    card_w, card_h = w - 120, h - 160
    d.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=14, fill=(0, 0, 0))

    header = Image.open(ROOT / "header-1500x500.png").convert("RGBA").resize((card_w, int(card_w * 500 / 1500)))
    bg.alpha_composite(header, (card_x, card_y))
    hdr_h = header.size[1]

    # avatar
    av = Image.open(ROOT / "avatar-400x400.png").convert("RGBA").resize((134, 134))
    mask = Image.new("L", (134, 134), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 134, 134), fill=255)
    av.putalpha(mask)
    # white ring
    ring = Image.new("RGBA", (146, 146), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, 146, 146), fill=(0, 0, 0))
    bg.alpha_composite(ring, (card_x + 20, card_y + hdr_h - 74))
    bg.alpha_composite(av, (card_x + 26, card_y + hdr_h - 68))

    # follow button top-right
    btn_x2 = card_x + card_w - 24
    btn_y1 = card_y + hdr_h + 16
    btn_y2 = btn_y1 + 36
    btn_w = 110
    d.rounded_rectangle((btn_x2 - btn_w, btn_y1, btn_x2, btn_y2), radius=18, fill=(239, 239, 239))
    tw, th = text_wh(d, "Follow", font("sans_bold", 15))
    d.text((btn_x2 - btn_w + (btn_w - tw) // 2, btn_y1 + (36 - th) // 2 - 2), "Follow", font=font("sans_bold", 15), fill=(10, 10, 10))

    # bio text
    bx = card_x + 28
    by = card_y + hdr_h + 86
    d.text((bx, by), "SZL Holdings", font=font("sans_bold", 26), fill=(240, 240, 240))
    # verified-like gold dot
    d.ellipse((bx + 196, by + 10, bx + 214, by + 28), fill=GOLD)
    d.text((bx, by + 38), "@szlholdings", font=font("sans", 16), fill=(113, 118, 123))
    bio_lines = [
        "Governed decision infrastructure for high-consequence operations.",
        "Defense · Maritime · Real Estate · Legal · Capital — one operating layer.",
        "Observe → Understand → Decide → Execute.",
    ]
    y = by + 76
    for ln in bio_lines:
        d.text((bx, y), ln, font=font("sans", 16), fill=(230, 232, 236))
        y += 26
    # meta row
    y += 8
    d.text((bx, y), "📍 New York · Miami      🔗 szlholdings.com      📅 Joined April 2026",
           font=font("sans", 15), fill=(113, 118, 123))
    y += 34
    d.text((bx, y), "128 Following     1,284 Followers", font=font("sans", 15), fill=(113, 118, 123))

    # tab bar
    tab_y = y + 40
    tabs = ["Posts", "Replies", "Highlights", "Media", "Likes"]
    tx = bx
    for i, t in enumerate(tabs):
        color = (240, 240, 240) if i == 0 else (113, 118, 123)
        d.text((tx, tab_y), t, font=font("sans_bold", 15), fill=color)
        if i == 0:
            tw_, _ = text_wh(d, t, font("sans_bold", 15))
            d.rounded_rectangle((tx, tab_y + 24, tx + tw_, tab_y + 27), radius=2, fill=(29, 155, 240))
        tx += 110

    # pinned post preview
    pin_y = tab_y + 54
    d.rounded_rectangle((bx, pin_y, card_x + card_w - 28, pin_y + 120), radius=10, fill=(16, 18, 22))
    d.text((bx + 16, pin_y + 14), "📌 Pinned", font=font("sans_bold", 12), fill=(113, 118, 123))
    d.text((bx + 16, pin_y + 36), "SZL Holdings  @szlholdings",
           font=font("sans_bold", 14), fill=(240, 240, 240))
    d.text((bx + 16, pin_y + 58), "Dashboards tell you what happened. Governance tells you what",
           font=font("sans", 14), fill=(220, 224, 230))
    d.text((bx + 16, pin_y + 78), "should happen next — with proof. Meet SZL Holdings. ↓",
           font=font("sans", 14), fill=(220, 224, 230))
    d.text((bx + 16, pin_y + 98), "szlholdings.com", font=font("sans", 13), fill=(29, 155, 240))

    bg.convert("RGB").save(ROOT / "profile-mockup-desktop.png", "PNG")

    # ---- Mobile mockup ----
    mw, mh = 430, 900
    mbg_rgb = Image.new("RGB", (mw, mh), (0, 0, 0))
    mbg = mbg_rgb.convert("RGBA")
    md = ImageDraw.Draw(mbg)
    # status bar
    md.text((20, 14), "9:41", font=font("sans_bold", 14), fill=(240, 240, 240))
    md.text((mw - 70, 14), "●●●● 100%", font=font("sans", 12), fill=(240, 240, 240))
    # back arrow + name
    md.text((20, 44), "←   SZL Holdings", font=font("sans_bold", 17), fill=(240, 240, 240))
    md.text((56, 66), "1.3K posts", font=font("sans", 12), fill=(113, 118, 123))
    # header
    mh_hdr = int(mw * 500 / 1500)
    header_m = Image.open(ROOT / "header-1500x500.png").convert("RGBA").resize((mw, mh_hdr))
    mbg.alpha_composite(header_m, (0, 90))
    # avatar overlap
    av_m = Image.open(ROOT / "avatar-400x400.png").convert("RGBA").resize((86, 86))
    mask = Image.new("L", (86, 86), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 86, 86), fill=255)
    av_m.putalpha(mask)
    ring = Image.new("RGBA", (94, 94), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, 94, 94), fill=(0, 0, 0))
    mbg.alpha_composite(ring, (12, 90 + mh_hdr - 46))
    mbg.alpha_composite(av_m, (16, 90 + mh_hdr - 42))
    # follow button
    md.rounded_rectangle((mw - 108, 90 + mh_hdr + 12, mw - 20, 90 + mh_hdr + 44), radius=16, fill=(239, 239, 239))
    tw, th = text_wh(md, "Follow", font("sans_bold", 13))
    md.text((mw - 108 + (88 - tw) // 2, 90 + mh_hdr + 16), "Follow", font=font("sans_bold", 13), fill=(10, 10, 10))

    y = 90 + mh_hdr + 60
    md.text((20, y), "SZL Holdings", font=font("sans_bold", 20), fill=(240, 240, 240))
    md.ellipse((160, y + 6, 176, y + 22), fill=GOLD)
    md.text((20, y + 28), "@szlholdings", font=font("sans", 13), fill=(113, 118, 123))
    lines = [
        "Governed decision infrastructure",
        "for high-consequence operations.",
        "Defense · Maritime · Real Estate ·",
        "Legal · Capital — one operating layer.",
    ]
    ly = y + 56
    for ln in lines:
        md.text((20, ly), ln, font=font("sans", 14), fill=(230, 232, 236))
        ly += 22
    md.text((20, ly + 10), "📍 NY · Miami", font=font("sans", 12), fill=(113, 118, 123))
    md.text((140, ly + 10), "🔗 szlholdings.com", font=font("sans", 12), fill=(113, 118, 123))
    md.text((20, ly + 32), "📅 Joined April 2026", font=font("sans", 12), fill=(113, 118, 123))
    md.text((20, ly + 60), "128 Following   1,284 Followers", font=font("sans", 12), fill=(113, 118, 123))
    # tabs
    tabs_y = ly + 96
    md.text((20, tabs_y), "Posts", font=font("sans_bold", 13), fill=(240, 240, 240))
    md.rounded_rectangle((20, tabs_y + 22, 60, tabs_y + 25), radius=2, fill=(29, 155, 240))
    md.text((90, tabs_y), "Replies", font=font("sans_bold", 13), fill=(113, 118, 123))
    md.text((170, tabs_y), "Media", font=font("sans_bold", 13), fill=(113, 118, 123))
    md.text((240, tabs_y), "Likes", font=font("sans_bold", 13), fill=(113, 118, 123))
    # pinned preview
    py = tabs_y + 48
    md.rounded_rectangle((12, py, mw - 12, py + 140), radius=10, fill=(16, 18, 22))
    md.text((24, py + 10), "📌 Pinned", font=font("sans_bold", 11), fill=(113, 118, 123))
    md.text((24, py + 30), "SZL Holdings  @szlholdings",
           font=font("sans_bold", 13), fill=(240, 240, 240))
    md.text((24, py + 52), "Dashboards tell you what happened.",
           font=font("sans", 13), fill=(220, 224, 230))
    md.text((24, py + 70), "Governance tells you what should happen",
           font=font("sans", 13), fill=(220, 224, 230))
    md.text((24, py + 88), "next — with proof.",
           font=font("sans", 13), fill=(220, 224, 230))
    md.text((24, py + 112), "szlholdings.com", font=font("sans", 12), fill=(29, 155, 240))

    mbg.convert("RGB").save(ROOT / "profile-mockup-mobile.png", "PNG")


def main():
    print("Building avatar...")
    build_avatar()
    print("Building headers...")
    build_headers()
    print("Building screenshot crops...")
    build_screenshots()
    print("Building profile mockups...")
    build_profile_mockups()
    print("Done.")


if __name__ == "__main__":
    main()
