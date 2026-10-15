"""Check the readiness publisher's explicit HF_TOKEN without writing evidence.

The workflow pins huggingface_hub==2.0.0, which supports auth_check(write=True).
These checks establish prerequisites only. The executor must still publish its
real receipt and enforce khipu.require_published after this command succeeds.
"""
from __future__ import annotations

import json
import os

from khipu import HF_DATASET

HF_ENDPOINT = "https://huggingface.co"


def _result(ready: bool, stage: str, code: str, message: str) -> dict:
    return {
        "ready": ready,
        "stage": stage,
        "code": code,
        "message": message,
        "dataset": HF_DATASET,
        "repo_type": "dataset",
    }


def _failure(stage: str, exc: Exception) -> dict:
    # Do not stringify the exception, response, request or token. SDK errors
    # can carry credential-bearing bodies/headers or workflow-command text.
    status = getattr(getattr(exc, "response", None), "status_code", None)
    if type(status) is not int or not 100 <= status <= 599:
        status = None

    code = "verification_unavailable"
    message = "Hugging Face access could not be verified. Check service availability and rerun."
    if stage == "client":
        code = "client_unavailable"
        message = "The Hugging Face client could not start. Install the workflow's pinned huggingface_hub==2.0.0."
    elif stage == "identity" and status == 401:
        code = "token_rejected"
        message = "Hugging Face rejected the HF_TOKEN supplied to this job. Provision an active credential in the effective Actions secret."
    elif stage == "identity" and status == 403:
        code = "access_denied"
        message = "Hugging Face denied the HF_TOKEN identity check. Verify the credential and applicable access policy."
    elif stage == "destination" and status in (401, 403, 404):
        code = "destination_unavailable"
        message = "The configured dataset could not be resolved or accessed with HF_TOKEN. Verify the existing dataset and this credential's access."
    elif stage == "write" and status in (401, 403, 404):
        code = "write_denied"
        message = "Dataset content-write permission was not established. Verify HF_TOKEN has scoped write access and any required organization approval."

    result = _result(False, stage, code, message)
    if status is not None:
        result["http_status"] = status
    return result


def check_publish_access() -> dict:
    """Verify identity, destination and write access using only the CI token.

    Never fall back to a cached login, an alternate secret, anonymous access,
    OIDC or another repository. A 401/404 at the repository stage does not
    establish that the dataset was deleted. No preflight creates a receipt.
    """
    token = os.environ.get("HF_TOKEN")
    if not token or not token.strip():
        return _result(
            False, "credential", "missing_token",
            "HF_TOKEN is missing or empty in this job. Provision the effective GitHub Actions secret.",
        )
    if any(char.isspace() or not char.isprintable() for char in token):
        return _result(
            False, "credential", "malformed_token",
            "HF_TOKEN contains whitespace or control characters. Correct the stored Actions secret without printing it.",
        )
    if os.environ.get("HF_ENDPOINT", HF_ENDPOINT) != HF_ENDPOINT:
        return _result(
            False, "destination", "endpoint_mismatch",
            "HF_ENDPOINT must be unset or https://huggingface.co so the preflight and receipt publisher use the same Hub.",
        )

    stage = "client"
    try:
        from huggingface_hub import HfApi  # type: ignore

        # Match the publisher's token and canonical Hub. The endpoint guard
        # above prevents checking a different Hub from the receipt publisher.
        api = HfApi(endpoint=HF_ENDPOINT, token=token)
        stage = "identity"
        api.whoami(token=token)
        stage = "destination"
        api.repo_info(
            repo_id=HF_DATASET, repo_type="dataset", token=token, timeout=15,
        )
        stage = "write"
        api.auth_check(
            repo_id=HF_DATASET, repo_type="dataset", token=token, write=True,
        )
    except Exception as exc:
        return _failure(stage, exc)

    return _result(
        True, "complete", "ready",
        "Credential identity, dataset access and write authorization verified. Publication and receipt signing remain separate evidence checks.",
    )


def main() -> int:
    result = check_publish_access()
    print(json.dumps(result, sort_keys=True))
    if result["ready"]:
        return 0
    if os.environ.get("GITHUB_ACTIONS") == "true":
        # Only locally defined strings and an allowlisted numeric status can
        # enter this annotation; raw provider text is never interpolated.
        status = result.get("http_status")
        http = f" (HTTP {status})" if status is not None else ""
        print(
            "::error title=Readiness publication preflight failed::"
            f"{result['stage']}/{result['code']}{http}: {result['message']}"
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
