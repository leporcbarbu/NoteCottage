# Changelog

All notable changes to NoteCottage will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-01-04

### Added
- Redesigned welcome screen with keyboard shortcuts, tips, and helpful sections
- Empty trash confirmation dialog using Modal.confirm with detailed warning
- Toast notifications for empty trash operations (success/error)

### Fixed
- Service worker fetch error handler now returns proper Response object instead of undefined
- Fixed favicon.ico and manifest.json network errors in service worker
- Save button now always visible on mobile (positioned right side, before overflow menu)
- Removed duplicate mobile save button from overflow menu

### Changed
- Updated service worker cache version to v1.1.1
- Added manifest.json and favicon.ico to static assets cache

## [1.1.1] - 2026-01-04

### Fixed
- Text note icon display: Added `type` field to all note API endpoints (`/api/notes`, `/api/notes/:id`, `/api/tags/:tagName/notes`, `/api/search`)
- Mobile sidebar now auto-closes when creating a note from the dropdown menu

### Changed
- Compacted PROJECT_STATUS.md from 27,453 tokens to ~2,500 tokens (90% reduction)

## [1.1.0] - 2026-01-04

### Added
- Note type selection: Choose between plain text (📄) or markdown (📝) for each note
- Smart editor switching based on note type
- Type-specific icons in sidebar (📄 for text, 📝 for markdown)
- Export as .txt for plain text notes
- New note dropdown menu for type selection

### Changed
- Database schema: Added `type` column to notes table (default: 'markdown')
- Export handling: Text notes → .txt, Markdown notes → .md/.html/.pdf
- Hide markdown-specific features (Preview, Images, Tags, Wiki-links) for text notes

## [1.0.10] - 2026-01-03

### Added
- Toast notification system for mobile and desktop (replaces status bar on mobile)
- Mobile overflow menu (⋮) for note actions
- Card-based user table on small screens in admin panel

### Fixed
- Hamburger menu positioning and touch handling on mobile
- Mobile sidebar now properly dismisses

### Changed
- Hidden status bar on mobile (eliminated bottom scrollbar)
- Transparent button styling to prevent overlap
- Responsive admin panel with 2x2 tab grid
- 44px minimum touch targets for all buttons

## [1.0.9] - 2026-01-02

### Added
- Progressive Web App (PWA) support
- Service worker for offline capability
- Web app manifest with app metadata
- "Add to Home Screen" functionality
- App icons (192x192 and 512x512)
- Offline asset caching (CSS, JS, images)

### Changed
- Added PWA meta tags to index.html
- Theme color integration with PWA

## [1.0.8] - 2026-01-01

### Added
- Clickable broken wiki-links that create new notes with pre-filled titles
- Improved hover states for broken links

### Changed
- Broken links now use pointer cursor instead of not-allowed
- Enhanced visual feedback with smooth transitions

## [1.0.7] - 2025-12-31

### Added
- Wiki-link autocomplete: Dropdown suggestions when typing `[[`
- Keyboard navigation for autocomplete (arrow keys, Enter)
- Real-time filtering of note suggestions

## [1.0.6] - 2025-12-30

### Added
- Published to Docker Hub: leporcbarbu/notecottage
- Comprehensive README for Docker Hub
- Health checks in docker-compose

### Fixed
- Docker volume permissions for database and uploads
- Session cookie configuration for containerized deployment

### Changed
- Production-ready Docker configuration

## [1.0.5] - 2025-12-29

### Added
- Database backup/restore system (admin-only)
- Automatic safety backups before restore
- Profile settings page with display name, password change, theme preferences
- User account statistics and deletion

### Changed
- Enhanced admin panel with backup management
- Improved user settings UI

## [1.0.0 - 1.0.4] - 2025-12-01 to 2025-12-28

### Added
- Multi-user authentication system with session management
- Private/Shared folder model
- Admin panel with user management
- Four distinct themes (Light, Dark, Cottage, Cottage Dark)
- Image upload support (dual storage: files + external URLs)
- Drag-and-drop for images
- Clipboard paste for screenshots
- Nested folder hierarchy with unlimited depth
- Hashtag tagging system with autocomplete
- Wiki-links with backlinks panel
- Full-text search (SQLite FTS5)
- Recycle bin with restore capability
- Export as Markdown, HTML, PDF
- Autosave functionality
- Resizable sidebar
- Keyboard shortcuts (Ctrl+N, Ctrl+S, Ctrl+P)
- Word count and breadcrumb navigation
- Responsive mobile design

### Security
- SQL injection protection with prepared statements
- bcrypt password hashing
- Session-based authentication
- File validation and size limits

---

## Version Numbering

- **Major version** (X.0.0): Breaking changes or major architectural updates
- **Minor version** (1.X.0): New features, significant improvements
- **Patch version** (1.1.X): Bug fixes, small improvements, UX tweaks
