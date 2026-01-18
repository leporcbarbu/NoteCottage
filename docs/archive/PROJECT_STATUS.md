# Project Status

**Version:** 1.3.2
**Updated:** January 17, 2026
**Status:** Production-ready

Self-hosted note-taking app built with Node.js, Express, and SQLite. Supports Markdown/plain text, wiki-links, tags, folders, and multi-user collaboration. Currently running at https://notes.bytecottage.com via Cloudflare Tunnel.

**Stack:** Node.js, Express, SQLite (better-sqlite3), Vanilla JS, marked.js
**Deployed:** Docker on port 3000
**Links:** [GitHub](https://github.com/leporcbarbu/NoteCottage) | [Docker Hub](https://hub.docker.com/r/leporcbarbu/notecottage)

## What's Working

**Notes**
- Plain text and Markdown note types
- Autosave, full-text search (FTS5)
- Nested folders with drag-and-drop
- Recycle bin with restore
- Export to .txt, .md, HTML, PDF

**Linking & Discovery**
- Wiki-links (`[[Note Title]]`) with autocomplete
- Link aliases (`[[Note Title|Display Text]]`)
- Heading links (`[[Note#Section]]` or `[[#Section]]`)
- Combined syntax (`[[Note#Section|Custom Text]]`)
- Intelligent heading autocomplete (type `[[Note#` for suggestions)
- Backlinks panel
- Hashtag tags with autocomplete and filtering
- Broken link detection with click-to-create

**Media**
- Image uploads or external URLs
- Drag-drop and clipboard paste
- Image gallery per note

**UI**
- Four themes (Light, Dark, Cottage, Cottage Dark)
- Note count badges on folders (deep counting)
- Context menus for notes (right-click or long-press)
- Mobile long-press support with haptic feedback
- Resizable sidebar with improved readability
- Enhanced contrast (badges, inline code, code blocks)
- Mobile responsive with toast notifications
- Keyboard shortcuts (Alt+N, Ctrl+S, Ctrl+P)
- PWA support (installable on mobile, offline mode)

**Multi-User**
- Session auth with bcrypt
- Private/Shared folders
- Admin panel (user management, backup/restore)
- User profiles (display name, password, theme)

**Infrastructure**
- Docker with volume persistence
- Service worker for offline
- SQLite WAL mode
- SQL injection protection

## Database

- `notes`: id, title, content, type, folder_id, position, timestamps, deleted_at
- `folders`: id, name, parent_id, icon, position, user_id, is_shared, timestamps
- `tags`: id, name
- `note_tags`: note_id, tag_id
- `users`: id, username, email, password_hash, display_name, role, theme, created_at
- `sessions`: sid, sess (JSON), expire
- `attachments`: id, note_id, file_path, url, mime_type, size, dimensions, alt_text, uploaded_at
- `notes_fts`: FTS5 virtual table for search

## Version History

**v1.3.2** (Current) - GFM line breaks, service worker caching fixes (network-first for code, network-only for API), folder context menu "New Note" option, quiet save notifications

**v1.3.1** - Session persistence (remembers last note), admin panel version display, force reload button

**v1.3.0** - Comprehensive test suite (66 tests), CI/CD, bug fixes (note permissions, folder deletion, restore auth), cross-device sync

**v1.2.1** - Note count badges, context menus for notes, mobile long-press support, improved contrast (badges, inline code, code blocks), sidebar readability enhancements

**v1.2.0** - Wiki-link enhancements (aliases, heading links, combined syntax), intelligent heading autocomplete, fixed heading renderer for marked.js v17, broken link + alias bug fix

**v1.1.3** - Slugify utility fix for heading IDs, keyboard shortcut changed to Alt+N (browser compatibility)

**v1.1.2** - UX improvements, service worker fixes, mobile save button visibility, welcome screen redesign, empty trash confirmation

**v1.1.1** - Fixed text note icon display, mobile sidebar auto-close

**v1.1.0** - Plain text note type support, smart editor switching

**v1.0.10** - Mobile UI enhancements (toast notifications, overflow menu)

**v1.0.9** - PWA support (installable, offline mode)

**v1.0.8** - Clickable broken wiki-links create notes

**v1.0.7** - Wiki-link autocomplete with keyboard nav

**v1.0.6** - Published to Docker Hub, production-ready

**v1.0.5** - Database backup/restore, profile settings

**v1.0.0-v1.0.4** - Initial release (auth, folders, tags, wiki-links, themes, images)

## What's Next

See [ROADMAP.md](../ROADMAP.md) for the full list. Key priorities:

**Soon**
- Keyboard shortcuts in tooltips ("Save (Ctrl+S)")
- Update Docker Hub README
- Test PWA on actual phones (Android/iOS)
- Enhanced word count with character count and reading time
- Sort notes by "last updated" instead of just alphabetical

**Later**
- Search filters (by folder, date, tags)
- Graph view of wiki-links (visual network diagram)
- Note templates (built-in + custom)
- Note history/versioning with diffs
- Interactive checkboxes in Markdown

**Eventually**
- More themes (Forest, Ocean, Sunset, Solarized)
- Real-time collaboration
- Share notes as read-only links
- API & integrations

## Project Structure

```
NoteCottage/
├── server.js                    # Express server & API routes
├── database.js                  # SQLite module
├── package.json                 # Dependencies
├── Dockerfile                   # Container config
├── docker-compose.yml           # Orchestration
└── public/
    ├── index.html               # Main UI
    ├── admin.html               # Admin panel
    ├── profile.html             # User settings
    ├── manifest.json            # PWA manifest
    ├── sw.js                    # Service worker
    ├── css/
    │   ├── style.css            # Main styles
    │   ├── mobile.css           # Mobile responsive
    │   └── components/          # Component styles
    └── js/
        ├── app.js               # Main client logic
        ├── wikilink-extension.js # marked.js extension
        └── components/          # UI components
```

## Running It

**Development**
```bash
npm install && npm start
```

**Docker**
```bash
docker-compose up -d
```

**Production**
Use nginx + Let's Encrypt SSL, or Cloudflare Tunnel for HTTPS. Set `SECURE_COOKIES=true` and configure session secrets.

---

Built as a learning project to explore Node.js (coming from Python/Flask). Learned a lot about Express routing, SQLite, component-based frontend architecture, PWAs, and Docker deployment.
