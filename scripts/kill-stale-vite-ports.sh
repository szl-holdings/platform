#!/usr/bin/env bash
# kill-stale-vite-ports.sh
#
# Free one or more TCP ports before a dev server tries to bind them. Safe to
# run on a clean container (no-op when nothing is listening). Used as a
# pre-hook for artifact dev workflows after a restart that left a zombie
# `vite` / `expo` / `node` process holding the assigned PORT.
#
# Why: Replit's artifact-router restarts the workflow process, but the OS
# sometimes does not immediately reap the previous process's listening
# socket. The next vite start then sees `EADDRINUSE` and exits, which the
# workflow runner surfaces as `Port N is already in use`.
#
# Implementation note: the Replit Nix env does not ship `lsof`, `ss`, or
# `fuser`. We parse /proc/net/tcp{,6} directly to find listening sockets,
# then walk /proc/*/fd/* to map inodes back to PIDs. This is deliberately
# dependency-free.
#
# Usage: scripts/kill-stale-vite-ports.sh <port> [<port> ...]

set -u

if [[ $# -eq 0 ]]; then
  echo "kill-stale-vite-ports: no ports specified, nothing to do" >&2
  exit 0
fi

# Print PIDs of processes listening on the given TCP port (IPv4 + IPv6).
# Listening state in /proc/net/tcp{,6} is column 4 == "0A".
find_pids_on_port() {
  local port="$1"
  local hex
  printf -v hex '%04X' "$port"

  # Collect inodes whose local address ends in :<hex> and whose state is 0A.
  local inodes
  inodes=$(awk -v hex=":$hex" -v st="0A" '
    NR > 1 && $4 == st {
      n = split($2, parts, ":")
      if (parts[n] == substr(hex, 2)) print $10
    }
  ' /proc/net/tcp /proc/net/tcp6 2>/dev/null | sort -u)

  [[ -z "$inodes" ]] && return 0

  # Map socket inodes -> PIDs by scanning /proc/<pid>/fd/*.
  local pids=""
  for pid_dir in /proc/[0-9]*; do
    [[ -r "$pid_dir/fd" ]] || continue
    local pid="${pid_dir##*/}"
    for fd in "$pid_dir"/fd/*; do
      [[ -L "$fd" ]] || continue
      local target
      target=$(readlink "$fd" 2>/dev/null) || continue
      [[ "$target" == socket:* ]] || continue
      local inode="${target#socket:[}"
      inode="${inode%]}"
      if grep -qxF "$inode" <<<"$inodes"; then
        pids+="$pid "
        break
      fi
    done
  done
  echo "$pids"
}

for port in "$@"; do
  if ! [[ "$port" =~ ^[0-9]+$ ]]; then
    echo "kill-stale-vite-ports: skipping non-numeric arg '$port'" >&2
    continue
  fi

  pids=$(find_pids_on_port "$port")
  pids=$(echo "$pids" | tr -s ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')
  pids="${pids% }"

  if [[ -z "$pids" ]]; then
    continue
  fi

  echo "kill-stale-vite-ports: freeing port ${port} (pids: ${pids})" >&2
  # SIGTERM first, brief grace period, then SIGKILL the holdouts.
  kill $pids 2>/dev/null || true
  sleep 0.3
  remaining=$(find_pids_on_port "$port")
  remaining=$(echo "$remaining" | tr -s ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')
  remaining="${remaining% }"
  if [[ -n "$remaining" ]]; then
    kill -9 $remaining 2>/dev/null || true
  fi
done

exit 0
