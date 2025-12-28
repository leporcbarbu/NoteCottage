# NoteCottage - Project Status

**Last Updated:** December 27, 2024
**Status:** Fully functional note-taking application with inline folder/note browsing, wiki-links, tags, backlinks, and dark mode

## Project Overview

NoteCottage (formerly NodeNotes) is a web-based note-taking application built with Node.js and Express, inspired by Obsidian and Trilium. It features Markdown support, SQLite database storage, traditional file-browser style interface with inline notes, wiki-style linking, backlinks panel, tagging system, and dark mode theming.

**Built as a learning project** for understanding Node.js fundamentals, coming from a Python/Flask background.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite with better-sqlite3
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Markdown:** marked.js library
- **Port:** 3000

## Project Structure

```
NodeTest/
├── server.js                    # Express server with all API routes
├── database.js                  # SQLite database module with folders and tags
├── nodenotes.db                 # SQLite database file
├── package.json                 # Dependencies and scripts
├── test-sql-injection.js        # Security test suite
├── test-tags.js                 # Tag functionality tests
├── test-tag-fixes.js            # Tag validation tests
├── fix-database.js              # Database repair script for FTS corruption
├── PROJECT_STATUS.md            # This file
└── public/
    ├── index.html               # Main UI
    ├── css/
    │   ├── style.css            # Themed CSS with variables
    │   └── components/          # Component stylesheets
    │       ├── modal.css        # Modal dialog styles
    │       ├── emoji-picker.css # Emoji picker styles
    │       ├── context-menu.css # Context menu styles
    │       ├── drag.css         # Drag-and-drop visual feedback
    │       ├── tag-autocomplete.css # Tag autocomplete dropdown styles
    │       └── wikilink-autocomplete.css # Wiki-link autocomplete dropdown styles
    └── js/
        ├── app.js               # Main client-side logic
        ├── wikilink-extension.js # marked.js extension for [[Note Title]] syntax
        └── components/          # Reusable UI components
            ├── modal.js         # Modal dialog component
            ├── emoji-picker.js  # Emoji picker component
            ├── folder-form.js   # Folder creation/editing form
            ├── drag-manager.js  # Drag-and-drop state manager
            ├── context-menu.js  # Visual context menu
            ├── tag-autocomplete.js # Tag autocomplete dropdown
            └── wikilink-autocomplete.js # Wiki-link autocomplete dropdown
```

## Implemented Features

### Core Functionality
✅ **CRUD Operations** - Create, Read, Update, Delete notes
✅ **Markdown Support** - Write in Markdown, preview rendered HTML
✅ **SQLite Database** - Persistent storage with proper schema
✅ **Full-Text Search** - SQLite FTS5 for fast searching (searches both title and content)
✅ **SQL Injection Protection** - Prepared statements throughout

### Folder Hierarchy System
✅ **Nested Folders** - Unlimited depth folder structure (folders within folders)
✅ **Traditional File Browser UI** - Notes displayed inline within folders like VS Code/Finder
✅ **"All Notes" Virtual Folder** - Special folder at top showing all notes across folders
✅ **Inline Note Display** - Notes appear directly under their parent folder when expanded
✅ **Drag-and-Drop Folders** - Drag folders to reorder or nest within other folders
✅ **Drag-and-Drop Notes** - Drag notes between folders to move them
✅ **Folder Icons** - Visual emoji picker with 80+ curated emojis in 7 categories
✅ **Individual Folder Expand/Collapse** - Arrow icon on each folder to show/hide contents
✅ **Auto-Migration** - Existing notes automatically moved to "Uncategorized" folder
✅ **Visual Context Menu** - Right-click folders for clickable button menu
✅ **Cascade Delete** - Deleting folder deletes all subfolders and notes
✅ **Circular Prevention** - Cannot move folder into itself or descendants (client & server validation)
✅ **State Persistence** - Expanded/collapsed folders saved in localStorage
✅ **Position Tracking** - Folders maintain custom ordering within parent
✅ **Smart Note Creation** - New notes automatically created in currently selected folder (or as subfolder if folder selected)
✅ **Folder Note Count Badges** - Each folder displays count of notes it contains (non-recursive)
✅ **Auto-Expand to Note** - Opening a note automatically expands and highlights its parent folder
✅ **Breadcrumb Navigation** - Status bar shows folder path of current note

