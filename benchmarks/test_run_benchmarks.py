#!/usr/bin/env python3
"""Regression tests for deterministic benchmark payload seeding."""

from __future__ import annotations

import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import textwrap
import unittest


HARNESS = Path(__file__).with_name("run_benchmarks.py")

PROBE = textwrap.dedent(
    r"""
    import contextlib
    import io
    import json
    import os
    import random
    import runpy
    import sys
    import tempfile

    namespace = runpy.run_path(sys.argv[1])
    main = namespace["main"]
    globals_ = main.__globals__
    calls = []

    class HealthResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return b'{"v1EndpointCount": 16}'

    def payload_for(payload_fn, method, seed):
        if method == "GET":
            return None
        measured_seed = seed * 2654435761 % (2**32)
        return payload_fn(random.Random(measured_seed), 0)

    def bench_route(_base, _api_key, route_id, method, path, payload_fn,
                    _reps, _warmup, seed):
        calls.append({
            "stream": "route",
            "route_id": route_id,
            "seed": seed,
            "payload": payload_for(payload_fn, method, seed),
        })
        return {
            "route_id": route_id,
            "method": method,
            "path": path,
            "p50_us": 0.0,
            "p99_us": 0.0,
            "throughput_per_s": 0.0,
            "status_counts": {},
            "raw_latencies_us": [],
        }

    def bench_governed_pair(_base, _api_key, route_id, method, path,
                            payload_fn, _reps, _warmup, seed):
        calls.append({
            "stream": "paired",
            "route_id": route_id,
            "seed": seed,
            "payload": payload_for(payload_fn, method, seed),
        })
        return {
            "route_id": route_id,
            "base_p50_ms": 0.0,
            "base_p95_ms": 0.0,
            "base_p99_ms": 0.0,
            "gov_p50_ms": 0.0,
            "gov_p95_ms": 0.0,
            "gov_p99_ms": 0.0,
            "delta_p50_ms": 0.0,
            "delta_p99_ms": 0.0,
            "audit_p50_ms": 0.0,
            "audit_p99_ms": 0.0,
            "rho_closed_count": 0,
            "rho_closed_rate": 0.0,
            "reps": 1,
            "missing_total": 0,
            "error_count": 0,
        }

    globals_["urllib"].request.urlopen = (
        lambda *_args, **_kwargs: HealthResponse()
    )
    globals_["bench_route"] = bench_route
    globals_["bench_governed_pair"] = bench_governed_pair
    globals_["write_csv"] = lambda *_args, **_kwargs: None
    globals_["write_per_product_csv"] = lambda *_args, **_kwargs: None

    with tempfile.TemporaryDirectory() as out_dir:
        sys.argv = [
            sys.argv[1],
            "--seed", sys.argv[2],
            "--reps", "1",
            "--warmup", "0",
            "--out-dir", out_dir,
        ]
        with contextlib.redirect_stderr(io.StringIO()):
            result = main()
        if result != 0:
            raise SystemExit(result)
        with open(os.path.join(out_dir, "meta.json"), encoding="utf-8") as handle:
            meta = json.load(handle)

    print(json.dumps({
        "calls": calls,
        "meta_keys": sorted(meta),
        "meta_seed": meta["seed"],
        "paired_keys": sorted(meta["paired"][0]),
        "route_keys": sorted(meta["routes"][0]),
    }, sort_keys=True, separators=(",", ":")))
    """
)


def run_probe(base_seed: int, python_hash_seed: str) -> dict:
    env = os.environ.copy()
    env["PYTHONHASHSEED"] = python_hash_seed
    completed = subprocess.run(
        [sys.executable, "-c", PROBE, str(HARNESS), str(base_seed)],
        check=True,
        capture_output=True,
        env=env,
        text=True,
        timeout=30,
    )
    return json.loads(completed.stdout)


class BenchmarkSeedDeterminismTests(unittest.TestCase):
    def test_payloads_are_stable_across_python_hash_seeds(self) -> None:
        seed_one = run_probe(42, "1")
        seed_two = run_probe(42, "8675309")

        self.assertEqual(seed_one, seed_two)
        self.assertEqual(seed_one["meta_seed"], 42)
        self.assertEqual(len(seed_one["calls"]), 24)
        self.assertEqual(
            seed_one["meta_keys"],
            [
                "harness",
                "host",
                "paired",
                "reps_per_route",
                "routes",
                "seed",
                "server",
                "started_iso",
                "version",
                "wallclock_seconds",
                "warmup_per_route",
            ],
        )
        self.assertEqual(
            seed_one["route_keys"],
            ["method", "path", "route_id", "status_counts"],
        )
        self.assertEqual(
            seed_one["paired_keys"],
            [
                "base_p50_ms",
                "delta_p50_ms",
                "delta_p99_ms",
                "error_count",
                "gov_p50_ms",
                "missing_total",
                "rho_closed_rate",
                "route_id",
            ],
        )

    def test_cli_seed_changes_payload_streams_and_metadata(self) -> None:
        seed_42 = run_probe(42, "1")
        seed_43 = run_probe(43, "1")
        payloads_42 = [
            call["payload"] for call in seed_42["calls"]
            if call["payload"] is not None
        ]
        payloads_43 = [
            call["payload"] for call in seed_43["calls"]
            if call["payload"] is not None
        ]

        self.assertEqual(seed_42["meta_seed"], 42)
        self.assertEqual(seed_43["meta_seed"], 43)
        self.assertNotEqual(payloads_42, payloads_43)

    def test_cli_seed_remains_the_additive_base(self) -> None:
        namespace = runpy.run_path(str(HARNESS))
        derive_route_seed = namespace["derive_route_seed"]

        for route_id, *_rest in namespace["ROUTES"]:
            for stream in ("route", "paired"):
                with self.subTest(route_id=route_id, stream=stream):
                    self.assertEqual(
                        derive_route_seed(43, route_id, stream)
                        - derive_route_seed(42, route_id, stream),
                        1,
                    )

    def test_seed_derivation_has_a_locked_known_vector(self) -> None:
        namespace = runpy.run_path(str(HARNESS))

        self.assertEqual(
            namespace["derive_route_seed"](
                42, "a11oy.reconcile-handoff", "route"
            ),
            3210,
        )


if __name__ == "__main__":
    unittest.main()
