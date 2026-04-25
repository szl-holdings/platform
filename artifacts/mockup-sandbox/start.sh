#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/mockup-sandbox
exec node_modules/.bin/vite --config vite.config.ts --host 0.0.0.0 --port 8008
