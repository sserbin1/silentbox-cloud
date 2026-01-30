#!/bin/bash
# Silentbox Cloud - Deployment Script
# Server: 49.12.104.181

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Configuration
APP_DIR="/var/www/silentbox-cloud"
BACKUP_DIR="/var/backups/silentbox"
LOG_DIR="/var/log/silentbox"

log "Starting Silentbox Cloud deployment..."

# Create directories if they don't exist
log "Creating directories..."
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR

# Navigate to app directory
cd $APP_DIR || error "App directory not found: $APP_DIR"

# Backup current deployment
if [ -d ".next" ] || [ -d "apps/api/dist" ]; then
    log "Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    cp -r apps/api/dist "$BACKUP_DIR/$BACKUP_NAME/api-dist" 2>/dev/null || true
    cp -r apps/admin/.next "$BACKUP_DIR/$BACKUP_NAME/admin-next" 2>/dev/null || true
    cp -r apps/booking/.next "$BACKUP_DIR/$BACKUP_NAME/booking-next" 2>/dev/null || true
fi

# Pull latest code
log "Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile

# Build applications
log "Building applications..."
pnpm build

# Reload PM2 processes (zero-downtime)
log "Reloading PM2 processes..."
pm2 reload ecosystem.config.js --env production

# Wait for processes to be ready
sleep 5

# Verify processes are running
log "Verifying processes..."
pm2 list

# Health check
log "Running health checks..."
for i in {1..5}; do
    if curl -sf http://localhost:3001/health > /dev/null; then
        log "API health check passed"
        break
    fi
    if [ $i -eq 5 ]; then
        warn "API health check failed after 5 attempts"
    fi
    sleep 2
done

# Clean up old backups (keep last 5)
log "Cleaning up old backups..."
cd $BACKUP_DIR
ls -dt */ | tail -n +6 | xargs rm -rf 2>/dev/null || true

log "Deployment completed successfully!"
echo ""
echo "Services:"
echo "  - API:     http://localhost:3001 -> https://api.silent-box.com"
echo "  - Admin:   http://localhost:3002 -> https://admin.silent-box.com"
echo "  - Booking: http://localhost:3003 -> https://cloud.silent-box.com"
echo ""
pm2 status
