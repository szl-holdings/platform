#!/usr/bin/env python3
"""Companion test for tools/a11oy_frontier.py — self-test-the-guard.

The frontier tool is a *gate*, so the org convention applies: a guard with no
self-test is not a guard. Every doctrine invariant the tool claims to enforce
gets a positive and a negative case here, including the tamper path that must
turn the receipt chain red.

  I1  MEASURED is unreachable without a real measurement
  I2  admission control against the locked formula set at kernel c7c0ba17
  I3  bounded recursion: the kernel ceiling wins over the caller
  I4  receipt chain is content-addressed; tampering is detected
  I5  no engine is promoted over the oracle without token-id equality
  I6  private mesh addresses never reach published output

Fully offline: no network, no optional tokenizer engines required. Absent
engines are asserted to produce UNAVAILABLE receipts rather than fake zeros.

Run with:  python tools/test_a11oy_frontier.py
Exits non-zero on any failure.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import a11oy_frontier as af  # noqa: E402

_passed = 0
_failed = 0


def check(cond: bool, msg: str) -> None:
    global _passed, _failed
    if cond:
        _passed += 1
    else:
        _failed += 1
        print(f"  FAIL: {msg}")


def _ledger(tmp: str) -> af.ReceiptLedger:
    return af.ReceiptLedger(Path(tmp) / "receipts.jsonl")


# --------------------------------------------------------------------------
# I1 — evidence labels cannot be laundered
# --------------------------------------------------------------------------

def test_i1_measured_requires_measurement() -> None:
    print("[test] I1: MEASURED without a measurement downgrades to DECLARED")
    with tempfile.TemporaryDirectory() as tmp:
        led = _ledger(tmp)
        r = led.emit("bench", af.LABEL_MEASURED, {"gb_per_sec": 9.9}, measured=False)
        check(r["label"] == af.LABEL_DECLARED,
              f"expected DECLARED downgrade, got {r['label']}")
        r2 = led.emit("bench", af.LABEL_MEASURED, {"gb_per_sec": 0.02}, measured=True)
        check(r2["label"] == af.LABEL_MEASURED,
              f"a real measurement must stay MEASURED, got {r2['label']}")


def test_i1_illegal_label_rejected() -> None:
    print("[test] I1: an unknown evidence label is a hard error")
    with tempfile.TemporaryDirectory() as tmp:
        led = _ledger(tmp)
        try:
            led.emit("bench", "PROVEN", {}, measured=True)
            check(False, "label 'PROVEN' must raise, not be accepted")
        except ValueError:
            check(True, "")


def test_i1_energy_unavailable_not_zero() -> None:
    print("[test] I1: absent energy meter yields UNAVAILABLE, never 0.0 J")
    blk = af.StateBlock("p", "prefix", ["F1"], "h" * 64, tokens=10, joules=None)
    check(blk.energy_label() == af.LABEL_UNAVAILABLE, "no meter must be UNAVAILABLE")
    live = af.StateBlock("p", "prefix", ["F1"], "h" * 64, tokens=10, joules=4.2)
    check(live.energy_label() == af.LABEL_MEASURED, "a live meter must be MEASURED")


# --------------------------------------------------------------------------
# I2 — admission control
# --------------------------------------------------------------------------

def test_i2_locked_admitted() -> None:
    print("[test] I2: fully locked provenance is ADMITTED")
    blk = af.StateBlock("kv", "kv", ["F1", "F12", "F22"], "a" * 64)
    verdict, reason = blk.gate()
    check(verdict == af.ADMITTED, f"locked chain must be ADMITTED, got {verdict}")
    check(af.KERNEL in reason, "reason must name the gating kernel")


def test_i2_conjecture_quarantined_not_rejected() -> None:
    print("[test] I2: conjectural provenance is QUARANTINED, still reusable")
    for name in af.CONJECTURES:
        blk = af.StateBlock("kv", "kv", ["F1", name], "b" * 64)
        verdict, reason = blk.gate()
        check(verdict == af.QUARANTINED,
              f"{name} chain must be QUARANTINED, got {verdict}")
        check("promotion denied" in reason,
              "quarantine must state that promotion is denied")


def test_i2_unlocked_formula_quarantined() -> None:
    print("[test] I2: a formula outside the locked set cannot be ADMITTED")
    blk = af.StateBlock("kv", "kv", ["F1", "F99"], "c" * 64)
    verdict, reason = blk.gate()
    check(verdict == af.QUARANTINED, f"F99 must not be ADMITTED, got {verdict}")
    check("F99" in reason, "reason must name the offending formula")


def test_i2_empty_provenance_rejected() -> None:
    print("[test] I2: no provenance chain is REJECTED outright")
    verdict, _ = af.StateBlock("kv", "kv", [], "d" * 64).gate()
    check(verdict == af.REJECTED, f"empty chain must be REJECTED, got {verdict}")


def test_i2_locked_set_matches_doctrine() -> None:
    print("[test] I2: the locked set is the doctrine boundary, 8 formulas")
    check(len(af.LOCKED_FORMULAS) == 8,
          f"expected 8 locked formulas, got {len(af.LOCKED_FORMULAS)}")
    check(af.LOCKED_FORMULAS == frozenset(
        {"F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"}),
        "locked set drifted from the live directive")
    check(af.KERNEL == "c7c0ba17", f"kernel drifted: {af.KERNEL}")


# --------------------------------------------------------------------------
# I3 — bounded recursion
# --------------------------------------------------------------------------

def test_i3_kernel_ceiling_beats_caller() -> None:
    print("[test] I3: a caller asking for depth 99 is capped by the kernel")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        folds = af.ouroboros("seed", 99, _ledger(tmp))
        check(len(folds) <= af.MAX_DEPTH,
              f"depth {len(folds)} exceeded kernel max {af.MAX_DEPTH}")
        check(folds[-1].halted != "", "the final fold must record a halt condition")


def test_i3_fixed_point_halts() -> None:
    print("[test] I3: a self-identical state halts the loop immediately")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        folds = af.ouroboros("seed", af.MAX_DEPTH, _ledger(tmp),
                             tokenize=lambda s: [1, 2, 3])
        check(len(folds) < af.MAX_DEPTH,
              "a constant tokenizer must trip the fixed-point detector early")
        check("fixed point" in folds[-1].halted,
              f"expected a fixed-point halt, got {folds[-1].halted!r}")


def test_i3_conjectural_fold_quarantined() -> None:
    print("[test] I3: folds touching a conjecture are quarantined, not promoted")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        folds = af.ouroboros("seed", af.MAX_DEPTH, _ledger(tmp))
        check(any(f.verdict == af.QUARANTINED for f in folds),
              "the conjectural fold must appear as QUARANTINED")
        check(all(f.verdict != af.ADMITTED or "locked-proven" in f.reason
                  for f in folds),
              "an ADMITTED fold must cite locked-proven provenance")


# --------------------------------------------------------------------------
# I4 — chained, content-addressed receipts (the CI gate)
# --------------------------------------------------------------------------

def test_i4_chain_verifies() -> None:
    print("[test] I4: an untouched ledger verifies")
    with tempfile.TemporaryDirectory() as tmp:
        led = _ledger(tmp)
        for i in range(4):
            led.emit("bench", af.LABEL_MEASURED, {"i": i}, measured=True)
        ok, errs = led.verify()
        check(ok, f"clean chain must verify, errors: {errs}")


def test_i4_empty_ledger_is_not_a_pass() -> None:
    print("[test] I4: an empty or missing ledger fails closed")
    with tempfile.TemporaryDirectory() as tmp:
        ok, _ = af.ReceiptLedger(Path(tmp) / "nope.jsonl").verify()
        check(not ok, "a missing ledger must not verify")


def test_i4_tamper_detected() -> None:
    print("[test] I4: mutating a receipt body turns the chain red")
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "receipts.jsonl"
        led = af.ReceiptLedger(path)
        for i in range(3):
            led.emit("bench", af.LABEL_MEASURED, {"gb_per_sec": 0.01 * i},
                     measured=True)
        lines = path.read_text().splitlines()
        rec = json.loads(lines[1])
        rec["body"]["gb_per_sec"] = 999.0          # the overclaim we must catch
        lines[1] = json.dumps(rec, sort_keys=True, separators=(",", ":"))
        path.write_text("\n".join(lines) + "\n")
        ok, errs = af.ReceiptLedger(path).verify()
        check(not ok, "a tampered body MUST fail verification")
        check(any("hash mismatch" in e for e in errs),
              f"expected a hash mismatch, got {errs}")


def test_i4_chain_break_detected() -> None:
    print("[test] I4: deleting a middle receipt breaks the chain")
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "receipts.jsonl"
        led = af.ReceiptLedger(path)
        for i in range(4):
            led.emit("bench", af.LABEL_MEASURED, {"i": i}, measured=True)
        lines = path.read_text().splitlines()
        del lines[1]
        path.write_text("\n".join(lines) + "\n")
        ok, errs = af.ReceiptLedger(path).verify()
        check(not ok, "a deleted receipt MUST fail verification")
        check(any("chain break" in e for e in errs),
              f"expected a chain break, got {errs}")


def test_i4_foreign_kernel_detected() -> None:
    print("[test] I4: a receipt from a foreign kernel is rejected")
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "receipts.jsonl"
        led = af.ReceiptLedger(path)
        led.emit("bench", af.LABEL_MEASURED, {"i": 0}, measured=True)
        rec = json.loads(path.read_text().splitlines()[0])
        rec.pop("receipt_id")
        rec["kernel"] = "deadbeef"
        rec["receipt_id"] = af.blockhash(rec)      # re-seal under a wrong kernel
        path.write_text(json.dumps(rec, sort_keys=True,
                                   separators=(",", ":")) + "\n")
        ok, errs = af.ReceiptLedger(path).verify()
        check(not ok, "a foreign-kernel receipt must not verify")
        check(any("foreign kernel" in e for e in errs), f"got {errs}")


# --------------------------------------------------------------------------
# I5 — no promotion without token-id equality
# --------------------------------------------------------------------------

def _res(engine: str, gbs: float, eq, label=af.LABEL_MEASURED) -> af.Result:
    r = af.Result(engine=engine, dataset="corpus", workload="corpus",
                  tokenizer_id="tok", family="BPE", label=label,
                  bytes_processed=1_000_000, docs=10, tokens_total=200_000,
                  validate_equal=eq)
    r.elapsed_sec = (1_000_000 / 1e9) / gbs if gbs else 0.0
    return r.finish()


def test_i5_drift_blocks_promotion() -> None:
    print("[test] I5: a faster engine with mismatched ids is BLOCKED")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        rows = af.audit([_res("hf", 0.01, True), _res("gigatoken", 5.0, False)],
                        _ledger(tmp))
        check(rows[0]["verdict"].startswith("BLOCKED"),
              f"semantic drift must block, got {rows[0]['verdict']}")
        check(rows[0]["migration_risk"] == "high", "drift is high risk")


def test_i5_equal_ids_promote() -> None:
    print("[test] I5: a faster engine with equal ids is promoted")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        rows = af.audit([_res("hf", 0.01, True), _res("gigatoken", 5.0, True)],
                        _ledger(tmp))
        check(rows[0]["verdict"] == "PROMOTE", f"got {rows[0]['verdict']}")
        check(rows[0]["speedup_vs_oracle"] > 1, "speedup must be recorded")
        check(rows[0]["bottleneck_after"] != "tokenization",
              "a >=2x win must move the bottleneck off tokenization")


def test_i5_modeled_is_only_provisional() -> None:
    print("[test] I5: a MODELED CLI number is PROVISIONAL, never promoted")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        rows = af.audit([_res("hf", 0.01, True),
                         _res("gigatoken", 5.0, True, af.LABEL_MODELED)],
                        _ledger(tmp))
        check("PROVISIONAL" in rows[0]["verdict"],
              f"MODELED must stay provisional, got {rows[0]['verdict']}")


def test_i5_unavailable_not_fabricated() -> None:
    print("[test] I5: absent engines report UNAVAILABLE, not a zero win")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)
        miss = af.unavailable("gigatoken", af.Case("corpus", "corpus",
                                                   Path(tmp) / "x.txt"),
                              "ModuleNotFoundError")
        check(miss.label == af.LABEL_UNAVAILABLE, "must be UNAVAILABLE")
        check(miss.gb_per_sec == 0.0 and miss.tokens_total == 0,
              "an absent engine must not carry invented throughput")
        rows = af.audit([miss], _ledger(tmp))
        check(rows[0]["verdict"] == "UNAVAILABLE",
              f"no measurement means no claim, got {rows[0]['verdict']}")


# --------------------------------------------------------------------------
# I6 — egress guard
# --------------------------------------------------------------------------

def test_i6_private_addresses_scrubbed() -> None:
    print("[test] I6: private, loopback and internal hosts are redacted")
    for bad in ("10.0.0.7", "192.168.1.44", "172.16.5.9", "127.0.0.1",
                "169.254.1.1"):
        check("[REDACTED-PRIVATE-ADDR]" in af.scrub(f"node at {bad} is warm"),
              f"{bad} was not redacted")
    for host in ("mesh-a.internal", "gpu1.ts.net", "box.lan"):
        check("[REDACTED-INTERNAL-HOST]" in af.scrub(f"see {host}"),
              f"{host} was not redacted")


def test_i6_public_addresses_preserved() -> None:
    print("[test] I6: public addresses survive, so the guard is not a blunt mask")
    out = af.scrub("upstream 8.8.8.8 responded")
    check("8.8.8.8" in out, "a public address must not be redacted")


def test_i6_scrub_applied_to_receipt_bodies() -> None:
    print("[test] I6: the guard runs on receipt bodies, not just the report")
    with tempfile.TemporaryDirectory() as tmp:
        led = _ledger(tmp)
        r = led.emit("bench", af.LABEL_MEASURED,
                     {"notes": "fetched from 10.1.2.3"}, measured=True)
        check("10.1.2.3" not in json.dumps(r), "private address leaked into a receipt")
        check("[REDACTED-PRIVATE-ADDR]" in json.dumps(r), "redaction marker missing")


# --------------------------------------------------------------------------
# Estate inventory + end-to-end CLI
# --------------------------------------------------------------------------

def test_inventory_tiers() -> None:
    print("[test] inventory: BPE leads, SentencePiece and WordPiece are held")
    with tempfile.TemporaryDirectory() as tmp:
        af.set_root(tmp)

        rows = af.inventory(af.default_estate(), _ledger(tmp))
        by_id = {r["model_id"]: r for r in rows}
        check(by_id["szl/a11oy-router-8b"]["tier"] == "A", "high-volume BPE is tier A")
        check(by_id["szl/a11oy-router-8b"]["priority"] == "highest",
              "42 GB/mo BPE must be highest priority")
        check(by_id["szl/formula-verifier"]["priority"] == "hold",
              "SentencePiece must be held behind the fallback")
        check(by_id["szl/uds-classifier"]["mode"] == "fallback HF path",
              "WordPiece is unsupported on the fast path")


def test_cli_end_to_end() -> None:
    print("[test] cli: `all` then `verify` on a clean tree, offline")
    with tempfile.TemporaryDirectory() as tmp:
        env = dict(os.environ, A11OY_ROOT=tmp)
        tool = os.path.join(HERE, "a11oy_frontier.py")
        p = subprocess.run([sys.executable, tool, "all", "--mb", "0.2"],
                           capture_output=True, text=True, env=env, timeout=600)
        check(p.returncode == 0, f"`all` failed: {p.stderr[-400:]}")
        check("chain VERIFIED" in p.stdout, f"chain not verified: {p.stdout[-300:]}")
        report = Path(tmp) / "output" / "frontier_report.md"
        check(report.exists(), "no report was written")
        body = report.read_text()
        check(af.KERNEL in body, "the report must name the gating kernel")
        check("Conjecture 1" in body, "conjectures must be declared in the report")
        v = subprocess.run([sys.executable, tool, "verify"],
                           capture_output=True, text=True, env=env, timeout=120)
        check(v.returncode == 0, f"`verify` failed: {v.stdout} {v.stderr[-300:]}")


def test_cli_verify_fails_on_tamper() -> None:
    print("[test] cli: `verify` exits non-zero on a tampered ledger (the gate)")
    with tempfile.TemporaryDirectory() as tmp:
        env = dict(os.environ, A11OY_ROOT=tmp)
        tool = os.path.join(HERE, "a11oy_frontier.py")
        subprocess.run([sys.executable, tool, "ouroboros"], capture_output=True,
                       text=True, env=env, timeout=300)
        led = Path(tmp) / "output" / "receipts.jsonl"
        lines = led.read_text().splitlines()
        rec = json.loads(lines[0])
        rec["body"]["folds"] = 4242
        lines[0] = json.dumps(rec, sort_keys=True, separators=(",", ":"))
        led.write_text("\n".join(lines) + "\n")
        v = subprocess.run([sys.executable, tool, "verify"], capture_output=True,
                           text=True, env=env, timeout=120)
        check(v.returncode != 0, "the CI gate must exit non-zero on tamper")
        check("FAILED" in v.stdout, f"expected a FAILED report, got {v.stdout!r}")


def main() -> int:
    tests = [
        test_i1_measured_requires_measurement,
        test_i1_illegal_label_rejected,
        test_i1_energy_unavailable_not_zero,
        test_i2_locked_admitted,
        test_i2_conjecture_quarantined_not_rejected,
        test_i2_unlocked_formula_quarantined,
        test_i2_empty_provenance_rejected,
        test_i2_locked_set_matches_doctrine,
        test_i3_kernel_ceiling_beats_caller,
        test_i3_fixed_point_halts,
        test_i3_conjectural_fold_quarantined,
        test_i4_chain_verifies,
        test_i4_empty_ledger_is_not_a_pass,
        test_i4_tamper_detected,
        test_i4_chain_break_detected,
        test_i4_foreign_kernel_detected,
        test_i5_drift_blocks_promotion,
        test_i5_equal_ids_promote,
        test_i5_modeled_is_only_provisional,
        test_i5_unavailable_not_fabricated,
        test_i6_private_addresses_scrubbed,
        test_i6_public_addresses_preserved,
        test_i6_scrub_applied_to_receipt_bodies,
        test_inventory_tiers,
        test_cli_end_to_end,
        test_cli_verify_fails_on_tamper,
    ]
    for t in tests:
        t()
    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
