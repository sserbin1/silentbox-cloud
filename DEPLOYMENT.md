# Silentbox Cloud - Deployment Guide

## Server Information

| Property | Value |
|----------|-------|
| Server IP | 49.12.104.181 |
| Provider | Hetzner |
| OS | Ubuntu 22.04 LTS |
| Domain | silent-box.com |

## Subdomains

| Subdomain | App | Port |
|-----------|-----|------|
| cloud.silent-box.com | Booking PWA | 3003 |
| admin.silent-box.com | Admin Dashboard | 3002 |
| api.silent-box.com | Fastify API | 3001 |

---

## Quick Deployment

### If server is already configured:

```bash
ssh root@49.12.104.181
cd /var/www/silentbox-cloud
./scripts/deploy.sh
```

---

## First-Time Setup

### Step 1: DNS Configuration

Add A records in your domain registrar:

```
cloud.silent-box.com  → 49.12.104.181
admin.silent-box.com  → 49.12.104.181
api.silent-box.com    → 49.12.104.181
```

### Step 2: SSH to Server

```bash
ssh root@49.12.104.181
```

### Step 3: Run Setup Script

```bash
# Clone repo first
cd /var/www
git clone https://github.com/sergiorbk/silentbox-cloud.git
cd silentbox-cloud

# Run setup (installs Node.js, pnpm, PM2, Nginx)
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

### Step 4: Create Environment Files

```bash
# API environment
cp .env.production.example apps/api/.env
nano apps/api/.env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          DATABASE_URL, JWT_SECRET

# Admin environment
cp .env.production.example apps/admin/.env.local
nano apps/admin/.env.local
# Add: NEXT_PUBLIC_API_URL=https://api.silent-box.com
#      NEXT_PUBLIC_SUPABASE_URL=https://ggwdzqcchusaakdpwgzz.supabase.co
#      NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>

# Booking environment
cp .env.production.example apps/booking/.env.local
nano apps/booking/.env.local
# Add: NEXT_PUBLIC_API_URL=https://api.silent-box.com
#      NEXT_PUBLIC_SUPABASE_URL=https://ggwdzqcchusaakdpwgzz.supabase.co
#      NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
#      NEXT_PUBLIC_GOOGLE_MAPS_KEY=<key>
```

### Step 5: Build and Start

```bash
pnpm install
pnpm build
pm2 start ecosystem.config.js --env production
pm2 save
```

### Step 6: SSL Certificates

```bash
# Make sure DNS is propagated first (check with: dig cloud.silent-box.com)
certbot --nginx -d cloud.silent-box.com -d admin.silent-box.com -d api.silent-box.com
```

---

## Useful Commands

### PM2

```bash
pm2 status                    # Check status
pm2 logs                      # View all logs
pm2 logs silentbox-api        # View API logs
pm2 restart all               # Restart all apps
pm2 reload ecosystem.config.js --env production  # Zero-downtime reload
```

### Nginx

```bash
nginx -t                      # Test config
systemctl restart nginx       # Restart nginx
tail -f /var/log/nginx/error.log  # View errors
```

### Logs

```bash
tail -f /var/log/silentbox/api-out.log      # API stdout
tail -f /var/log/silentbox/api-error.log    # API errors
tail -f /var/log/silentbox/admin-out.log    # Admin stdout
tail -f /var/log/silentbox/booking-out.log  # Booking stdout
```

---

## Rollback

If something goes wrong:

```bash
# Restore from backup
cd /var/www/silentbox-cloud
cp -r /var/backups/silentbox/backup-YYYYMMDD-HHMMSS/* .
pnpm install
pnpm build
pm2 reload ecosystem.config.js --env production
```

---

## Security Checklist

- [ ] SSH key authentication (disable password login)
- [ ] Firewall configured (UFW)
- [ ] SSL certificates installed
- [ ] Production JWT_SECRET is unique and strong
- [ ] Database credentials are not committed
- [ ] CORS configured for your domains only

---

## Monitoring

### Health Checks

```bash
curl https://api.silent-box.com/health
curl https://admin.silent-box.com
curl https://cloud.silent-box.com
```

### Server Resources

```bash
htop                    # CPU/Memory
df -h                   # Disk space
pm2 monit               # PM2 dashboard
```
