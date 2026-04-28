#!/usr/bin/env bash
# lint-ai-direct-calls.sh
# Enforces that every source file making direct AI SDK calls also imports
# from the callModel telemetry layer (call-model.ts).
#
# GATE: Any file that directly invokes AI provider APIs must also import
#       from call-model to prove it routes through budget/telemetry.
#
# Covered patterns:
#   - anthropic.messages.{create,stream}            — Anthropic SDK
#   - openai.chat.completions.create                — OpenAI Chat Completions SDK
#   - getOpenAI().chat                              — OpenAI via helper
#   - createResponse / createResponseStream         — OpenAI Responses API wrappers
#   - geminiAi.models.generateContent               — Gemini SDK
#
# Files that are exempt by design:
#   - call-model.ts itself (the implementation)
#   - *.test.ts / *.spec.ts (test utilities may call SDK directly)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DIRECT_CALL_PATTERN="anthropic\.messages\.(create|stream)|openai\.chat\.completions\.create|getOpenAI\(\)\.chat|createResponse\(|createResponseStream\(|geminiAi\.models\.generateContent"

# Find all TS source files (not tests) that contain direct AI SDK calls
FILES_WITH_SDK_CALLS=$(grep -rEl "$DIRECT_CALL_PATTERN" "$SRC_DIR" \
  --include="*.ts" \
  | grep -v "\.test\.ts$" \
  | grep -v "\.spec\.ts$" \
  | grep -v "call-model\.ts$" \
  | grep -v "responses\.ts$")   # ai-engine/providers/openai/responses.ts is the implementation itself

if [ -z "$FILES_WITH_SDK_CALLS" ]; then
  echo "✓ lint-ai-direct-calls: No direct AI SDK calls found outside call-model.ts."
  exit 0
fi

# Each such file must import from call-model to confirm it's wired
UNGUARDED=""
while IFS= read -r f; do
  if ! grep -q "call-model" "$f"; then
    UNGUARDED="$UNGUARDED\n  $f"
  fi
done <<< "$FILES_WITH_SDK_CALLS"

if [ -n "$UNGUARDED" ]; then
  echo "ERROR: The following files make direct AI SDK calls without importing from the callModel layer:"
  echo -e "$UNGUARDED"
  echo ""
  echo "Every call to anthropic.messages.*, createResponse, createResponseStream, or geminiAi.models.generateContent"
  echo "must be wrapped inside callModel() or use enforceBudgetForOrg + recordModelUsage."
  echo "Import { callModel, enforceBudgetForOrg, recordModelUsage } from '../services/ai/call-model'."
  exit 1
fi

echo "✓ lint-ai-direct-calls: All direct AI SDK calls are routed through the callModel telemetry layer."
exit 0
