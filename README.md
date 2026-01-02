# NoteCottage 🏡

[![Docker Hub](https://img.shields.io/docker/v/leporcbarbu/notecottage?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/leporcbarbu/notecottage)
[![Docker Pulls](https://img.shields.io/docker/pulls/leporcbarbu/notecottage)](https://hub.docker.com/r/leporcbarbu/notecottage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cozy, self-hosted note-taking application for small teams (2-5 users) with a warm, cottage-inspired aesthetic. Built with Node.js and SQLite, NoteCottage combines the simplicity of markdown notes with powerful features like wiki-style linking, folder organization, and collaborative workspaces.

**Perfect for:** Family knowledge bases, small team wikis, personal note collections, collaborative documentation

**Inspired by:** Obsidian, Trilium, and the comfort of a warm cottage

## ✨ Key Features

### 📝 Note-Taking Essentials
- **Markdown Support** - Write in Markdown, preview rendered HTML
- **Full-Text Search** - SQLite FTS5 for fast searching across titles and content
- **Autosave** - Automatic saving with visual feedback
- **Word Count** - Real-time word counter in status bar
- **Export** - Download notes as Markdown, HTML, or PDF

### 🏡 Cozy User Experience
- **Four Beautiful Themes** - Light, Dark, Cottage (warm & cozy), Cottage Dark
- **Traditional File Browser UI** - Familiar interface like VS Code/Finder
- **Resizable Sidebar** - Adjustable workspace layout
- **Status Bar** - Shows folder breadcrumb, word count, and timestamps
- **Tooltips** - Hover to see full names of truncated items

### 📁 Powerful Organization
- **Nested Folders** - Unlimited depth folder hierarchy
- **Drag-and-Drop** - Drag notes/folders to reorganize
- **Folder Icons** - Visual emoji picker with 80+ curated emojis
- **Smart Organization** - Private and Shared folder sections
- **Alphabetical Sorting** - Folders automatically sorted for easy navigation
- **Recycle Bin** - Soft delete with restore capability

### 🔗 Linking & Connections
- **Wiki-Links** - `[[Note Title]]` syntax for linking between notes (Obsidian-style)
- **Backlinks Panel** - See all notes that reference the current note
- **Autocomplete** - Smart suggestions while typing wiki-links and hashtags
- **Broken Link Detection** - Visual indicators for missing note references

### 🏷️ Tagging System
- **Hashtag Detection** - Auto-detect `#tags` in content
- **Tag Filtering** - Click tags to filter notes
- **Tag Autocomplete** - Dropdown suggestions while typing hashtags
- **Tag Management** - Delete unused tags via context menu

### 🖼️ Image Support
- **Dual Storage** - Upload files (JPEG, PNG, GIF, WebP, SVG) or link external URLs
- **Drag-and-Drop Upload** - Drop images directly into editor
- **Clipboard Paste** - Ctrl+V to paste screenshots
- **Image Gallery** - Sidebar panel showing all note images
- **Click to Insert** - Gallery thumbnails insert markdown syntax at cursor

### 👥 Multi-User Collaboration
- **Session-Based Authentication** - Secure login with bcrypt password hashing
- **Hybrid Privacy Model** - Private folders (personal) + Shared folders (collaborative)
- **User Permissions** - Notes inherit folder privacy settings
- **Admin Panel** - User management, system settings, statistics
- **Profile Settings** - Customize display name, password, theme preferences
- **Database Backup/Restore** - Admin-only disaster recovery

### 🔒 Security & Privacy
- **SQL Injection Protection** - Prepared statements throughout
- **Permission System** - Fine-grained access control for folders/notes
- **Secure Sessions** - HTTPOnly cookies, configurable HTTPS mode
- **File Validation** - MIME type checking, size limits, path traversal prevention

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Install Docker Desktop**
   Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

2. **Create directories for persistent data**
   ```bash
   mkdir -p notecottage/data notecottage/uploads
   cd notecottage
   ```

3. **Create `docker-compose.yml`**
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
       restart: unless-stopped
   ```

4. **Fix permissions** (Linux/macOS only)
   ```bash
   chmod 777 data uploads
   ```

5. **Start the container**
   ```bash
   docker-compose up -d
   ```

6. **Open browser**
   Navigate to `http://localhost:3000`

7. **Create admin account**
   First user becomes admin automatically

### Using Node.js (Development)

**Prerequisites:** Node.js 18+ installed

1. **Clone repository**
   ```bash
   git clone https://github.com/leporcbarbu/NoteCottage.git
   cd NoteCottage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start server**
   ```bash
   npm start
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port for web server |
| `DATABASE_PATH` | `./notecottage.db` | SQLite database file location |
| `SECURE_COOKIES` | `false` | Set to `true` when using HTTPS reverse proxy |

### Docker Compose Example

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
      - SECURE_COOKIES=true  # Enable if behind HTTPS reverse proxy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🌐 Deployment Options

### Option 1: Local Network (LAN)
- Deploy with Docker on home server
- Access via `http://192.168.x.x:3000`
- Perfect for family or small team on same network

### Option 2: Remote Access via VPN
- Use Tailscale or WireGuard for secure remote access
- No port forwarding required
- Maintains local network security

### Option 3: Public Internet (HTTPS Required)
- Deploy behind nginx reverse proxy with SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Configure `SECURE_COOKIES=true`

See deployment guides in `docs/deployment/` for detailed instructions.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite with better-sqlite3
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Markdown:** marked.js with custom wiki-link extensions
- **Authentication:** express-session with bcrypt password hashing
- **File Uploads:** multer with image-size metadata extraction
- **Containerization:** Docker with multi-stage builds

## 📸 Screenshots

### Cottage Theme (Default)
The warm, cozy interface with earthy browns and cream colors

### Dark Mode
Cool, modern dark theme for late-night note-taking

### Wiki-Links & Backlinks
Connect your notes with Obsidian-style `[[wiki-links]]` and see all backlinks

### Multi-User Organization
Private folders for personal notes, Shared folders for team collaboration

## 📚 Usage Tips

### Creating Your First Note
1. Click "New Note" button
2. Add a title and markdown content
3. Press Ctrl/Cmd + S to save
4. Use `#hashtags` for tagging
5. Link to other notes with `[[Note Title]]`

### Organizing with Folders
1. Click "New Folder" button
2. Choose an emoji icon
3. Select Private (personal) or Shared (team)
4. Drag notes into folders to organize
5. Drag folders to nest within each other

### Adding Images
1. Click 📷 Image button in editor toolbar
2. Upload files or link external URLs
3. Drag-drop images directly into editor
4. Paste screenshots with Ctrl+V
5. Click gallery thumbnails to insert

### Using Tags
1. Type `#` in your note to start a tag
2. Choose from autocomplete suggestions or create new
3. Click tags in sidebar to filter notes
4. Right-click unused tags to delete

## 🔐 Admin Features

### User Management
- View all users with creation dates
- Create user accounts manually
- Update usernames, emails, display names
- Reset user passwords
- Delete user accounts (removes their private content)
- Toggle admin status

### System Settings
- Enable/disable new user registrations
- Set maximum user limit (1-20)
- Customize app name
- View system statistics

### Database Backup & Restore
- Download complete database backup
- Restore from backup file
- Automatic safety backup before restore
- Disaster recovery capability

## 🐛 Troubleshooting

### Container won't start (Permission errors)
```bash
chmod 777 data uploads
```

### Blank page after login
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors

### Database corruption
```bash
node fix-database.js
```

### Images not uploading
- Check `uploads/` directory permissions
- Verify 10MB file size limit not exceeded
- Ensure MIME type is supported (JPEG, PNG, GIF, WebP, SVG)

## 🤝 Contributing

Contributions are welcome! This project was built as a learning experience and is open for improvements.

**Areas for contribution:**
- Additional themes and color schemes
- Mobile PWA enhancements
- Performance optimizations
- Documentation improvements
- Bug fixes and security enhancements

Please open an issue to discuss major changes before submitting a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

**Inspired by:**
- [Obsidian](https://obsidian.md/) - Wiki-links and backlinks concept
- [Trilium](https://github.com/zadam/trilium) - Hierarchical note organization
- [Mealie](https://mealie.io/) - Self-hosted collaborative app model

**Built as a learning project** to understand Node.js fundamentals, coming from a Python/Flask background.

## 🔗 Links

- **Docker Hub:** [leporcbarbu/notecottage](https://hub.docker.com/r/leporcbarbu/notecottage)
- **GitHub:** [leporcbarbu/NoteCottage](https://github.com/leporcbarbu/NoteCottage)
- **Maintainer:** [leporcbarbu](https://github.com/leporcbarbu)

## 📊 Project Status

**Current Version:** 1.0.6 (January 2026)

**Status:** Production-ready for multi-user collaborative use

**Recent Updates:**
- v1.0.6 - Folder improvements: uncategorized notes at root level, alphabetical sorting
- v1.0.5 - CRITICAL security fix: user privacy breach resolved
- v1.0.4 - Database restore complete flow working
- v1.0.3 - Fixed Modal.confirm() missing method
- v1.0.2 - Fixed blank page on normal refresh
- v1.0.1 - Browser caching issue resolved

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed development history and roadmap.

---

**Made with ☕ and ❤️ by leporcbarbu**
