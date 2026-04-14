#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/api-server
test -f ./dist/index.mjs || node ./build.mjs
exec node --max-old-space-size=512 --enable-source-maps ./dist/index.mjs
