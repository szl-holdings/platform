#!/bin/sh
cd /home/runner/workspace/artifacts/mockup-sandbox
exec node_modules/.bin/vite --config vite.config.ts --host ::
