#!/usr/bin/env bash
# Optional: install the GPU thermal exporter as a systemd service on a LINUX GPU node.
# Run ON the RTX 5000 node as root. (Windows users: just run the .py at login instead.)
set -euo pipefail
DEST=/opt/gpu-node-exporter
PORT="${GPU_EXPORTER_PORT:-9839}"
BIND="${GPU_EXPORTER_BIND:-0.0.0.0}"
TOKEN="${GPU_EXPORTER_TOKEN:-}"

install -d "$DEST"
install -m 0755 "$(dirname "$0")/gpu_thermal_exporter.py" "$DEST/gpu_thermal_exporter.py"

cat > /etc/default/gpu-node-exporter <<EOF
GPU_EXPORTER_PORT=$PORT
GPU_EXPORTER_BIND=$BIND
GPU_EXPORTER_TOKEN=$TOKEN
EOF
chmod 0600 /etc/default/gpu-node-exporter

cat > /etc/systemd/system/gpu-node-exporter.service <<'EOF'
[Unit]
Description=a11oy GPU thermal exporter (nvidia-smi -> /gpu/thermal)
After=network-online.target
Wants=network-online.target

[Service]
EnvironmentFile=/etc/default/gpu-node-exporter
ExecStart=/usr/bin/python3 /opt/gpu-node-exporter/gpu_thermal_exporter.py
Restart=always
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now gpu-node-exporter.service
sleep 2
echo "--- health ---"
curl -s "http://127.0.0.1:${PORT}/gpu/thermal" || true
echo
echo "Exporter live. Now on the APP box add to /etc/a11oy-gpu.env:"
echo "  GPU_THERMAL_URL=http://<this-node-tailscale-ip>:${PORT}/gpu/thermal"
