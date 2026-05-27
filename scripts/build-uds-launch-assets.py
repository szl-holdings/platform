#!/usr/bin/env python3
"""Build Andrew Green packet: DOCX + 2 PNG diagrams for the UDS mesh launch.

Outputs:
  docs/uds/exports/SZL-UDS-Mesh-Launch-AndrewGreen.docx
  docs/uds/exports/img/uds-fleet-mesh.png
  docs/uds/exports/img/uds-pull-verify-install.png
"""
from __future__ import annotations
import os
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "uds" / "exports"
IMG_DIR = OUT_DIR / "img"
OUT_DIR.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)

# Brand palette (SZL dark, cyan accent, amber warn, green ok)
BG       = "#0b0e14"
FG       = "#e6edf3"
MUTED    = "#8b949e"
CYAN     = "#22d3ee"
AMBER    = "#f0b429"
GREEN    = "#34d399"
PANEL    = "#11161d"
BORDER   = "#1f2733"

BUNDLES = [
    ("A11oy",   "brand orchestration",       "#22d3ee"),
    ("Amaru",   "convergent data-sync",      "#a78bfa"),
    ("ROSIE",   "governed decisions",        "#34d399"),
    ("Sentra",  "cyber resilience",          "#f0b429"),
    ("Vessels", "maritime intelligence",     "#60a5fa"),
]

# ──────────────────────────────────────────────────────────────────────────────
# Diagram 1: Bundle fleet → mesh registry
# ──────────────────────────────────────────────────────────────────────────────

def panel(ax, x, y, w, h, fc=PANEL, ec=BORDER, lw=1.2, radius=0.04):
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=0.005,rounding_size={radius}",
                       linewidth=lw, edgecolor=ec, facecolor=fc)
    ax.add_patch(p)
    return p

def text(ax, x, y, s, **kw):
    kw.setdefault("color", FG)
    kw.setdefault("fontsize", 11)
    kw.setdefault("ha", "left")
    kw.setdefault("va", "center")
    kw.setdefault("family", "DejaVu Sans Mono")
    ax.text(x, y, s, **kw)

