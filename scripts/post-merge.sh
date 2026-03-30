#!/bin/bash
set -e
pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1 || true
echo "y" | pnpm --filter db push --force 2>&1 || true
