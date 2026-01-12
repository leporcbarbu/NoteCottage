# NoteCottage 🏡

A cozy, self-hosted note-taking application for small teams (2-5 users) with a warm, cottage-inspired aesthetic. Built with Node.js and SQLite, NoteCottage combines the simplicity of markdown notes with powerful features like wiki-style linking, folder organization, and collaborative workspaces.

**Perfect for:** Family knowledge bases, small team wikis, personal note collections, collaborative documentation

## ✨ Key Features

- **Markdown Support** with live preview and export (MD, HTML, PDF)
- **Wiki-Style Links** - `[[Note Title]]` syntax with backlinks panel (Obsidian-style)
- **Multi-User Collaboration** - Private folders + Shared team workspaces
- **Nested Folders** with drag-and-drop organization and emoji icons
- **Full-Text Search** - Fast SQLite FTS5 searching across all notes
- **Image Support** - Upload files or link external URLs with gallery view
- **Tagging System** - Auto-detect `#hashtags` with autocomplete
- **Four Beautiful Themes** - Light, Dark, Cottage, Cottage Dark
- **Admin Panel** - User management, settings, database backup/restore
- **Recycle Bin** - Soft delete with restore capability

## 🚀 Quick Start

### 1. Create directories
```bash
mkdir -p notecottage/data notecottage/uploads
cd notecottage
```

### 2. Create docker-compose.yml
```yaml
version: '3.8'
services:
  notecottage:
    image: leporcbarbu/notecottage:latest
    container_name: notecottage
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - PORT=3000
      - DATABASE_PATH=/app/data/notecottage.db
      # - SECURE_COOKIES=true  # Uncomment if behind HTTPS reverse proxy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. Fix permissions (Linux/macOS)
```bash
chmod 777 data uploads
```

### 4. Start container
```bash
docker-compose up -d
```

### 5. Open browser
Navigate to `http://localhost:3000` and create your admin account!

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port for web server |
| `DATABASE_PATH` | `./notecottage.db` | SQLite database file location |
| `SECURE_COOKIES` | `false` | Set to `true` when using HTTPS reverse proxy |

## 🔧 Volume Mounts

| Container Path | Description |
|----------------|-------------|
| `/app/data` | SQLite database storage (persistent) |
| `/app/uploads` | User-uploaded images (persistent) |

**Important:** On Linux/macOS, set permissions with `chmod 777 data uploads` before starting the container.

## 📊 Latest Version

**v1.3.0** (January 2026) - Testing & Quality Release 🧪

**What's New:**
- ✅ **Comprehensive test suite** - 66 automated tests covering all major features
- 🔒 **Enhanced security** - Fixed note permission checks for better privacy
- 💾 **Data protection** - Folder deletion now preserves notes/subfolders instead of deleting
- 🔄 **Cross-device sync** - Auto-refresh with conflict detection (5-second polling)
- 🐛 **Better error handling** - Improved API responses and status codes
- 🤖 **CI/CD automation** - GitHub Actions runs tests on every commit

**Previous Updates (v1.2.x):**
- ✨ Folder note count badges with deep counting
- 📱 Mobile long-press support with haptic feedback
- 🎨 Enhanced contrast and readability
- 🖱️ Context menus for notes and folders
- 🔗 Advanced wiki-link features (aliases, heading links, autocomplete)

**Stability:** Production-ready with 40% test coverage and automated quality checks.

See [release notes](https://github.com/leporcbarbu/NoteCottage/releases) for full changelog.

## 🐛 Troubleshooting

### Container won't start (Permission errors)
```bash
chmod 777 data uploads
```

### Blank page after login
Clear browser cache (Ctrl+Shift+R) and reload.

### Using behind reverse proxy (nginx, Caddy, etc.)
Set `SECURE_COOKIES=true` in environment variables.

### Images not uploading
- Check `uploads/` directory permissions
- Verify file size under 10MB
- Supported formats: JPEG, PNG, GIF, WebP, SVG

## 🌐 Deployment Options

### Local Network (LAN)
Perfect for home/office networks. Access via `http://192.168.x.x:3000`

### Remote Access (VPN)
Use Tailscale or WireGuard for secure remote access without port forwarding.

### Public Internet (HTTPS)
Deploy behind nginx reverse proxy with SSL/TLS:
```bash
# Set secure cookies when using HTTPS
SECURE_COOKIES=true
```

See [deployment guides](https://github.com/leporcbarbu/NoteCottage/tree/master/docs/deployment) for detailed instructions.

## 🔗 Links

- **GitHub:** [leporcbarbu/NoteCottage](https://github.com/leporcbarbu/NoteCottage)
- **Documentation:** [Full README](https://github.com/leporcbarbu/NoteCottage#readme)
- **Issues:** [Report bugs](https://github.com/leporcbarbu/NoteCottage/issues)
- **License:** [MIT License](https://github.com/leporcbarbu/NoteCottage/blob/master/LICENSE)

## 🙏 Acknowledgments

**Inspired by:** [Obsidian](https://obsidian.md/), [Trilium](https://github.com/zadam/trilium), [Mealie](https://mealie.io/)

**Built as a learning project** to understand Node.js fundamentals, coming from a Python/Flask background.

---

**Made with ☕ and ❤️ by Joshua C. Diller**