### Tagging System
✅ **Hashtag Detection** - Auto-detect `#tags` in content
✅ **Smart Validation** - Tags must start with letter (not `#1`, but `#v1` works)
✅ **Many-to-Many Relationships** - Proper database design
✅ **Tag Filtering** - Click tags to filter notes
✅ **Tag Counts** - Shows usage count for each tag
✅ **Case-Insensitive** - `#JavaScript` and `#javascript` are the same
✅ **Auto-Hide** - Tags panel hidden when no tags exist
✅ **Tag Autocomplete** - Dropdown suggestions while typing hashtags with arrow key navigation
✅ **Tag Deletion** - Right-click unused tags (count = 0) to delete them

### Timestamps & Localization
✅ **Created/Updated Dates** - Automatic timestamp tracking
✅ **Timezone Conversion** - UTC in database, local time in UI
✅ **Relative Time** - "5 minutes ago" in sidebar
✅ **Full Timestamps** - Detailed dates in editor header

### Wiki-Links (Obsidian-Style)
✅ **Internal Linking** - `[[Note Title]]` syntax for linking between notes
✅ **Case-Insensitive Matching** - `[[my note]]` and `[[My Note]]` link to same note
✅ **Clickable Links** - Click wiki-links in preview mode to navigate to target note
✅ **Broken Link Detection** - Non-existent notes shown as grayed-out with dashed underline
✅ **Duplicate Title Handling** - Links to most recently updated note when titles match
✅ **Export Support** - Wiki-links work in HTML and PDF exports
✅ **Alias Ready** - Regex supports future `[[Note|Display]]` syntax
✅ **Dark Mode Support** - Wiki-link colors adapt to current theme
✅ **Wiki-Link Autocomplete** - Type `[[` to see dropdown of note titles with keyboard navigation
✅ **Backlinks Panel** - Shows all notes that link to the current note

### Note Export
✅ **Markdown Export** - Download notes as .md files with original content
✅ **HTML Export** - Convert to styled standalone HTML with embedded CSS
✅ **PDF Export** - Print-optimized HTML with browser Save as PDF dialog
✅ **Export Dropdown** - Clean dropdown menu in editor header
✅ **Wiki-Link Preservation** - Exported HTML/PDF includes rendered wiki-links

### UI/UX Features
✅ **Dark Mode** - Toggle between light/dark themes
✅ **Theme Persistence** - Preference saved in localStorage
✅ **Smooth Transitions** - CSS transitions for theme changes
✅ **Responsive Design** - Split sidebar/editor layout
✅ **Status Bar** - Bottom bar shows word count, folder breadcrumb, and timestamps
✅ **Word Count** - Real-time word counter in status bar
✅ **Folder Breadcrumb** - Status bar shows folder path of current note (e.g., "Work › Projects › Current")
✅ **Clean Header** - Editor header decluttered by moving metadata to status bar
✅ **Autosave** - Automatic saving 2 seconds after user stops typing
  - Visual save status indicator ("Saving...", "All changes saved", "Unsaved changes")
  - Only autosaves existing notes (new notes require manual save with title)
  - Smart debouncing prevents excessive API calls
  - Timestamp updates without full page reload
✅ **Keyboard Shortcuts**:
  - `Ctrl/Cmd + S` - Save note
  - `Ctrl/Cmd + N` - New note
  - `Ctrl/Cmd + P` - Toggle preview

## Database Schema

### Tables

**notes**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `title` TEXT NOT NULL
- `content` TEXT NOT NULL
- `folder_id` INTEGER DEFAULT NULL (NULL defaults to "Uncategorized")
- `position` INTEGER DEFAULT 0 (for custom ordering within folder)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP

**folders**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `parent_id` INTEGER DEFAULT NULL (NULL = root level folder)
- `icon` TEXT DEFAULT NULL (emoji or text icon)
- `position` INTEGER DEFAULT 0 (for custom ordering via drag-and-drop)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE

**tags**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT UNIQUE NOT NULL (lowercase)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

**note_tags** (junction table)
- `note_id` INTEGER → FOREIGN KEY to notes(id) ON DELETE CASCADE
- `tag_id` INTEGER → FOREIGN KEY to tags(id) ON DELETE CASCADE
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- PRIMARY KEY (note_id, tag_id)

