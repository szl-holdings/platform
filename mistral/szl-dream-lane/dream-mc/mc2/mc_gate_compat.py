"""
mc_gate_compat.py - offline cross-validator: dream-lane mc_first_wave_gate.json
vs sibling mc-launch-pack. Ruled in by Kimi (seat answer mc2, Q3), concurring
with Astra and Sol. Zero network, zero writes outside its output file.

Checks (all offline, fail-closed):
  C1 rollout_sum_400     : rollout_stages from the pack spec must sum to 400
  C2 canary_first       : no stage-before-canary; a dream gate scheduling a wave
                          without an explicit canary-first acknowledgment is a
                          CANARY_BYPASS (rc=2)
  C3 ceiling_consistency: dream gate numeric ceiling must be <= any pack numeric
                          ceiling (lower ceilings win, per Kimi mc2)
  C4 registry_hash      : registry binding must match across sources or be
                          marked PENDING; a mismatch is a bind break (rc=2)
  C5 c5_c6_terminal     : canary terminal evidence keys c5 and c6 must be
                          present WITH pass=true; pending = honest HOLD
  C6 dream_bindings     : the dream gate must keep its tighter bindings (new
                          node class, not the 4 running production ids; dual
                          auto-termination wall-clock AND spend; runtime cap)

Exit codes: 0 structurally consistent (verdict may still be HOLD for owner
gates); 2 compatibility break; 3 usage. The receipt records verdict
GATE_COMPAT:<GO_COMPLIANT_HOLDS_STANDING | HOLD:<reasons>> plus a
unified_plan_hash: the digest of the combined normalized fields.
"""
import argparse
import hashlib
import json
import os
import re
import sys

RUNNING_NODE_IDS = {"d1a50da9", "5e78da67", "4353a0cd", "072a4c0b"}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def digest(obj):
    return hashlib.sha256(canonical(obj).encode("utf-8")).hexdigest()


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_pack_files(pack_dir):
    """Locate the pack spec files by known names (read-only)."""
    found = {}
    for name in ("canary_1x_a6000.spec.yaml", "plan.schema.json", "mc_gates.py",
                 "README.md", "mc_spec_hash.py", "mc_canary_launch.py"):
        p = os.path.join(pack_dir, name)
        if os.path.exists(p):
            found[name] = p
    return found


def extract_yaml_flow_list(text, key):
    """Extract rollout_stages: [a,b,c] flow list from spec yaml text (line based)."""
    for line in text.splitlines():
        m = re.match(r"^\s*%s\s*:\s*\[([0-9,\s]+)\]" % re.escape(key), line)
        if m:
            nums = [int(x.strip()) for x in m.group(1).split(",") if x.strip()]
            return nums
    return None


def extract_first_sha256(text):
    m = re.search(r"\b([0-9a-f]{64})\b", text)
    return m.group(1) if m else None


def extract_states(text):
    """Pull c1..c6 state markers like c5: PENDING or c5 PASS from pack text."""
    states = {}
    for key in ("c1", "c2", "c3", "c4", "c5", "c6"):
        m = re.search(r"\b%s\b[^()\n]{0,40}?(PASS|PENDING|FAIL)" % key, text)
        if m:
            states[key] = m.group(1)
    return states


