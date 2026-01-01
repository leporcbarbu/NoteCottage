# Tailscale Deployment (Secure Remote Access)

This guide covers deploying NoteCottage with Tailscale for secure remote access via encrypted VPN tunnel.

## When to Use This

- ✅ Want to access NoteCottage from anywhere (phone, laptop, etc.)
- ✅ Don't want to expose server to public internet
- ✅ Want automatic HTTPS with trusted certificates
- ✅ Prefer simple, zero-config VPN

**Perfect for:**
- Accessing your home server while traveling
- Multi-device access (phone, tablet, laptop)
- Secure remote access without port forwarding
- Family/team access across locations

## What is Tailscale?

Tailscale creates a private network (VPN) between your devices:
- **Encrypted tunnel** - All traffic is encrypted
- **No port forwarding** - Works behind NAT/firewalls
- **Automatic HTTPS** - Free trusted SSL certificates
- **Free for personal use** - Up to 100 devices

## Architecture

```
Your Phone → Tailscale VPN → Your Server → NoteCottage
    ↓
  HTTPS (automatic trusted cert)
```

---

## Setup Guide

### Step 1: Install Tailscale on Server

**Linux:**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

**Windows:**
Download from https://tailscale.com/download/windows

**Mac:**
```bash
brew install tailscale
tailscale up
```

**Docker (Alternative):**
```yaml
services:
  tailscale:
    image: tailscale/tailscale:latest
    container_name: tailscale
    privileged: true
    network_mode: host
    volumes:
      - ./tailscale:/var/lib/tailscale
    command: tailscaled
```

### Step 2: Authenticate

After running `tailscale up`, you'll get a URL:
```
To authenticate, visit: https://login.tailscale.com/a/...
```

1. Open the URL in your browser
2. Sign in with your Tailscale account (or create one)
3. Approve the device

Your server is now on your Tailscale network!

### Step 3: Find Your Tailscale IP

```bash
tailscale ip -4
```

Example output: `100.101.102.103`

### Step 4: Deploy NoteCottage

Use the standard docker-compose setup:

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
```

```bash
docker-compose up -d
```

### Step 5: Access from Any Device

**Install Tailscale on your client devices:**
- **Phone:** Tailscale app from App Store/Play Store
- **Laptop:** Download from https://tailscale.com/download

**Connect:**
1. Open Tailscale app
2. Sign in with same account
3. All your devices can now see each other!

**Access NoteCottage:**
```
http://TAILSCALE_IP:3000
```

Example: `http://100.101.102.103:3000`

---

## Option: Tailscale HTTPS with MagicDNS

Get automatic HTTPS with trusted certificates!

### Step 1: Enable MagicDNS

1. Go to https://login.tailscale.com/admin/dns
2. Enable MagicDNS
3. Your server gets a hostname: `server-name.tail1234.ts.net`

### Step 2: Enable HTTPS

On your server:

```bash
tailscale cert server-name.tail1234.ts.net
```

This generates:
- `server-name.tail1234.ts.net.crt` (certificate)
- `server-name.tail1234.ts.net.key` (private key)

### Step 3: Configure nginx with Tailscale Certificate

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 443 ssl http2;
        server_name server-name.tail1234.ts.net;

        ssl_certificate /etc/nginx/certs/server-name.tail1234.ts.net.crt;
        ssl_certificate_key /etc/nginx/certs/server-name.tail1234.ts.net.key;

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

Update `docker-compose.yml`:

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
    networks:
      - notecottage

  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - notecottage
    networks:
      - notecottage

networks:
  notecottage:
