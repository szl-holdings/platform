#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# szlctl — SZL Holdings estate operations CLI
#
# CLI ergonomics inspired by jkdevcode/smart-job-cli + gh-follow-sync (MIT).
# Those upstream tools are MIT-licensed; we take inspiration WITH ATTRIBUTION.
# This is original SZL code (Python stdlib + the `gh` subprocess only). No
# upstream source is copied; no upstream authorship is claimed.
#
# Doctrine v11: no overclaim; joules are MEASURED only via a real on-box
# exporter; locked=8; Lambda = Conjecture 1; never commit a key; trust never
# 100%. This tool only READS the estate and prints. It mutates nothing.
#
# Pure stdlib: urllib for HTTP, subprocess for `gh`. No third-party deps.
"""szlctl — one clean ops entrypoint over the SZL estate.

Subcommands:
  surfaces   live a-11-oy.com surface health (green/red 200-vs-down table)
  prs        open PRs across szl-holdings with a 1-line disposition
  fabric     compute-pool: gpu_nodes_reachable + per-node reachable + joules_label
  forge      Forge auto-loop state from replit-sync/AUTO_STATE.json
  posture    live grid price + should_soak + joules_label (the energy money signal)

Honesty contract: never fabricate. On any fetch failure a field/row is marked
"unavailable"; network calls retry up to 3 times; the CLI never crashes on a
fetch error (it reports and continues).
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

A11OY_BASE = "https://a-11-oy.com"

# Founder-facing surface VIEWS (browser tabs). `surfaces` health-checks these:
# a 200 means the live view is serving. Order is the canonical estate order.
SURFACES = (
    "harvest/posture",
    "energy/budget",
    "anatomy/loop",
    "heart/pulse",
    "revenue/marketplace",
    "ayni",
    "research/verify",
    "formula/sovereign",
    "compute-pool",
    "proof",
)

# Surface views are served under /v1/<surface>. The structured JSON DATA feeds
# (used by `fabric` and `posture`) live under /api/a11oy/v1/<surface>.
SURFACE_VIEW_PREFIX = "/v1/"
DATA_API_PREFIX = "/api/a11oy/v1/"

GH_ORG = "szl-holdings"
FORGE_STATE_PATH = "replit-sync/AUTO_STATE.json"

HTTP_TIMEOUT = 15
HTTP_RETRIES = 3
RETRY_BACKOFF = 1.5  # seconds, multiplied by attempt index

# ANSI colour (auto-disabled when stdout is not a TTY or NO_COLOR is set).
_USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _c(text, code):
    if not _USE_COLOR:
        return text
    return "\033[%sm%s\033[0m" % (code, text)


def green(text):
    return _c(text, "32")


def red(text):
    return _c(text, "31")


def yellow(text):
    return _c(text, "33")


def dim(text):
    return _c(text, "2")


UNAVAILABLE = "unavailable"


# ---------------------------------------------------------------------------
# Network helpers (stdlib only, honest, retrying, non-crashing)
# ---------------------------------------------------------------------------

def http_status(url, retries=HTTP_RETRIES, timeout=HTTP_TIMEOUT):
    """Return (status_code:int | None, note:str). Never raises.

    Retries up to `retries` times. On total failure returns (None, reason).
    """
    last_note = UNAVAILABLE
    for attempt in range(1, retries + 1):
        req = urllib.request.Request(url, method="GET",
                                     headers={"User-Agent": "szlctl"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.getcode(), "ok"
        except urllib.error.HTTPError as e:
            # An HTTP error still carries a real status code (e.g. 404/503).
            return e.code, "http-error"
        except (urllib.error.URLError, OSError) as e:
            last_note = "%s: %s" % (type(e).__name__, getattr(e, "reason", e))
        except Exception as e:  # defensive: never crash the CLI
            last_note = "%s: %s" % (type(e).__name__, e)
        if attempt < retries:
            time.sleep(RETRY_BACKOFF * attempt)
    return None, last_note


def http_json(url, retries=HTTP_RETRIES, timeout=HTTP_TIMEOUT):
    """Return (data:dict | None, note:str). Never raises."""
    last_note = UNAVAILABLE
    for attempt in range(1, retries + 1):
        req = urllib.request.Request(
            url, method="GET",
            headers={"User-Agent": "szlctl", "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8", "replace")
            return json.loads(raw), "ok"
        except urllib.error.HTTPError as e:
            last_note = "HTTP %s" % e.code
        except (urllib.error.URLError, OSError) as e:
            last_note = "%s: %s" % (type(e).__name__, getattr(e, "reason", e))
        except json.JSONDecodeError as e:
            last_note = "bad-json: %s" % e
        except Exception as e:  # defensive
            last_note = "%s: %s" % (type(e).__name__, e)
        if attempt < retries:
            time.sleep(RETRY_BACKOFF * attempt)
    return None, last_note


def run_gh(args, retries=HTTP_RETRIES):
    """Run `gh <args>` and return (stdout:str | None, note:str). Never raises."""
    last_note = UNAVAILABLE
    for attempt in range(1, retries + 1):
        try:
            proc = subprocess.run(
                ["gh"] + list(args),
                capture_output=True, text=True, timeout=60)
            if proc.returncode == 0:
                return proc.stdout, "ok"
            last_note = (proc.stderr or "gh exit %d" % proc.returncode).strip()
        except FileNotFoundError:
            return None, "gh-not-installed"
        except subprocess.TimeoutExpired:
            last_note = "gh-timeout"
        except Exception as e:  # defensive
            last_note = "%s: %s" % (type(e).__name__, e)
        if attempt < retries:
            time.sleep(RETRY_BACKOFF * attempt)
    return None, last_note


# ---------------------------------------------------------------------------
# Pure formatters (network-free; unit-tested on mock data)
# ---------------------------------------------------------------------------

def format_surface_table(rows):
    """Render the surfaces health table.

    rows: list of dicts {surface, status (int|None), up (bool)}.
    Returns a multi-line string. Pure: no I/O, no colour-dependence on data.
    """
    name_w = max([len("SURFACE")] + [len(r["surface"]) for r in rows]) if rows else 7
    lines = []
    header = "  %-*s  %-6s  %s" % (name_w, "SURFACE", "HTTP", "STATE")
    lines.append(header)
    lines.append("  " + "-" * (name_w + 18))
    up_count = 0
    for r in rows:
        status = r["status"]
        code = str(status) if status is not None else "--"
        if r["up"]:
            up_count += 1
            mark = green("● UP")
        else:
            mark = red("● DOWN")
        lines.append("  %-*s  %-6s  %s" % (name_w, r["surface"], code, mark))
    lines.append("")
    summary = "  %d/%d surfaces serving 200" % (up_count, len(rows))
    lines.append(green(summary) if up_count == len(rows) else yellow(summary))
    return "\n".join(lines)


def classify_surface(status):
    """A surface is UP iff it returns HTTP 200. Anything else is down."""
    return status == 200


def format_fabric(pool, posture):
    """Render the compute-fabric view from compute-pool + harvest/posture JSON.

    pool / posture may be None (fetch failed) -> 'unavailable' lines.
    Returns a multi-line string. Pure.
    """
    lines = ["SZL compute fabric", ""]
    if pool is None:
        lines.append("  compute-pool: %s" % red(UNAVAILABLE))
    else:
        counts = pool.get("counts", {}) or {}
        gnr = counts.get("gpu_nodes_reachable", UNAVAILABLE)
        ntot = counts.get("nodes_total", UNAVAILABLE)
        nreach = counts.get("nodes_reachable", UNAVAILABLE)
        lines.append("  gpu_nodes_reachable : %s" % gnr)
        lines.append("  nodes_reachable     : %s / %s" % (nreach, ntot))
        lines.append("")
        nodes = pool.get("nodes", []) or []
        # Founder cares about the two named sovereign/tailnet GPUs first.
        focus = ("betterwithage", "chaski")
        name_w = max([len("NODE")] + [len(n.get("name", "?")) for n in nodes]) \
            if nodes else 4
        lines.append("  %-*s  %-9s  %s" % (name_w, "NODE", "REACHABLE", "KIND"))
        lines.append("  " + "-" * (name_w + 24))
        for n in nodes:
            name = n.get("name", "?")
            reach = n.get("reachable")
            kind = n.get("kind", "?")
            if reach is True:
                rtxt = green("yes")
            elif reach is False:
                rtxt = red("no")
            else:
                rtxt = yellow(UNAVAILABLE)
            star = " *" if any(f in name for f in focus) else ""
            lines.append("  %-*s  %-9s  %s%s"
                         % (name_w, name, rtxt, kind, star))
        lines.append("")
        lines.append(dim("  * = founder-tracked GPU (betterwithage, chaski)"))
    lines.append("")
    # joules_label sourced from harvest/posture (doctrine: MEASURED only via
    # a real exporter; we print exactly what the live exporter reports).
    if posture is None:
        lines.append("  joules_label (harvest/posture): %s" % red(UNAVAILABLE))
    else:
        jl = posture.get("joules_label", UNAVAILABLE)
        lines.append("  joules_label (harvest/posture): %s" % jl)
    return "\n".join(lines)


def format_posture(posture):
    """Render the energy money signal: grid price + should_soak + joules_label."""
    lines = ["SZL energy posture (the money signal)", ""]
    if posture is None:
        lines.append("  %s — could not read harvest/posture" % red(UNAVAILABLE))
        return "\n".join(lines)
    price = posture.get("price_now_eur_mwh", UNAVAILABLE)
    nxt = posture.get("next_min_eur_mwh", UNAVAILABLE)
    soak = posture.get("should_soak")
    jl = posture.get("joules_label", UNAVAILABLE)
    src = posture.get("energy_source", UNAVAILABLE)
    gp = posture.get("grid_price_posture", UNAVAILABLE)
    lines.append("  grid price now   : %s EUR/MWh" % price)
    lines.append("  next-window min  : %s EUR/MWh" % nxt)
    lines.append("  grid posture     : %s" % gp)
    if soak is True:
        lines.append("  should_soak      : %s" % green("YES — soak wasted energy now"))
    elif soak is False:
        lines.append("  should_soak      : %s" % yellow("no"))
    else:
        lines.append("  should_soak      : %s" % UNAVAILABLE)
    lines.append("  joules_label     : %s" % jl)
    lines.append("  energy_source    : %s" % src)
    return "\n".join(lines)


def format_forge(state):
    """Render Forge auto-loop state from AUTO_STATE.json content."""
    lines = ["Forge auto-loop state (replit-sync/AUTO_STATE.json)", ""]
    if state is None:
        lines.append("  %s — could not read AUTO_STATE.json" % red(UNAVAILABLE))
        return "\n".join(lines)
    lines.append("  state        : %s" % state.get("state", UNAVAILABLE))
    lines.append("  idle         : %s" % state.get("idle", UNAVAILABLE))
    lines.append("  seen_at      : %s" % state.get("seen_at", UNAVAILABLE))
    lines.append("  updated_at   : %s" % state.get("updated_at", UNAVAILABLE))
    lines.append("  order_kind   : %s" % state.get("order_kind", UNAVAILABLE))
    lines.append("  order_path   : %s" % state.get("order_path", UNAVAILABLE))
    lines.append("  dispatch     : %s" % state.get("dispatch_mode", UNAVAILABLE))
    fa = state.get("freeze_ack")
    if isinstance(fa, dict):
        lines.append("  freeze_active: %s" % fa.get("freeze_active", UNAVAILABLE))
    return "\n".join(lines)


def disposition(title):
    """1-line PR disposition heuristic from the title (honest, conservative)."""
    t = (title or "").lower()
    if t.startswith("feat") or "feat(" in t:
        return "feature — review scope"
    if t.startswith("fix") or "fix(" in t:
        return "fix — verify + merge candidate"
    if t.startswith("docs") or "docs(" in t:
        return "docs — low-risk"
    if "proof" in t:
        return "proof — needs Lean/kernel check"
    if "chore" in t or "ci" in t:
        return "chore/ci — low-risk"
    return "review"


def format_prs(items):
    """Render open PRs across the org with a 1-line disposition. Pure."""
    if items is None:
        return red("PR search %s — could not query gh" % UNAVAILABLE)
    if not items:
        return "No open PRs across %s." % GH_ORG
    lines = ["Open PRs across %s (%d)" % (GH_ORG, len(items)), ""]
    for it in items:
        repo = (it.get("repository") or {}).get("name", "?")
        num = it.get("number", "?")
        title = it.get("title", "")
        lines.append("  %s#%s  %s" % (repo, num, title))
        lines.append(dim("      -> %s" % disposition(title)))
        url = it.get("url")
        if url:
            lines.append(dim("      %s" % url))
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Command handlers (do the I/O, then call pure formatters)
# ---------------------------------------------------------------------------

def cmd_surfaces(args):
    rows = []
    for s in SURFACES:
        url = A11OY_BASE + SURFACE_VIEW_PREFIX + s
        status, _note = http_status(url)
        rows.append({"surface": s, "status": status, "up": classify_surface(status)})
    print(format_surface_table(rows))
    return 0


def cmd_prs(args):
    out, note = run_gh([
        "search", "prs", "--owner", GH_ORG, "--state", "open",
        "--limit", "100", "--json", "number,title,repository,url",
    ])
    if out is None:
        print(format_prs(None))
        print(dim("  (%s)" % note))
        return 0
    try:
        items = json.loads(out)
    except json.JSONDecodeError:
        print(format_prs(None))
        return 0
    print(format_prs(items))
    return 0


def cmd_fabric(args):
    pool, _ = http_json(A11OY_BASE + DATA_API_PREFIX + "compute-pool")
    posture, _ = http_json(A11OY_BASE + DATA_API_PREFIX + "harvest/posture")
    print(format_fabric(pool, posture))
    return 0


def cmd_forge(args):
    # Read AUTO_STATE.json from the platform repo via `gh api contents`.
    # gh api decodes base64 when we use the .content jq-ish path; we request raw.
    out, note = run_gh([
        "api",
        "repos/%s/platform/contents/%s" % (GH_ORG, FORGE_STATE_PATH),
        "-H", "Accept: application/vnd.github.raw+json",
    ])
    state = None
    if out is not None:
        try:
            state = json.loads(out)
        except json.JSONDecodeError:
            state = None
    if state is None:
        # Fallback: local checkout (when run from inside the repo).
        for base in (os.getcwd(), os.path.dirname(os.path.dirname(os.path.abspath(__file__)))):
            p = os.path.join(base, FORGE_STATE_PATH)
            if os.path.isfile(p):
                try:
                    with open(p, "r", encoding="utf-8") as fh:
                        state = json.load(fh)
                    break
                except Exception:
                    pass
    print(format_forge(state))
    if state is None:
        print(dim("  (%s)" % note))
    return 0


def cmd_posture(args):
    posture, note = http_json(A11OY_BASE + DATA_API_PREFIX + "harvest/posture")
    print(format_posture(posture))
    if posture is None:
        print(dim("  (%s)" % note))
    return 0


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

def build_parser():
    p = argparse.ArgumentParser(
        prog="szlctl",
        description="SZL Holdings estate operations CLI (read-only). "
                    "CLI ergonomics inspired by jkdevcode/smart-job-cli + "
                    "gh-follow-sync (MIT).",
    )
    sub = p.add_subparsers(dest="command", required=True)

    sp = sub.add_parser("surfaces", help="live a-11-oy.com surface health table")
    sp.set_defaults(func=cmd_surfaces)

    sp = sub.add_parser("prs", help="open PRs across szl-holdings + disposition")
    sp.set_defaults(func=cmd_prs)

    sp = sub.add_parser("fabric", help="compute-pool fabric + joules_label")
    sp.set_defaults(func=cmd_fabric)

    sp = sub.add_parser("forge", help="Forge auto-loop state from AUTO_STATE.json")
    sp.set_defaults(func=cmd_forge)

    sp = sub.add_parser("posture", help="grid price + should_soak + joules_label")
    sp.set_defaults(func=cmd_posture)

    return p


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except KeyboardInterrupt:
        return 130
    except Exception as e:  # final safety net: honest failure, never a crash
        print(red("szlctl: unexpected error: %s" % e), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
