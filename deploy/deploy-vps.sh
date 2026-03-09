#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# BuildSupply Pro — VPS Deploy Script
# Usage:  ./deploy/deploy-vps.sh          (deploy all)
#         ./deploy/deploy-vps.sh react    (react-ui only)
#         ./deploy/deploy-vps.sh backend  (ERPNext only)
# ─────────────────────────────────────────────────────────
set -euo pipefail

PROJECT="buildsupply"
COMPOSE_DIR="/opt/buildsupply/docker"
COMPONENT="${1:-all}"

cd /opt/buildsupply

echo "━━━ BuildSupply Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Component: $COMPONENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Pull latest code
echo ""
echo "==> Pulling latest code..."
git pull origin master

# 2. Build & restart
cd "$COMPOSE_DIR"

case "$COMPONENT" in
  react|react-ui|frontend-ui)
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
  all)
    echo "==> Building all images..."
    docker compose -p "$PROJECT" build react-ui
    echo "==> Restarting React UI..."
    docker compose -p "$PROJECT" up -d --no-deps react-ui
    ;;
  *)
    echo "Unknown component: $COMPONENT"
    echo "Usage: $0 [react|backend|all]"
    exit 1
    ;;
esac

# 3. Health check
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
  echo "⚠️  ERPNext health check skipped or unavailable"
fi

echo ""
echo "━━━ Deploy Complete ━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -p "$PROJECT" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | head -15
