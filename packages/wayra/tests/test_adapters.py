# SPDX-License-Identifier: Apache-2.0
"""Adapter tests against canned source payloads (no network)."""
from wayra.sources.hf_hub_watcher import HFHubWatcher
from wayra.sources.github_releases import GitHubReleases
from wayra.sources.arxiv_firehose import ArxivFirehose
from wayra.sources.drone_osint import DroneOSINT
from wayra.sources.standards_watcher import StandardsWatcher

from conftest import (canned_list_models, CANNED_GH_ATOM, CANNED_ARXIV_RSS,
                      CANNED_PRESS_RSS, CANNED_USASPENDING, CANNED_STD_ATOM)


def test_hf_hub_watcher_canned(log):
    w = HFHubWatcher(log=log, orgs=["Qwen", "deepseek-ai", "meta-llama"],
                     list_models_fn=canned_list_models)
    summary = w.run_once(log, max_items=50)
    assert summary["fetched"] == 4
    # Apache/MIT models should accept; Llama (AMBER) still likely accepts but routed.
    rows = log.recent(50)
    ids = {r["url"] for r in rows}
    assert "https://huggingface.co/Qwen/Qwen3-Next-80B" in ids
    accepted = [r for r in rows if r["decision"] == "accept"]
    assert len(accepted) >= 2
    for r in accepted:
        assert "a11oy" in r["organ_routing"]
    assert log.verify_chain()["ok"]


def test_github_releases_canned(log):
    g = GitHubReleases(log=log, repos=[("zarf-dev", "zarf")],
                       fetch_fn=lambda url: CANNED_GH_ATOM)
    summary = g.run_once(log, max_items=50)
    assert summary["fetched"] == 2
    rows = log.recent(50)
    titles = " ".join(r["title"] for r in rows)
    assert "zarf-dev/zarf release v0.77.0" in titles
    # zarf routes to sentra+a11oy per _ROUTING
    acc = [r for r in rows if r["decision"] == "accept"]
    assert any("sentra" in r["organ_routing"] for r in acc)


def test_arxiv_firehose_canned_gates_spam(log):
    a = ArxivFirehose(log=log, categories=["cs.LO"],
                      fetch_fn=lambda url: CANNED_ARXIV_RSS)
    summary = a.run_once(log, max_items=50)
    assert summary["fetched"] == 2
    rows = log.recent(50)
    # The Lean paper accepts; the spam paper drops.
    decisions = {r["title"][:20]: r["decision"] for r in rows}
    lean = [r for r in rows if "Lean-Verified" in r["title"]][0]
    spam = [r for r in rows if "Buy Now" in r["title"]][0]
    assert lean["decision"] == "accept"
    assert spam["decision"] == "drop"
    assert summary["dropped"] >= 1


def test_drone_osint_canned(log):
    d = DroneOSINT(log=log,
                   press_feeds=[("Anduril", "https://x/feed.xml")],
                   keywords=["counter-UAS"],
                   fetch_fn=lambda url: CANNED_PRESS_RSS,
                   post_fn=lambda url, body: CANNED_USASPENDING)
    summary = d.run_once(log, max_items=50)
    assert summary["fetched"] == 2  # 1 press + 1 award
    rows = log.recent(50)
    kinds = {r["source_detail"] for r in rows}
    assert any(k.startswith("press:") for k in kinds)
    assert any(k.startswith("USASpending:") for k in kinds)
    acc = [r for r in rows if r["decision"] == "accept"]
    assert any("killinchu" in r["organ_routing"] for r in acc)


def test_standards_watcher_canned(log):
    s = StandardsWatcher(log=log,
                         feeds=[("IETF-SCITT", "https://x/atom.xml", ["sentra", "amaru"])],
                         fetch_fn=lambda url: CANNED_STD_ATOM)
    summary = s.run_once(log, max_items=50)
    assert summary["fetched"] == 1
    rows = log.recent(50)
    assert "SCITT" in rows[0]["title"]
    assert rows[0]["decision"] in ("accept", "review")


def test_dedup_across_runs(log):
    g = GitHubReleases(log=log, repos=[("zarf-dev", "zarf")],
                       fetch_fn=lambda url: CANNED_GH_ATOM)
    s1 = g.run_once(log, max_items=50)
    s2 = g.run_once(log, max_items=50)  # second run: all duplicates
    assert s1["fetched"] == 2
    assert s2["fetched"] == 0
    assert s2["duplicates"] == 2
    assert log.count() == 2  # no duplicate rows
