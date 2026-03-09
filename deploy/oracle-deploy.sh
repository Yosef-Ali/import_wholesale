#!/usr/bin/env bash
# ============================================================
# BuildSupply Pro — Oracle Cloud Always Free Deployment
# Free tier: 4 CPU + 24 GB RAM ARM64 VM (enough for full stack)
# ============================================================
set -e

# ── CONFIG — Edit these before running ──────────────────────
VM_IP=""              # Your Oracle Cloud VM public IP
SSH_KEY="~/.ssh/id_rsa"
SSH_USER="ubuntu"     # default for Oracle Ubuntu images
APP_DIR="/opt/buildsupply"
DB_ROOT_PASSWORD="change-this-strong-password"
ADMIN_PASSWORD="change-this-admin-password"
# ────────────────────────────────────────────────────────────

if [ -z "$VM_IP" ]; then
  echo "ERROR: Set VM_IP at the top of this script first."
  exit 1
fi

echo "==> Deploying BuildSupply Pro to Oracle Cloud VM: $VM_IP"

# 1. Install Docker on Oracle Cloud VM
echo "==> [1/5] Installing Docker on VM..."
ssh -i $SSH_KEY $SSH_USER@$VM_IP "
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker.io docker-compose-plugin
  sudo usermod -aG docker $SSH_USER
  sudo systemctl enable --now docker
  echo 'Docker installed!'
"

# 2. Copy project files to VM
echo "==> [2/5] Uploading project files..."
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ssh -i $SSH_KEY $SSH_USER@$VM_IP "mkdir -p $APP_DIR"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'frontend/dist' \
  --exclude '.git' \
  --exclude 'frontend/.env.local' \
  -e "ssh -i $SSH_KEY" \
  "$REPO_ROOT/" "$SSH_USER@$VM_IP:$APP_DIR/"

# 3. Write production .env on VM
echo "==> [3/5] Writing production environment..."
ssh -i $SSH_KEY $SSH_USER@$VM_IP "
  cat > $APP_DIR/deploy/.env.prod <<EOF
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD
ADMIN_PASSWORD=$ADMIN_PASSWORD
VM_IP=$VM_IP
EOF
"

# 4. Build and start containers on VM
echo "==> [4/5] Building and starting Docker containers (takes 5-10 min first time)..."
ssh -i $SSH_KEY $SSH_USER@$VM_IP "
  cd $APP_DIR/docker
  DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD \
  ADMIN_PASSWORD=$ADMIN_PASSWORD \
  docker compose -f docker-compose.yml up -d --build
"

# 5. Wait for backend to be ready
echo "==> [5/5] Waiting for backend to be ready..."
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$VM_IP:8081/api/method/frappe.auth.get_logged_user" 2>/dev/null)
  if [ "$CODE" = "403" ] || [ "$CODE" = "200" ]; then
    echo ""
    echo "============================================================"
    echo "  BuildSupply Pro is LIVE!"
    echo "  React frontend : http://$VM_IP:3000"
    echo "  ERPNext backend: http://$VM_IP:8081"
    echo "  Login: Administrator / $ADMIN_PASSWORD"
    echo "============================================================"
    exit 0
  fi
  printf "  waiting... ($i/30)\r"
  sleep 10
done
echo "WARNING: Backend not responding yet. Check: ssh -i $SSH_KEY $SSH_USER@$VM_IP 'docker compose -f $APP_DIR/docker/docker-compose.yml ps'"