**notes_fts** (FTS5 virtual table)
- Full-text search index for title and content
- Automatically synced via triggers

## API Endpoints

### Notes
- `GET /` - Serve main HTML page
- `GET /api/notes` - List all notes with tags and timestamps
- `GET /api/notes/:id` - Get specific note with full details
- `POST /api/notes` - Create new note (tags auto-extracted, accepts folder_id)
- `PUT /api/notes/:id` - Update note (tags auto-updated)
- `PUT /api/notes/:id/move` - Move note to different folder
- `PUT /api/notes/:id/reorder` - Reorder note (change folder and position)
- `DELETE /api/notes/:id` - Delete note

### Folders
- `GET /api/folders` - Get folder tree (hierarchical structure)
- `GET /api/folders/:id` - Get single folder with note count
- `POST /api/folders` - Create new folder
- `PUT /api/folders/:id` - Update folder (name, parent_id, icon)
- `PUT /api/folders/:id/reorder` - Reorder folder (change position and/or parent)
- `DELETE /api/folders/:id` - Delete folder (cascades to subfolders and notes)
- `GET /api/folders/:id/notes` - Get notes in specific folder

### Tags
- `GET /api/tags` - Get all tags with usage counts
- `GET /api/tags/:tagName/notes` - Get notes filtered by tag
- `DELETE /api/tags/:tagName` - Delete tag (only if count = 0)

### Search
- `GET /api/search?q=query` - Full-text search across notes (title and content)

## Key Technical Decisions

### Folder Hierarchy Implementation
- **Tree Structure**: Backend builds tree with `buildFolderTree()`, sends complete structure to frontend
- **Nested Structure**: Uses `parent_id` self-referential foreign key with CASCADE DELETE
- **Circular Prevention**: Recursive CTE query checks ancestors before allowing folder move (both client and server-side)
- **Default Folder**: "Uncategorized" (id=1) is created on initialization, cannot be deleted or dragged
- **State Persistence**: Expanded folder IDs stored in localStorage as JSON array
- **Filter Priority**: Folder filter > tag filter > show all notes
- **Position Field**: Enables custom ordering within same parent via drag-and-drop
- **Drag-and-Drop**: HTML5 Drag API with visual indicators (above/inside/below drop zones)
- **Component Architecture**: Reusable vanilla JS components (Modal, EmojiPicker, ContextMenu, DragManager)

### Tag System Implementation
- **Validation Rules**: Tags must start with a letter: `/#([a-zA-Z]\w*)/g`
  - Prevents `#1` from being a tag
  - Allows `#nodejs2`, `#python3`, `#web_dev`
  - All tags stored as lowercase for case-insensitive matching
- **Autocomplete**: Mirror div technique for cursor position detection
  - Creates invisible div with same text/styling as textarea
  - Measures span position to get accurate cursor coordinates
  - Accounts for textarea scroll position
  - Dropdown positioned relative to cursor, adjusted for viewport boundaries
- **Protected Deletion**: Server validates tag count before allowing deletion

### Timezone Handling
- SQLite stores timestamps in UTC format: `"2025-12-26 01:08:13"`
- JavaScript converts to ISO with UTC indicator: `"2025-12-26T01:08:13Z"`
- Browser automatically converts to user's local timezone
- Function: `parseUTCDate()` in app.js

### Wiki-Link Implementation
- **Extension Architecture**: Custom marked.js inline extension for `[[...]]` syntax
- **Pattern Matching**: Regex `/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/` supports aliases
- **Title Resolution**: Case-insensitive lookup using `getNotesTitleMap()` database function
- **Duplicate Handling**: Most recently updated note wins (`ORDER BY updated_at DESC`)
- **Server Rendering**: `renderMarkdownWithWikiLinks()` helper in server.js
- **Client Rendering**: Configured on note load and before exports
- **Link Types**:
  - Valid: `<a class="wiki-link" data-note-id="123">Title</a>`
  - Broken: `<span class="wiki-link-broken">Title</span>`
- **Navigation**: Event delegation on document for all wiki-link clicks
- **Universal Module**: Works in both Node.js (require) and browser (window global)

