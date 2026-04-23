#!/usr/bin/env sh
# Install local git hooks for the SZL Holdings monorepo.
# Run automatically via `pnpm prepare` after install.
set -e

HOOKS_DIR="$(git rev-parse --git-dir 2>/dev/null)/hooks"
if [ -z "$HOOKS_DIR" ] || [ "$HOOKS_DIR" = "/hooks" ]; then
  echo "setup-hooks: not a git repository, skipping hook installation"
  exit 0
fi

mkdir -p "$HOOKS_DIR"

cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/usr/bin/env sh
# Pre-commit: run Biome format + Oxlint on staged files only (fast path).
set -e

STAGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx|json|css)$' || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

echo "Running biome format on staged files..."
echo "$STAGED" | xargs node_modules/.bin/biome format --write

echo "Running oxlint on staged files..."
echo "$STAGED" | xargs node_modules/.bin/oxlint --quiet

echo "Running biome lint on staged files..."
echo "$STAGED" | xargs node_modules/.bin/biome lint

# Re-add any files that biome formatted
echo "$STAGED" | xargs git add --
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "setup-hooks: pre-commit hook installed at $HOOKS_DIR/pre-commit"

cat > "$HOOKS_DIR/pre-push" << 'HOOK'
#!/usr/bin/env sh
# Brand drift guard — runs on every git push.
# Fails the push if any deprecated strings or stale metrics are found.
echo "Running brand:check before push..."
pnpm brand:check

echo "Running brand:strings before push..."
pnpm brand:strings

# OG card freshness — flags committed cards that no longer match the generator.
# Skipped automatically if python3 / Pillow are unavailable on the machine.
if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" >/dev/null 2>&1; then
  echo "Running qa:og before push..."
  pnpm qa:og
else
  echo "qa:og skipped (python3 + Pillow not available)"
fi
HOOK

chmod +x "$HOOKS_DIR/pre-push"
echo "setup-hooks: pre-push hook installed at $HOOKS_DIR/pre-push"
