# Docker Hub Distribution Guide for NoteCottage

This guide explains how to distribute NoteCottage via Docker Hub for easy installation by end users.

**Docker Hub Username:** leporcbarbu
**Repository:** leporcbarbu/notecottage

## What is Docker Hub?

Docker Hub is like GitHub, but for Docker images. It's the default registry where Docker pulls images from (like when you use `FROM node:20-alpine` in your Dockerfile - that comes from Docker Hub).

## How It Works

**Publishing workflow:**
1. You build your image locally
2. Tag it with your Docker Hub username
3. Push it to Docker Hub
4. Anyone can pull and run it with a single command

**User workflow:**
```bash
# Instead of building locally, users just run:
docker pull leporcbarbu/notecottage:latest
docker run -d -p 3000:3000 -v ./data:/app/data leporcbarbu/notecottage
```

Or with docker-compose, they'd just reference your image instead of building.

---

## Step-by-Step Setup Guide

### 1. Create Docker Hub Account
- Go to https://hub.docker.com
- Sign up (free tier includes unlimited public repos, 1 private repo)
- Note your username (e.g., `joshd` or whatever you choose)

### 2. Login from CLI
```bash
docker login
# Enter username and password when prompted
# Credentials are stored in ~/.docker/config.json
```

### 3. Build Your Image
```bash
# Make sure you're in the NoteCottage directory
docker-compose build

# Or build directly:
docker build -t notecottage:latest .
```

### 4. Tag Your Image
```bash
# Replace 'leporcbarbu' with your actual Docker Hub username
# Format: docker tag <local-image> <username>/<repo-name>:<tag>

docker tag notecottage:latest leporcbarbu/notecottage:latest

# You can add version tags too:
docker tag notecottage:latest leporcbarbu/notecottage:v1.0.0
docker tag notecottage:latest leporcbarbu/notecottage:1.0
```

### 5. Push to Docker Hub
```bash
docker push leporcbarbu/notecottage:latest
docker push leporcbarbu/notecottage:v1.0.0
docker push leporcbarbu/notecottage:1.0

# This uploads your image layers to Docker Hub
# First push takes a while, subsequent pushes only upload changed layers
```

### 6. Add Description on Docker Hub
- Go to https://hub.docker.com/r/leporcbarbu/notecottage
- Click "Edit" to update repository details
- Add short description (one-liner shown in search results)
- Edit the README with usage instructions (see template below)

---

## Recommended Tagging Strategy

**Always push these three tags:**

```bash
docker tag notecottage:latest leporcbarbu/notecottage:latest
docker tag notecottage:latest leporcbarbu/notecottage:1.0.0
docker tag notecottage:latest leporcbarbu/notecottage:1.0

docker push leporcbarbu/notecottage:latest  # Always latest version
docker push leporcbarbu/notecottage:1.0.0   # Specific patch version
docker push leporcbarbu/notecottage:1.0     # Minor version (auto-updates with patches)
```

**Why multiple tags?**
- `latest` - Users who want cutting edge (auto-updates when you push)
- `1.0.0` - Users who want stability (pinned to exact version)
- `1.0` - Users who want bug fixes but not breaking changes

**Version numbering:**
- `1.0.0` → `1.0.1` - Bug fix (update the `1.0` tag)
- `1.0.0` → `1.1.0` - New features (create new `1.1` tag, keep `1.0`)
- `1.0.0` → `2.0.0` - Breaking changes (create new `2.0` tag)

---

## Docker Hub README Template

Copy this to your Docker Hub repository description:

````markdown
# NoteCottage

A self-hosted, multi-user note-taking application with Markdown support, wiki-links, tags, and image attachments. Built with Node.js and SQLite.

## Features

- **Multi-user authentication** with private and shared folders
- **Markdown editor** with live preview
- **Wiki-style [[links]]** between notes with autocomplete
- **Full-text search** across all notes
- **Image support** - Upload files or link external URLs
- **Tags and backlinks** for knowledge organization
- **Four beautiful themes** (Light, Dark, Cottage, Cottage Dark)
- **Recycle bin** with restore capability
- **Docker-ready** with data persistence
- **Export** notes to Markdown, HTML, or PDF

## Quick Start

### Option 1: Docker Run (Simplest)

