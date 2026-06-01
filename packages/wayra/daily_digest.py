#!/usr/bin/env python3
"""
WAYRA — Daily Digest Pipeline (Hatun-Willay morning briefing)
=============================================================

Reads the Khipu-receipted IngestLog, selects the top-N accepted events by
WAYRA factor (cost-bounded), and produces a WALLPA-narrated digest transcript.
Optionally renders the transcript to a synthetic-timbre TTS audio file using an
OPEN-SOURCE engine (coqui-xtts-v2 / piper / openvoice) per Doctrine v13 §5.

This is the script intended to be invoked once per day by a scheduler (see
SCHEDULING below). It is RECEIVE-ONLY and never writes to third-party systems.

  Organ : WAYRA (4th organ — wind/breath; additive to Chaski/Wallpa/Wasi-Rikuq)
  Author: Yachay
  Law   : Khipu receipt on every ingested event · Yuyay-13 gate enforced ·
          cost-bounded (DAILY_DIGEST_CAP) · Zero Bandaid

SCHEDULING
----------
This script is designed to run as a daily cron job. In a standard deployment:

    # crontab -e  (runs 06:00 America/New_York every day)
    0 6 * * *  cd /app && /usr/bin/python3 daily_digest.py --emit-audio >> /var/log/wayra_digest.log 2>&1

or, as a systemd timer (wayra-digest.timer + wayra-digest.service):

    [Timer]
    OnCalendar=*-*-* 06:00:00
    Persistent=true

NOTE (honest): The Perplexity/agent runtime used to BUILD this organ does not
expose a `schedule_cron` tool, and no task/calendar scheduler connector is
currently authorized. Therefore the cron entry above is provided as the
deployment artifact (see wayra-digest.cron / wayra-digest.timer next to this
file). The pipeline itself is fully runnable on demand and was executed during
verification — see VERIFICATION.md. Faking a scheduled trigger would violate the
Zero Bandaid law, so the scheduling step is documented as a deployment artifact
rather than claimed as live.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# WAYRA core
sys.path.insert(0, str(Path(__file__).resolve().parent))
from wayra.core.khipu_emit import IngestLog  # noqa: E402

# ── Cost bounds (Doctrine v13 §WAYRA) ────────────────────────────────────────
DAILY_DIGEST_CAP = 50          # never narrate more than 50 items/day pre-Yuyay
DIGEST_TOP_N = 5               # Hatun-Willay surfaces the top 5
DEFAULT_DB = str(Path(__file__).resolve().parent / "data" / "wayra_ingest.db")
OUT_DIR = Path(__file__).resolve().parent / "data" / "digests"


def build_transcript(log: IngestLog, top_n: int = DIGEST_TOP_N) -> dict:
    """Select top-N accepted events and render the WALLPA narration.

    Mirrors the /api/a11oy/v1/wayra/digest endpoint logic so the a11oy tab and
    the cron pipeline always speak with one voice.
    """
    chain = log.verify_chain()
    total = log.count()
    stats = log.source_stats()

    # Cost-bounded selection: pull at most DAILY_DIGEST_CAP accepted candidates,
    # then keep the top_n by WAYRA factor.
    candidates = log.top_n(min(DAILY_DIGEST_CAP, max(top_n, DAILY_DIGEST_CAP)), "accept")
    top = candidates[:top_n]

    chain_ok = bool(chain.get("ok"))
    lines = [
        "Hatun-Willay morning briefing. WAYRA breathed in the world overnight.",
        (f"The empire's lungs logged {total} items across {len(stats)} streams; "
         f"the Khipu chain verifies {'intact' if chain_ok else 'BROKEN'}."),
        "Top five by WAYRA factor:",
    ]
    for i, t in enumerate(top, 1):
        routing = t.get("organ_routing") or ["(held for review)"]
        lines.append(
            f"{i}. {t.get('title','')} — from {t.get('source','')}, "
            f"WAYRA factor {float(t.get('wayra_factor', 0)):.2f}, "
            f"routed to {', '.join(routing)}."
        )
    lines.append("That is the breath of the world, made ours. — Wallpa, for WAYRA.")
    transcript = "\n".join(lines)

    return {
        "organ": "WAYRA",
        "kind": "hatun-willay-daily-digest",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "daily_digest_cap": DAILY_DIGEST_CAP,
        "selected": len(top),
        "totals": {
            "events": total,
            "chain_verified": chain_ok,
            "chain_depth": chain.get("depth"),
        },
        "top": top,
        "transcript": transcript,
        "voice": "wallpa-synthetic-timbre",
        "tts_engines": ["coqui-xtts-v2", "piper", "openvoice"],
        "author": "Yachay",
    }


def emit_audio(transcript: str, out_path: Path) -> str | None:
    """Render the transcript to a WAV using an open-source TTS engine.

    Tries piper, then coqui-TTS, in order. If neither is installed, returns None
    (the JSON transcript is still produced — audio is an optional surface).
    No proprietary/cloud TTS is used (Doctrine v13 §5: open-source timbre only).
    """
    # 1) piper (fast, fully offline)
    try:
        import shutil
        import subprocess
        if shutil.which("piper"):
            wav = out_path.with_suffix(".wav")
            subprocess.run(
                ["piper", "--model", "en_US-lessac-medium", "--output_file", str(wav)],
                input=transcript.encode("utf-8"), check=True,
            )
            return str(wav)
    except Exception as e:  # pragma: no cover - environment dependent
        print(f"  piper unavailable: {e}", file=sys.stderr)

    # 2) coqui-TTS python API
    try:  # pragma: no cover - environment dependent
        from TTS.api import TTS  # type: ignore
        wav = out_path.with_suffix(".wav")
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
        tts.tts_to_file(text=transcript, file_path=str(wav))
        return str(wav)
    except Exception as e:  # pragma: no cover
        print(f"  coqui-TTS unavailable: {e}", file=sys.stderr)

    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="WAYRA daily digest pipeline")
    ap.add_argument("--db", default=DEFAULT_DB, help="path to wayra_ingest.db")
    ap.add_argument("--top-n", type=int, default=DIGEST_TOP_N)
    ap.add_argument("--emit-audio", action="store_true",
                    help="also render WAV via open-source TTS if available")
    ap.add_argument("--out-dir", default=str(OUT_DIR))
    args = ap.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    log = IngestLog(args.db)
    digest = build_transcript(log, top_n=args.top_n)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    json_path = out_dir / f"wayra_digest_{stamp}.json"
    txt_path = out_dir / f"wayra_digest_{stamp}.txt"
    json_path.write_text(json.dumps(digest, indent=2))
    txt_path.write_text(digest["transcript"] + "\n")

    print("=== WAYRA daily digest ===")
    print(digest["transcript"])
    print(f"\nwrote {json_path}")
    print(f"wrote {txt_path}")

    if args.emit_audio:
        wav = emit_audio(digest["transcript"], out_dir / f"wayra_digest_{stamp}")
        if wav:
            print(f"wrote {wav}")
        else:
            print("audio: no open-source TTS engine present; transcript-only.")

    # Cost-bound assertion (Zero Bandaid: fail loudly if violated)
    assert digest["selected"] <= DAILY_DIGEST_CAP, "DAILY_DIGEST_CAP exceeded"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
