"""Static regression checks for the non-idempotent claim proxy boundary."""

from __future__ import annotations

from pathlib import Path


DEPLOY_DIR = Path(__file__).resolve().parents[1] / "deploy"


def test_nginx_never_retries_mutating_claims() -> None:
    config = (DEPLOY_DIR / "nginx.conf").read_text(encoding="utf-8")
    claim_block = config.split("location = /claim {", 1)[1].split("}", 1)[0]

    assert "proxy_next_upstream off;" in claim_block
    assert "proxy_next_upstream_tries 1;" in claim_block
    assert "http_502" not in claim_block
    assert "http_503" not in claim_block
    assert "http_504" not in claim_block


def test_caddy_never_retries_mutating_claims() -> None:
    config = (DEPLOY_DIR / "Caddyfile").read_text(encoding="utf-8")
    claim_block = config.split("handle /claim {", 1)[1].split("handle /ready {", 1)[0]

    assert "lb_try_duration 0s" in claim_block
    assert "lb_retry_match" not in claim_block