```bash
# Create directories for data persistence with proper permissions
mkdir -p data uploads
chmod 777 data uploads

# Run NoteCottage
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e NODE_ENV=production \
  --name notecottage \
  --restart unless-stopped \
  leporcbarbu/notecottage:latest

# Access at http://localhost:3000
```

### Option 2: Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
services:
  notecottage:
    container_name: notecottage
    image: leporcbarbu/notecottage:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/app/data/notecottage.db
      # Uncomment when using HTTPS (e.g., behind nginx with SSL)
      # - SECURE_COOKIES=true
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Then run:

```bash
# Create directories with proper permissions
mkdir -p data uploads
chmod 777 data uploads

# Start the container
docker-compose up -d
```

## First-Time Setup

1. Access http://localhost:3000
2. Create your admin account (first user becomes admin)
3. Start taking notes!

## Data Persistence

Your notes and images are stored in the mounted volumes:
- `./data/` - SQLite database
- `./uploads/` - Uploaded images

**Backup:** Simply copy these directories to backup your data.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Port to run server on |
| `DATABASE_PATH` | `/app/data/notecottage.db` | SQLite database location |
| `SECURE_COOKIES` | `false` | Set to `true` only when using HTTPS (e.g., behind nginx with SSL) |

## Updating

```bash
# Pull latest image
docker pull leporcbarbu/notecottage:latest

# Restart container (with docker-compose)
docker-compose down
docker-compose up -d

# Or restart directly
docker stop notecottage
docker rm notecottage
# Then run the docker run command again
```

## Tags

- `latest` - Always the newest version
- `1.0`, `1.0.0` - Stable releases
- Specific versions available for pinning

## Documentation

- **Source Code:** https://github.com/leporcbarbu/NoteCottage
- **Issues:** https://github.com/leporcbarbu/NoteCottage/issues
- **Full Documentation:** See PROJECT_STATUS.md in repository

## License

[Add your license here - MIT, GPL, etc.]

## Support

For issues, questions, or feature requests, please visit the GitHub repository.
````

---

## Docker Compose for End Users

Create a `docker-compose.yml` file for users (without the build section):