```

### Step 4: Copy Certificates

```bash
mkdir certs
sudo cp /var/lib/tailscale/certs/server-name.tail1234.ts.net.* certs/
sudo chown $USER:$USER certs/*
```

### Step 5: Access with HTTPS

```
https://server-name.tail1234.ts.net
```

✅ Trusted certificate
✅ No browser warnings
✅ Only accessible on your Tailscale network

---

## Tailscale Funnel (Public Access)

Want to share NoteCottage publicly? Tailscale Funnel exposes your service to the internet (still with HTTPS).

⚠️ **Warning:** This makes NoteCottage publicly accessible. Ensure strong passwords!

```bash
tailscale funnel --bg --https=443 http://localhost:3000
```

Now anyone can access:
```
https://server-name.tail1234.ts.net
```

**To disable public access:**
```bash
tailscale funnel --off
```

---

## Benefits of Tailscale

### Security
- ✅ **Encrypted tunnel** - All traffic is encrypted end-to-end
- ✅ **No exposed ports** - Server doesn't need public IP
- ✅ **Access control** - Only your devices can connect
- ✅ **Trusted HTTPS** - Free Let's Encrypt certificates

### Convenience
- ✅ **Zero configuration** - Works through NAT/firewalls automatically
- ✅ **Cross-platform** - Works on all devices (phone, laptop, tablet)
- ✅ **Fast** - Direct peer-to-peer connections when possible
- ✅ **Reliable** - Falls back to relay servers if direct connection fails

### Cost
- ✅ **Free for personal use** (up to 100 devices)
- ✅ **No domain required** - Uses .ts.net domains
- ✅ **No port forwarding** - Works on any network

---

## Use Cases

### Scenario 1: Personal Remote Access
Access your home NoteCottage from anywhere:
```
You (Phone) → Tailscale → Home Server → NoteCottage
```

### Scenario 2: Family/Team Access
Share NoteCottage with family across different locations:
```
Family Member 1 → Tailscale
Family Member 2 → Tailscale  →  Your Server → NoteCottage
Family Member 3 → Tailscale
```

### Scenario 3: Multi-Device Sync
Access from all your devices:
```
Laptop  →
Phone   →  Tailscale →  NoteCottage
Tablet  →
```

---

## Comparison with Other Methods

| Feature | Tailscale | Port Forwarding + DDNS | VPN (OpenVPN) |
|---------|-----------|------------------------|---------------|
| **Setup Difficulty** | Easy | Medium | Hard |
| **Works Behind NAT** | Yes | Requires port forwarding | Requires port forwarding |
| **Automatic HTTPS** | Yes (with MagicDNS) | No (need Let's Encrypt) | No |
| **Firewall Friendly** | Yes | Need to open ports | Need to open ports |
| **Cost** | Free (personal) | Free (+ domain ~$10/yr) | Free (DIY) |
| **Security** | Encrypted tunnel | Exposed to internet | Encrypted tunnel |

---

## Troubleshooting

### Can't Connect to Tailscale

```bash
# Check Tailscale status
tailscale status

# Should show "logged in" and list of devices
```

### Can't Access NoteCottage

1. **Verify NoteCottage is running:**
   ```bash
   docker ps
   curl http://localhost:3000
   ```

2. **Check Tailscale IP:**
   ```bash
   tailscale ip -4
   ```

3. **Test from server itself:**
   ```bash
   curl http://TAILSCALE_IP:3000
   ```

### Certificate Issues

```bash
# Re-generate certificate
tailscale cert --force server-name.tail1234.ts.net

# Check certificate location
ls -la /var/lib/tailscale/certs/
```

### MagicDNS Not Working

1. Check MagicDNS is enabled: https://login.tailscale.com/admin/dns
2. Restart Tailscale:
   ```bash
   sudo systemctl restart tailscaled
   ```

---

## Performance Tips

### Enable Direct Connections

Tailscale uses direct peer-to-peer when possible for best performance:

1. Check connection type:
   ```bash
   tailscale status
   ```

2. Look for "direct" in the output (vs "relay")

### Subnet Routing (Advanced)

Expose entire subnet through Tailscale:

```bash
# On server
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Advertise subnet
tailscale up --advertise-routes=192.168.1.0/24

# Approve in Tailscale admin console
```

Now all devices on your LAN are accessible via Tailscale!

---

## Next Steps

- ✅ **Install Tailscale on all devices** for seamless access
- ✅ **Enable MagicDNS** for easy-to-remember hostnames
- ✅ **Add HTTPS** with Tailscale certificates
- ✅ **Invite family/team** to your Tailscale network

## Resources

- **Tailscale Documentation:** https://tailscale.com/kb/
- **MagicDNS Guide:** https://tailscale.com/kb/1081/magicdns/
- **Tailscale Cert:** https://tailscale.com/kb/1153/enabling-https/
- **Funnel Guide:** https://tailscale.com/kb/1223/tailscale-funnel/
