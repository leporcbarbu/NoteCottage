# Production Deployment Guide

This guide covers deploying NoteCottage in a production environment with all security best practices, automatic SSL certificates, monitoring, and backups.

## When to Use This

- ✅ Deploying for business or team use
- ✅ Need public internet access
- ✅ Require high availability and security
- ✅ Want automatic backups and monitoring

## Architecture

```
Internet
   ↓
Firewall (ports 80, 443)
   ↓
nginx (SSL termination, rate limiting, caching)
   ↓
NoteCottage (Docker container)
   ↓
SQLite Database (persistent volume)
```

---

## Prerequisites

### Server Requirements

- **OS:** Linux (Ubuntu 22.04 LTS recommended)
- **RAM:** 1GB minimum, 2GB recommended
- **Disk:** 10GB minimum (more for notes/images)
- **CPU:** 1 core minimum
- **Network:** Static IP or dynamic DNS

### Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install certbot (for Let's Encrypt)
sudo apt install certbot python3-certbot-nginx

# Install monitoring tools
sudo apt install htop iotop nethogs
```

### Domain Setup

1. **Purchase domain** (e.g., notecottage.yourdomain.com)
2. **Point A record** to your server's public IP:
   ```
   notecottage.yourdomain.com → 203.0.113.45
   ```
3. **Wait for DNS propagation** (5-30 minutes):
   ```bash
   nslookup notecottage.yourdomain.com
   ```

---

## Step 1: Server Hardening

### Firewall Configuration

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### SSH Security

```bash
# Create new sudo user (don't use root)
sudo adduser notecottage
sudo usermod -aG sudo notecottage
sudo usermod -aG docker notecottage

# Disable root SSH login
sudo nano /etc/ssh/sshd_config
```

Edit these lines:
```
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

### Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Step 2: Directory Structure

```bash
# Create application directory
mkdir -p ~/notecottage
cd ~/notecottage

# Create subdirectories
mkdir -p data uploads nginx/conf nginx/ssl backups logs
```

Directory structure:
```
~/notecottage/
├── data/              # SQLite database
├── uploads/           # User-uploaded images
├── nginx/
│   ├── conf/         # nginx configuration
│   └── ssl/          # SSL certificates
├── backups/          # Database backups
├── logs/             # Application logs
└── docker-compose.yml
```

---

## Step 3: SSL Certificate (Let's Encrypt)

### Option A: Using Certbot (Recommended)

```bash
# Stop any running web servers
sudo systemctl stop nginx 2>/dev/null || true

# Generate certificate
sudo certbot certonly --standalone \
  -d notecottage.yourdomain.com \
  --agree-tos \
  --email your-email@example.com

# Certificates saved to:
# /etc/letsencrypt/live/notecottage.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/notecottage.yourdomain.com/privkey.pem

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/notecottage.yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/notecottage.yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Option B: Using Docker with nginx-proxy

See [examples/nginx/docker-compose-letsencrypt.yml](../../examples/nginx/docker-compose-letsencrypt.yml) for automated setup.

---

## Step 4: nginx Configuration

Create `nginx/conf/nginx.conf`:

```nginx
# nginx Production Configuration for NoteCottage

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;  # Allow larger file uploads

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=general:10m rate=60r/m;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        listen [::]:80;
        server_name notecottage.yourdomain.com;

        # Allow Let's Encrypt verification
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name notecottage.yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # SSL configuration (Mozilla Modern)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;

        # OCSP stapling
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

        # Rate limiting for auth endpoints
        location /api/auth/ {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://notecottage:3000;
            include /etc/nginx/proxy_params;
        }

        # Rate limiting for API endpoints
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://notecottage:3000;
            include /etc/nginx/proxy_params;
        }

        # General rate limiting
        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://notecottage:3000;
            include /etc/nginx/proxy_params;
        }
    }
}
```

Create `nginx/conf/proxy_params`:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;

proxy_buffering off;
proxy_request_buffering off;
proxy_http_version 1.1;
proxy_intercept_errors off;
```

---

## Step 5: Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  notecottage:
    image: leporcbarbu/notecottage:latest
    container_name: notecottage
    restart: unless-stopped
    expose:
      - "3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    environment:
      - PORT=3000
      - DATABASE_PATH=/app/data/notecottage.db
      - SECURE_COOKIES=true
      - NODE_ENV=production
    networks:
      - notecottage
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf/proxy_params:/etc/nginx/proxy_params:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - notecottage
    networks:
      - notecottage
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  notecottage:
    driver: bridge