### Theme Implementation
- CSS custom properties (variables) for all colors
- `[data-theme="dark"]` selector overrides variables
- localStorage key: `'theme'` (values: `'light'` or `'dark'`)
- Default: light mode

## NPM Scripts

```bash
npm start          # Start server on port 3000
npm install        # Install dependencies
```

## Dependencies

```json
{
  "better-sqlite3": "^12.5.0",    // SQLite database
  "express": "^5.2.1",            // Web framework
  "marked": "^17.0.1"             // Markdown parser
}
```

## Security Features

✅ **SQL Injection Prevention** - All queries use prepared statements
✅ **Input Validation** - Note IDs validated before database queries
✅ **Foreign Key Constraints** - CASCADE DELETE for data integrity
✅ **No Eval/Exec** - No dynamic code execution
✅ **XSS Protection** - Markdown rendering to HTML (marked.js handles sanitization)

Tested with `test-sql-injection.js` - all tests pass.

## Known Limitations / Future Considerations

### Current Limitations
- No user authentication (single-user app)
- No note attachments/images

### Potential Next Features (Not Implemented)
- **Create Note from Broken Link** - Click broken wiki-link to create that note
- **Alias Support** - `[[Note Title|Display Text]]` for custom link text
- **Heading Links** - `[[Note#Heading]]` to link to specific sections
- **Note History** - Version control for notes
- **Graph View** - Visual network of linked notes
- **Templates** - Pre-defined note structures
- **Attachments** - Upload images/files
- **Import** - Bulk import from Markdown files
- **Note Encryption** - Encrypted notes with password
- **Collaborative Editing** - Multi-user support
- **Mobile App** - React Native or PWA

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start server:**
   ```bash
   npm start
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

4. **Stop server:**
   - Press `Ctrl+C` in terminal
   - Or kill process on port 3000: `taskkill //PID <pid> //F`

## Testing

Run test suites to verify functionality:

```bash
node test-sql-injection.js     # SQL injection protection tests
node test-tags.js              # Tag system functionality tests
node test-tag-fixes.js         # Tag validation rules tests
```

All tests include automatic cleanup.

## Database Maintenance

### Repairing Database Corruption

If you encounter FTS corruption errors (`SQLITE_CORRUPT_VTAB`), run the repair script:

```bash
node fix-database.js           # Repair FTS5 table corruption
```

This script will:
- Create a backup of your database (`nodenotes.db.backup`)
- Remove any corrupted database files
- Rebuild the FTS5 (Full-Text Search) virtual table
- Re-sync the FTS table with your notes
- Verify the repair was successful

The server also runs an automatic health check on startup to detect issues early.

## User Preferences

Stored in browser's localStorage:
- `theme`: `'light'` or `'dark'` (default: `'light'`)
- `expandedFolders`: JSON array of folder IDs that are expanded in tree view
- `allNotesExpanded`: Boolean for "All Notes" virtual folder expansion state (default: `false`)

Persists across browser sessions.

## Notes for Next Session

### What Works Well
- Traditional file browser UI feels intuitive and familiar (like VS Code/Finder)
- "All Notes" virtual folder provides convenient overview of all notes
- Auto-expand to parent folder helps maintain context when navigating
- Status bar with breadcrumb trail shows location at a glance
- Drag-and-drop is smooth and intuitive with clear visual feedback
- Folder hierarchy system with unlimited nesting works smoothly
- Visual emoji picker makes folder customization quick and fun
- Context menu with clickable buttons is much better than prompts
- Component architecture is clean and reusable
- Full-text search now properly searches both title and content
- Tag system is robust and well-tested
- Tag autocomplete provides excellent UX with keyboard navigation
- Wiki-link autocomplete makes linking notes effortless
- Backlinks panel shows note connections clearly
- New notes intelligently created in selected folder (or as subfolders)
- Dark mode is smooth with good color choices
- SQL injection protection is solid
- Timezone handling works correctly
- CASCADE DELETE properly handles folder/note relationships
- Position recalculation with transactions ensures data integrity
- Database health check on startup catches corruption issues early
- FTS corruption is handled gracefully with helpful error messages
- Autosave is responsive and unobtrusive with clear visual feedback
- Manual save (Ctrl/Cmd + S) still works alongside autosave
- Preview button auto-saves before showing content, ensuring accuracy
- WAL mode and graceful shutdown prevent database corruption
- Light mode buttons now have excellent readability and contrast

