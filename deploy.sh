#!/usr/bin/env bash
#
# Deploy my-agent/ to the production API server.
#
#   ./deploy.sh
#
# The production host is NOT a git checkout -- code is copied in place and the
# service is a systemd unit. This script encodes that, plus the three things
# that took production down on 2026-09-21:
#
#   1. The local .env must never be copied up. server.py loads a .env sitting
#      next to itself, so shipping the dev one would set ENVIRONMENT=development
#      in production and expose /auth/dev, which mints a session with no
#      credentials at all.
#   2. Dependencies must be installed on the server, not assumed. The box had
#      drifted months behind requirements.txt; an import that moved to module
#      scope turned a dormant gap into a boot failure.
#   3. The service must be health-checked after restart, and rolled back if it
#      does not come up -- systemd reporting "active" is not the same as the
#      API answering.
#
set -euo pipefail

HOST="${FINCORE_DEPLOY_HOST:-ec2-user@35.178.139.5}"
KEY="${FINCORE_DEPLOY_KEY:-$HOME/Code/config-repo/fincore-key.pem}"
REMOTE_DIR="/opt/fincore/my-agent"
SERVICE="fincore"
HEALTH_URL="${FINCORE_HEALTH_URL:-http://35.178.139.5:8000/}"

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/my-agent"
STAMP="$(date +%F-%H%M)"
BACKUP="${REMOTE_DIR}.bak-${STAMP}"

ssh_run() { ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "$@"; }

echo "==> Preflight"
[ -f "$KEY" ]        || { echo "FAIL: ssh key not found at $KEY"; exit 1; }
[ -d "$LOCAL_DIR" ]  || { echo "FAIL: $LOCAL_DIR not found"; exit 1; }
ssh_run true         || { echo "FAIL: cannot ssh to $HOST"; exit 1; }
echo "    ok"

echo "==> Backing up current code to $BACKUP"
ssh_run "sudo cp -r '$REMOTE_DIR' '$BACKUP'"

echo "==> Uploading (.env, venv, caches and tests excluded)"
rsync -a --delete-excluded \
  --exclude='.env' --exclude='venv' --exclude='__pycache__' \
  --exclude='.pytest_cache' --exclude='tests' --exclude='node_modules' \
  -e "ssh -i $KEY -o StrictHostKeyChecking=no" \
  "$LOCAL_DIR/" "$HOST:/tmp/my-agent-deploy-$STAMP/"

ssh_run "sudo cp /tmp/my-agent-deploy-$STAMP/*.py '$REMOTE_DIR/' && sudo cp /tmp/my-agent-deploy-$STAMP/requirements.txt '$REMOTE_DIR/'"

echo "==> Installing dependencies"
ssh_run "sudo /usr/bin/python3.11 -m pip install -q -r '$REMOTE_DIR/requirements.txt' 2>&1 | tail -3"

echo "==> Restarting $SERVICE"
ssh_run "sudo systemctl restart $SERVICE"

echo "==> Health check"
ok=""
for i in $(seq 1 10); do
  sleep 3
  if [ "$(curl -s -m 8 -o /dev/null -w '%{http_code}' "$HEALTH_URL")" = "200" ]; then
    ok=1; echo "    healthy after $((i*3))s"; break
  fi
  echo "    waiting ($((i*3))s)"
done

if [ -z "$ok" ]; then
  echo
  echo "!! FAILED to come up. Last log lines:"
  ssh_run "sudo journalctl -u $SERVICE -n 15 --no-pager" || true
  echo
  echo "!! Rolling back to $BACKUP"
  ssh_run "sudo cp '$BACKUP'/*.py '$REMOTE_DIR/' && sudo systemctl restart $SERVICE"
  sleep 5
  echo "!! Rolled back. Health now: $(curl -s -m 8 -o /dev/null -w '%{http_code}' "$HEALTH_URL")"
  exit 1
fi

echo "==> Verifying production safety settings"
dev_auth="$(curl -s -m 8 -o /dev/null -w '%{http_code}' -X POST "${HEALTH_URL%/}/auth/dev" -H 'Content-Type: application/json' -d '{}')"
if [ "$dev_auth" = "404" ]; then
  echo "    /auth/dev -> 404 (credential-free bypass correctly disabled)"
else
  echo
  echo "!! WARNING: /auth/dev returned $dev_auth, expected 404."
  echo "!! ENVIRONMENT=development is set in production. Anyone can mint a session."
  echo "!! Remove it from /opt/fincore/.env and restart $SERVICE."
  exit 1
fi

echo
echo "Deployed. Backup kept at $BACKUP"
echo "Old backups are not pruned automatically -- tidy them occasionally."
