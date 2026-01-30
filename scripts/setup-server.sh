#!/bin/bash
# Silentbox Cloud - Server Setup Script
# Run this ONCE on a fresh server
# Server: 49.12.104.181

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup-server.sh)"
    exit 1
fi

log "Starting Silentbox Cloud server setup..."

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# Install Node.js 20
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
log "Installing pnpm..."
npm install -g pnpm

# Install PM2
log "Installing PM2..."
npm install -g pm2

# Create app user (optional, for security)
# useradd -m -s /bin/bash silentbox

# Create directories
log "Creating directories..."
mkdir -p /var/www/silentbox-cloud
mkdir -p /var/log/silentbox
mkdir -p /var/backups/silentbox
mkdir -p /var/www/certbot

# Set permissions
chown -R $USER:$USER /var/www/silentbox-cloud
chown -R $USER:$USER /var/log/silentbox
chown -R $USER:$USER /var/backups/silentbox

# Clone repository (replace with your repo)
log "Cloning repository..."
cd /var/www
if [ ! -d "silentbox-cloud/.git" ]; then
    git clone https://github.com/sergiorbk/silentbox-cloud.git
fi
cd silentbox-cloud

# Install dependencies
log "Installing dependencies..."
pnpm install

# Build applications
log "Building applications..."
pnpm build

# Copy nginx configuration
log "Configuring Nginx..."
cp nginx/silentbox.conf /etc/nginx/sites-available/silentbox
ln -sf /etc/nginx/sites-available/silentbox /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Setup SSL certificates with Let's Encrypt
log "Setting up SSL certificates..."
warn "Make sure DNS records point to this server before running certbot!"
echo ""
echo "Run this command after DNS is configured:"
echo "  certbot --nginx -d silent-box.com -d cloud.silent-box.com -d admin.silent-box.com -d api.silent-box.com"
echo ""

# Start nginx
systemctl restart nginx
systemctl enable nginx

# Start PM2 processes
log "Starting PM2 processes..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup

# Setup firewall
log "Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# Print status
log "Server setup completed!"
echo ""
echo "=== Next Steps ==="
echo "1. Configure DNS records:"
echo "   - cloud.silent-box.com  -> 49.12.104.181"
echo "   - admin.silent-box.com  -> 49.12.104.181"
echo "   - api.silent-box.com    -> 49.12.104.181"
echo ""
echo "2. Run SSL setup:"
echo "   certbot --nginx -d silent-box.com -d cloud.silent-box.com -d admin.silent-box.com -d api.silent-box.com"
echo ""
echo "3. Create .env files in /var/www/silentbox-cloud/apps/{api,admin,booking}/"
echo ""
echo "4. Restart PM2:"
echo "   pm2 reload ecosystem.config.js --env production"
echo ""
pm2 status
