#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/mockup-sandbox

# Wait up to 8 seconds for port 8008 to be free
for i in $(seq 1 8); do
  if ! node -e "require('net').createConnection(8008,'127.0.0.1').on('connect',function(){process.exit(1)}).on('error',function(){process.exit(0)})" 2>/dev/null; then
    break
  fi
  sleep 1
done

exec node_modules/.bin/vite --config vite.config.ts --host :: --port 8008
