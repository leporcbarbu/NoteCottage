# Changelog

All notable changes to NoteCottage will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-01-10

### Added - UX Improvements & Mobile Enhancements

**Note Count Badges**
- Folder note counts now display next to each folder name
- Deep counting: Shows total notes including all subfolders
- Empty folders display "(0)" for clarity
- Visual at-a-glance overview of content distribution

**Context Menus for Notes**
- Right-click any note to access quick actions
- Desktop: Standard right-click menu
- Mobile: Long-press (500ms) support with haptic feedback
- Options: Delete note (move to trash)

**Mobile Long-Press Support**
- All folders now support long-press on mobile
- Trash folder menu accessible via long-press
- Trash notes support long-press for restore/delete
- 10px movement threshold prevents accidental triggers
- Vibration feedback on supported devices

### Fixed - Contrast & Readability

**Note Count Badge Contrast**
- Increased background opacity from 0.2 to 0.5 (150% improvement)
- Darker text colors for better readability
- Light theme: Changed from #2980b9 to #0d3d5c (deep blue)
- Cottage theme: Changed from #8b6f47 to #4a3520 (dark brown)

**Inline Code Contrast (Dark Themes)**
- Dark theme: Light gray text on dark background (#f8c555 on #2d2d2d)
- Cottage Dark: Tan text on warm brown background (#d4a574 on #2d2416)
- Light themes: Added pink/red color (#c7254e) for better visibility
- No more unreadable light text on light backgrounds

**Code Block Backgrounds (Dark Themes)**
- Dark theme: Code blocks now match page background (#2d2d2d)
- Cottage Dark: Code blocks use warm brown background (#3a2f24)
- Light themes: Keep classic blue-gray background (#2c3e50)
- Added subtle border for better visual separation

**Sidebar Readability**
- Removed "last edited" timestamps from sidebar note list
- Note titles now have significantly more display space
- Timestamps still visible in status bar when note is open
- Cleaner, less cluttered interface

### Changed

**Menu System Unification**
- Trash note menus now use unified contextMenu system
- Trash folder menu now uses unified contextMenu system
- Consistent styling, hover effects, and transitions across all menus
- Reduced code duplication (~50 lines removed)

### Technical Details

**Files Modified:**
- `public/js/app.js` - Note counts, context menus, long-press support, sidebar cleanup
- `public/css/style.css` - Badge contrast, code styling, inline code colors
- `public/index.html` - Cache busting for CSS and JS

**New Functions:**
- `countNotesInFolder(folder)` - Recursive note counting
- `addNoteCounts(folderList)` - Populate counts for all folders
- `addLongPressListener(element, callback)` - Mobile long-press detection
- `showNoteContextMenu(event, note)` - Note context menu

**Updated Functions:**
- `showTrashNoteMenu()` - Refactored to use contextMenu.show()
- `createTrashFolder()` - Added long-press support
- `createNoteElement()` - Removed timestamp, added context menu
- `createTrashNoteElement()` - Added long-press support

### Migration Notes
No breaking changes. All existing functionality preserved. New features are purely additive.

## [1.2.0] - 2026-01-10

✅ **Bug Fixed:** Heading renderer issue resolved. Updated to use marked.js v17 API correctly.

### Added - Wiki-Link Power Features
This release dramatically enhances wiki-links with features that were already implemented in the codebase but never documented or announced!

**Link Aliases** (`[[Note Title|Display Text]]`)
- Write `[[My Important Document|click here]]` to show "click here" while linking to "My Important Document"
- Perfect for natural reading flow in sentences
- Backlinks correctly track the original note title, not the alias
- Works in both client-side and server-side rendering

**Heading Links** (`[[Note#Section]]`)
- Jump directly to specific sections within notes: `[[Meeting Notes#Action Items]]`
- Link to headings in current note: `[[#Summary]]`
- Smooth scroll animation when navigating to headings
- Works with all heading levels (H1-H6)
- Server-side rendering supports heading embeds: `![[Note#Section]]`

**Combined Syntax** (`[[Note#Section|Display Text]]`)
- Ultimate flexibility: `[[Research#Methodology|our methods]]`
- Combine all features for maximum expressiveness

**Intelligent Heading Autocomplete**
- Type `[[NoteName#` to see all headings in that note
- Real-time filtering as you type more characters
- Visual distinction: headings shown with `#` prefix
- Heading suggestions cached for performance
- Keyboard navigation with arrow keys and Enter
- Shows helpful messages: "Note not found", "No headings found"
- Dropdown positioned intelligently near cursor

**Enhanced Autocomplete UI**
- Sleek dropdown styling with proper dark theme support
- Smooth transitions and hover effects
- Better positioning to avoid screen edges
- Loading states and error handling
- Maximum 300px height with scroll for long lists

### Fixed

**Heading Renderer for marked.js v17**
- Fixed `[object Object]` display issue in markdown headings
- Updated to use `this.parser.parseInline(token.tokens)` instead of `token.text`
- Applied fix to both client-side (`app.js`) and server-side (`server.js`) rendering
- Headings now display correctly with proper HTML and slugified IDs
- See TROUBLESHOOTING-v1.2.0.md for technical details

**Broken Link + Alias Bug**
- Previously: Clicking `[[Missing Note|Alias]]` would create a note titled "Alias"
- Now: Correctly creates "Missing Note" using data attribute storage
- Broken links store `data-note-title` attribute with original note name
- Click handler prioritizes data attribute over display text
- Works for both simple links and heading links

**Autocomplete Edge Cases**
- Better handling of notes with no headings
- Proper error messages when note doesn't exist
- Cache invalidation works correctly
- Dropdown closes properly on blur

### Changed

**Documentation Overhaul**
- README now documents all wiki-link syntax with examples
- Usage section includes dedicated wiki-link guide
- ROADMAP updated to reflect completed features
- Version bumped to 1.2.0 to reflect significant feature additions

**CSS Improvements**
- New `.wiki-link-heading-broken` class for missing headings (orange wavy underline)
- Complete autocomplete dropdown styles
- `.wikilink-autocomplete-heading` for visual distinction
- `.wikilink-autocomplete-message` for info/error messages
- Consistent dark theme support across all new elements

### Technical Details

**Files Modified:**
- `public/js/app.js` - Added `data-note-title` to broken links, updated click handler
- `server.js` - Added `data-note-title` to server-rendered broken links
- `public/js/components/wikilink-autocomplete.js` - Complete heading autocomplete system
- `public/css/style.css` - New autocomplete and heading-broken styles
- `README.md` - Comprehensive wiki-link documentation
- `ROADMAP.md` - Moved completed features, updated status

**Implementation Highlights:**
- Heading detection regex: `/^#{1,6}\s+(.+)$/gm`
- Pattern matching: `/\[\[([^\]#]+)#([^\]]*?)$/` for heading mode
- Caching system with Map for heading storage by note title
- Async fetch with error handling for note content
- Graceful degradation for missing notes or headings

### Migration Notes
No breaking changes. All existing wiki-links continue to work exactly as before. The new features are purely additive.

## [1.1.3] - 2026-01-07

### Added
- Shared slugify utility for heading IDs (works in both Node.js and browser environments)
- Navigation improvements to roadmap (history stack, tabs, close button, back/forward shortcuts)

### Fixed
- Slugify utility now properly handles marked.js tokens and HTML tags in headings

### Changed
- Keyboard shortcut changed from Ctrl+N to Alt+N for new notes (browser compatibility, especially Brave)
- Updated all documentation to reflect Alt+N keyboard shortcut

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
- Keyboard shortcuts (Alt+N, Ctrl+S, Ctrl+P)
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
