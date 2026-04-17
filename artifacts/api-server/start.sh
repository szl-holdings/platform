#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/api-server
test -f ./dist/index.mjs || node ./build.mjs
exec node --max-old-space-size=1536 --expose-gc --optimize-for-size --enable-source-maps ./dist/index.mjs