def fig_fleet_mesh(path):
    fig, ax = plt.subplots(figsize=(13.33, 7.5), dpi=160)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)
    ax.set_xlim(0, 16); ax.set_ylim(0, 9); ax.set_axis_off()

    # Title
    text(ax, 0.6, 8.5, "SZL Holdings — UDS bundle mesh, v0.2.0",
         fontsize=22, weight="bold", family="DejaVu Sans")
    text(ax, 0.6, 7.95, "five signed Zarf payloads → one read-only registry feed → one pull-verify-install contract",
         fontsize=12, color=MUTED, family="DejaVu Sans")

    # Left column: 5 bundles
    bx = 0.6; bw = 6.0; bh = 1.05; gap = 0.15
    by = 6.9
    for slug, blurb, color in BUNDLES:
        panel(ax, bx, by - bh, bw, bh, fc=PANEL, ec=color, lw=1.6)
        # color tab
        panel(ax, bx, by - bh, 0.18, bh, fc=color, ec=color, lw=0, radius=0.02)
        text(ax, bx + 0.40, by - 0.30, slug, fontsize=13, weight="bold")
        text(ax, bx + 1.55, by - 0.32, blurb, fontsize=9.5, color=MUTED, family="DejaVu Sans")
        text(ax, bx + 0.40, by - 0.78,
             f"ghcr.io/szl-holdings/{slug.lower()}-uds:0.2.0",
             fontsize=9.0, color=CYAN)
        by -= (bh + gap)

    # Middle: mesh registry node
    mx, my, mw, mh = 7.2, 3.6, 3.8, 3.4
    panel(ax, mx, my, mw, mh, fc=PANEL, ec=CYAN, lw=2.2, radius=0.05)
    text(ax, mx + mw/2, my + mh - 0.45, "Mesh Registry",
         fontsize=15, weight="bold", color=CYAN, ha="center")
    text(ax, mx + mw/2, my + mh - 0.85, "read-only, machine-readable",
         fontsize=10, color=MUTED, ha="center", family="DejaVu Sans")
    text(ax, mx + 0.25, my + mh - 1.55, "GET /api/uds/registry",
         fontsize=10.5, color=FG)
    text(ax, mx + 0.25, my + mh - 1.95, "GET /api/uds/registry/<slug>",
         fontsize=10.5, color=FG)
    text(ax, mx + 0.25, my + mh - 2.55, "• version + OCI coords",
         fontsize=9.5, color=MUTED, family="DejaVu Sans")
    text(ax, mx + 0.25, my + mh - 2.85, "• cosign identity regex",
         fontsize=9.5, color=MUTED, family="DejaVu Sans")
    text(ax, mx + 0.25, my + mh - 3.15, "• install path + build cmd",
         fontsize=9.5, color=MUTED, family="DejaVu Sans")

    # Arrows from bundles → mesh
    arrow_x_start = bx + bw + 0.05
    arrow_x_end = mx
    y_cur = 6.9 - bh/2
    for _ in BUNDLES:
        arr = FancyArrowPatch((arrow_x_start, y_cur), (arrow_x_end, my + mh/2),
                              arrowstyle="-|>", mutation_scale=10,
                              color=BORDER, linewidth=1.0, alpha=0.7)
        ax.add_patch(arr)
        y_cur -= (bh + gap)

    # Right: Defense-Unicorns consumers
    cx, cy, cw, ch = 11.8, 3.6, 3.8, 3.4
    panel(ax, cx, cy, cw, ch, fc=PANEL, ec=AMBER, lw=1.8, radius=0.05)
    text(ax, cx + cw/2, cy + ch - 0.45, "Defense-Unicorns",
         fontsize=14, weight="bold", color=AMBER, ha="center")
    text(ax, cx + cw/2, cy + ch - 0.85, "consumers",
         fontsize=10, color=MUTED, ha="center", family="DejaVu Sans")
    rows = [
        "• UDS gateways",
        "• CI runners",
        "• mesh nodes",
        "• air-gap operators",
        "• policy controllers",
    ]
    for i, r in enumerate(rows):
        text(ax, cx + 0.25, cy + ch - 1.45 - i*0.35, r,
             fontsize=10, color=FG)

    # Mesh → consumers arrow
    arr = FancyArrowPatch((mx + mw, my + mh/2), (cx, cy + ch/2),
                          arrowstyle="-|>", mutation_scale=14,
                          color=CYAN, linewidth=2.0)
    ax.add_patch(arr)
    text(ax, (mx + mw + cx)/2, my + mh/2 + 0.25, "discover",
         fontsize=9, color=CYAN, ha="center", family="DejaVu Sans")

    # Footer trust anchor — pushed below the bundle stack
    panel(ax, 0.6, -1.2, 14.8, 1.6, fc="#0f1620", ec=GREEN, lw=1.4, radius=0.04)
    text(ax, 0.95, 0.05, "trust anchor",
         fontsize=10.5, color=GREEN, weight="bold")
    text(ax, 0.95, -0.35,
         "bundles register at publish time via the per-bundle GitHub Actions workflow —",
         fontsize=10, color=FG, family="DejaVu Sans")
    text(ax, 0.95, -0.70,
         "the same workflow whose identity cosign verifies against.  no POST surface on the mesh.",
         fontsize=10, color=FG, family="DejaVu Sans")
    text(ax, 0.95, -1.05,
         "deterministic builds • content-addressed MANIFEST.json • keyless cosign via OIDC • air-gap parity",
         fontsize=9, color=MUTED, family="DejaVu Sans")

    # Expand the y range so the footer (now below 0) is visible
    ax.set_ylim(-1.5, 9)

    plt.savefig(path, dpi=160, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {path}")

# ──────────────────────────────────────────────────────────────────────────────
# Diagram 2: pull-verify-install contract
# ──────────────────────────────────────────────────────────────────────────────

def fig_contract(path):
    fig, ax = plt.subplots(figsize=(13.33, 7.5), dpi=160)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)
    ax.set_xlim(0, 16); ax.set_ylim(0, 9); ax.set_axis_off()

    text(ax, 0.6, 8.5, "Universal pull-verify-install contract",
         fontsize=22, weight="bold", family="DejaVu Sans")
    text(ax, 0.6, 7.95, "one shape — five bundles — air-gap-compatible",
         fontsize=12, color=MUTED, family="DejaVu Sans")

    steps = [
        ("1", "PULL", CYAN,
         "zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:0.2.0",
         "fetch the signed OCI image\nor the GitHub Release tarball"),
        ("2", "VERIFY", AMBER,
         "cosign verify \\\n  --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\\\n     \\.github/workflows/<bundle>-uds-publish\\.yml@.+' \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\\n  ghcr.io/szl-holdings/<bundle>-uds:0.2.0",
         "keyless cosign — pinned to\nthe per-bundle Actions workflow"),
        ("3", "INSTALL", GREEN,
         "zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm",
         "components stage under\n/opt/<bundle>/ on the target node"),
    ]

    y_cursor = 7.0
    for n, label, color, cmd, blurb in steps:
        h = 1.85
        # numbered badge
        circle = plt.Circle((1.2, y_cursor - h/2), 0.45, color=color, ec=color, lw=2)
        ax.add_patch(circle)
        text(ax, 1.2, y_cursor - h/2, n, fontsize=22, weight="bold",
             color=BG, ha="center", va="center", family="DejaVu Sans")
        # label
        text(ax, 2.0, y_cursor - 0.3, label, fontsize=15, weight="bold",
             color=color, family="DejaVu Sans")
        text(ax, 2.0, y_cursor - 0.7, blurb, fontsize=10, color=MUTED,
             family="DejaVu Sans", va="top")
        # command box
        panel(ax, 6.5, y_cursor - h + 0.15, 9.0, h - 0.3,
              fc="#0d141c", ec=BORDER, lw=1.2)
        text(ax, 6.7, y_cursor - 0.35, cmd, fontsize=9.0, color=FG, va="top")

        y_cursor -= (h + 0.15)

    # Footer
    panel(ax, 0.6, 0.5, 14.8, 1.1, fc="#0f1620", ec=BORDER, lw=1.2, radius=0.04)
    text(ax, 0.95, 1.25, "trust chain",
         fontsize=10.5, color=CYAN, weight="bold")
    text(ax, 0.95, 0.85,
         "GitHub OIDC → workflow identity → cosign signature → MANIFEST.json sha256 → zarf deploy.",
         fontsize=10, color=FG, family="DejaVu Sans")
    text(ax, 0.95, 0.55,
         "every step verifies the previous one.  break the chain, the deploy halts.",
         fontsize=9, color=MUTED, family="DejaVu Sans")

    plt.savefig(path, dpi=160, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {path}")

# ──────────────────────────────────────────────────────────────────────────────
# Word doc for Andrew Green
# ──────────────────────────────────────────────────────────────────────────────

def add_heading(doc, text, level=1, color=None):
    h = doc.add_heading(text, level=level)
    if color:
        for run in h.runs:
            run.font.color.rgb = color
    return h

def add_para(doc, text, *, mono=False, color=None, size=None, bold=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    if mono:
        run.font.name = "Consolas"
        run.font.size = Pt(9.5)
    if size:
        run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    if bold:
        run.bold = True
    return p

def add_code(doc, code):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    run = p.add_run(code)
    run.font.name = "Consolas"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    return p

def build_docx(path, fleet_png, contract_png):
    doc = Document()

    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    # Title block
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = t.add_run("SZL Holdings — UDS bundle mesh, v0.2.0")
    r.bold = True
    r.font.size = Pt(22)

    sub = doc.add_paragraph()
    sr = sub.add_run("Defense-Unicorns operator packet · Prepared for Andrew Green")
    sr.italic = True
    sr.font.size = Pt(11)
    sr.font.color.rgb = RGBColor(0x60, 0x60, 0x60)

    doc.add_paragraph()

    # Hero diagram
    doc.add_picture(str(fleet_png), width=Inches(6.5))

    doc.add_paragraph()

    # Executive summary
    add_heading(doc, "Executive summary", level=1)
    doc.add_paragraph(
        "We just shipped five signed Zarf payloads plus a read-only mesh registry feed for "
        "Defense-Unicorns (UDS) environments. Same pull-verify-install contract across every "
        "bundle. One machine-readable feed so downstream UDS gateways, CI runners, and other "
        "mesh nodes discover current oci:// coordinates without scraping markdown. "
        "Cosign-keyless via GitHub Actions OIDC. Air-gap-compatible from day one."
    )
    doc.add_paragraph(
        "If you're standing up a UDS-enabled cluster — connected, edge, or fully disconnected — "
        "the full fleet is pullable today."
    )

    # Bundle table
    add_heading(doc, "The five bundles (all v0.2.0)", level=1)
    table = doc.add_table(rows=1, cols=4)
    table.style = "Light Grid Accent 1"
    hdr = table.rows[0].cells
    for i, label in enumerate(["#", "Bundle", "Runtime", "OCI release coordinates"]):
        hdr[i].text = label
        for run in hdr[i].paragraphs[0].runs:
            run.bold = True

    rows = [
        ("1", "A11oy",   "brand orchestration — @a11oy/core + @a11oy/connection, optional hash-chained attestations component for offline provenance without a Rekor round-trip", "oci://ghcr.io/szl-holdings/a11oy-uds:0.2.0"),
        ("2", "Amaru",   "Andean Ouroboros convergent data-sync — Doctrine V6 (Lutar Σ, Λ floor, Bekenstein admission, bounded-loop convergence, KL drift, hash-chained proof receipts)", "oci://ghcr.io/szl-holdings/amaru-uds:0.2.0"),
        ("3", "ROSIE",   "governed decision fabric — policy admission, contradiction detection, governed-action emit, hash-chained decision receipts", "oci://ghcr.io/szl-holdings/rosie-uds:0.2.0"),
        ("4", "Sentra",  "cyber resilience command — asset-scoped fail-closed Safety Gate · NIST CSF 2.0 + SP 800-61r2 + CISA CIRCIA + MITRE D3FEND mappings · Ising allocation · Proof Chain", "oci://ghcr.io/szl-holdings/sentra-uds:0.2.0"),
        ("5", "Vessels", "maritime intelligence — CPA (Bowditch), collision cone, AIS-gap dark-vessel detector (Λ-floor 0.90), sanctions screen, voyage Λ-receipts", "oci://ghcr.io/szl-holdings/vessels-uds:0.2.0"),
    ]
    for r in rows:
        cells = table.add_row().cells
        for i, val in enumerate(r):
            cells[i].text = val

    doc.add_paragraph()
    doc.add_paragraph(
        "Every bundle also ships an unsigned dev channel tracking main: "
        "oci://ghcr.io/szl-holdings/<bundle>-uds:dev. Release-channel images are the only "
        "ones signed — by design."
    )

    # Contract diagram
    add_heading(doc, "Universal pull-verify-install contract", level=1)
    doc.add_picture(str(contract_png), width=Inches(6.5))

    add_code(doc,
        "# 1. PULL\n"
        "zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:0.2.0\n\n"
        "# 2. VERIFY  (release channel only — keyless cosign via GitHub OIDC)\n"
        "cosign verify \\\n"
        "  --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\\.github/workflows/<bundle>-uds-publish\\.yml@.+' \\\n"
        "  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\\n"
        "  ghcr.io/szl-holdings/<bundle>-uds:0.2.0\n\n"
        "# 3. INSTALL\n"
        "zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm\n"
        "# Components stage under /opt/<bundle>/ on the target node."
    )

    # Mesh registry
    add_heading(doc, "The mesh registry — read-only, machine-readable, live", level=1)
    doc.add_paragraph(
        "The whole fleet is exposed on the mesh api-server so downstream Defense-Unicorns "
        "gateways, mesh nodes, and CI runners can discover current pull coordinates + cosign "
        "identity regex without scraping any markdown."
    )
    add_code(doc,
        "# Full fleet — versions, OCI coords, cosign identity regex, install paths, build commands\n"
        "curl https://<mesh-host>/api/uds/registry\n\n"
        "# Single bundle\n"
        "curl https://<mesh-host>/api/uds/registry/vessels"
    )
    doc.add_paragraph(
        "Returns schemaVersion, generatedAt, the canonical doc pointer, universal "
        "pull/verify/install templates, the shared-package list, and every bundle entry. "
        "Read-only by design — there is no POST /api/uds/registry path. Bundles register at "
        "publish time via the per-bundle GitHub Actions workflow, which is also the workflow "
        "whose identity cosign verifies against. That invariant is the trust anchor; we will "
        "not weaken it."
    )

    # Repos
    add_heading(doc, "Repos — pull source, build yourself, audit anything", level=1)
    repo_table = doc.add_table(rows=1, cols=2)
    repo_table.style = "Light Grid Accent 1"
    rh = repo_table.rows[0].cells
    for i, label in enumerate(["Repo", "What lives there"]):
        rh[i].text = label
        for run in rh[i].paragraphs[0].runs:
            run.bold = True
    repo_rows = [
        ("github.com/szl-holdings/szl",
         "Canonical monorepo: every bundle source, every shared package, the mesh api-server, the publish workflows, the verifier scripts, doctrine docs."),
        ("github.com/szl-holdings/.github",
         "Reusable composite Actions and the OIDC-bound publish workflows whose identity cosign pins. Auditable from the outside."),
        ("ghcr.io/szl-holdings/<bundle>-uds",
         "Signed OCI images — five repos, one per bundle."),
    ]
    for r in repo_rows:
        cells = repo_table.add_row().cells
        for i, val in enumerate(r):
            cells[i].text = val

    add_para(doc, "")
    add_para(doc, "Per-bundle source directories:", bold=True)
    for d in [
        "artifacts/a11oy-uds/   — README · scripts/build.sh · scripts/verify-manifest.mjs · scripts/verify-attestations.mjs",
        "artifacts/amaru-uds/   — README · scripts/build.sh · scripts/verify-manifest.mjs",
        "artifacts/rosie-uds/   — README · scripts/build.sh · scripts/verify-manifest.mjs",
        "artifacts/sentra-uds/  — README · scripts/build.sh · scripts/verify-manifest.mjs",
        "artifacts/vessels-uds/ — README · scripts/build.sh · scripts/verify-manifest.mjs",
    ]:
        doc.add_paragraph(d, style="List Bullet")

    add_para(doc, "")
    add_para(doc, "Per-bundle publish workflows (the GitHub Actions whose OIDC identity cosign binds to):", bold=True)
    for w in [
        ".github/workflows/a11oy-uds-publish.yml",
        ".github/workflows/amaru-uds-publish.yml",
        ".github/workflows/rosie-uds-publish.yml",
        ".github/workflows/sentra-uds-publish.yml",
        ".github/workflows/vessels-uds-publish.yml",
    ]:
        doc.add_paragraph(w, style="List Bullet")

    add_heading(doc, "Build any bundle locally", level=2)
    add_code(doc,
        "git clone https://github.com/szl-holdings/szl.git\n"
        "cd szl\n"
        "pnpm install --frozen-lockfile\n\n"
        "pnpm --filter @szl/amaru-uds   run build\n"
        "pnpm --filter @szl/rosie-uds   run build\n"
        "pnpm --filter @szl/sentra-uds  run build\n"
        "pnpm --filter @szl/vessels-uds run build\n"
        "pnpm --filter @workspace/a11oy-uds run build    # a11oy uses @workspace/ scope\n\n"
        "# sign locally with the dev cosign keypair\n"
        "COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD=\"\" \\\n"
        "  pnpm --filter @szl/<bundle>-uds run build"
    )

    # Shared packages
    add_heading(doc, "Shared SZL packages baked into every bundle (v0.2 payload)", level=1)
    doc.add_paragraph(
        "Staged into build/shared/ on every bundle via scripts/release/lib/stage-v2-packages.sh — "
        "one helper, walker + tar-fallback parity, MANIFEST-bound, attestation-chain-bound on a11oy:"
    )
    for line in [
        "@szl-holdings/perception-loop — operator-loop perception envelope for real-time sensing. Privacy invariant enforced by a serialization test: raw frame bytes never appear in the envelope.",
        "@szl-holdings/sequence-pipeline — multi-stage hashed evidence pipeline (peak detector + reviewer-presence signals mixed into AMI N/D with max() and G with a multiplicative damper — never overwritten).",
        "@szl-holdings/sparse-attention-kit — sparse envelope + 12 receipt classes with contradiction-probe + fail-up-to-full escalation. Hybrid-sparse wins benchmarks but loses multi-hop reasoning at scale; absorption is non-negotiably gated by the probe.",
    ]:
        doc.add_paragraph(line, style="List Bullet")
    doc.add_paragraph(
        "Coming in v0.3: @szl-holdings/memo-reflection-kit — MeMo (arXiv 2605.15156) absorption. "
        "Reflection memory with content-addressed receipts, mandatory Stage1↔Stage2 contradiction-pair "
        "escalation, span-hash-only privacy invariant. Already live on the mesh api-server under "
        "/api/memo/*; joins the bundle payload at v0.3."
    )

    # Air-gap
    add_heading(doc, "Air-gap path — the reason this whole thing exists", level=1)
    doc.add_paragraph(
        "Every release also attaches the raw *.tar.zst, *.sig, and *.sha256 sidecars to the matching "
        "GitHub Release. Air-gapped operators:"
    )
    for s in [
        "Fetch tarball + sidecars over HTTP from the GitHub Release.",
        "Verify offline against the per-file MANIFEST.json.",
        "zarf package deploy <local-path> --confirm — no GHCR reach-out needed.",
    ]:
        doc.add_paragraph(s, style="List Number")

    add_code(doc,
        "# per-file integrity post-unpack\n"
        "node artifacts/<bundle>-uds/scripts/verify-manifest.mjs /path/to/unpacked\n\n"
        "# a11oy: hash-chained provenance offline (no Rekor round-trip)\n"
        "node artifacts/a11oy-uds/scripts/verify-attestations.mjs /path/to/unpacked"
    )

    # Build prereqs
    add_heading(doc, "Build prerequisites (operator side)", level=1)
    pre_table = doc.add_table(rows=1, cols=3)
    pre_table.style = "Light Grid Accent 1"
    ph = pre_table.rows[0].cells
    for i, label in enumerate(["Tool", "Min version", "Required for"]):
        ph[i].text = label
        for run in ph[i].paragraphs[0].runs:
            run.bold = True
    for tool, ver, why in [
        ("node",   "18+",   "Manifest generation + verification"),
        ("tar",    "any",   "Fallback packaging when zarf is missing"),
        ("zstd",   "any",   "Fallback packaging when zarf is missing"),
        ("zarf",   "0.36+", "Native Zarf package create / deploy"),
        ("cosign", "2+",    "Signing (only when COSIGN_KEY is set)"),
    ]:
        cells = pre_table.add_row().cells
        cells[0].text = tool; cells[1].text = ver; cells[2].text = why

    # Doctrine
    add_heading(doc, "Doctrine guarantees — the things we will not break", level=1)
    for line in [
        "Deterministic — rebuild the same SHA → byte-for-byte the same tarball. Cold-cache rebuilds verify against the original .sha256.",
        "Strict by default — builds run tsc and refuse to ship if any package built empty. Dev-only source fallback is clearly marked in the manifest (sourcePackaged: true) and is never used for release.",
        "Content-addressed — every file in every bundle has a sha256 line in MANIFEST.json. A11oy additionally ships an optional hash-chained ATTESTATIONS.json for offline provenance.",
        "Read-only mesh registration — bundles cannot self-register at runtime. The only path onto the registry is through the per-bundle GitHub Actions publish workflow, which is the same workflow whose identity cosign verifies against.",
        "One contract, five bundles — adding a sixth bundle does not change the pull-verify-install shape. New bundles inherit the contract, not the other way around.",
    ]:
        doc.add_paragraph(line, style="List Bullet")

    # Why
    add_heading(doc, "Why this matters for UDS / Defense-Unicorns operators", level=1)
    for line in [
        "A single discovery feed for the whole SZL fleet — wire it into your gateway or CI once, never scrape again.",
        "Keyless cosign verification pinned to a workflow identity — the trust anchor is GitHub OIDC, not a long-lived key on someone's laptop.",
        "Air-gap parity — the same bytes GHCR serves are attached to the GitHub Release; MANIFEST.json walks every file; attestations chain on a11oy.",
        "Doctrine-bound runtimes — every bundle ships a Λ-receipt or Proof-Chain trail by default; nothing on the node runs without writing what it did.",
        "Auditable source — full monorepo public, per-bundle dirs, per-bundle publish workflows, verifier scripts you can read in fifteen minutes.",
    ]:
        doc.add_paragraph(line, style="List Bullet")

    doc.add_paragraph()
    closing = doc.add_paragraph()
    cr = closing.add_run(
        "Pull the registry feed. Pull a bundle. Verify it. Deploy it. "
        "If anything in those four steps surprises you, that is a bug — open an issue."
    )
    cr.italic = True

    doc.save(str(path))
    print(f"wrote {path}")

# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    fleet_png    = IMG_DIR / "uds-fleet-mesh.png"
    contract_png = IMG_DIR / "uds-pull-verify-install.png"
    docx_path    = OUT_DIR / "SZL-UDS-Mesh-Launch-AndrewGreen.docx"

    fig_fleet_mesh(fleet_png)
    fig_contract(contract_png)
    build_docx(docx_path, fleet_png, contract_png)
    print("done")
