# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. HF Hub Watcher source adapter.
"""
hf_hub_watcher.py — WAYRA's Hugging Face Hub watcher.

LEGAL: uses the OFFICIAL `huggingface_hub` Python client (HfApi.list_models) against
the public Hub API (https://huggingface.co/api/models). No scraping. Read-only.

What it does (Doctrine WAYRA §Sources → HF Hub Watcher):
  - Polls the top model orgs hourly for new / newly-modified model uploads, sorting
    by `last_modified` so only fresh deltas matter.
  - Parses each model card: license, pipeline tag, params, downloads, summary.
  - Computes novelty (vs known model ids/titles already in the ingest log).
  - Computes the Yuyay-13 score + WAYRA factor; gates accept/review/drop.
  - For accepted items, routing → a11oy (the model router / coding brain). The
    Doctrine prescribes a quick benchmark via /v1/router before router-admission;
    that benchmark is a downstream a11oy step, gated by Yuyay-13 here. WAYRA never
    bakes closed weights — it only flags official open-weight uploads for a11oy.

The watcher accepts an injected `list_models_fn` so tests can run against canned
payloads with zero network (see tests/test_hf_hub_watcher.py).
"""
from __future__ import annotations

import os
from typing import Any, Callable, Iterator

from ..core.normalize import IngestEvent, make_event
from .base import Source

# Top model orgs WAYRA watches (open-weight leaders + frontier labs publishing on HF).
# Sourced from puriq/llms/OPEN_LLM_LANDSCAPE_2026.md model survey + HF Hub authors.
TOP_MODEL_ORGS = [
    "meta-llama", "Qwen", "deepseek-ai", "mistralai", "google", "microsoft",
    "01-ai", "CohereForAI", "stabilityai", "tiiuae", "HuggingFaceH4", "allenai",
    "nvidia", "ibm-granite", "internlm", "THUDM", "bigcode", "facebook",
    "openai-community", "EleutherAI", "BAAI", "Salesforce", "togethercomputer",
    "NousResearch", "teknium", "upstage", "openchat", "WizardLMTeam", "cognitivecomputations",
    "ai2", "apple", "amazon", "Snowflake", "databricks", "xai-org",
    "moonshotai", "zai-org", "perplexity-ai", "ServiceNow-AI", "LiquidAI",
    "arcee-ai", "jinaai", "Alibaba-NLP", "sentence-transformers", "laion",
    "OpenGVLab", "Skywork", "rinna", "openbmb", "kyutai",
]


def _card_field(model: Any, key: str, default: Any = None) -> Any:
    cd = getattr(model, "card_data", None)
    if cd is None:
        return default
    try:
        return cd.get(key, default)
    except Exception:
        return getattr(cd, key, default)


class HFHubWatcher(Source):
    source_id = "hf_hub"
    route_to = ["a11oy"]            # new open-weight models → a11oy model router
    rate_limit_s = 1.0
    cadence = "hourly"

    def __init__(self, log=None, orgs: list[str] | None = None,
                 per_org_limit: int = 5,
                 list_models_fn: Callable[..., Any] | None = None,
                 token: str | None = None) -> None:
        super().__init__(log)
        self.orgs = orgs or TOP_MODEL_ORGS
        self.per_org_limit = per_org_limit
        self._list_models_fn = list_models_fn
        self._token = token or os.environ.get("HF_TOKEN")
        self._api = None

    def start(self) -> None:
        if self._list_models_fn is not None:
            return
        from huggingface_hub import HfApi  # local import: only needed for live runs
        self._api = HfApi(token=self._token)

    def _list_models(self, author: str):
        if self._list_models_fn is not None:
            return self._list_models_fn(author=author, limit=self.per_org_limit)
        return self._api.list_models(
            author=author, sort="last_modified", limit=self.per_org_limit,
            cardData=True, full=True)

    def stream(self) -> Iterator[Any]:
        for org in self.orgs:
            self._throttle()
            try:
                for model in self._list_models(org):
                    yield model
            except Exception:
                continue  # one bad org must not stop the breath

    def parse(self, model: Any) -> dict[str, Any]:
        lic = _card_field(model, "license") or getattr(model, "license", None) or "unknown"
        if isinstance(lic, list):
            lic = lic[0] if lic else "unknown"
        pipeline = getattr(model, "pipeline_tag", None) or _card_field(model, "pipeline_tag")
        lm = getattr(model, "last_modified", None)
        return {
            "id": getattr(model, "id", "") or getattr(model, "modelId", ""),
            "last_modified": str(lm) if lm else "",
            "license": str(lic),
            "pipeline_tag": pipeline or "",
            "downloads": getattr(model, "downloads", 0) or 0,
            "likes": getattr(model, "likes", 0) or 0,
            "tags": list(getattr(model, "tags", []) or [])[:20],
        }

    def normalize(self, parsed: dict[str, Any]) -> IngestEvent:
        mid = parsed["id"]
        org = mid.split("/")[0] if "/" in mid else ""
        summary = (
            f"New/updated model `{mid}` on the Hugging Face Hub. "
            f"License: {parsed['license']}. Pipeline: {parsed['pipeline_tag'] or 'n/a'}. "
            f"Downloads: {parsed['downloads']}, likes: {parsed['likes']}. "
            f"Tags: {', '.join(parsed['tags'][:8])}."
        )
        return make_event(
            source=self.source_id,
            source_detail=org,
            timestamp=parsed["last_modified"],
            title=f"HF model: {mid}",
            url=f"https://huggingface.co/{mid}",
            raw=parsed,
            parsed_summary=summary,
            license=parsed["license"],
            # Dedup identity = model id + last_modified (a re-upload bumps last_modified).
            identity_parts=[self.source_id, mid, parsed["last_modified"]],
        )
