# NoteCottage

[![Docker Hub](https://img.shields.io/docker/v/leporcbarbu/notecottage?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/leporcbarbu/notecottage)
[![Docker Pulls](https://img.shields.io/docker/pulls/leporcbarbu/notecottage)](https://hub.docker.com/r/leporcbarbu/notecottage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A self-hosted note-taking app built with Node.js and SQLite. Think Obsidian meets Trilium, but simpler and designed for small teams. Supports Markdown and plain text notes, wiki-style linking, tags, folders, and multi-user collaboration.

I built this as a learning project while exploring Node.js (coming from a Python/Flask background). It's designed for 2-5 users - families, small teams, or anyone who wants a lightweight alternative to cloud-based note apps.

## Features

**Note-Taking**
- Flexible note types (plain text or Markdown)
- Full-text search powered by SQLite FTS5
- Autosave with visual feedback
- Word count and character tracking
- Export to .txt, .md, HTML, or PDF

**Organization**
- Nested folders with unlimited depth
- Drag-and-drop for notes and folders
- Folder icons (80+ emojis to choose from)
- Recycle bin with restore capability
- Private and shared folder sections

**Linking & Discovery**
- Wiki-style links (`[[Note Title]]`) like Obsidian
- Link aliases for custom display text (`[[Note Title|Display Text]]`)
- Heading links to jump to sections (`[[Note#Section]]` or `[[#Section]]`)
- Combined syntax (`[[Note#Section|Custom Text]]`) for maximum flexibility
- Backlinks panel shows all notes referencing current note
- Intelligent autocomplete:
  - Type `[[` for note suggestions
  - Type `[[Note#` for heading suggestions within that note
- Broken link detection with click-to-create
- Hashtag tagging with filtering

**Collaboration**
- Multi-user support (2-5 users recommended)
- Session-based authentication
- Private folders (personal notes) and shared folders (team notes)
- Admin panel for user management
- Database backup and restore

**User Experience**
- Four themes: Light, Dark, Cottage, and Cottage Dark
- Progressive Web App (installable on mobile, works offline)
- Responsive mobile design with touch-friendly UI
- Resizable sidebar
- Toast notifications

**Images**
- Upload images or link external URLs
- Drag-and-drop or paste from clipboard
- Image gallery per note
- Supported formats: JPEG, PNG, GIF, WebP, SVG

**Security**
- bcrypt password hashing
- SQL injection protection via prepared statements
- Session management with HTTPOnly cookies
- File validation and size limits

## Quick Start

### Docker (Recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. Create directories and compose file:
   ```bash
   mkdir -p notecottage/data notecottage/uploads
   cd notecottage
   ```

3. Create `docker-compose.yml`:
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

4. Fix permissions (Linux/macOS):
   ```bash
   chmod 777 data uploads
   ```

5. Start the container:
   ```bash
   docker-compose up -d
   ```

6. Open `http://localhost:3000` in your browser

7. Create an account (first user becomes admin)

### Node.js (Development)

Requires Node.js 18+

```bash
git clone https://github.com/leporcbarbu/NoteCottage.git
cd NoteCottage
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Web server port |
| `DATABASE_PATH` | `./notecottage.db` | SQLite database location |
| `SECURE_COOKIES` | `false` | Enable for HTTPS reverse proxy |

### Docker Compose with HTTPS

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

## Deployment

**Local Network**
Run Docker on a home server and access via `http://192.168.x.x:3000`. Works great for families or teams on the same network.

**Remote Access (VPN)**
Use Tailscale or WireGuard to access your instance remotely without exposing it to the internet. No port forwarding needed.

**Public Internet (HTTPS)**
Deploy behind an nginx reverse proxy with Let's Encrypt SSL certificates. Set `SECURE_COOKIES=true` in your environment. You can also use Cloudflare Tunnel for easy HTTPS without opening ports.

## Tech Stack

- Node.js + Express.js
- SQLite with better-sqlite3
- Vanilla JavaScript, HTML5, CSS3
- marked.js for Markdown rendering (with custom wiki-link extension)
- express-session + bcrypt for authentication
- multer for file uploads
- Docker for containerization

## Usage

**Creating Notes**
Click "New Note", choose plain text or Markdown, and start writing. Press Alt+N for new note, Ctrl+S to save, Ctrl+P to toggle preview.

**Wiki-Links**
Connect your notes with powerful wiki-style linking:
- `[[Note Title]]` - Link to another note
- `[[Note Title|Display Text]]` - Link with custom text (alias)
- `[[Note#Section]]` - Link to a specific heading in a note
- `[[#Section]]` - Link to a heading in the current note
- Autocomplete suggests notes as you type `[[` and headings when you type `[[Note#`
- Click broken links to instantly create that note

**Folders**
Click "New Folder" to create a folder. Choose an emoji icon and set it as Private (personal) or Shared (team). Drag notes and folders to organize them.

**Images**
Click the image button in the editor, or just drag-and-drop images directly into the editor. You can also paste screenshots with Ctrl+V.

**Tags**
Type `#` to start a tag. Use autocomplete or create new tags. Click tags in the sidebar to filter notes.

## Admin Panel

The admin panel lets you manage users (create, update, delete), configure system settings (registration, user limits), and backup/restore the database. The first user account becomes admin automatically.

## Troubleshooting

**Permission errors on Linux/macOS**
```bash
chmod 777 data uploads
```

**Blank page after login**
Clear your browser cache (Ctrl+Shift+R) or check the console for errors.

**Database issues**
```bash
node fix-database.js
```

**Image uploads failing**
Check that the `uploads/` directory has write permissions and files are under 10MB.

## Contributing

Contributions welcome! Open an issue to discuss major changes before submitting a PR. I'm particularly interested in theme contributions, mobile improvements, and performance optimizations.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- Docker Hub: [leporcbarbu/notecottage](https://hub.docker.com/r/leporcbarbu/notecottage)
- GitHub: [leporcbarbu/NoteCottage](https://github.com/leporcbarbu/NoteCottage)
- Maintainer: [leporcbarbu](https://github.com/leporcbarbu)

## Acknowledgments

Inspired by [Obsidian](https://obsidian.md/) (wiki-links and backlinks), [Trilium](https://github.com/zadam/trilium) (hierarchical notes), and [Mealie](https://mealie.io/) (self-hosted collaboration model).

---

**Current Version:** 1.2.0 (January 2026)

See [CHANGELOG.md](CHANGELOG.md) for version history and [ROADMAP.md](ROADMAP.md) for planned features.
