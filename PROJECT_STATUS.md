# NoteCottage - Project Status

**Last Updated:** January 4, 2026
**Current Version:** v1.1.2
**Status:** Production-ready multi-user note-taking application

## Project Overview

NoteCottage is a web-based note-taking application built with Node.js and Express, inspired by Obsidian and Trilium. Features Markdown support, SQLite database storage, traditional file-browser UI, wiki-style linking, backlinks, tagging, and comprehensive theming.

**Maintainer:** leporcbarbu
**GitHub:** https://github.com/leporcbarbu/NoteCottage
**Docker Hub:** https://hub.docker.com/r/leporcbarbu/notecottage

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite with better-sqlite3
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Markdown:** marked.js
- **Port:** 3000

## Core Features

### Notes & Organization
- ✅ Flexible note types (📄 plain text or 📝 markdown)
- ✅ CRUD operations with autosave
- ✅ Full-text search (SQLite FTS5)
- ✅ Nested folder hierarchy (unlimited depth)
- ✅ Drag-and-drop folders and notes
- ✅ Recycle bin with restore capability
- ✅ Breadcrumb navigation

### Content & Linking
- ✅ Markdown rendering with live preview
- ✅ Wiki-links `[[Note Title]]` with autocomplete
- ✅ Backlinks panel
- ✅ Hashtag tagging with autocomplete
- ✅ Tag filtering and management
- ✅ Broken link detection

### Media & Export
- ✅ Image support (upload or external URL)
- ✅ Drag-drop and clipboard paste for images
- ✅ Export as Markdown, HTML, or PDF
- ✅ Image gallery per note

### UI & Themes
- ✅ Four themes (Light, Dark, Cottage, Cottage Dark)
- ✅ Resizable sidebar with state persistence
- ✅ Status bar (word count, breadcrumbs, timestamps)
- ✅ Responsive mobile design with toast notifications
- ✅ Keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+P)
- ✅ Progressive Web App (PWA) support

### Multi-User & Security
- ✅ Session-based authentication
- ✅ Private/Shared folder model
- ✅ User roles (user, admin)
- ✅ Admin panel (user management, stats)
- ✅ Profile settings (password, theme, display name)
- ✅ Database backup/restore (admin only)
- ✅ SQL injection protection

### Infrastructure
- ✅ Docker containerization
- ✅ Volume persistence
- ✅ Service worker for offline support
- ✅ WAL mode for database stability

## Database Schema

**notes**: id, title, content, type, folder_id, position, created_at, updated_at, deleted_at
**folders**: id, name, parent_id, icon, position, user_id, is_shared, created_at, updated_at
**tags**: id, name
**note_tags**: note_id, tag_id (many-to-many)
**users**: id, username, email, password_hash, display_name, role, theme, created_at
**sessions**: sid (primary key), sess (JSON), expire
**attachments**: id, note_id, file_path, url, mime_type, size, width, height, alt_text, uploaded_at
**notes_fts**: Virtual FTS5 table for full-text search

## Version History (Summary)

### v1.1.2 (Current) - UX Improvements & Fixes
- Fixed service worker fetch error (proper Response objects)
- Save button always visible on mobile (right side placement)
- Redesigned welcome screen with shortcuts and tips
- Empty trash confirmation with Modal dialog
- Toast notifications for trash operations

### v1.1.1 - Bug Fixes
- Fixed text note icon display (added type field to API endpoints)
- Fixed mobile sidebar auto-close on note creation

### v1.1.0 - Plain Text Note Type
- Added note type selection (text vs markdown)
- Smart editor switching based on type
- Type-specific icons (📄 vs 📝)
- Export as .txt for text notes

### v1.0.10 - Mobile UI Enhancements
- Toast notification system
- Fixed hamburger menu
- Mobile overflow menu for actions
- Responsive admin panel

### v1.0.9 - Progressive Web App
- PWA manifest and service worker
- Offline support
- "Add to Home Screen" capability
- App icons and splash screen support

### v1.0.8 - Broken Wiki-Link UX
- Clickable broken wiki-links create new notes
- Improved hover states and visual feedback

### v1.0.7 - Wiki-Link Autocomplete
- Dropdown suggestions when typing `[[`
- Keyboard navigation (arrow keys, Enter)

### v1.0.6 - Docker Hub Publication
- Published to Docker Hub: leporcbarbu/notecottage
- Volume permissions and session cookie fixes
- Production-ready deployment

### v1.0.5 - Database Backup/Restore
- Admin-only backup/restore system
- Safety backups before restore
- Profile settings page

### v1.0.0-v1.0.4 - Foundation
- Multi-user authentication
- Private/Shared folder model
- Admin panel
- Theme system (4 themes)
- Image upload support
- Folder hierarchy
- Tag system
- Wiki-links and backlinks

## Recent Updates

### v1.1.2 (Current) - UX Improvements & Fixes
**Completed:**
- ✅ **Service Worker Fix** - Fixed fetch error handler returning undefined instead of proper Response object
- ✅ **Save Button Mobile Visibility** - Save button now always visible on mobile (positioned right side, before overflow menu)
- ✅ **Improved Welcome Screen** - Complete redesign with keyboard shortcuts, tips, and helpful guide sections
- ✅ **Empty Trash Confirmation** - Added Modal.confirm dialog with warning for permanent deletion
- ✅ **Service Worker Cache** - Updated to v1.1.1, added manifest.json and favicon.ico to cache
- ✅ **Toast Notifications** - Replaced alert() with toast.success/error for empty trash feedback

### v1.1.1 - Bug Fixes
**Completed:**
- ✅ Text note icon display - Added `type` field to all note API endpoints
- ✅ Mobile sidebar auto-close - Sidebar now closes when creating notes on mobile

**Pending Tasks:**
- Update Docker Hub README
- Real-world mobile testing (Android/iOS devices)
- PWA splash screen testing (requires HTTPS)

## Future Enhancements (Backlog)

1. Graph view of wiki-link connections
2. Wiki-link aliases `[[Note|Display]]` and heading links `[[Note#Section]]`
3. Search filters (by folder, date range)
4. Keyboard shortcuts for folder navigation
5. Additional themes (Forest, Ocean, Sunset)
6. Note templates and interactive checklists
7. Note history/versioning
8. Bulk import of Markdown files
9. Additional export formats (DOCX, JSON)
10. Note encryption for sensitive content
11. CSRF protection for production

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

## Key Learning Outcomes

- Node.js async patterns and Express routing
- SQLite with better-sqlite3 (synchronous API)
- Many-to-many relationships and self-referential foreign keys
- Recursive queries (CTEs) and CASCADE DELETE
- Tree data structures and recursive DOM rendering
- HTML5 Drag and Drop API
- Component-based architecture (Modal, EmojiPicker, ContextMenu, etc.)
- CSS custom properties for theming
- Regular expressions for text parsing
- REST API design and SQL injection prevention
- marked.js extensions and universal module patterns
- Docker containerization and volume persistence
- PWA service workers and offline caching
- File upload handling and image metadata extraction

## Running NoteCottage

**Local Development:**
```bash
npm install
npm start
# Visit http://localhost:3000
```

**Docker:**
```bash
docker-compose up -d
# Visit http://localhost:3000
```

**Production Deployment:**
- Use nginx reverse proxy with SSL/TLS
- Set secure session secrets in environment
- Regular database backups recommended

---

*Built as a learning project for understanding Node.js fundamentals, coming from a Python/Flask background.*
