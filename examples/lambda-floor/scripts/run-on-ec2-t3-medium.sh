#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# run-on-ec2-t3-medium.sh
#
# Provisions a one-shot t3.medium EC2 instance, runs the lambda-floor
# in-cluster admission-latency harness on it, uploads the resulting artifact
# bundle to S3, and tears every AWS resource it created back down — even on
# failure. This is the script that produces the §05-certifying number for
# row 4 of examples/lambda-floor/PR_DESCRIPTION.md.
#
# Why this script exists
# ----------------------
# `scripts/run-cluster-latency.sh` is the harness; it doesn't care what host
# it runs on. The §05 acceptance criterion specifically calls for a reference
# t3.medium, so the harness must run on actual t3.medium hardware to satisfy
# it. This script is the thin, auditable shim that gets it there and back.
#
# Required env
#   AWS_REGION                  e.g. us-east-1
#   S3_BUCKET                   destination bucket for artifacts
#   AWS_ACCESS_KEY_ID           IAM user with EC2 + the one bucket
#   AWS_SECRET_ACCESS_KEY
#   (AWS_SESSION_TOKEN          if using STS)
#
# Optional env
#   S3_PREFIX                   default: lambda-floor-latency
#   SAMPLES                     forwarded to harness, default 200
#   P95_BUDGET_MS               forwarded to harness, default 50
#   AMI_ID                      override; default = latest Ubuntu 22.04 LTS
#                               amd64 via the canonical SSM parameter
#   INGRESS_CIDR                CIDR allowed to SSH in; default = this host's
#                               public IPv4 /32 from checkip.amazonaws.com
#   KEEP_INSTANCE               non-empty: skip teardown (debugging only)
#
# Outputs
#   examples/lambda-floor/artifacts/lambda-floor-latency/
#     samples.ndjson, summary.json, summary.md   (pulled back from the box)
#     s3-url.txt                                 (s3:// URL of the upload)
#
# Exit status
#   0  harness exited 0 AND artifacts uploaded
#   non-zero on any failure (teardown still runs)
#
# Prereqs on the host running THIS script (typically a CI runner or laptop):
#   aws (v2), ssh, scp, jq, curl, tar
# ---------------------------------------------------------------------------
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$HERE/.." && pwd)"
OUT_DIR="$MODULE_DIR/artifacts/lambda-floor-latency"
mkdir -p "$OUT_DIR"

log() { printf '[lambda-floor-ec2] %s\n' "$*" >&2; }
die() { log "FATAL: $*"; exit 1; }

require() {
  for bin in "$@"; do
    command -v "$bin" >/dev/null 2>&1 || die "missing required tool: $bin"
  done
}
require aws ssh scp jq curl tar

: "${AWS_REGION:?AWS_REGION is required}"
: "${S3_BUCKET:?S3_BUCKET is required}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"

S3_PREFIX="${S3_PREFIX:-lambda-floor-latency}"
SAMPLES="${SAMPLES:-200}"
P95_BUDGET_MS="${P95_BUDGET_MS:-50}"

aws sts get-caller-identity >/dev/null \
  || die "AWS credentials are not valid for sts:GetCallerIdentity"
aws s3api head-bucket --bucket "$S3_BUCKET" >/dev/null \
  || die "cannot reach s3://$S3_BUCKET (HeadBucket failed)"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RAND="$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6)"
TAG="lambda-floor-bench-${STAMP}-${RAND}"
KEY_NAME="$TAG"
SG_NAME="$TAG"
INSTANCE_NAME="$TAG"

WORK="$(mktemp -d)"
PEM="$WORK/${KEY_NAME}.pem"

KEY_CREATED=""
SG_ID=""
INSTANCE_ID=""

cleanup() {
  local rc=$?
  if [[ -n "${KEEP_INSTANCE:-}" ]]; then
    log "KEEP_INSTANCE set — leaving $INSTANCE_NAME up; key $PEM kept"
    log "you MUST manually terminate: $INSTANCE_ID / sg $SG_ID / key $KEY_NAME"
    exit "$rc"
  fi
  if [[ -n "$INSTANCE_ID" ]]; then
    log "terminating instance $INSTANCE_ID"
    aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" \
      --region "$AWS_REGION" >/dev/null 2>&1 || true
    aws ec2 wait instance-terminated --instance-ids "$INSTANCE_ID" \
      --region "$AWS_REGION" >/dev/null 2>&1 || true
  fi
  if [[ -n "$SG_ID" ]]; then
    log "deleting security group $SG_ID"
    # The SG can take a moment to release after instance termination.
    for _ in 1 2 3 4 5; do
      aws ec2 delete-security-group --group-id "$SG_ID" \
        --region "$AWS_REGION" >/dev/null 2>&1 && break
      sleep 5
    done
  fi
  if [[ -n "$KEY_CREATED" ]]; then
    log "deleting key pair $KEY_NAME"
    aws ec2 delete-key-pair --key-name "$KEY_NAME" \
      --region "$AWS_REGION" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK"
  exit "$rc"
}
trap cleanup EXIT INT TERM

