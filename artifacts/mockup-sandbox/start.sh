#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/mockup-sandbox
exec node_modules/.bin/vite --config vite.config.ts --host :: --port 8008
