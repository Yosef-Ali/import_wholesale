#!/usr/bin/env bash
# ============================================================
# BuildSupply Pro — Hostinger VPS Deployment
# VPS: 72.62.170.70 (Ubuntu)
# Stack: ERPNext :8081  |  React UI :3002  |  Hospital app :80 (untouched)
# ============================================================
set -e

# ── CONFIG ──────────────────────────────────────────────────
VM_IP="72.62.170.70"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
SSH_USER="${SSH_USER:-root}"          # Hostinger VPS typically uses root
APP_DIR="/opt/buildsupply"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-change-this-strong-password}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
# ────────────────────────────────────────────────────────────

echo "==> Deploying BuildSupply Pro to Hostinger VPS: $VM_IP"

# 1. Ensure Docker is installed on VPS
echo "==> [1/5] Checking Docker on VPS..."
ssh -i "$SSH_KEY" "$SSH_USER@$VM_IP" "
  if ! command -v docker &>/dev/null; then
    echo 'Installing Docker...'
    apt-get update -qq
    apt-get install -y -qq docker.io docker-compose-plugin
    systemctl enable --now docker
    echo 'Docker installed!'
  else
    echo 'Docker already installed.'
  fi
"

# 2. Upload project files (excludes local build artifacts and secrets)
echo "==> [2/5] Uploading project files..."
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ssh -i "$SSH_KEY" "$SSH_USER@$VM_IP" "mkdir -p $APP_DIR"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'frontend/dist' \
  --exclude '.git' \
  --exclude 'frontend/.env.local' \
  --exclude 'deploy/.env.prod' \
  -e "ssh -i $SSH_KEY" \
  "$REPO_ROOT/" "$SSH_USER@$VM_IP:$APP_DIR/"

# 3. Write production .env on VPS
echo "==> [3/5] Writing production environment..."
ssh -i "$SSH_KEY" "$SSH_USER@$VM_IP" "
  cat > $APP_DIR/frontend/.env.production <<EOF
VITE_GEMINI_API_KEY=\${VITE_GEMINI_API_KEY:-}
VITE_MOCK_MODE=false
# React UI is on :3002, ERPNext desk is on :8081
VITE_ERPNEXT_URL=http://$VM_IP:8081
EOF
  echo 'Production env written.'
"

# 4. Build and start containers on VPS
echo "==> [4/5] Building and starting Docker containers..."
ssh -i "$SSH_KEY" "$SSH_USER@$VM_IP" "
  cd $APP_DIR/docker
  DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD \
  ADMIN_PASSWORD=$ADMIN_PASSWORD \
  docker compose -f docker-compose.yml up -d --build
"

# 5. Health-check
echo "==> [5/5] Waiting for services to be ready..."
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$VM_IP:8081/api/method/frappe.auth.get_logged_user" 2>/dev/null || true)
  if [ "$CODE" = "403" ] || [ "$CODE" = "200" ]; then
    echo ""
    echo "============================================================"
    echo "  BuildSupply Pro is LIVE on Hostinger VPS!"
    echo "  React UI   : http://$VM_IP:3002"
    echo "  ERPNext    : http://$VM_IP:8081"
    echo "  Login      : Administrator / $ADMIN_PASSWORD"
    echo "  Hospital   : http://$VM_IP (port 80 — untouched)"
    echo "============================================================"
    exit 0
  fi
  printf "  waiting... (%d/30)\r" "$i"
  sleep 10
done
echo ""
echo "WARNING: Backend not responding yet."
echo "Check: ssh -i $SSH_KEY $SSH_USER@$VM_IP 'docker compose -f $APP_DIR/docker/docker-compose.yml ps'"