```

---

## Step 6: Launch Application

```bash
# Set permissions
chmod 777 data uploads

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Test the deployment:
```bash
# Test HTTP redirect
curl -I http://notecottage.yourdomain.com

# Test HTTPS
curl -I https://notecottage.yourdomain.com
```

---

## Step 7: Automated Backups

### Database Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# NoteCottage Backup Script

BACKUP_DIR="/home/notecottage/notecottage/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Stop container for consistent backup
cd /home/notecottage/notecottage
docker-compose stop notecottage

# Backup database and uploads
tar -czf "$BACKUP_DIR/notecottage-$DATE.tar.gz" data/ uploads/

# Restart container
docker-compose start notecottage

# Remove backups older than retention period
find "$BACKUP_DIR" -name "notecottage-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "$(date): Backup completed - notecottage-$DATE.tar.gz" >> "$BACKUP_DIR/backup.log"

# Optional: Upload to remote storage (S3, rsync, etc.)
# aws s3 cp "$BACKUP_DIR/notecottage-$DATE.tar.gz" s3://your-bucket/backups/
```

Make executable:
```bash
chmod +x backup.sh
```

### Automated Backup with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/notecottage/notecottage/backup.sh
```

### Alternative: Database Backup via Admin Panel

Use the built-in backup feature:
1. Login as admin
2. Go to Admin Panel → Backup & Restore
3. Click "Download Backup"

---

## Step 8: Monitoring

### System Monitoring with htop

```bash
# Install htop
sudo apt install htop

# Monitor system resources
htop
```

### Docker Container Monitoring

```bash
# Container stats
docker stats

# Logs
docker-compose logs -f --tail=100

# Check health
docker ps
```

### nginx Access Logs

```bash
# Monitor nginx access logs
tail -f logs/nginx/access.log

# Monitor error logs
tail -f logs/nginx/error.log

# Analyze traffic
cat logs/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -20
```

### Log Rotation

Create `/etc/logrotate.d/notecottage`:

```
/home/notecottage/notecottage/logs/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        docker exec nginx nginx -s reload > /dev/null 2>&1
    endscript
}
```

### Optional: Uptime Monitoring

Use external services:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com
- **StatusCake** (free tier): https://www.statuscake.com

---

## Step 9: Performance Optimization

### nginx Caching

Add to nginx.conf inside `http {}` block:

```nginx
# Cache settings
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=notecottage_cache:10m max_size=1g inactive=60m use_temp_path=off;

# In server block, add:
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    proxy_pass http://notecottage:3000;
    proxy_cache notecottage_cache;
    proxy_cache_valid 200 1h;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    add_header X-Cache-Status $upstream_cache_status;
    expires 1h;
}
```

### Database Optimization

SQLite is already optimized by NoteCottage with:
- WAL (Write-Ahead Logging) mode
- Proper indexing on foreign keys
- FTS5 for full-text search

For very large databases (>10,000 notes):
```bash
# Run VACUUM monthly to reclaim space
sqlite3 data/notecottage.db "VACUUM;"
```

### Container Resource Limits

Add to docker-compose.yml under `notecottage` service:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

---

## Step 10: Security Hardening

### Fail2Ban (Prevent Brute Force)

```bash
# Install fail2ban
sudo apt install fail2ban

# Create nginx jail
sudo nano /etc/fail2ban/jail.d/nginx.conf
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /home/notecottage/notecottage/logs/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status nginx-limit-req
```

### Regular Security Updates

```bash
# Update system packages monthly
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd ~/notecottage
docker-compose pull
docker-compose up -d

# Check for vulnerabilities
docker scan leporcbarbu/notecottage:latest
```

### Backup Verification

Test backups monthly:
```bash
# Extract backup to test directory
mkdir -p /tmp/backup-test
tar -xzf backups/notecottage-YYYYMMDD_HHMMSS.tar.gz -C /tmp/backup-test

# Verify database integrity
sqlite3 /tmp/backup-test/data/notecottage.db "PRAGMA integrity_check;"

# Clean up
rm -rf /tmp/backup-test
```

---

## Disaster Recovery

### Recovery from Backup

```bash
# Stop services
docker-compose down

# Restore from backup
tar -xzf backups/notecottage-YYYYMMDD_HHMMSS.tar.gz

# Restart services
docker-compose up -d
```

### Database Corruption Recovery

If database is corrupted:

