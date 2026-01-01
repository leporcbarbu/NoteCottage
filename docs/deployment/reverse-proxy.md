# Reverse Proxy Setup with HTTPS

This guide covers setting up NoteCottage behind a reverse proxy with SSL/HTTPS support. This eliminates browser "Not Secure" warnings and encrypts all traffic.

## When to Use This

- ✅ Want HTTPS encryption for local network
- ✅ Want to eliminate browser security warnings
- ✅ Need production-ready setup
- ✅ Planning to add more services later

## Overview

```
Browser (HTTPS) → nginx (port 443) → NoteCottage (port 3000)
                     ↓
                SSL Certificate
```

## SSL Certificate Options

Choose one based on your needs:

| Option | Best For | Difficulty | Cost |
|--------|----------|------------|------|
| [mkcert](#option-1-mkcert-local-ca) | LAN only, no warnings | Easy | Free |
| [Self-Signed](#option-2-self-signed-certificate) | LAN only, accept warnings | Easy | Free |
| [Let's Encrypt](#option-3-lets-encrypt) | Public domain | Medium | Free |

---

## Option 1: mkcert (Local CA)

**Best for:** LAN access with trusted certificates and no browser warnings.

### Prerequisites

- mkcert installed on your computer
  - **Windows:** `choco install mkcert` (requires [Chocolatey](https://chocolatey.org/))
  - **Mac:** `brew install mkcert`
  - **Linux:** See [mkcert installation](https://github.com/FiloSottile/mkcert#installation)

### Step 1: Install Local CA (One-Time)

On your **local computer** (not the server):

```bash
mkcert -install
```

This creates a local Certificate Authority trusted by your browser.

### Step 2: Generate Certificate

Replace `notecottage.local` with your hostname:

```bash
# If your server hostname is "allura"
mkcert allura localhost 127.0.0.1 ::1

# This creates:
# - allura+3.pem (certificate)
# - allura+3-key.pem (private key)
```

### Step 3: Copy Certificates to Server

```bash
# Create certs directory
mkdir -p certs

# Copy generated certificates
cp allura+3.pem certs/cert.pem
cp allura+3-key.pem certs/key.pem
```

### Step 4: Use nginx Example

See [examples/nginx/](../../examples/nginx/) for full configuration.

Quick start:
```bash
cd examples/nginx
# Edit nginx.conf (change server_name to your hostname)
docker-compose up -d
```

Access at: **https://allura** (or your hostname)

**Advantages:**
- ✅ No browser warnings
- ✅ Trusted certificates
- ✅ Free and easy

**Limitations:**
- Only works on devices with mkcert CA installed
- Not suitable for public internet

---

## Option 2: Self-Signed Certificate

**Best for:** Quick HTTPS setup, don't mind one-time browser warning.

### Generate Certificate

```bash
# Create certs directory
mkdir -p certs

# Generate self-signed certificate (valid 1 year)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=notecottage.local"
```

Replace in the `-subj` line:
- `CN=notecottage.local` with your hostname

### Use with nginx

See [examples/nginx/](../../examples/nginx/) and follow the same docker-compose setup.

### Accept Certificate in Browser

1. Visit https://your-hostname
2. Browser shows warning: "Your connection is not private"
3. Click "Advanced" → "Proceed to your-hostname (unsafe)"
4. Certificate is now trusted for this browser

**Advantages:**
- ✅ Quick setup
- ✅ Free
- ✅ No external dependencies

**Limitations:**
- ⚠️ Browser warning on first visit (each browser/device)
- Must manually accept certificate
- Expires in 1 year (need to regenerate)

---

## Option 3: Let's Encrypt

**Best for:** Public domain with automatic trusted certificates.

### Prerequisites

- **Public domain name** pointing to your server
- **Ports 80 and 443** open to the internet
- **Static IP** or dynamic DNS setup

### Using Certbot

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d notecottage.yourdomain.com

# Auto-renewal is set up automatically
```

### Using Docker + nginx-proxy + Let's Encrypt Companion

See [examples/nginx/docker-compose-letsencrypt.yml](../../examples/nginx/docker-compose-letsencrypt.yml) for automated setup.

**Advantages:**
- ✅ Trusted by all browsers
- ✅ Auto-renewal (90 days)
- ✅ Free
- ✅ Industry standard

**Requirements:**
- Requires public domain
- Requires internet-accessible server
- More complex setup

---

## nginx Configuration

### Basic nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name notecottage.local;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name notecottage.local;

        # SSL certificates
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Proxy settings
        location / {
            proxy_pass http://notecottage:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Full Example

See complete setup in [examples/nginx/](../../examples/nginx/) directory:
- `docker-compose.yml` - Full stack with nginx + NoteCottage
- `nginx.conf` - Production-ready nginx configuration
- `README.md` - Detailed setup instructions

---

## Alternative: Caddy (Simpler!)

Caddy automatically handles HTTPS with zero configuration.

### Caddyfile

```
notecottage.local {
    reverse_proxy notecottage:3000
    tls internal  # Automatic self-signed cert
}
```

That's it! Caddy handles everything automatically.

See [examples/caddy/](../../examples/caddy/) for full setup.

**Why Caddy?**
- Automatic HTTPS (even self-signed)
- Simpler configuration
- Automatic certificate renewal
- Built-in security headers

---

## Testing Your Setup

### 1. Check nginx is Running

```bash
docker-compose ps
```

Should show both `nginx` and `notecottage` containers.

### 2. Test HTTP Redirect

```bash
curl -I http://your-hostname
```

Should return `301` redirect to HTTPS.

### 3. Test HTTPS

```bash
curl -k https://your-hostname
```

Should return HTML content.

### 4. Check Certificate

In browser:
1. Visit https://your-hostname
2. Click padlock icon in address bar
3. View certificate details
4. Verify it's your certificate

---

## Troubleshooting

### "Connection Refused"

- Check nginx is running: `docker-compose ps`
- Check nginx logs: `docker-compose logs nginx`
- Verify NoteCottage is accessible: `curl http://localhost:3000`

### "Certificate Not Trusted"

**Self-signed certificates:**
- Expected - manually accept in browser

**mkcert certificates:**
- Run `mkcert -install` on your computer
- Restart browser

### "502 Bad Gateway"

- NoteCottage container not running
- Check: `docker-compose logs notecottage`
- Verify network: containers must be on same network

### Port Already in Use

```bash
# Check what's using port 443
sudo lsof -i :443

# or
sudo netstat -tulpn | grep :443
```

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Keep certificates updated** (automated with Let's Encrypt)
3. **Enable security headers** (included in example configs)
4. **Use strong SSL ciphers** (configured in examples)
5. **Disable HTTP** or redirect to HTTPS (shown in examples)

---

## Next Steps

- ✅ **Production Hardening:** See [Production Guide](production.md)
- ✅ **Remote Access:** See [Tailscale Guide](tailscale.md)
- ✅ **Multiple Services:** nginx can proxy many apps

## Need Help?

- Check [examples/nginx/README.md](../../examples/nginx/README.md)
- Check [examples/caddy/README.md](../../examples/caddy/README.md)
- Review nginx logs: `docker-compose logs nginx`
