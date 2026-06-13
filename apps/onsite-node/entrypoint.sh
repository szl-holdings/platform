#!/bin/sh
# entrypoint.sh — Start both node_agent (loop) and node_thermal_agent (HTTP server).
# Crusoe-style: the whole node arrives pre-wired.
#
# DOCTRINE: No key is read here. All secrets come from env.
# The node_thermal_agent binds to BIND_ADDR:BIND_PORT (default 0.0.0.0:9101).
# In production, set BIND_ADDR to your Tailscale IP to restrict to the tailnet.
set -e

PYTHONPATH="/app/agentic-gpu:/app/onsite-node:${PYTHONPATH:-}"
export PYTHONPATH

echo '{"service":"onsite-node","status":"starting","note":"energy-stays-local; results-travel"}'

# Start the thermal agent in the background
python3 /app/onsite-node/node_thermal_agent.py \
    --addr "${BIND_ADDR:-0.0.0.0}" \
    --port "${BIND_PORT:-9101}" &
THERMAL_PID=$!

echo "{\"service\":\"node-thermal-agent\",\"pid\":${THERMAL_PID},\"bind\":\"${BIND_ADDR:-0.0.0.0}:${BIND_PORT:-9101}\"}"

# Start the node agent loop in the foreground
exec python3 /app/onsite-node/node_agent.py \
    --loop \
    --lat "${NODE_LAT:-52.5}" \
    --lon "${NODE_LON:-13.4}" \
    --interval "${NODE_LOOP_INTERVAL:-60}"
