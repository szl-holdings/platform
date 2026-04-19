"""Shared rendering library for SZL subaccount X launch kits.

Each product subaccount (Aegis, Vessels, Terra) uses the same layout grammar as
the parent @szlholdings kit but swaps:
  - the monogram + product wordmark
  - the brand accent color
  - the screenshot lineup (vertical-focused)
  - copy in the bio + content calendar

The build function is parameterized by a `KitConfig` dataclass. Each subaccount
folder contains a thin `build_kit.py` that imports from this module.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------- Brand palette (shared) ----------
GOLD = (212, 160, 84)
PLATINUM = (199, 205, 212)
INK = (7, 10, 14)
TEXT_HI = (242, 238, 230)
TEXT_LO = (150, 158, 170)

FONT_PATHS = {
    "sans_bold": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "sans": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "mono_reg": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATHS[kind], size)


@dataclass
class KitConfig:
    handle: str                  # e.g. "aegis_soc"
    wordmark: str                # e.g. "AEGIS"
    parent_wordmark: str         # always "SZL"
    parent_tag: str              # "× SZL HOLDINGS"
    monogram: str                # 2-3 letters used in the avatar (e.g. "AGS")
    eyebrow: str                 # header eyebrow line
    headline: str                # multi-line header headline
    subline: str                 # header sub-line
    accent: Tuple[int, int, int]
    accent_soft: Tuple[int, int, int]
    bg_top: Tuple[int, int, int]
    bg_bottom: Tuple[int, int, int]
    chips: list                  # right-side header chips
    operating_loop: str          # bottom-left tagline
    raw_screenshots_dir: Path    # directory containing source screenshots
    screenshots: list            # list of (src, out_169, out_11_or_None)
    profile_name: str = ""       # display name in mockups
    bio_lines: list = field(default_factory=list)


# ---------- Rendering helpers ----------
def vgradient(w: int, h: int, top, bottom):
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


def draw_grid(img, step=48, color=(255, 255, 255, 10)):
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=color, width=1)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=color, width=1)
    img.alpha_composite(overlay)


def draw_dot_field(img, density=0.0006, color=(212, 160, 84, 100)):
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


def draw_topography(img, color=(212, 160, 84, 45)):
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    cx, cy = int(w * 0.82), int(h * 0.5)
    for r in range(60, min(w, h), 70):
        a = max(0, color[3] - r // 8)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(*color[:3], a), width=1)
    d.line([(cx - 40, cy), (cx + 40, cy)], fill=(*color[:3], color[3]), width=1)
    d.line([(cx, cy - 40), (cx, cy + 40)], fill=(*color[:3], color[3]), width=1)
    img.alpha_composite(overlay)


def text_wh(draw, text, f):
    bbox = draw.textbbox((0, 0), text, font=f)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


# ---------- Avatar ----------
def build_avatar(cfg: KitConfig, out_path: Path):
    size = 400
    bg = vgradient(size, size, cfg.bg_top, cfg.bg_bottom).convert("RGBA")
    glow = radial_glow((size, size), cfg.accent, intensity=150)
    bg.alpha_composite(glow.resize((size, size)))
    draw_grid(bg, step=40, color=(255, 255, 255, 8))
    d = ImageDraw.Draw(bg)

    # Monogram in product accent
    mono_size = 180 if len(cfg.monogram) <= 3 else 140
    f_mark = font("sans_bold", mono_size)
    label = cfg.monogram
    tw, th = text_wh(d, label, f_mark)
    tx = (size - tw) // 2
    ty = (size - th) // 2 - 28

    # Glow behind text
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.text((tx, ty), label, font=f_mark, fill=(*cfg.accent, 160))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(8))
    bg.alpha_composite(glow_layer)
    d.text((tx, ty), label, font=f_mark, fill=(248, 240, 226))

    # Wordmark bar
    f_tag = font("mono", 20)
    tw, th = text_wh(d, cfg.wordmark, f_tag)
    bar_y = ty + 175
    d.rectangle((0, bar_y - 6, size, bar_y + th + 10), fill=(0, 0, 0, 130))
    d.text(((size - tw) // 2, bar_y), cfg.wordmark, font=f_tag, fill=cfg.accent)

    # SZL affiliate badge — small line below
    f_aff = font("mono_reg", 13)
    aff = cfg.parent_tag
    tw, th = text_wh(d, aff, f_aff)
    d.text(((size - tw) // 2, bar_y + 32), aff, font=f_aff, fill=GOLD)

    # accent hairline ring
    d.ellipse((6, 6, size - 6, size - 6), outline=(*cfg.accent, 200), width=2)
    # outer gold sub-ring (parent affiliation)
    d.ellipse((14, 14, size - 14, size - 14), outline=(*GOLD, 90), width=1)

    bg.convert("RGB").save(out_path, "PNG")


# ---------- Header ----------
def _header_base(cfg: KitConfig, w=1500, h=500):
    bg = vgradient(w, h, cfg.bg_top, cfg.bg_bottom).convert("RGBA")
    glow = radial_glow((900, 900), cfg.accent, intensity=140)
    bg.alpha_composite(glow, (int(w * 0.55), int(h * -0.4)))
    gold_glow = radial_glow((700, 700), GOLD, intensity=55)
    bg.alpha_composite(gold_glow, (-200, int(h * -0.3)))
    draw_grid(bg, step=72, color=(255, 255, 255, 10))
    draw_dot_field(bg, density=0.00035, color=(*PLATINUM, 110))
    draw_topography(bg, color=(*cfg.accent, 60))
    return bg


def _header_text(cfg: KitConfig, bg):
    w, h = bg.size
    d = ImageDraw.Draw(bg)
    left = 80
    f_eye = font("mono", 22)
    d.text((left, 110), cfg.eyebrow, font=f_eye, fill=cfg.accent)
    d.rectangle((left, 146, left + 64, 149), fill=cfg.accent)

    f_head = font("sans_bold", 70)
    lines = cfg.headline.split("\n")
    y = 168
    for ln in lines:
        d.text((left, y), ln, font=f_head, fill=(245, 240, 230))
        y += 76

    f_sub = font("sans", 22)
    d.text((left, y + 14), cfg.subline, font=f_sub, fill=TEXT_LO)

    # Right-side chips
    f_chip = font("mono", 18)
    cx = w - 60
    cy = h - 60
    for label in reversed(cfg.chips):
        tw, th = text_wh(d, label, f_chip)
        pad_x, pad_y = 14, 8
        x2 = cx
        x1 = x2 - tw - pad_x * 2
        y1 = cy - th - pad_y * 2
        y2 = cy
        d.rounded_rectangle((x1, y1, x2, y2), radius=4, outline=(*cfg.accent, 170), width=1, fill=(0, 0, 0, 110))
        d.text((x1 + pad_x, y1 + pad_y - 2), label, font=f_chip, fill=cfg.accent)
        cx = x1 - 10

    # Bottom-left wordmark + SZL affiliate badge + operating-loop tagline
    f_mark = font("sans_bold", 28)
    f_mono = font("mono", 18)
    f_aff = font("mono_reg", 16)
    d.text((80, h - 70), cfg.wordmark, font=f_mark, fill=(240, 236, 224))
    aff_x = 80 + text_wh(d, cfg.wordmark, f_mark)[0] + 14
    d.text((aff_x, h - 62), cfg.parent_tag, font=f_aff, fill=GOLD)
    aff2_x = aff_x + text_wh(d, cfg.parent_tag, f_aff)[0] + 16
    d.text((aff2_x, h - 62), cfg.operating_loop, font=f_mono, fill=TEXT_LO)


def build_headers(cfg: KitConfig, primary_path: Path, variants_dir: Path):
    bg = _header_base(cfg)
    _header_text(cfg, bg)
    bg.convert("RGB").save(primary_path, "PNG")

    # Variant 1 — editorial / minimal
    w, h = 1500, 500
    bg = Image.new("RGBA", (w, h), (3, 4, 6))
    draw_grid(bg, step=72, color=(255, 255, 255, 8))
    draw_topography(bg, color=(*cfg.accent, 50))
    glow = radial_glow((1100, 1100), cfg.accent, intensity=95)
    bg.alpha_composite(glow, (200, -300))
    d = ImageDraw.Draw(bg)
    d.text((80, 150), cfg.wordmark, font=font("sans_bold", 130), fill=(240, 234, 220))
    d.text((80, 300), cfg.subline, font=font("sans", 26), fill=TEXT_HI)
    d.rectangle((80, 280, 144, 283), fill=cfg.accent)
    d.text((80, 350), f"{cfg.parent_tag}  ·  szlholdings.com", font=font("mono", 18), fill=GOLD)
    bg.convert("RGB").save(variants_dir / "header-variant-editorial.png", "PNG")

    # Variant 2 — accent-forward (more saturated)
    bg = _header_base(cfg)
    _header_text(cfg, bg)
    # extra accent wash
    wash = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    wd = ImageDraw.Draw(wash)
    wd.rectangle((0, 0, bg.size[0], bg.size[1]), fill=(*cfg.accent, 14))
    bg.alpha_composite(wash)
    bg.convert("RGB").save(variants_dir / "header-variant-saturated.png", "PNG")


# ---------- Screenshot framing ----------
def frame_screenshot(src: Image.Image, accent, aspect=(16, 9), target_w=1600, pad_bottom_frac=0.10):
    w, h = src.size
    usable_h = int(h * (1 - pad_bottom_frac))
    ar_w, ar_h = aspect
    crop_w = w
    crop_h = int(w * ar_h / ar_w)
    if crop_h > usable_h:
        crop_h = usable_h
        crop_w = int(crop_h * ar_w / ar_h)
    x0 = (w - crop_w) // 2
    cropped = src.crop((x0, 0, x0 + crop_w, crop_h))
    target_h = int(target_w * ar_h / ar_w)
    cropped = cropped.resize((target_w, target_h), Image.LANCZOS)

    frame_pad = 28
    out_w = target_w + frame_pad * 2
    out_h = target_h + frame_pad * 2
    frame = Image.new("RGB", (out_w, out_h), INK)
    frame_rgba = frame.convert("RGBA")
    draw_grid(frame_rgba, step=64, color=(255, 255, 255, 6))
    shadow = Image.new("RGBA", (target_w + 60, target_h + 60), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((30, 30, 30 + target_w, 30 + target_h), radius=10, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    frame_rgba.alpha_composite(shadow, (frame_pad - 30, frame_pad - 24))
    frame_rgba.paste(cropped, (frame_pad, frame_pad))
    d = ImageDraw.Draw(frame_rgba)
    d.rectangle((frame_pad - 1, frame_pad - 1, frame_pad + target_w, frame_pad + target_h), outline=(*accent, 160), width=1)
    return frame_rgba.convert("RGB")


def build_screenshots(cfg: KitConfig, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    for src_name, out_169, out_11 in cfg.screenshots:
        src_path = cfg.raw_screenshots_dir / src_name
        if not src_path.exists():
            print(f"  skip missing raw: {src_name}")
            continue
        src = Image.open(src_path).convert("RGB")
        if out_169:
            frame_screenshot(src, cfg.accent, (16, 9), 1600).save(out_dir / out_169)
        if out_11:
            frame_screenshot(src, cfg.accent, (1, 1), 1200).save(out_dir / out_11)


# ---------- Profile mockup (desktop + mobile) ----------
def build_profile_mockups(cfg: KitConfig, root: Path):
    avatar_path = root / "avatar-400x400.png"
    header_path = root / "header-1500x500.png"

    # Desktop
    w, h = 1200, 900
    bg = Image.new("RGB", (w, h), (22, 24, 28)).convert("RGBA")
    d = ImageDraw.Draw(bg)
    d.rectangle((0, 0, w, 48), fill=(30, 33, 38))
    for i, c in enumerate([(237, 106, 94), (244, 191, 79), (98, 197, 84)]):
        d.ellipse((20 + i * 24, 16, 36 + i * 24, 32), fill=c)
    d.rounded_rectangle((140, 12, w - 120, 36), radius=6, fill=(20, 22, 26))
    d.text((160, 16), f"x.com/{cfg.handle}", font=font("mono_reg", 14), fill=TEXT_LO)

    card_x, card_y = 60, 80
    card_w, card_h = w - 120, h - 160
    d.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=14, fill=(0, 0, 0))

    header = Image.open(header_path).convert("RGBA").resize((card_w, int(card_w * 500 / 1500)))
    bg.alpha_composite(header, (card_x, card_y))
    hdr_h = header.size[1]

    av = Image.open(avatar_path).convert("RGBA").resize((134, 134))
    mask = Image.new("L", (134, 134), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 134, 134), fill=255)
    av.putalpha(mask)
    ring = Image.new("RGBA", (146, 146), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, 146, 146), fill=(0, 0, 0))
    bg.alpha_composite(ring, (card_x + 20, card_y + hdr_h - 74))
    bg.alpha_composite(av, (card_x + 26, card_y + hdr_h - 68))

    # Follow button
    btn_x2 = card_x + card_w - 24
    btn_y1 = card_y + hdr_h + 16
    btn_w = 110
    d.rounded_rectangle((btn_x2 - btn_w, btn_y1, btn_x2, btn_y1 + 36), radius=18, fill=(239, 239, 239))
    tw, th = text_wh(d, "Follow", font("sans_bold", 15))
    d.text((btn_x2 - btn_w + (btn_w - tw) // 2, btn_y1 + (36 - th) // 2 - 2), "Follow", font=font("sans_bold", 15), fill=(10, 10, 10))

    bx = card_x + 28
    by = card_y + hdr_h + 86
    d.text((bx, by), cfg.profile_name, font=font("sans_bold", 26), fill=(240, 240, 240))
    d.ellipse((bx + text_wh(d, cfg.profile_name, font("sans_bold", 26))[0] + 12, by + 10,
               bx + text_wh(d, cfg.profile_name, font("sans_bold", 26))[0] + 30, by + 28), fill=cfg.accent)
    d.text((bx, by + 38), f"@{cfg.handle}", font=font("sans", 16), fill=(113, 118, 123))
    y = by + 76
    for ln in cfg.bio_lines:
        d.text((bx, y), ln, font=font("sans", 16), fill=(230, 232, 236))
        y += 26
    y += 8
    d.text((bx, y), f"🔗 szlholdings.com      📅 Joined April 2026      {cfg.parent_tag}",
           font=font("sans", 15), fill=(113, 118, 123))

    bg.convert("RGB").save(root / "profile-mockup-desktop.png", "PNG")

    # Mobile
    mw, mh = 430, 900
    mbg = Image.new("RGB", (mw, mh), (0, 0, 0)).convert("RGBA")
    md = ImageDraw.Draw(mbg)
    md.text((20, 14), "9:41", font=font("sans_bold", 14), fill=(240, 240, 240))
    md.text((mw - 70, 14), "●●●● 100%", font=font("sans", 12), fill=(240, 240, 240))
    md.text((20, 44), f"←   {cfg.profile_name}", font=font("sans_bold", 17), fill=(240, 240, 240))
    md.text((56, 66), "Launch week", font=font("sans", 12), fill=(113, 118, 123))
    mh_hdr = int(mw * 500 / 1500)
    header_m = Image.open(header_path).convert("RGBA").resize((mw, mh_hdr))
    mbg.alpha_composite(header_m, (0, 90))
    av_m = Image.open(avatar_path).convert("RGBA").resize((86, 86))
    mask = Image.new("L", (86, 86), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 86, 86), fill=255)
    av_m.putalpha(mask)
    ring = Image.new("RGBA", (94, 94), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, 94, 94), fill=(0, 0, 0))
    mbg.alpha_composite(ring, (12, 90 + mh_hdr - 46))
    mbg.alpha_composite(av_m, (16, 90 + mh_hdr - 42))
    md.rounded_rectangle((mw - 108, 90 + mh_hdr + 12, mw - 20, 90 + mh_hdr + 44), radius=16, fill=(239, 239, 239))
    tw, th = text_wh(md, "Follow", font("sans_bold", 13))
    md.text((mw - 108 + (88 - tw) // 2, 90 + mh_hdr + 16), "Follow", font=font("sans_bold", 13), fill=(10, 10, 10))
    y = 90 + mh_hdr + 60
    md.text((20, y), cfg.profile_name, font=font("sans_bold", 20), fill=(240, 240, 240))
    md.text((20, y + 28), f"@{cfg.handle}", font=font("sans", 13), fill=(113, 118, 123))
    ly = y + 56
    for ln in cfg.bio_lines:
        md.text((20, ly), ln, font=font("sans", 14), fill=(230, 232, 236))
        ly += 22
    md.text((20, ly + 10), f"🔗 szlholdings.com", font=font("sans", 12), fill=(113, 118, 123))
    md.text((20, ly + 32), cfg.parent_tag, font=font("sans", 12), fill=GOLD)

    mbg.convert("RGB").save(root / "profile-mockup-mobile.png", "PNG")


# ---------- Top-level build ----------
def build_kit(cfg: KitConfig, root: Path) -> None:
    root.mkdir(parents=True, exist_ok=True)
    variants = root / "header-variants"
    variants.mkdir(parents=True, exist_ok=True)
    shots = root / "screenshots"
    shots.mkdir(parents=True, exist_ok=True)

    print(f"[{cfg.handle}] avatar...")
    build_avatar(cfg, root / "avatar-400x400.png")
    print(f"[{cfg.handle}] headers...")
    build_headers(cfg, root / "header-1500x500.png", variants)
    print(f"[{cfg.handle}] screenshots...")
    build_screenshots(cfg, shots)
    print(f"[{cfg.handle}] profile mockups...")
    build_profile_mockups(cfg, root)
    print(f"[{cfg.handle}] done.")


