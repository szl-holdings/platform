#!/usr/bin/env bash
# rollback_flagship.sh — revert an SZL flagship HF Space to a previous commit SHA.
#
# Usage:
#   ./rollback_flagship.sh <flagship> <previous_sha>
# Example:
#   ./rollback_flagship.sh rosie 29deb433fcf288af441e34596c07e10a35e93fb2
#
# Requires: HF_TOKEN env (write scope on SZLHOLDINGS), python3 with huggingface_hub.
# ADDITIVE / NON-DESTRUCTIVE: this creates a NEW commit on the Space that restores
# the tree of <previous_sha>. It does NOT force-push or rewrite history, so the
# rollback itself is auditable and itself reversible.
#
# Doctrine v11 LOCKED · 749/14/163 · locked_at c7c0ba17
set -euo pipefail

FLAGSHIP="${1:?usage: rollback_flagship.sh <flagship> <previous_sha>}"
PREV_SHA="${2:?usage: rollback_flagship.sh <flagship> <previous_sha>}"
ORG="SZLHOLDINGS"
REPO_ID="${ORG}/${FLAGSHIP}"

echo "[rollback] target=${REPO_ID} -> ${PREV_SHA}"

python3 - "$REPO_ID" "$PREV_SHA" "$FLAGSHIP" <<'PY'
import sys, io, json, datetime, os
from huggingface_hub import HfApi, hf_hub_download
repo_id, prev_sha, flagship = sys.argv[1], sys.argv[2], sys.argv[3]
api = HfApi(token=os.environ["HF_TOKEN"])

# Enumerate files at the previous revision and re-upload them as a new restore commit.
files = api.list_repo_files(repo_id=repo_id, repo_type="space", revision=prev_sha)
from huggingface_hub import CommitOperationAdd
ops = []
for f in files:
    local = hf_hub_download(repo_id=repo_id, repo_type="space", revision=prev_sha, filename=f)
    ops.append(CommitOperationAdd(path_in_repo=f, path_or_fileobj=local))

commit = api.create_commit(
    repo_id=repo_id, repo_type="space", operations=ops,
    commit_message=f"revert({flagship}): restore Space tree of {prev_sha[:12]} (rollback)\n\n"
                   "Doctrine v11 LOCKED 749/14/163 locked_at c7c0ba17\n"
                   "Co-Authored-By: Perplexity Computer Agent <agent@perplexity.ai>",
)
print(json.dumps({"restored_to": prev_sha, "new_commit": getattr(commit, "oid", str(commit))}))
PY

# --- Khipu chain log ---
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
KHIPU_ENTRY="{\"ts\":\"${TS}\",\"event\":\"rollback\",\"flagship\":\"${FLAGSHIP}\",\"restored_to\":\"${PREV_SHA}\",\"actor\":\"yachay@szlholdings.dev\"}"
echo "[khipu] ${KHIPU_ENTRY}"
# Best-effort append to the Khipu constellation chain endpoint (non-fatal on failure).
if [ -n "${KHIPU_ENDPOINT:-}" ]; then
  curl -fsS -X POST "${KHIPU_ENDPOINT}/khipu/append" \
    -H "Content-Type: application/json" \
    -d "${KHIPU_ENTRY}" || echo "[khipu] WARN: append failed (logged locally above)"
fi
echo "[rollback] done."