```bash
# Stop container
docker-compose stop notecottage

# Try SQLite recovery
sqlite3 data/notecottage.db ".recover" | sqlite3 data/notecottage-recovered.db

# Backup corrupted database
mv data/notecottage.db data/notecottage-corrupted.db

# Use recovered database
mv data/notecottage-recovered.db data/notecottage.db

# Restart
docker-compose start notecottage
```

Or use the built-in repair script:
```bash
docker exec -it notecottage node fix-database.js
```

---

## Maintenance Checklist

### Daily
- [ ] Check container health: `docker ps`
- [ ] Review error logs: `docker-compose logs --tail=50 notecottage`

### Weekly
- [ ] Check disk space: `df -h`
- [ ] Review nginx logs for suspicious activity
- [ ] Verify backups are running: `ls -lh backups/`

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Update Docker images: `docker-compose pull && docker-compose up -d`
- [ ] Test backup restoration
- [ ] Run database VACUUM: `sqlite3 data/notecottage.db "VACUUM;"`
- [ ] Review user accounts in Admin Panel
- [ ] Check SSL certificate expiration: `sudo certbot certificates`

### Quarterly
- [ ] Review and update nginx configuration
- [ ] Audit user access and permissions
- [ ] Review fail2ban logs
- [ ] Performance testing and optimization

---

## Troubleshooting

### High CPU Usage

```bash
# Check container stats
docker stats

# Check nginx processes
docker exec nginx top

# Review slow queries (if any)
docker-compose logs notecottage | grep "slow"
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart containers if needed
docker-compose restart
```

### SSL Certificate Issues

```bash
# Test SSL configuration
openssl s_client -connect notecottage.yourdomain.com:443

# Renew certificate manually
sudo certbot renew --force-renewal

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/notecottage.yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/notecottage.yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*

# Reload nginx
docker-compose restart nginx
```

### Database Lock Errors

```bash
# Check for long-running queries
docker-compose logs notecottage | grep "database is locked"

# Restart container
docker-compose restart notecottage
```

---

## Scaling Considerations

### Horizontal Scaling (Not Currently Supported)

NoteCottage uses SQLite, which doesn't support multiple concurrent writers. For horizontal scaling:

**Future Options:**
- Migrate to PostgreSQL/MySQL
- Implement read replicas
- Use connection pooling

**Current Best Practice:**
- Vertical scaling (increase RAM/CPU)
- Optimize nginx caching
- Use CDN for static assets

### Database Migration (If Needed)

For >100,000 notes or >20 concurrent users, consider PostgreSQL:
1. Export all notes to JSON via API
2. Set up PostgreSQL database
3. Modify database.js to use PostgreSQL driver
4. Import notes from JSON

---

## Cost Estimation

### Cloud Provider Pricing (Monthly)

| Provider | Instance | RAM | Disk | Cost |
|----------|----------|-----|------|------|
| **DigitalOcean** | Droplet | 1GB | 25GB | $6 |
| **Linode** | Nanode | 1GB | 25GB | $5 |
| **AWS** | t2.micro | 1GB | 8GB | $8.50 |
| **Vultr** | Cloud Compute | 1GB | 25GB | $6 |
| **Hetzner** | CX11 | 2GB | 20GB | €4.15 |

**Plus:**
- Domain: ~$10-15/year
- SSL: Free (Let's Encrypt)
- Backups: Included or +$1-2/month

**Total: ~$5-10/month**

### On-Premises (Home Server)

- **Hardware:** Raspberry Pi 4 ($50-75) or old laptop (free)
- **Power:** ~$1-3/month
- **Domain:** $10-15/year (optional)
- **SSL:** Free (Let's Encrypt or mkcert)

**Total: ~$1-3/month (after initial hardware)**

---

## Support & Resources

- **NoteCottage GitHub:** https://github.com/leporcbarbu/NoteCottage
- **Docker Hub:** https://hub.docker.com/r/leporcbarbu/notecottage
- **Issues:** https://github.com/leporcbarbu/NoteCottage/issues

---

## Summary

You now have:
- ✅ Production-ready NoteCottage deployment
- ✅ HTTPS with Let's Encrypt SSL
- ✅ nginx reverse proxy with rate limiting
- ✅ Automated daily backups
- ✅ Security hardening (firewall, fail2ban, SSL)
- ✅ Monitoring and logging
- ✅ Disaster recovery procedures

**Next Steps:**
- Configure user accounts in Admin Panel
- Set up external monitoring (UptimeRobot)
- Document your specific configuration
- Test disaster recovery procedures
- Schedule monthly maintenance
