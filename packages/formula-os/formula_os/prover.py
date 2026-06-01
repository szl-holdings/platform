"""
prover.py — automated Lean proof-completion attempt for a PURIQ formula.

Strategy (honest, NOT magic):
  1. For a target theorem, generate a deterministic ordered list of tactic
     candidates from a fixed template set:
       rfl, decide, norm_num, ring, simp, omega, linarith,
       and short combinations (e.g. "simp; ring", "constructor <;> norm_num").
  2. Splice each candidate into a standalone, Mathlib-FREE Lean source file
     (so it can be checked by `lean` alone without a multi-GB Mathlib build).
  3. Submit to a verifier:
       - if env LEAN_VERIFY_URL is set, POST source to /lean-verify (lean-kernel);
       - else invoke the local `lean` binary on the spliced file.
  4. Iterate up to `max_attempts` (default 5). Record EVERY attempt + result.
  5. Outcome is one of: PROVED | STILL-SORRY | FAILED-WITH-REASON | BLOCKED.

We NEVER claim PROVED without a real verifier returning success (exit 0 / 200).
If no verifier can run (e.g. OOM, lean missing), outcome is BLOCKED with reason.

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import os
import subprocess
import tempfile
import time
import urllib.request
import urllib.error
import json
from dataclasses import dataclass, field


# Deterministic tactic-candidate templates, simplest-first.
TACTIC_CANDIDATES: list[str] = [
    "rfl",
    "decide",
    "norm_num",
    "ring",
    "simp",
    "omega",
    "linarith",
    "constructor",
    "exact Iff.rfl",
    "simp; ring",
    "unfold_let; ring",
    "constructor <;> norm_num",
    "intro h; exact h",
    "simp only []; rfl",
    "norm_num [pow_two]",
]


@dataclass
class ProofAttempt:
    attempt: int
    tactic: str
    ok: bool
    detail: str


@dataclass
class ProofResult:
    formula_id: str
    theorem: str
    outcome: str               # PROVED | STILL-SORRY | FAILED-WITH-REASON | BLOCKED
    attempts: list[ProofAttempt] = field(default_factory=list)
    proved_tactic: str | None = None
    verifier: str = ""
    elapsed_s: float = 0.0


def _lean_bin() -> str | None:
    for cand in (
        os.path.expanduser("~/.elan/toolchains/leanprover--lean4---v4.13.0/bin/lean"),
        os.path.expanduser("~/.elan/bin/lean"),
        "/usr/local/bin/lean",
    ):
        if os.path.exists(cand):
            return cand
    return None


def _verify_source(src: str, timeout: int = 60) -> tuple[bool, str, str]:
    """Returns (ok, verifier_name, detail). Tries HTTP service then local lean."""
    url = os.environ.get("LEAN_VERIFY_URL")
    if url:
        try:
            data = json.dumps({"source": src}).encode()
            req = urllib.request.Request(url, data=data,
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode()
                ok = resp.status == 200 and '"ok":true' in body.replace(" ", "")
                return ok, f"lean-verify@{url}", body[:500]
        except Exception as e:
            return False, f"lean-verify@{url}", f"{type(e).__name__}: {e}"

    lean = _lean_bin()
    if not lean:
        return False, "none", "no lean binary and no LEAN_VERIFY_URL"
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".lean", delete=False) as fh:
            fh.write(src)
            path = fh.name
        proc = subprocess.run([lean, path], capture_output=True, text=True,
                              timeout=timeout)
        ok = proc.returncode == 0 and "sorry" not in (proc.stdout + proc.stderr).lower()
        detail = (proc.stdout + proc.stderr)[:500] or f"exit={proc.returncode}"
        return ok, f"local-lean({os.path.basename(lean)})", detail
    except subprocess.TimeoutExpired:
        return False, "local-lean", f"timeout after {timeout}s"
    except Exception as e:  # e.g. OOM-killed -> honest BLOCKED upstream
        return False, "local-lean", f"{type(e).__name__}: {e}"


def attempt_proof(formula_id: str, theorem_name: str, lean_template: str,
                  max_attempts: int = 5, timeout: int = 60) -> ProofResult:
    """
    lean_template must contain the literal token `__TACTIC__` where a tactic
    block goes. The template is otherwise a complete, Mathlib-free Lean file.
    """
    t0 = time.time()
    res = ProofResult(formula_id=formula_id, theorem=theorem_name, outcome="STILL-SORRY")
    blocked_reasons = 0
    for i, tac in enumerate(TACTIC_CANDIDATES[:max_attempts], start=1):
        src = lean_template.replace("__TACTIC__", tac)
        ok, verifier, detail = _verify_source(src, timeout=timeout)
        res.verifier = verifier
        res.attempts.append(ProofAttempt(attempt=i, tactic=tac, ok=ok, detail=detail))
        # Detect a hard environment block (no verifier / OOM) vs genuine tactic failure
        if not ok and ("no lean binary" in detail or "OutOfMemory" in detail
                       or "Killed" in detail or "timeout" in detail
                       or "OSError" in detail):
            blocked_reasons += 1
        if ok:
            res.outcome = "PROVED"
            res.proved_tactic = tac
            break
    else:
        # no tactic succeeded
        if blocked_reasons >= max_attempts:
            res.outcome = "BLOCKED"
        elif res.attempts and any(a.ok is False and "error:" in a.detail.lower()
                                  for a in res.attempts):
            res.outcome = "FAILED-WITH-REASON"
        else:
            res.outcome = "STILL-SORRY"
    if res.outcome != "PROVED" and blocked_reasons >= max_attempts:
        res.outcome = "BLOCKED"
    res.elapsed_s = round(time.time() - t0, 3)
    return res