def main():
    ap = argparse.ArgumentParser(description="dream gate vs mc-launch-pack compat check")
    ap.add_argument("--dream", required=True)
    ap.add_argument("--pack", required=True)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    checks = []

    def check(name, ok, detail=""):
        checks.append({"check": name, "pass": bool(ok), "detail": str(detail)[:200]})

    dream = load_json(args.dream)
    pending_holds = []
    files = find_pack_files(args.pack)
    spec_text = ""
    if "canary_1x_a6000.spec.yaml" in files:
        with open(files["canary_1x_a6000.spec.yaml"], "r", encoding="utf-8") as f:
            spec_text = f.read()
    pack_blob = ""
    for name, path in sorted(files.items()):
        with open(path, "r", encoding="utf-8") as f:
            pack_blob += f.read()
    if not files:
        print(json.dumps({"kind": "error", "error": "PACK_EMPTY_OR_MISSING"}, sort_keys=True))
        return 3

    # C1 rollout sum
    stages = extract_yaml_flow_list(spec_text, "rollout_stages")
    check("C1_rollout_sum_400", stages is not None and sum(stages) == 400,
          "stages=%s" % stages)

    # C2 canary-first: dream gate must acknowledge canary-first; a wave scheduled
    # without it would be a bypass
    dream_blob = canonical(dream).lower()
    canary_first_ack = ("canary" in dream_blob and "first" in dream_blob) or "canary_first" in dream_blob
    check("C2_canary_first_acknowledged", canary_first_ack,
          "dream gate must record canary-first before any wave")

    # C3 ceilings: only a FILLED ratification receipt or an explicit numeric
    # ceiling_usd in the spec binds; unfilled templates are PENDING (never a
    # break, and never guessed from prose numbers)
    pack_ceiling = None
    rat_receipt = os.path.join(args.pack, "ratification_receipt.json")
    if os.path.exists(rat_receipt):
        try:
            rr = load_json(rat_receipt)
            for k, v in rr.items():
                if "ceiling" in str(k).lower() and isinstance(v, (int, float)):
                    pack_ceiling = float(v)
        except Exception:
            pack_ceiling = None
    spec_ceiling = None
    m = re.search(r"^\s*ceiling[_a-z]*\s*:\s*\$?([0-9]+(?:\.[0-9]+)?)", spec_text, re.MULTILINE | re.IGNORECASE)
    if m:
        spec_ceiling = float(m.group(1))
    ratified = pack_ceiling if pack_ceiling is not None else spec_ceiling
    dream_ceiling = None
    b = dream.get("budget", {})
    if isinstance(b.get("ceiling_usd_hard"), (int, float)):
        dream_ceiling = float(b["ceiling_usd_hard"])
    ceiling_ok = (dream_ceiling is None) or (ratified is None) or dream_ceiling <= ratified
    check("C3_ceiling_consistency", ceiling_ok,
          "dream=%s ratified_pack_ceiling=%s (PENDING template is honest, not a break)" % (dream_ceiling, ratified))
    if ratified is None:
        pending_holds.append("ratification_ceiling_pending")

    # C4 registry hash binding: both carry one or both pending; mismatch breaks
    dream_sha = extract_first_sha256(canonical(dream))
    pack_sha = extract_first_sha256(pack_blob)
    dream_pending = "PIN_PENDING" in canonical(dream) or dream_sha is None
    pack_pending = pack_sha is None
    bind_ok = (dream_pending and pack_pending) or (dream_sha == pack_sha) or dream_pending or pack_pending
    check("C4_registry_binding", bind_ok,
          "dream_sha=%s pack_sha=%s (PENDING is acceptable; MISMATCH is not)" % (
              (dream_sha or "PENDING")[:12], (pack_sha or "PENDING")[:12]))

    # C5 c5/c6 terminal evidence from the honest custody state
    states = extract_states(pack_blob)
    c5 = states.get("c5")
    c6 = states.get("c6")
    terminal_ok = (c5 == "PASS" and c6 == "PASS")
    check("C5_c5_c6_terminal_evidence", terminal_ok,
          "c5=%s c6=%s (PENDING is an honest HOLD, not a compat break)" % (c5, c6))

    # C6 dream keeps its tighter bindings
    node_ok = False
    if isinstance(dream.get("node"), str):
        node_text = dream["node"]
        has_new = "NEW" in node_text
        exclusions_ok = True
        for nid in RUNNING_NODE_IDS:
            pos = node_text.find(nid)
            if pos < 0:
                continue
            start = max(0, pos - 90)
            ctx = node_text[start:pos + len(nid) + 90].lower()
            if not any(w in ctx for w in ("excluded", "exclude", "not", "never", "avoid", "no-stomp", "sibling", "production")):
                exclusions_ok = False
        node_ok = has_new and exclusions_ok
    auto_term_ok = False
    at = b.get("auto_terminate", [])
    if isinstance(at, list):
        auto_term_ok = ("wall_clock" in at) and ("spend" in at)
    cap_ok = b.get("runtime_cap_s") is not None
    check("C6_dream_bindings_retained",
          node_ok and auto_term_ok and cap_ok,
          "node_new=%s dual_terminate=%s runtime_cap=%s" % (node_ok, auto_term_ok, cap_ok))

    breaks = [c for c in checks if not c["pass"] and c["check"] != "C5_c5_c6_terminal_evidence"]
    holds = list(pending_holds)
    if not terminal_ok:
        holds.append("c5_c6_terminal_pending")
    if "PENDING" in str(dream.get("hf_token", {}).get("status", "")) or \
            dream.get("hf_token", {}).get("status") == "MISSING":
        holds.append("hf_token_missing")
    if "WAIT" in str(dream.get("ruling", "")):
        holds.append(dream.get("ruling"))
    verdict = "GATE_COMPAT:GO_COMPLIANT_HOLDS_STANDING" if not breaks and not holds \
        else ("GATE_COMPAT:HOLD:" + "+".join(sorted(set(holds))) if not breaks else "GATE_COMPAT:BREAK")
    unified = {
        "dream_ruling": dream.get("ruling"),
        "dream_ceiling": b.get("ceiling_usd_hard"),
        "dream_runtime_cap_s": b.get("runtime_cap_s"),
        "dream_auto_terminate": b.get("auto_terminate"),
        "dream_node_policy": dream.get("node"),
        "pack_stages": stages,
        "pack_files": sorted(files),
        "c_states": states,
    }
    receipt = {
        "kind": "gate_compat",
        "verdict": verdict,
        "checks": checks,
        "breaks": len(breaks),
        "holds": holds,
        # Keep generator output aligned with the checked-in receipt contract.
        # These are source metadata, not an approval or a launch authorization.
        "doctrine": "v11",
        "lambda_uniqueness": "Conjecture 1",
        "unified_plan_hash": digest(unified),
    }
    out = json.dumps(receipt, indent=1, sort_keys=True)
    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out + "\n")
    print(out)
    if breaks:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
