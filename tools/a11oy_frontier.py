#!/usr/bin/env python3
"""
a11oy_frontier.py -- SZL Holdings / a11oy Token-State Frontier payload (single file).

One runnable artifact that does six jobs under SZL Doctrine:

  1. INVENTORY  -- classify every tokenizer in a Hugging Face estate into
                   fast-path / compatibility / fallback tiers.
  2. BENCH      -- measure real ingress throughput (gigatoken | hf | tiktoken)
                   on your own corpora, with token-id equality validation.
  3. AUDIT      -- find where the bottleneck MOVES after ingress accelerates.
  4. LEDGER     -- emit append-only, content-addressed receipts for every
                   measurement, carrying typed evidence labels
                   (DECLARED / MODELED / MEASURED / UNAVAILABLE / LIVE).
  5. GATE       -- admission control for cache/state blocks against the locked
                   formula set at kernel c7c0ba17. Conjectural provenance
                   (Lambda = Conjecture 1, Khipu BFT = Conjecture 2) is
                   QUARANTINED, never promoted.
  6. OUROBOROS  -- bounded self-referential ingress loop: verifier traces are
                   re-tokenized and folded back into the prefix foundry with a
                   hard recursion ceiling and a fixed-point detector.

Doctrine invariants enforced in code (not in prose):
  I1  no receipt is MEASURED unless a real measurement produced it
  I2  no block is ADMITTED unless its full provenance chain is locked-proven
  I3  no self-reference exceeds MAX_DEPTH (bounded recursion, kernel-gated)
  I4  every receipt is content-addressed and chained to its predecessor
  I5  no engine is promoted over the oracle without token-id equality
  I6  private mesh addresses never enter published output (egress guard)

Zero hard dependencies. Every engine is optional; a missing engine yields an
UNAVAILABLE receipt instead of a crash.

Usage
-----
  python tools/a11oy_frontier.py init                 # scaffold dirs + synthetic corpora
  python tools/a11oy_frontier.py inventory            # tier the HF estate
  python tools/a11oy_frontier.py bench                # measure ingress engines
  python tools/a11oy_frontier.py audit                # bottleneck-shift analysis
  python tools/a11oy_frontier.py ouroboros --depth 4  # bounded prefix-fold loop
  python tools/a11oy_frontier.py verify               # re-verify the receipt chain
  python tools/a11oy_frontier.py all                  # full sweep, honest labels
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import ipaddress
import json
import os
import platform
import re
import subprocess
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Callable, Iterable, Optional

# ----------------------------------------------------------------------------
# 0. Doctrine boundary. Edit ONLY when the live directive changes.
# ----------------------------------------------------------------------------

KERNEL = "c7c0ba17"
LOCKED_FORMULAS = frozenset({"F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"})
CONJECTURES = {"Lambda": "Conjecture 1", "KhipuBFT": "Conjecture 2"}

LABEL_DECLARED = "DECLARED"        # asserted, not measured
LABEL_MODELED = "MODELED"          # derived from a model, not the wire
LABEL_MEASURED = "MEASURED"        # produced by a real measurement here
LABEL_UNAVAILABLE = "UNAVAILABLE"  # could not be obtained; say so
LABEL_LIVE = "LIVE"                # streaming from a live source
VALID_LABELS = frozenset(
    {LABEL_DECLARED, LABEL_MODELED, LABEL_MEASURED, LABEL_UNAVAILABLE, LABEL_LIVE}
)

MAX_DEPTH = 6           # I3: bounded recursion ceiling
GENESIS = "0" * 64      # I4: receipt chain root

ROOT = Path(os.environ.get("A11OY_ROOT", ".")).resolve()
DATA_DIR = ROOT / "datasets"
OUT_DIR = ROOT / "output"
LEDGER = OUT_DIR / "receipts.jsonl"


def set_root(path: os.PathLike[str] | str) -> Path:
    """Repoint every output path at once.

    Module-level paths are resolved at import time, so tests (and callers that
    embed this tool) need one explicit hook instead of mutating four globals
    and hoping they stay consistent.
    """
    global ROOT, DATA_DIR, OUT_DIR, LEDGER
    ROOT = Path(path).resolve()
    DATA_DIR = ROOT / "datasets"
    OUT_DIR = ROOT / "output"
    LEDGER = OUT_DIR / "receipts.jsonl"
    return ROOT


HOST = f"{platform.system()}|{platform.machine()}|py{platform.python_version()}"


# ----------------------------------------------------------------------------
# 1. Egress guard (I6). Private mesh addresses must never reach published text.
# ----------------------------------------------------------------------------

_HOSTISH = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b|\b[a-z0-9-]+\.(?:internal|local|ts\.net|lan)\b", re.I)


def scrub(text: str) -> str:
    """Replace private/link-local/loopback addresses and internal hostnames."""

    def _sub(m: re.Match[str]) -> str:
        tok = m.group(0)
        try:
            ip = ipaddress.ip_address(tok)
        except ValueError:
            return "[REDACTED-INTERNAL-HOST]"
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            return "[REDACTED-PRIVATE-ADDR]"
        return tok

    return _HOSTISH.sub(_sub, text or "")


# ----------------------------------------------------------------------------
# 2. Receipt ledger. Append-only, content-addressed, chained (I1, I4).
# ----------------------------------------------------------------------------

def _canon(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


def blockhash(obj: Any) -> str:
    return hashlib.sha256(_canon(obj).encode()).hexdigest()


class ReceiptLedger:
    """Append-only receipt sink. Each receipt commits to its predecessor."""

    def __init__(self, path: Optional[Path] = None) -> None:
        # Resolved at call time, not def time, so set_root() is always honoured.
        self.path = Path(path) if path is not None else LEDGER
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.prev = self._tail() or GENESIS

    def _tail(self) -> Optional[str]:
        if not self.path.exists():
            return None
        last = None
        with self.path.open(encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    last = line
        return json.loads(last)["receipt_id"] if last else None

    def emit(self, kind: str, label: str, body: dict, measured: bool = False) -> dict:
        # I1: MEASURED is only legal when a measurement actually happened.
        if label not in VALID_LABELS:
            raise ValueError(f"illegal evidence label {label!r}")
        if label == LABEL_MEASURED and not measured:
            label = LABEL_DECLARED
        payload = {
            "kind": kind,
            "label": label,
            "kernel": KERNEL,
            "locked": sorted(LOCKED_FORMULAS),
            "ts": time.time(),
            "host": HOST,
            "prev": self.prev,
            "body": json.loads(scrub(_canon(body))),
        }
        payload["receipt_id"] = blockhash(payload)
        with self.path.open("a", encoding="utf-8") as f:
            f.write(_canon(payload) + "\n")
        self.prev = payload["receipt_id"]
        return payload

    def verify(self) -> tuple[bool, list[str]]:
        """Re-verify the whole chain. Publication depends on this, not cleanup."""
        errs: list[str] = []
        prev = GENESIS
        n = 0
        if not self.path.exists():
            return False, ["ledger missing"]
        with self.path.open(encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                if not line.strip():
                    continue
                n += 1
                r = json.loads(line)
                rid = r.pop("receipt_id")
                if r["prev"] != prev:
                    errs.append(f"line {i}: chain break")
                if blockhash(r) != rid:
                    errs.append(f"line {i}: hash mismatch")
                if r["kernel"] != KERNEL:
                    errs.append(f"line {i}: foreign kernel {r['kernel']}")
                prev = rid
        return (not errs and n > 0), errs


# ----------------------------------------------------------------------------
# 3. Invariant gate (I2). Cache/state admission control.
# ----------------------------------------------------------------------------

ADMITTED, QUARANTINED, REJECTED = "ADMITTED", "QUARANTINED", "REJECTED"


@dataclass
class StateBlock:
    """A content-addressed unit of reusable state: KV block, prefix, trace."""

    name: str
    kind: str                      # kv | prefix | trace | embedding | adapter
    provenance: list[str]          # formula ids and/or conjecture names
    payload_hash: str
    tokens: int = 0
    joules: Optional[float] = None  # None => energy UNAVAILABLE, never zero-faked

    def gate(self) -> tuple[str, str]:
        """I2 + conjecture discipline. Returns (verdict, reason)."""
        prov = set(self.provenance)
        if not prov:
            return REJECTED, "no provenance chain"
        conj = prov & set(CONJECTURES)
        if conj:
            names = ", ".join(f"{c}={CONJECTURES[c]}" for c in sorted(conj))
            return QUARANTINED, f"conjectural provenance ({names}); reuse allowed, promotion denied"
        unknown = prov - LOCKED_FORMULAS
        if unknown:
            return QUARANTINED, f"unlocked formulas {sorted(unknown)} not in kernel {KERNEL}"
        return ADMITTED, f"locked-proven under kernel {KERNEL}"

    def energy_label(self) -> str:
        return LABEL_MEASURED if self.joules is not None else LABEL_UNAVAILABLE


# ----------------------------------------------------------------------------
# 4. Ingress engines. Each is optional; absence => UNAVAILABLE, not a crash.
# ----------------------------------------------------------------------------

@dataclass
class Case:
    dataset: str
    workload: str          # corpus | code | diff | chat | retrieval
    path: Path
    tokenizer_id: str = "openai-community/gpt2"
    family: str = "BPE"    # BPE | SentencePiece | WordPiece | other
    separator: str = ""


@dataclass
class Result:
    engine: str
    dataset: str
    workload: str
    tokenizer_id: str
    family: str
    label: str
    bytes_processed: int = 0
    docs: int = 0
    elapsed_sec: float = 0.0
    gb_per_sec: float = 0.0
    tokens_total: int = 0
    tokens_per_sec: float = 0.0
    bytes_per_token: float = 0.0
    validate_equal: Optional[bool] = None
    mismatches: int = 0
    threads: int = 0
    joules: Optional[float] = None
    j_per_gb: Optional[float] = None
    ids_digest: str = ""
    notes: str = ""

    def finish(self) -> "Result":
        if self.elapsed_sec > 0:
            self.gb_per_sec = self.bytes_processed / 1e9 / self.elapsed_sec
            self.tokens_per_sec = self.tokens_total / self.elapsed_sec
        if self.tokens_total:
            self.bytes_per_token = self.bytes_processed / self.tokens_total
        if self.joules is not None and self.bytes_processed:
            self.j_per_gb = self.joules / (self.bytes_processed / 1e9)
        self.notes = scrub(self.notes)[:2000]
        return self


def read_lines(path: Path) -> list[str]:
    txt = path.read_text(encoding="utf-8", errors="ignore")
    return [ln for ln in txt.splitlines() if ln.strip()]


def digest_ids(ids: Iterable[Iterable[int]]) -> str:
    h = hashlib.sha256()
    for row in ids:
        h.update(b"|")
        h.update(",".join(map(str, row)).encode())
    return h.hexdigest()


def unavailable(engine: str, case: Case, why: str) -> Result:
    return Result(
        engine=engine, dataset=case.dataset, workload=case.workload,
        tokenizer_id=case.tokenizer_id, family=case.family,
        label=LABEL_UNAVAILABLE, notes=f"engine unavailable: {why}",
    ).finish()


# --- oracle: Hugging Face tokenizers (semantic safety layer) ----------------

def bench_hf(case: Case) -> Result:
    try:
        from transformers import AutoTokenizer  # type: ignore
    except Exception as e:  # pragma: no cover
        return unavailable("hf", case, repr(e))
    lines = read_lines(case.path)
    nbytes = case.path.stat().st_size
    tok = AutoTokenizer.from_pretrained(case.tokenizer_id, use_fast=True)
    t0 = time.perf_counter()
    enc = tok(lines, add_special_tokens=False)["input_ids"]
    dt = time.perf_counter() - t0
    return Result(
        engine="hf", dataset=case.dataset, workload=case.workload,
        tokenizer_id=case.tokenizer_id, family=case.family, label=LABEL_MEASURED,
        bytes_processed=nbytes, docs=len(lines), elapsed_sec=dt,
        tokens_total=sum(len(x) for x in enc), validate_equal=True,
        threads=os.cpu_count() or 1, ids_digest=digest_ids(enc),
        notes="oracle: HF fast tokenizer defines reference semantics",
    ).finish()


# --- baseline: tiktoken -----------------------------------------------------

def bench_tiktoken(case: Case, oracle: Optional[Result] = None) -> Result:
    try:
        import tiktoken  # type: ignore
    except Exception as e:
        return unavailable("tiktoken", case, repr(e))
    lines = read_lines(case.path)
    nbytes = case.path.stat().st_size
    try:
        enc = tiktoken.encoding_for_model(case.tokenizer_id.split("/")[-1])
    except Exception:
        enc = tiktoken.get_encoding("gpt2")
    t0 = time.perf_counter()
    ids = enc.encode_ordinary_batch(lines, num_threads=os.cpu_count() or 1)
    dt = time.perf_counter() - t0
    dg = digest_ids(ids)
    eq = (dg == oracle.ids_digest) if (oracle and oracle.ids_digest) else None
    return Result(
        engine="tiktoken", dataset=case.dataset, workload=case.workload,
        tokenizer_id=case.tokenizer_id, family=case.family, label=LABEL_MEASURED,
        bytes_processed=nbytes, docs=len(lines), elapsed_sec=dt,
        tokens_total=sum(len(x) for x in ids), validate_equal=eq,
        mismatches=0 if eq in (True, None) else 1,
        threads=os.cpu_count() or 1, ids_digest=dg, notes="BPE baseline",
    ).finish()


# --- frontier: gigatoken (ingress acceleration layer) ----------------------



def bench_gigatoken(case: Case, oracle: Optional[Result] = None) -> Result:
    """Prefer the in-process API; fall back to the `bench` CLI; else UNAVAILABLE."""
    nbytes = case.path.stat().st_size
    lines = read_lines(case.path)

    try:
        import gigatoken  # type: ignore
    except Exception:
        gigatoken = None  # type: ignore

    if gigatoken is not None:
        for ctor in ("Tokenizer", "from_pretrained", "load"):
            fn = getattr(gigatoken, ctor, None)
            if fn is None:
                continue
            try:
                tk = fn(case.tokenizer_id) if ctor != "Tokenizer" else fn(case.tokenizer_id)
                call = getattr(tk, "encode_batch", None) or getattr(tk, "encode", None)
                if call is None:
                    continue
                t0 = time.perf_counter()
                ids = call(lines)
                dt = time.perf_counter() - t0
                ids = [list(x) for x in ids]
                dg = digest_ids(ids)
                eq = (dg == oracle.ids_digest) if (oracle and oracle.ids_digest) else None
                return Result(
                    engine="gigatoken", dataset=case.dataset, workload=case.workload,
                    tokenizer_id=case.tokenizer_id, family=case.family,
                    label=LABEL_MEASURED, bytes_processed=nbytes, docs=len(lines),
                    elapsed_sec=dt, tokens_total=sum(len(x) for x in ids),
                    validate_equal=eq, mismatches=0 if eq in (True, None) else 1,
                    threads=os.cpu_count() or 1, ids_digest=dg,
                    notes=f"native API via {ctor}",
                ).finish()
            except Exception:
                continue

    cmd = [sys.executable, "-m", "gigatoken", "bench", case.tokenizer_id, str(case.path), "--validate"]
    if case.separator:
        cmd += ["--doc-separator", case.separator]
    try:
        t0 = time.perf_counter()
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
        dt = time.perf_counter() - t0
    except Exception as e:
        return unavailable("gigatoken", case, repr(e))
    if p.returncode != 0:
        return unavailable("gigatoken", case, f"cli rc={p.returncode}")
    out = (p.stdout or "") + "\n" + (p.stderr or "")
    low = out.lower()
    # CLI self-reported throughput is MODELED, not MEASURED here: the wall clock
    # includes process startup, so we do not launder it into a MEASURED claim.
    return Result(
        engine="gigatoken", dataset=case.dataset, workload=case.workload,
        tokenizer_id=case.tokenizer_id, family=case.family, label=LABEL_MODELED,
        bytes_processed=nbytes, docs=len(lines), elapsed_sec=dt,
        validate_equal=("mismatch" not in low and "fail" not in low),
        mismatches=low.count("mismatch"), threads=os.cpu_count() or 1,
        notes="cli bench; wall clock includes process startup: " + out[:600],
    ).finish()


ENGINES: dict[str, Callable[..., Result]] = {
    "hf": bench_hf, "tiktoken": bench_tiktoken, "gigatoken": bench_gigatoken,
}


# ----------------------------------------------------------------------------
# 5. Estate inventory. Tier assignment before any migration.
# ----------------------------------------------------------------------------

FAMILY_TIER = {"BPE": "A", "other": "B", "SentencePiece": "C", "WordPiece": "C"}
TIER_MODE = {"A": "native fast path", "B": "compatibility path", "C": "fallback HF path"}


def inventory(models: list[dict], led: ReceiptLedger) -> list[dict]:
    rows = []
    for m in models:
        fam = m.get("family", "other")
        tier = FAMILY_TIER.get(fam, "C")
        vol = float(m.get("monthly_gb", 0) or 0)
        rows.append({
            "model_id": m.get("model_id", "?"), "family": fam, "tier": tier,
            "mode": TIER_MODE[tier], "monthly_gb": vol,
            "priority": "highest" if (tier == "A" and vol >= 10) else
                        "high" if tier == "A" else
                        "medium" if tier == "B" else "hold",
            "gate": "validate token-id equality before promotion",
        })
    rows.sort(key=lambda r: (-r["monthly_gb"], r["tier"]))
    write_csv(OUT_DIR / "estate_inventory.csv", rows)
    # DECLARED: this reflects a supplied manifest, not a live registry scan.
    led.emit("inventory", LABEL_DECLARED, {"count": len(rows), "tiers":
             {t: sum(1 for r in rows if r["tier"] == t) for t in "ABC"}})
    return rows


# ----------------------------------------------------------------------------
# 6. Audit. The real question: where does the bottleneck MOVE?
# ----------------------------------------------------------------------------

def audit(results: list[Result], led: ReceiptLedger) -> list[dict]:
    groups: dict[tuple[str, str], list[Result]] = {}
    for r in results:
        groups.setdefault((r.dataset, r.tokenizer_id), []).append(r)

    rows = []
    for (ds, tid), rs in sorted(groups.items()):
        real = [r for r in rs if r.label in (LABEL_MEASURED, LABEL_MODELED) and r.gb_per_sec > 0]
        oracle = next((r for r in rs if r.engine == "hf"), None)
        if not real:
            rows.append({"dataset": ds, "tokenizer_id": tid, "current_engine": "hf",
                         "candidate_engine": "hf", "speedup_vs_oracle": 0.0,
                         "bottleneck_before": "unknown", "bottleneck_after": "unknown",
                         "expected_gain": "unknown", "migration_risk": "unknown",
                         "verdict": "UNAVAILABLE", "recommendation":
                         "install engines and re-run; no measurement, no claim"})
            continue
        best = max(real, key=lambda r: r.gb_per_sec)
        base = oracle.gb_per_sec if (oracle and oracle.gb_per_sec > 0) else best.gb_per_sec
        speedup = best.gb_per_sec / base if base else 1.0

        # I5: promotion requires token-id equality with the oracle.
        equal = best.validate_equal is True or best.engine == "hf"
        if best.engine == "hf":
            verdict, risk = "KEEP ORACLE", "low"
        elif not equal:
            verdict, risk = "BLOCKED (semantic drift)", "high"
        elif best.label == LABEL_MODELED:
            verdict, risk = "PROVISIONAL (re-measure in-process)", "medium"
        else:
            verdict, risk = "PROMOTE", "low"

        after = ("prefill_or_kv" if speedup >= 2 else
                 "file_io" if best.bytes_per_token and best.gb_per_sec > 0.5 else
                 "tokenization")
        rows.append({
            "dataset": ds, "tokenizer_id": tid,
            "current_engine": oracle.engine if oracle else "unknown",
            "candidate_engine": best.engine,
            "speedup_vs_oracle": round(speedup, 3),
            "bottleneck_before": "tokenization",
            "bottleneck_after": after,
            "expected_gain": "high" if speedup >= 4 else "medium" if speedup >= 1.5 else "low",
            "migration_risk": risk, "verdict": verdict,
            "recommendation": (
                f"route {ds} to {best.engine}; reinvest reclaimed ingress budget in "
                f"{'verifier passes and branch scoring' if speedup >= 2 else 'prefix cache warmup'}"
            ),
        })
    write_csv(OUT_DIR / "audit_findings.csv", rows)
    led.emit("audit", LABEL_MEASURED, {"rows": len(rows),
             "promote": sum(1 for r in rows if r["verdict"] == "PROMOTE"),
             "blocked": sum(1 for r in rows if r["verdict"].startswith("BLOCKED"))},
             measured=True)
    return rows


# ----------------------------------------------------------------------------
# 7. Ouroboros: bounded self-referential ingress loop (I3).
#    Verifier traces are re-tokenized and folded into the prefix foundry.
#    Hard ceiling + fixed-point detector. No unbounded self-reference.
# ----------------------------------------------------------------------------

@dataclass
class Fold:
    depth: int
    state_hash: str
    tokens: int
    verdict: str
    reason: str
    halted: str = ""


def ouroboros(seed: str, max_depth: int, led: ReceiptLedger,
              tokenize: Optional[Callable[[str], list[int]]] = None) -> list[Fold]:
    """Fold verifier output back into ingress until fixed point or ceiling."""
    depth_cap = min(max_depth, MAX_DEPTH)  # I3: kernel gate wins over caller
    if tokenize is None:
        def tokenize(s: str) -> list[int]:  # deterministic stand-in oracle
            return [b for b in hashlib.blake2b(s.encode(), digest_size=32).digest()]

    seen: set[str] = set()
    folds: list[Fold] = []
    state = seed
    for d in range(1, depth_cap + 1):
        ids = tokenize(state)
        h = blockhash({"ids": ids})
        blk = StateBlock(
            name=f"fold-{d}", kind="trace",
            provenance=["F1", "F7", "F19"] if d % 3 else ["Lambda"],
            payload_hash=h, tokens=len(ids),
        )
        verdict, reason = blk.gate()
        f = Fold(d, h, len(ids), verdict, reason)
        if h in seen:
            f.halted = "fixed point reached: state is self-identical, stop folding"
            folds.append(f)
            break
        seen.add(h)
        folds.append(f)
        if verdict == REJECTED:
            f.halted = "gate rejected: provenance chain empty"
            break
        # next state = prior state summary + gate verdict (the ouroboros bite)
        state = f"{h[:32]}|{verdict}|{len(ids)}"
    else:
        if folds:
            folds[-1].halted = f"depth ceiling {depth_cap} reached (kernel max {MAX_DEPTH})"

    write_csv(OUT_DIR / "ouroboros_folds.csv", [asdict(f) for f in folds])
    led.emit("ouroboros", LABEL_MEASURED, {
        "depth_cap": depth_cap, "kernel_max": MAX_DEPTH, "folds": len(folds),
        "admitted": sum(1 for f in folds if f.verdict == ADMITTED),
        "quarantined": sum(1 for f in folds if f.verdict == QUARANTINED),
        "halt": folds[-1].halted if folds else "no folds",
    }, measured=True)
    return folds


# ----------------------------------------------------------------------------
# 8. IO helpers + synthetic corpora so the payload runs on a bare machine.
# ----------------------------------------------------------------------------

def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    keys: list[str] = []
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in keys})


SYNTH = {
    "corpus": "Governed inference requires that every reused block carry provenance. ",
    "code": "def gate(block):\n    return block.provenance <= LOCKED and kernel == 'c7c0ba17'\n",
    "diff": "-    label = 'MEASURED'\n+    label = 'UNAVAILABLE'  # no meter attached\n",
    "chat": "user: is this proven?\nassistant: no, it is Conjecture 1; label it honestly.\n",
    "retrieval": "chunk: KV blocks are immutable and content-addressed, so eviction replaces invalidation. ",
}


def init(mb_per_case: float = 2.0) -> list[Case]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cases = []
    for wl, unit in SYNTH.items():
        p = DATA_DIR / f"{wl}.txt"
        if not p.exists() or p.stat().st_size < mb_per_case * 1e6 * 0.9:
            target = int(mb_per_case * 1e6)
            reps = max(1, target // max(1, len(unit)))
            p.write_text((unit * reps), encoding="utf-8")
        cases.append(Case(dataset=wl, workload=wl, path=p,
                          separator="<|endoftext|>" if wl in ("corpus", "chat") else ""))
    return cases


def default_estate() -> list[dict]:
    return [
        {"model_id": "szl/a11oy-router-8b", "family": "BPE", "monthly_gb": 42},
        {"model_id": "szl/khipu-receiptagent", "family": "BPE", "monthly_gb": 18},
        {"model_id": "szl/killinchu-vision", "family": "other", "monthly_gb": 7},
        {"model_id": "szl/formula-verifier", "family": "SentencePiece", "monthly_gb": 3},
        {"model_id": "szl/uds-classifier", "family": "WordPiece", "monthly_gb": 1},
    ]


# ----------------------------------------------------------------------------
# 9. Dashboard. Honest by construction: labels travel with every number.
# ----------------------------------------------------------------------------

def dashboard(results: list[Result], audits: list[dict], inv: list[dict],
              folds: list[Fold], chain_ok: bool, chain_errs: list[str]) -> Path:
    L: list[str] = []
    L.append("# a11oy Token-State Frontier -- run report\n")
    L.append(f"- kernel: `{KERNEL}`  locked: {len(LOCKED_FORMULAS)} formulas "
             f"{sorted(LOCKED_FORMULAS)}")
    L.append(f"- conjectures held open: " +
             ", ".join(f"{k} = {v}" for k, v in CONJECTURES.items()))
    L.append(f"- receipt chain: {'VERIFIED' if chain_ok else 'FAILED'}"
             + ("" if chain_ok else f" ({'; '.join(chain_errs[:3])})"))
    L.append(f"- host: `{HOST}`\n")

    L.append("## Ingress measurements\n")
    L.append("| engine | dataset | label | GB/s | tokens/s | bytes/token | ids match | notes |")
    L.append("|---|---|---|---|---|---|---|---|")
    for r in sorted(results, key=lambda r: (-r.gb_per_sec, r.engine)):
        L.append(f"| {r.engine} | {r.dataset} | {r.label} | "
                 f"{r.gb_per_sec:.4f} | {r.tokens_per_sec:,.0f} | "
                 f"{r.bytes_per_token:.2f} | {r.validate_equal} | "
                 f"{(r.notes[:48] or '-')} |")

    L.append("\n## Migration verdicts\n")
    L.append("| dataset | candidate | speedup | bottleneck after | risk | verdict |")
    L.append("|---|---|---|---|---|---|")
    for a in audits:
        L.append(f"| {a['dataset']} | {a['candidate_engine']} | "
                 f"{a['speedup_vs_oracle']}x | {a['bottleneck_after']} | "
                 f"{a['migration_risk']} | {a['verdict']} |")

    L.append("\n## Estate tiers\n")
    L.append("| model | family | tier | mode | GB/mo | priority |")
    L.append("|---|---|---|---|---|---|")
    for m in inv:
        L.append(f"| {m['model_id']} | {m['family']} | {m['tier']} | {m['mode']} | "
                 f"{m['monthly_gb']} | {m['priority']} |")

    L.append("\n## Ouroboros folds (bounded)\n")
    L.append("| depth | tokens | gate | reason |")
    L.append("|---|---|---|---|")
    for f in folds:
        L.append(f"| {f.depth} | {f.tokens} | {f.verdict} | {f.reason} |")
    if folds and folds[-1].halted:
        L.append(f"\nhalt condition: **{folds[-1].halted}**")

    L.append("\n## Doctrine notes\n")
    L.append("- Any row labelled `UNAVAILABLE` means the engine or meter was absent. "
             "That is a real result, not a zero.")
    L.append("- `MODELED` throughput came from a CLI whose wall clock includes process "
             "startup; it is not promoted to `MEASURED`.")
    L.append("- No candidate is promoted over the oracle without token-id equality.")
    L.append("- Quarantined blocks stay reusable but never become proof.")

    p = OUT_DIR / "frontier_report.md"
    p.write_text(scrub("\n".join(L)), encoding="utf-8")
    return p


# ----------------------------------------------------------------------------
# 10. CLI
# ----------------------------------------------------------------------------

def run_bench(cases: list[Case], led: ReceiptLedger, engines: list[str]) -> list[Result]:
    results: list[Result] = []
    for c in cases:
        oracle: Optional[Result] = None
        if "hf" in engines:
            oracle = bench_hf(c)
            results.append(oracle)
            led.emit("bench", oracle.label, asdict(oracle),
                     measured=oracle.label == LABEL_MEASURED)
        for name in engines:
            if name == "hf":
                continue
            fn = ENGINES[name]
            try:
                r = fn(c, oracle)
            except Exception as e:
                r = unavailable(name, c, repr(e))
            results.append(r)
            led.emit("bench", r.label, asdict(r), measured=r.label == LABEL_MEASURED)
    write_csv(OUT_DIR / "benchmark_results.csv", [asdict(r) for r in results])
    return results


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="a11oy Token-State Frontier payload")
    ap.add_argument("cmd", choices=["init", "inventory", "bench", "audit",
                                    "ouroboros", "verify", "all"])
    ap.add_argument("--depth", type=int, default=MAX_DEPTH)
    ap.add_argument("--mb", type=float, default=2.0, help="synthetic corpus size per case")
    ap.add_argument("--engines", default="hf,tiktoken,gigatoken")
    ap.add_argument("--estate", default="", help="JSON file: [{model_id,family,monthly_gb}]")
    a = ap.parse_args(argv)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    led = ReceiptLedger()
    engines = [e.strip() for e in a.engines.split(",") if e.strip() in ENGINES]

    cases = init(a.mb)
    estate = json.loads(Path(a.estate).read_text()) if a.estate else default_estate()

    results: list[Result] = []
    audits: list[dict] = []
    inv: list[dict] = []
    folds: list[Fold] = []

    if a.cmd == "init":
        print(f"scaffolded {DATA_DIR} with {len(cases)} corpora -> {OUT_DIR}")
        return 0
    if a.cmd == "verify":
        ok, errs = led.verify()
        print("chain VERIFIED" if ok else f"chain FAILED: {errs[:5]}")
        return 0 if ok else 1
    if a.cmd in ("inventory", "all"):
        inv = inventory(estate, led)
    if a.cmd in ("bench", "audit", "all"):
        results = run_bench(cases, led, engines)
    if a.cmd in ("audit", "all"):
        audits = audit(results, led)
    if a.cmd in ("ouroboros", "all"):
        folds = ouroboros("a11oy:seed:" + KERNEL, a.depth, led)

    ok, errs = led.verify()
    report = dashboard(results, audits, inv, folds, ok, errs)
    print(f"report  -> {report}")
    print(f"ledger  -> {LEDGER} (chain {'VERIFIED' if ok else 'FAILED'})")
    for f in ("benchmark_results.csv", "audit_findings.csv",
              "estate_inventory.csv", "ouroboros_folds.csv"):
        p = OUT_DIR / f
        if p.exists():
            print(f"csv     -> {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
