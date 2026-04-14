#!/bin/sh
cd /home/runner/workspace/artifacts/api-server
export PORT=8080
exec node --max-old-space-size=512 --enable-source-maps ./fast-start.mjs