### Recent Updates (December 27, 2024)

**Session 1:**
- ✅ Implemented full drag-and-drop functionality for folders and notes
- ✅ Added visual emoji picker with 80+ curated emojis in 7 categories
- ✅ Replaced prompt-based context menu with beautiful visual button menu
- ✅ Built reusable component architecture (Modal, EmojiPicker, ContextMenu, DragManager)
- ✅ Added position tracking and reordering API endpoints
- ✅ Implemented visual drop zone indicators (above/inside/below)
- ✅ Enhanced circular dependency prevention (client + server validation)
- ✅ Removed color picker (simplified UI, improved UX)

**Session 2:**
- ✅ Implemented tag autocomplete with dropdown suggestions while typing hashtags
- ✅ Added keyboard navigation for autocomplete (arrow keys, Enter, Tab, Escape)
- ✅ Fixed cursor position detection for accurate dropdown placement
- ✅ Added tag deletion feature via right-click context menu for unused tags
- ✅ Fixed "New Note" to create notes in currently selected folder (not just Uncategorized)
- ✅ Added server-side validation to prevent deletion of tags in use

**Session 3:**
- ✅ Implemented folder note count badges with theme-aware styling
- ✅ Added note export functionality (Markdown, HTML, PDF)
- ✅ Built export dropdown menu in editor header
- ✅ Implemented Obsidian-style wiki-links with `[[Note Title]]` syntax
- ✅ Created marked.js custom extension for wiki-link parsing
- ✅ Added case-insensitive title lookup with duplicate handling
- ✅ Implemented clickable wiki-links in preview mode
- ✅ Added visual distinction for broken links (grayed out, dashed underline)
- ✅ Configured wiki-links for both server rendering and client exports
- ✅ Added event delegation for wiki-link navigation
- ✅ Implemented backlinks panel showing notes that reference current note
- ✅ Added wiki-link autocomplete with `[[` trigger and keyboard navigation
- ✅ Implemented word count display in editor header

**Session 4:**
- ✅ **Rebranded application from NodeNotes to NoteCottage**
- ✅ Updated welcome page with accurate, user-focused feature descriptions
- ✅ Removed unused color field from folder creation/update endpoints
- ✅ **Major UI restructure: Moved to traditional file browser layout**
  - Created "All Notes" virtual folder at top of sidebar
  - Implemented inline note display within folders (notes appear under parent folder)
  - Removed separate notes list panel in favor of integrated tree view
  - Added CSS styling for inline note items with hover/active states
- ✅ **Status bar implementation** - Moved timestamps from header to bottom status bar
  - Added folder breadcrumb showing note's location path
  - Repositioned word count to status bar
  - Decluttered editor header for cleaner look
- ✅ **Folder UI improvements**
  - Removed global expand all/collapse all buttons
  - Individual expand/collapse arrows on each folder
  - New folders default to subfolders of currently selected folder
- ✅ **Auto-navigation features**
  - Opening a note automatically expands parent folder tree
  - Parent folder is highlighted when note is opened
  - Breadcrumb trail shows full folder path in status bar

**Session 5:**
- ✅ **Fixed folder_id type mismatch bug** - Notes now correctly display in all subfolders
  - Ensured consistent string conversion of folder_id values throughout the application
  - Resolved issue where notes weren't appearing in nested folders due to type comparison failures
- ✅ **Fixed SQLite FTS5 table corruption** - Resolved `SQLITE_CORRUPT_VTAB` errors
  - Created `fix-database.js` repair script to rebuild corrupted FTS5 tables
  - Added automatic database health check on server startup
  - Added error handling for FTS corruption in note create/update operations
  - Removed corrupted zero-byte database file that was causing path issues
- ✅ **Implemented autosave feature** - Automatic saving with visual feedback
  - Saves automatically 2 seconds after user stops typing (debounced)
  - Real-time save status indicator in status bar ("Saving...", "All changes saved", "Unsaved changes")
  - Color-coded status: blue for saving, green for saved, yellow for unsaved
  - Only autosaves existing notes (new notes require manual save with title first)
  - Smart content change detection prevents unnecessary saves
  - Timestamp updates without full sidebar reload
  - Integrates with manual save button (Ctrl/Cmd + S)

