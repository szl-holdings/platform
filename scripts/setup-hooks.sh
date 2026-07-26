#!/usr/bin/env sh
# Compatibility entrypoint for environments that invoke this script directly.
exec node "$(dirname "$0")/setup-hooks.mjs"