# ---- AMI -------------------------------------------------------------------
if [[ -z "${AMI_ID:-}" ]]; then
  log "resolving latest Ubuntu 22.04 LTS amd64 AMI in $AWS_REGION"
  AMI_ID="$(aws ssm get-parameter \
    --name /aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id \
    --region "$AWS_REGION" --query 'Parameter.Value' --output text)"
fi
[[ "$AMI_ID" == ami-* ]] || die "could not resolve AMI (got: $AMI_ID)"
log "AMI: $AMI_ID"

# ---- key pair --------------------------------------------------------------
log "creating key pair $KEY_NAME"
aws ec2 create-key-pair --key-name "$KEY_NAME" \
  --region "$AWS_REGION" --query 'KeyMaterial' --output text >"$PEM"
chmod 600 "$PEM"
KEY_CREATED=1

# ---- security group --------------------------------------------------------
INGRESS_CIDR="${INGRESS_CIDR:-$(curl -fsS https://checkip.amazonaws.com)/32}"
[[ "$INGRESS_CIDR" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$ ]] \
  || die "could not derive INGRESS_CIDR (got: $INGRESS_CIDR)"
log "ingress CIDR: $INGRESS_CIDR (SSH only)"

VPC_ID="$(aws ec2 describe-vpcs \
  --filters Name=isDefault,Values=true \
  --region "$AWS_REGION" --query 'Vpcs[0].VpcId' --output text)"
[[ "$VPC_ID" == vpc-* ]] || die "no default VPC in $AWS_REGION"

SG_ID="$(aws ec2 create-security-group \
  --group-name "$SG_NAME" \
  --description "lambda-floor bench (auto, ephemeral)" \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" --query 'GroupId' --output text)"
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" --protocol tcp --port 22 --cidr "$INGRESS_CIDR" \
  --region "$AWS_REGION" >/dev/null
log "security group: $SG_ID"

# ---- user-data -------------------------------------------------------------
USER_DATA="$(cat <<'CLOUDINIT'
#!/usr/bin/env bash
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release rsync jq

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
usermod -aG docker ubuntu

# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# kubectl — latest stable. The kubectl client supports ±1 minor skew
# against whatever k8s minor k3d ships, so tracking stable avoids bit-rot
# on a pinned older minor as k3d advances.
KUBECTL_VERSION="$(curl -fsSL https://dl.k8s.io/release/stable.txt)"
curl -fsSL -o /usr/local/bin/kubectl \
  "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
chmod +x /usr/local/bin/kubectl

# k3d
curl -fsSL https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

touch /var/lib/cloud/instance/lambda-floor-ready
CLOUDINIT
)"

# ---- launch ----------------------------------------------------------------
log "launching t3.medium ($INSTANCE_NAME)"
INSTANCE_ID="$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t3.medium \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3,DeleteOnTermination=true}' \
  --user-data "$USER_DATA" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=lambda-floor-bench,Value=true}]" \
  --region "$AWS_REGION" --query 'Instances[0].InstanceId' --output text)"
log "instance: $INSTANCE_ID"

log "waiting for instance-running"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

PUBLIC_IP="$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)"
[[ "$PUBLIC_IP" != "None" && -n "$PUBLIC_IP" ]] || die "no public IP for $INSTANCE_ID"
log "public IP: $PUBLIC_IP"

SSH_OPTS=(-i "$PEM" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
          -o ConnectTimeout=10 -o ServerAliveInterval=30)
# Always invoke ssh with the array form ("${SSH_OPTS[@]}") — collapsing it
# into a string and word-splitting breaks the moment $PEM contains a space
# and is fragile around -o values, so we keep the array everywhere.
ssh_remote() { ssh "${SSH_OPTS[@]}" "ubuntu@$PUBLIC_IP" "$@"; }

# ---- wait for SSH ----------------------------------------------------------
log "waiting for SSH"
for i in $(seq 1 60); do
  if ssh_remote true >/dev/null 2>&1; then break; fi
  sleep 5
  [[ "$i" == 60 ]] && die "SSH never came up on $PUBLIC_IP"
