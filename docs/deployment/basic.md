# Basic Deployment (LAN Only)

This guide covers the simplest way to deploy NoteCottage for local network (LAN) access without SSL/HTTPS.

## When to Use This

- ✅ Accessing NoteCottage only from your local network
- ✅ Quick setup for testing or personal use
- ✅ Don't mind browser "Not Secure" warnings

**Not suitable for:**
- ❌ Public internet access
- ❌ Accessing from outside your network
- ❌ Production/business use

## Prerequisites

- Docker and Docker Compose installed
- Local network access to your server

## Installation

### 1. Create Directory

```bash
mkdir notecottage
cd notecottage
```

### 2. Download docker-compose.yml

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  notecottage:
    image: leporcbarbu/notecottage:latest
    container_name: notecottage
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - PORT=3000
      - DATABASE_PATH=/app/data/notecottage.db
```

### 3. Set Directory Permissions

```bash
# Linux/Mac
mkdir -p data uploads
chmod 777 data uploads

# Windows
mkdir data uploads
# No permission changes needed
```

### 4. Start NoteCottage

```bash
docker-compose up -d
```

### 5. Check Status

```bash
docker-compose logs -f
```

You should see:
```
NoteCottage server running on http://localhost:3000
Database: SQLite (notecottage.db)
```

### 6. Access NoteCottage

Open your browser and navigate to:
- **From same machine:** http://localhost:3000
- **From local network:** http://YOUR_SERVER_IP:3000

Replace `YOUR_SERVER_IP` with your server's IP address (e.g., `192.168.1.100`)

## First-Time Setup

1. You'll be redirected to the login page
2. Create your admin account:
   - Username: Choose your username
   - Email: Your email address
   - Password: Minimum 8 characters
3. Click "Create Account"
4. You're now logged in!

## Browser Security Warning

When accessing via HTTP, browsers will show a "Not Secure" warning in the address bar. This is expected for HTTP connections.

**This is safe for local network use**, but if this bothers you or you need remote access, see:
- [Reverse Proxy Setup](reverse-proxy.md) - Add HTTPS with nginx
- [Tailscale Setup](tailscale.md) - Secure remote access

## Managing NoteCottage

### Stop the Container

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

### Update to Latest Version

```bash
docker-compose pull
docker-compose up -d
```

### Backup Your Data

```bash
# Stop the container first
docker-compose down

# Backup data directory
tar -czf notecottage-backup-$(date +%Y%m%d).tar.gz data/ uploads/

# Restart
docker-compose up -d
```

Or use the built-in backup feature in the Admin Panel → Backup & Restore tab.

## Troubleshooting

### Can't Access from Other Devices

1. **Check firewall:** Port 3000 must be open
   ```bash
   # Linux: Allow port 3000
   sudo ufw allow 3000
   ```

2. **Check Docker is running:**
   ```bash
   docker ps
   ```
   Should show `notecottage` container

3. **Check server IP:**
   ```bash
   # Linux/Mac
   ip addr show
   # or
   ifconfig

   # Windows
   ipconfig
   ```

### Permission Errors

If you see "Permission denied" errors in logs:

```bash
chmod 777 data uploads
```

### Container Won't Start

Check logs for errors:
```bash
docker-compose logs
```

Common issues:
- Port 3000 already in use (change port in docker-compose.yml)
- Insufficient disk space
- Docker not running

## Next Steps

- ✅ **Add HTTPS:** See [Reverse Proxy Guide](reverse-proxy.md)
- ✅ **Remote Access:** See [Tailscale Guide](tailscale.md)
- ✅ **Production Setup:** See [Production Guide](production.md)
- ✅ **Configure Settings:** Visit Admin Panel after logging in
