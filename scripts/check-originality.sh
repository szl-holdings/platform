#!/usr/bin/env bash
# SZL Originality Guard — ensures no competitor product terminology appears in product UI/copy.
# Exclusions:
#   - This script itself
#   - agent-mesh.ts DISALLOWED_TERMS definition (it IS the guard list)
#   - ops/market/ analysis docs (competitor terms used in differentiation context only)
#   - lib/ (pre-existing shared components outside Agent Mesh scope)
set -e

DISALLOWED=(
  "RootShield"
  "Skill Shield"
  "SkillShield"
  "Context Shield"
  "ContextShield"
  "Lakera Guard"
  "LakeraGuard"
  "Runlayer"
  "prompt-armor"
  "shield-score"
  "agent-score"
)

SEARCH_DIRS="artifacts/sentra/src/pages artifacts/sentra/src/components artifacts/pulse/src"
FAILED=0

for term in "${DISALLOWED[@]}"; do
  MATCHES=$(grep -rl "$term" $SEARCH_DIRS 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "❌ DISALLOWED TERM FOUND IN PRODUCT UI: \"$term\""
    echo "$MATCHES" | sed 's/^/   /'
    FAILED=1
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo "✅ Originality check passed — no disallowed competitor terms in product UI/copy."
  exit 0
else
  echo ""
  echo "❌ Originality check FAILED — see findings above."
  exit 1
fi
