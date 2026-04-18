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

cat > "$HOOKS_DIR/pre-push" << 'HOOK'
#!/usr/bin/env sh
# Brand drift guard — runs on every git push.
# Fails the push if any deprecated strings or stale metrics are found.
echo "Running brand:check before push..."
pnpm brand:check
HOOK

chmod +x "$HOOKS_DIR/pre-push"
echo "setup-hooks: pre-push hook installed at $HOOKS_DIR/pre-push"