**Session 6:**
- ✅ **Fixed light mode button readability** - Improved contrast on Preview/Export buttons
  - Changed secondary button background from `#95a5a6` to `#455a64` (darker blue-gray)
  - Added explicit white text color to prevent inheritance issues
  - Better accessibility and readability in light theme
- ✅ **Database corruption prevention** - Added safeguards to prevent FTS5 table corruption
  - Implemented graceful shutdown handlers (SIGINT, SIGTERM, exit events)
  - Database connection now closes properly when server stops
  - Enabled WAL (Write-Ahead Logging) mode for better concurrency and corruption resistance
  - Set synchronous mode to NORMAL for optimal performance/safety balance
  - Prevents corruption from improper shutdowns (Ctrl+C, kill commands, crashes)
- ✅ **Auto-save on Preview** - Preview button now saves before showing rendered content
  - Ensures preview always shows the most recent changes
  - Only saves if there are unsaved changes
  - Prevents viewing stale preview data
  - Works seamlessly with existing autosave system

### Areas to Explore
If continuing development, consider:
1. **Graph View** - Visual network of linked notes (now possible with wiki-links)
2. **Multi-user Support** - Each user has their own note stash with authentication (high complexity, high value for sharing)
3. **Image Support** - Images within notes and possibly standalone image notes with tags (medium complexity, high value)
4. **Keyboard Shortcuts for Folders** - Arrow keys to navigate tree, Enter to open
5. **Create from Broken Link** - Click broken wiki-link to create that note

### Technical Debt
- Code is clean and well-structured with reusable components

## Learning Outcomes

This project successfully demonstrated:
- Node.js async patterns (async/await, promises)
- Express.js routing and middleware
- SQLite with better-sqlite3 (synchronous API)
- Many-to-many database relationships (tags)
- Self-referential foreign keys (nested folders with parent_id)
- Recursive database queries (CTE for ancestor checking)
- CASCADE DELETE for referential integrity
- Prepared statements and SQL injection prevention
- Tree data structures (hierarchical folder rendering)
- Recursive DOM rendering (nested folder tree)
- **HTML5 Drag and Drop API** (dragstart, dragover, drop, dragend events)
- **Component-based architecture** (reusable Modal, EmojiPicker, ContextMenu, DragManager)
- **Transaction-based database operations** (atomic position recalculation)
- **Visual feedback systems** (drop zone indicators, drag ghost images)
- CSS custom properties for theming
- localStorage API for persistence (theme, expanded folders)
- Regular expressions for text parsing (hashtag extraction)
- REST API design (CRUD + search + filtering + reordering)
- Client-side JavaScript DOM manipulation
- Event delegation and bubbling (folder tree interactions)
- **Context menu positioning** (viewport boundary detection)
- **Data transfer protocols** (JSON serialization in drag events)
- **Cursor position detection** (mirror div technique for textarea cursor coordinates)
- **Autocomplete UX patterns** (keyboard navigation, filtered suggestions, real-time updates)
- **Protected deletion** (server-side validation to prevent deletion of resources in use)
- **marked.js extensions** (custom inline tokenizers and renderers for wiki-link syntax)
- **Universal module pattern** (code working in both Node.js and browser environments)
- **Title-based linking** (case-insensitive note lookup for wiki-links)
- **Browser file downloads** (Blob API for exporting notes in multiple formats)
- **Print API integration** (window.print() for PDF generation)

**Comparison to Flask:** Very similar patterns, but Node.js is async by default, uses CommonJS modules, and has different idioms for routing and middleware. SQLite operations in Node.js (better-sqlite3) are synchronous unlike typical async database libraries.

---

**Status:** NoteCottage is feature-rich and production-ready for single-user personal use. Core features complete: traditional file-browser UI with inline notes, drag-and-drop, nested folders, wiki-links with autocomplete, backlinks panel, tags with autocomplete, note export, full-text search, status bar with breadcrumbs, autosave with preview integration, and dark mode. Database corruption issues resolved with WAL mode and graceful shutdown handlers. All known bugs have been resolved.
