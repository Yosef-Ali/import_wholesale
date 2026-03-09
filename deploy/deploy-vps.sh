#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# BuildSupply Pro — Deploy to VPS
#
# Run from ANYWHERE (laptop or VPS):
#   ./deploy/deploy-vps.sh              (deploy react-ui)
#   ./deploy/deploy-vps.sh react        (deploy react-ui)
#   ./deploy/deploy-vps.sh backend      (deploy ERPNext)
#   ./deploy/deploy-vps.sh all          (deploy everything)
# ─────────────────────────────────────────────────────────
set -euo pipefail

VPS_HOST="72.62.170.70"
VPS_USER="root"
COMPONENT="${1:-react}"

echo "━━━ BuildSupply Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Component: $COMPONENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Push local changes first
echo ""
echo "==> Pushing to GitHub..."
git push origin master 2>/dev/null || echo "   (nothing to push)"

# SSH into VPS and deploy
echo "==> Connecting to VPS ($VPS_HOST)..."
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" bash -s "$COMPONENT" <<'REMOTE'
set -e
COMPONENT="$1"
PROJECT="buildsupply"

cd /opt/buildsupply
echo "==> Pulling latest code..."
git pull origin master

cd docker

case "$COMPONENT" in
  react|react-ui|all)
    echo "==> Building React UI..."
    docker compose -p "$PROJECT" build react-ui
    echo "==> Restarting React UI..."
    docker compose -p "$PROJECT" up -d --no-deps react-ui
    ;;
  backend|erpnext)
    echo "==> Building ERPNext backend..."
    docker compose -p "$PROJECT" build backend
    echo "==> Restarting backend services..."
    docker compose -p "$PROJECT" up -d --no-deps backend websocket queue-short queue-long scheduler
    ;;
  *)
    echo "Unknown component: $COMPONENT"
    exit 1
    ;;
esac

echo ""
echo "==> Verifying deployment..."
sleep 3

if curl -sf http://localhost:3002 > /dev/null 2>&1; then
  echo "✅ React UI is live on port 3002"
else
  echo "⚠️  React UI health check failed"
fi

if curl -sf http://localhost:8081 > /dev/null 2>&1; then
  echo "✅ ERPNext is live on port 8081"
else
  echo "⚠️  ERPNext health check skipped"
fi

echo ""
echo "━━━ Deploy Complete ━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -p "$PROJECT" ps --format "table {{.Name}}\t{{.Status}}" | head -15
REMOTE