done

# ---- wait for cloud-init to finish installing docker/k3d/kubectl/node ------
log "waiting for cloud-init (docker/k3d/kubectl/node install)"
ssh_remote 'sudo cloud-init status --wait' \
  || die "cloud-init failed; check /var/log/cloud-init-output.log on the box"
ssh_remote 'test -f /var/lib/cloud/instance/lambda-floor-ready' \
  || die "cloud-init finished but ready marker is missing"

# ---- upload module ---------------------------------------------------------
log "uploading examples/lambda-floor module"
TARBALL="$WORK/lambda-floor.tgz"
tar -C "$(dirname "$MODULE_DIR")" \
  --exclude='lambda-floor/node_modules' \
  --exclude='lambda-floor/artifacts' \
  --exclude='lambda-floor/.pepr' \
  --exclude='lambda-floor/dist' \
  -czf "$TARBALL" lambda-floor
scp "${SSH_OPTS[@]}" "$TARBALL" "ubuntu@$PUBLIC_IP:/home/ubuntu/lambda-floor.tgz"
ssh_remote 'tar -xzf /home/ubuntu/lambda-floor.tgz -C /home/ubuntu'

# ---- run the harness -------------------------------------------------------
# Build the remote runner as a real file and scp it over, then invoke it via
# `sg docker -c "bash /path"`. This avoids quoting the entire script through
# ssh's command-line — `printf %q` of a multi-line bash heredoc produces
# $'...' ANSI-C quoting that remote /bin/sh (dash on Ubuntu) does not parse
# the same way bash does, which silently breaks the deny-batch invocation.
log "running run-cluster-latency.sh on the box (SAMPLES=$SAMPLES, P95=$P95_BUDGET_MS)"
REMOTE_RUNNER="$WORK/remote-runner.sh"
cat >"$REMOTE_RUNNER" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd /home/ubuntu/lambda-floor
npm install --no-audit --no-fund --loglevel=error
SAMPLES=$SAMPLES P95_BUDGET_MS=$P95_BUDGET_MS \\
  ARTIFACT_DIR=/home/ubuntu/lambda-floor/artifacts \\
  bash scripts/run-cluster-latency.sh
EOF
chmod +x "$REMOTE_RUNNER"
scp "${SSH_OPTS[@]}" "$REMOTE_RUNNER" \
  "ubuntu@$PUBLIC_IP:/home/ubuntu/remote-runner.sh"

# `sg docker -c` re-execs in a shell where the docker group from
# `usermod -aG docker ubuntu` is active (the existing SSH session still has
# the old groups). Exit code of the inner command propagates through `sg`,
# so `set -e` in this outer script will catch a non-zero harness exit.
ssh_remote 'sg docker -c "bash /home/ubuntu/remote-runner.sh"'

# ---- pull artifacts --------------------------------------------------------
log "pulling artifacts back"
scp "${SSH_OPTS[@]}" -r \
  "ubuntu@$PUBLIC_IP:/home/ubuntu/lambda-floor/artifacts/lambda-floor-latency/." \
  "$OUT_DIR/"

# ---- upload to S3 ----------------------------------------------------------
# Upload ONLY the four files this run produced (samples.ndjson,
# summary.json, summary.md, host.json if present). The OUT_DIR also contains
# the static bundle README and the evaluator-* CPU artifacts from the PR;
# those are repo-tracked, not per-run, and don't belong in the S3 snapshot.
S3_DEST="s3://$S3_BUCKET/$S3_PREFIX/$STAMP-$RAND/"
log "uploading to $S3_DEST"
for f in samples.ndjson summary.json summary.md host.json; do
  if [[ -f "$OUT_DIR/$f" ]]; then
    aws s3 cp "$OUT_DIR/$f" "$S3_DEST$f" --region "$AWS_REGION"
  fi
done
echo "$S3_DEST" > "$OUT_DIR/s3-url.txt"

# Helpful one-liner the operator can paste into PR_DESCRIPTION.md row 4.
SUMMARY_URL="${S3_DEST}summary.md"
cat >&2 <<EOF

------------------------------------------------------------------------------
PR_DESCRIPTION.md row 4 — paste this for "Linked run":

  [reference t3.medium, end-to-end run ${STAMP}]($SUMMARY_URL)

Local artifacts: $OUT_DIR
S3 prefix:       $S3_DEST
Instance:        $INSTANCE_ID (will be torn down on exit)
------------------------------------------------------------------------------
EOF
