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

###Human: Let me stop you there. I have like 96000 tokens left in my plan this hour. Let's go ahead and commit all of the work you've done to the git repo so far so we have a safe state in case anything happens. THen you can continue afterwards