```yaml
# docker-compose.yml
# NoteCottage - Docker Compose configuration for end users

services:
  notecottage:
    container_name: notecottage

    # Pull from Docker Hub instead of building locally
    image: leporcbarbu/notecottage:latest

    # Port mapping: host:container
    ports:
      - "3000:3000"

    # Environment variables
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/app/data/notecottage.db
      # Uncomment when using HTTPS (e.g., behind nginx with SSL)
      # - SECURE_COOKIES=true

    # Volume mounts for persistent data
    volumes:
      # Database storage
      - ./data:/app/data
      # Image uploads
      - ./uploads:/app/uploads

    # Restart policy
    restart: unless-stopped

    # Health check
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## Publishing Checklist

Before pushing to Docker Hub:

- [ ] Update version in `package.json`
- [ ] Test image locally
- [ ] Create git tag for version (`git tag v1.0.0`)
- [ ] Build fresh image (`docker-compose build --no-cache`)
- [ ] Tag with multiple tags (latest, version, minor)
- [ ] Push all tags to Docker Hub
- [ ] Update Docker Hub README with usage instructions
- [ ] Test pulling and running from Docker Hub
- [ ] Update GitHub README with Docker Hub installation instructions

---

## Privacy: Public vs Private Repositories

**Public Repository (Free):**
- ✅ Anyone can pull your image
- ✅ Good for open-source distribution
- ✅ Shows up in Docker Hub search
- ✅ Unlimited pulls
- ❌ Image size and layers are visible to everyone

**Private Repository ($5/month for more than 1):**
- ✅ Only you (or invited users) can pull
- ✅ Good for proprietary software
- ✅ Control access with team permissions
- ❌ Not suitable for public distribution
- ❌ Requires authentication to pull

**Recommendation for NoteCottage:** Use a **public repository** since it's an open-source project.

---

## Automation with GitHub Actions (Optional)

Automatically build and push to Docker Hub when you create a release:

Create `.github/workflows/docker-publish.yml`:

```yaml
name: Build and Push Docker Image

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  docker:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract version from tag
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          MINOR=${VERSION%.*}
          echo "VERSION=$VERSION" >> $GITHUB_OUTPUT
          echo "MINOR=$MINOR" >> $GITHUB_OUTPUT

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            leporcbarbu/notecottage:latest
            leporcbarbu/notecottage:${{ steps.version.outputs.VERSION }}
            leporcbarbu/notecottage:${{ steps.version.outputs.MINOR }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Setup:**
1. Go to GitHub repository → Settings → Secrets → Actions
2. Add `DOCKER_USERNAME` secret with your Docker Hub username
3. Add `DOCKER_PASSWORD` secret with your Docker Hub password (or access token)
4. Commit the workflow file
5. Create a release (e.g., v1.0.0) and it auto-builds!

---

## Benefits for End Users

**Without Docker Hub (current):**
```bash
git clone https://github.com/leporcbarbu/NoteCottage
cd NoteCottage
docker-compose build  # Takes 5-10 minutes
docker-compose up -d
```

**With Docker Hub (easier):**
```bash
wget https://raw.githubusercontent.com/leporcbarbu/NoteCottage/master/docker-compose.yml
docker-compose up -d  # Instant! Just pulls the pre-built image
```

**Much easier for non-technical users!**

---

## Updating Your Image

When you make code changes and want to publish a new version:

```bash
# 1. Update version in package.json
# 2. Commit changes to git
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin master --tags

# 3. Rebuild image
docker-compose build --no-cache

# 4. Tag with new version
docker tag notecottage:latest leporcbarbu/notecottage:latest
docker tag notecottage:latest leporcbarbu/notecottage:1.0.1
docker tag notecottage:latest leporcbarbu/notecottage:1.0

# 5. Push to Docker Hub
docker push leporcbarbu/notecottage:latest
docker push leporcbarbu/notecottage:1.0.1
docker push leporcbarbu/notecottage:1.0

# 6. Users can now pull the updated image
# (Those using :latest will get it automatically on next docker-compose pull)
```

---

## Troubleshooting

**Blank page after login (or after updating)**
- This is a browser caching issue - your browser cached old files
- **Fix:** Hard refresh the page to bypass cache:
  - **Windows/Linux:** `Ctrl + F5` or `Ctrl + Shift + R`
  - **Mac:** `Cmd + Shift + R`
- The app now sends proper no-cache headers to prevent this
- After hard refresh once, normal refreshing should work

**"unable to open database file" or SQLITE_CANTOPEN error**
- This is a permissions issue with the mounted volumes
- **Fix:** Create directories with proper permissions before starting:
  ```bash
  mkdir -p data uploads
  chmod 777 data uploads
  docker-compose up -d
  ```
- The container runs as non-root user (`node`) and needs write access
- The entrypoint script will show a helpful error if permissions are wrong

**"unauthorized: authentication required"**
- Run `docker login` and enter credentials

**"denied: requested access to the resource is denied"**
- Check that you're using YOUR username, not "leporcbarbu"
- Verify the repository name matches

**"tag does not exist"**
- Make sure you've built and tagged the image first
- Check `docker images` to see available local images

**Large image size**
- Current size should be ~180MB (node:20-alpine + dependencies)
- This is normal and acceptable
- Docker Hub has no size limits for public repos

**Slow push**
- First push uploads all layers (can take time)
- Subsequent pushes only upload changed layers (much faster)
- Consider running on faster internet connection for initial push

---

## Security Best Practices

**Docker Hub Access Tokens (instead of password):**
1. Go to Docker Hub → Account Settings → Security
2. Create new access token with description "NoteCottage Publishing"
3. Use token instead of password in `docker login`
4. More secure, can be revoked independently

**For GitHub Actions:**
- Always use repository secrets for credentials
- Never commit credentials to code
- Use access tokens with minimal required permissions

---

## Next Steps

1. Create Docker Hub account
2. Test push/pull locally
3. Update GitHub README with Docker Hub instructions
4. Consider setting up GitHub Actions for automated builds
5. Announce Docker Hub availability to users

---

**Quick Reference Commands:**

```bash
# Login to Docker Hub
docker login

# Tag image for Docker Hub
docker tag notecottage:latest leporcbarbu/notecottage:latest

# Push to Docker Hub
docker push leporcbarbu/notecottage:latest

# Pull from Docker Hub (test)
docker pull leporcbarbu/notecottage:latest

# View local images
docker images | grep notecottage

# Remove local image (to test pull)
docker rmi leporcbarbu/notecottage:latest
```
