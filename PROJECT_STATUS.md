# NoteCottage - Project Status

**Last Updated:** December 29, 2025
**Status:** Fully functional note-taking application with inline folder/note browsing, wiki-links, tags, backlinks, recycle bin, resizable sidebar, four distinct themes (Light, Dark, Cottage, Cottage Dark), and multi-user authentication with hybrid shared/private folders (IN PROGRESS)

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
NoteCottage/
├── server.js                    # Express server with all API routes
├── database.js                  # SQLite database module with folders and tags
├── notecottage.db               # SQLite database file
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
✅ **Recycle Bin** - Soft delete with restore capability, permanent delete, and empty trash

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
✅ **Four Distinct Themes** - Comprehensive theme system with visual variety
  - ☀️ **Light**: Clean, bright, professional (original)
  - 🌙 **Dark**: Cool, modern dark mode (original)
  - 🏡 **Cottage**: Warm, cozy light theme with earthy browns, cream, and honey gold
  - 🏡🌙 **Cottage Dark**: Warm, cozy dark theme like a cabin at night
  - Cottage themes feature subtle 6px rounded corners for extra coziness
✅ **Compact Theme Picker** - Space-efficient "Theme" button with dropdown menu
  - Floating menu with elevated shadow for visual depth
  - Fixed high-contrast colors for consistent readability
  - Active theme highlighted in menu
  - Click outside to close
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
✅ **Resizable Sidebar** - Adjustable width divider between sidebar and editor
  - Drag handle between sidebar and editor to resize
  - Visual feedback with blue highlight on hover/drag
  - Constrains width between 200px-600px
  - Width preference saved to localStorage
✅ **Tooltips** - Full names displayed on hover for truncated folder/note names
  - Shows complete folder and note names when ellipsis truncates text
  - Applied to all folders (regular and virtual) and note titles

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
- `deleted_at` DATETIME DEFAULT NULL (NULL = active, timestamp = in trash)

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
- `GET /api/notes` - List all notes with tags and timestamps (excludes deleted)
- `GET /api/notes/:id` - Get specific note with full details
- `POST /api/notes` - Create new note (tags auto-extracted, accepts folder_id)
- `PUT /api/notes/:id` - Update note (tags auto-updated)
- `PUT /api/notes/:id/move` - Move note to different folder
- `PUT /api/notes/:id/reorder` - Reorder note (change folder and position)
- `DELETE /api/notes/:id` - Soft delete note (move to trash)

### Trash/Recycle Bin
- `GET /api/trash` - List all deleted notes
- `PUT /api/trash/:id/restore` - Restore note from trash
- `DELETE /api/trash/:id` - Permanently delete specific note
- `DELETE /api/trash` - Empty trash (permanently delete all)

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

## Long-Term Goals / Roadmap

**Vision:** NoteCottage as a self-hosted, small-scale collaborative tool (similar to Mealie) for 2-5 users, primarily accessed via LAN with optional remote access.

### Deployment Model
- **Primary:** Docker on home server, accessed via LAN
- **Secondary:** Remote access via TailScale/VPN (secure, private)
- **Tertiary:** Public-facing with nginx + SSL (for users without VPN)
- **Distribution:** Open-source web app on GitHub/similar

### Mobile Strategy
- **Phase 1:** Progressive Web App (PWA)
  - Mobile-responsive design (mostly complete)
  - Service worker for offline capability
  - "Add to Home Screen" functionality
  - Free for all users
- **Phase 2:** Native mobile app (iOS/Android)
  - Enhanced UX with native features
  - Potential paid app revenue model
  - RESTful API already compatible

### Implementation Roadmap

#### 1. Dockerize Application ⭐ PRIORITY
**Feasibility: ⭐⭐⭐⭐⭐ (Very Easy)**
- Create Dockerfile with Node.js base image
- Add .dockerignore for node_modules and database files
- Docker Compose with environment variables
- Volume mounts for persistent database storage
- **Complexity:** Low - 1-2 hours
- **Benefit:** Foundation for all deployment scenarios, users can `docker-compose up` and go

#### 2. Production-Ready Infrastructure
**Feasibility: ⭐⭐⭐⭐⭐ (Easy)**
- Environment-based configuration (PORT, DATABASE_PATH, etc.)
- nginx reverse-proxy example configurations
- SSL/TLS setup documentation
- Rate limiting and security headers
- CORS configuration for remote access
- **Complexity:** Low to Medium - 2-4 hours
- **Benefit:** Secure remote access, SSL encryption, production deployment ready

#### 3. Multi-User Support (Small Scale: 2-5 users)
**Feasibility: ⭐⭐⭐ (Complex but doable)**

**Chosen Model: Hybrid Shared/Private (Mealie-style)**
- Shared public folders (collaborative knowledge base, team notes)
- Private user folders (personal notes, drafts)
- User can choose visibility when creating folders/notes

**Implementation Requirements:**
- **Database schema:**
  - `users` table (id, username, password_hash, email, created_at)
  - `user_id` foreign key on notes and folders
  - `is_public` boolean on folders (public = shared, private = user-only)
  - Notes inherit privacy from parent folder
- **Authentication:**
  - User registration and login
  - Session management (express-session or JWT)
  - Password hashing (bcrypt/argon2)
- **API changes:**
  - Authentication middleware on all routes
  - Query filters: public content OR owned by current user
  - Permission checks for edit/delete operations
- **Frontend:**
  - Login/registration UI
  - Auth state management
  - Visual indicators for public vs private folders
  - User settings/profile page
- **Complexity:** High - 3-5 days
- **Benefit:** Enables family/team collaboration while preserving privacy

#### 4. Progressive Web App (PWA)
**Feasibility: ⭐⭐⭐⭐ (Moderately Easy)**
- Service worker for offline support
- Web app manifest for "Add to Home Screen"
- Cache strategy for notes and assets
- Mobile-optimized responsive design (minor tweaks needed)
- Touch-friendly UI adjustments
- **Complexity:** Medium - 1-2 days
- **Benefit:** Free mobile experience, works offline, fast loading

#### 5. Note Encryption (Optional - Lower Priority)
**Feasibility: ⭐⭐⭐⭐ (Moderately Complex)**
- **Use Case:** For highly sensitive notes only
- **Recommended approach:** Per-note encryption toggle
  - Optional encryption checkbox when creating/editing notes
  - Client-side encryption for flagged notes
  - Unencrypted notes maintain full-text search and wiki-links
  - Encrypted notes stored as blobs, search disabled
- **Alternative:** HTTPS + VPN may be sufficient for small team use
- **Complexity:** Medium - 1-2 days
- **Challenges:**
  - Full-text search won't work on encrypted content
  - Wiki-links won't resolve for encrypted notes
  - Password management and key derivation
- **Benefit:** Privacy for truly sensitive information

### Recommended Implementation Order
1. **Dockerize** ← START HERE - Foundation for deployment
2. **Production-ready infrastructure** - Secure remote access
3. **Multi-user (hybrid model)** - Core collaboration features
4. **Progressive Web App** - Mobile accessibility
5. **Encryption** - Optional security enhancement

**Strategic Note:** With HTTPS (via nginx) and/or TailScale VPN, encryption becomes less critical for small team use. Focus on convenience and collaboration first.

---

## Multi-User Architecture Plan (Detailed)

**Status:** Planning phase - not yet implemented
**Last Updated:** December 29, 2025

### Database Schema Changes

#### New Table: `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Considerations:**
- Username: 3-20 characters, alphanumeric + underscore
- Email: For password recovery (future feature)
- Password: Hashed with bcrypt (cost factor 12)
- Display name: Optional friendly name for UI
- is_admin: First user automatically set to 1 (admin), others default to 0

#### Modified Table: `folders`
**Add columns:**
```sql
ALTER TABLE folders ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE folders ADD COLUMN is_public BOOLEAN DEFAULT 0;
```

**Privacy Model:**
- `is_public = 1`: Shared folder (visible to all users)
- `is_public = 0`: Private folder (visible only to owner)
- `user_id`: Owner of the folder
- Notes inherit privacy from parent folder

**Special Folders:**
- "Uncategorized" folder (id=1) should be user-specific or public (TBD)
- Each user could have their own "Uncategorized" folder, OR
- One shared "Uncategorized" for public notes

#### Modified Table: `notes`
**Add column:**
```sql
ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
```

**Ownership:**
- `user_id`: Creator/owner of the note
- Notes in public folders: Any user can edit
- Notes in private folders: Only owner can access

#### Modified Table: `tags`
**No changes needed** - tags remain global and shared across all users

**Rationale:**
- Tags like #javascript, #work, #ideas are naturally collaborative
- Users can filter by tags regardless of note ownership
- Simplifies tag autocomplete (show all tags)

#### New Table: `system_settings`
```sql
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Initial settings:**
- `registration_enabled`: "true" or "false" (admin can disable new registrations)
- `max_users`: "5" (default max, admin can adjust)
- `app_name`: "NoteCottage" (customizable instance name)

### Authentication System

#### Session Management: express-session (Recommended)
**Why express-session over JWT:**
- ✅ Simpler for small-scale app (2-5 users)
- ✅ Server-side session storage (more secure)
- ✅ Easy session invalidation (logout, security breach)
- ✅ Built-in CSRF protection patterns
- ✅ No token refresh complexity

**Implementation:**
```javascript
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './data'
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));
```

#### Password Hashing: bcrypt
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Register
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

// Login
const isValid = await bcrypt.compare(password, user.password_hash);
```

#### Authentication Middleware
```javascript
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = getUserById(req.session.userId);
    if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
}

function attachUser(req, res, next) {
    if (req.session.userId) {
        req.user = getUserById(req.session.userId);
    }
    next();
}
```

### API Changes

#### New Endpoints: Authentication
```
POST   /api/auth/register      - Create new user account
POST   /api/auth/login         - Login (create session)
POST   /api/auth/logout        - Logout (destroy session)
GET    /api/auth/me            - Get current user info
PUT    /api/auth/profile       - Update user profile (display name, password)
```

#### New Endpoints: Admin Panel (Admin Only)
```
GET    /api/admin/users        - List all users
DELETE /api/admin/users/:id    - Delete user (and all their private content)
PUT    /api/admin/users/:id/password  - Reset user's password
PUT    /api/admin/users/:id/admin     - Toggle admin status
GET    /api/admin/settings     - Get system settings (registration enabled, max users)
PUT    /api/admin/settings     - Update system settings
GET    /api/admin/stats        - Get system statistics (user count, note count, etc.)
```

#### Modified Endpoints: Permission Checks

**Notes API:**
```javascript
// GET /api/notes - Filter by visibility
// Return: Public notes + user's private notes
SELECT * FROM notes
WHERE deleted_at IS NULL
AND (
    folder_id IN (SELECT id FROM folders WHERE is_public = 1)
    OR folder_id IN (SELECT id FROM folders WHERE user_id = ?)
)

// POST /api/notes - Set owner
// Automatically set user_id to current user

// PUT /api/notes/:id - Check permission
// Allow if: user owns note OR note is in public folder

// DELETE /api/notes/:id - Check permission
// Allow if: user owns note OR user owns parent folder
```

**Folders API:**
```javascript
// GET /api/folders - Filter by visibility
// Return: Public folders + user's private folders

// POST /api/folders - Set owner and privacy
// Require: name, is_public (boolean)
// Set user_id to current user

// PUT /api/folders/:id - Check permission
// Allow if: user owns folder

// DELETE /api/folders/:id - Check permission
// Allow if: user owns folder
```

**Tags API:**
- No changes needed (tags remain global)
- All users can see all tags
- Tag filtering shows notes user has permission to see

### Frontend Changes

#### New UI Components

**1. Login/Registration Page** (`/login`)
- Login form (username/email, password)
- Registration form (username, email, password, confirm password)
- "Remember me" checkbox
- Password strength indicator
- Form validation

**2. User Indicator in Header**
- Display current user's name/avatar
- Dropdown menu: Profile, Settings, Admin Panel (if admin), Logout

**3. Folder Privacy Toggle**
- When creating/editing folders:
  - Checkbox: "🔓 Shared folder (visible to all users)"
  - Or: "🔒 Private folder (only you can see)"
- Visual indicators:
  - Public folders: 🌍 globe icon or green badge
  - Private folders: 🔒 lock icon or blue badge

**4. Note Ownership Display**
- Show "Created by [username]" in note metadata
- For public folders only (private folders implied ownership)

**5. User Settings Page** (`/settings`)
- Change display name
- Change password
- Email preferences (future: notifications)

**6. Admin Panel Page** (`/admin`) - Admin Only
- **User Management Tab:**
  - Table listing all users (username, email, display name, admin status, created date)
  - Actions per user: Reset Password, Toggle Admin, Delete User
  - Delete confirmation modal with warning about private content
  - Cannot delete yourself or last admin
- **System Settings Tab:**
  - Toggle: "Allow new user registrations" (on/off switch)
  - Number input: "Maximum users allowed" (1-20)
  - Text input: "Instance name" (customize app name)
  - Save button to update settings
- **Statistics Tab:**
  - Total users count
  - Total notes count (public vs private breakdown)
  - Total folders count
  - Database size
  - Uptime statistics

#### Authentication Flow

**First-time setup:**
1. App detects no users in database
2. Shows "Create Admin Account" screen
3. First user becomes admin (for future admin features)

**Login flow:**
1. User visits app → redirected to `/login` if not authenticated
2. Enters credentials → POST `/api/auth/login`
3. On success: Create session, redirect to `/`
4. On failure: Show error message

**Session persistence:**
- Check session on page load
- If valid: Load user info, show app
- If invalid: Redirect to login
- Session cookie lasts 30 days ("Remember me")

### Permission Logic

#### Folder Visibility Rules
```
User can see folder IF:
  - is_public = 1 (shared folder), OR
  - user_id = current_user (owns folder)
```

#### Note Visibility Rules
```
User can see note IF:
  - Parent folder is visible (by folder visibility rules)
```

#### Edit/Delete Permission Rules
```
User can edit/delete note IF:
  - User owns the note (note.user_id = current_user), OR
  - Parent folder is public (any user can edit notes in shared folders)

User can edit/delete folder IF:
  - User owns the folder (folder.user_id = current_user)
```

#### Tag Visibility Rules
```
All tags are visible to all users (global)
Clicking a tag shows: Notes user has permission to see
```

### Migration Strategy

**For existing single-user installations:**
1. Add schema changes (new columns with defaults)
2. On first run: Detect no users exist
3. Prompt: "Create your account to continue"
4. After account creation: Assign all existing content to this user
5. Default all existing folders to `is_public = 0` (private)
6. Give user option: "Make all my existing folders shared?"

**Database migration script:**
```sql
-- Add new columns
ALTER TABLE users ...;
ALTER TABLE folders ADD COLUMN user_id INTEGER;
ALTER TABLE folders ADD COLUMN is_public BOOLEAN DEFAULT 0;
ALTER TABLE notes ADD COLUMN user_id INTEGER;

-- Migrate existing data to first user (id = 1)
UPDATE folders SET user_id = 1;
UPDATE notes SET user_id = 1;
```

### Design Decisions (Finalized)

**Q1: Should "Uncategorized" folder be per-user or shared?**
- ✅ **DECIDED:** Per-user - Each user has their own "Uncategorized" folder
- Better privacy defaults, more intuitive ownership model

**Q2: Should tags be private or global?**
- ✅ **DECIDED:** Global (collaborative by nature)

**Q3: Can users edit notes created by others in public folders?**
- ✅ **DECIDED:** Full collaboration - any user can edit notes in shared folders
- True wiki-style collaboration, matches Mealie's model

**Q4: Admin features needed?**
- ✅ **DECIDED:** Yes, include admin panel in MVP
- Required features:
  - User management (view all users, reset passwords, delete users)
  - System settings (toggle registration on/off, set max users)
  - Admin role flag in users table (`is_admin` boolean)
  - Admin-only routes with middleware check
  - Admin panel UI (accessible from user dropdown menu)

**Q5: Password recovery?**
- **DECISION:** Defer to post-MVP
- For small team (2-5 users), admin can manually reset passwords
- Email-based recovery requires SMTP configuration (added complexity)

### Implementation Checklist (Not Started)

- [ ] Database schema changes
  - [ ] Create `users` table (with `is_admin` field)
  - [ ] Create `system_settings` table
  - [ ] Add `user_id` to `folders` and `notes`
  - [ ] Add `is_public` to `folders`
  - [ ] Create migration script for existing data
  - [ ] Set first user as admin automatically
- [ ] Authentication backend
  - [ ] Install dependencies (express-session, bcrypt, connect-sqlite3)
  - [ ] Create session store (separate sessions.db file)
  - [ ] Create auth endpoints (register, login, logout, profile)
  - [ ] Create authentication middleware (`requireAuth`, `requireAdmin`)
  - [ ] Hash passwords with bcrypt (cost factor 12)
  - [ ] Check registration_enabled setting during registration
  - [ ] Check max_users limit during registration
- [ ] API permission checks
  - [ ] Update all folder queries (filter by visibility)
  - [ ] Update all note queries (filter by visibility)
  - [ ] Add permission checks to PUT/DELETE endpoints
  - [ ] Update note/folder creation (set user_id)
  - [ ] Create per-user "Uncategorized" folders on registration
- [ ] Admin panel backend
  - [ ] Create admin endpoints (users, settings, stats)
  - [ ] Implement user management operations
  - [ ] Implement system settings CRUD
  - [ ] Add safeguards (can't delete self, can't delete last admin)
  - [ ] Initialize default system settings
- [ ] Frontend authentication
  - [ ] Create login/registration page
  - [ ] Add session check on app load
  - [ ] Handle 401/403 responses (redirect to login)
  - [ ] Add logout functionality
  - [ ] Show registration disabled message if applicable
- [ ] Frontend UI updates
  - [ ] Add user indicator in header with dropdown
  - [ ] Add privacy toggle to folder form
  - [ ] Add visual indicators (🌍 public, 🔒 private)
  - [ ] Show note ownership in public folders
  - [ ] Create user settings page (profile, password change)
  - [ ] Create admin panel page (user mgmt, settings, stats)
  - [ ] Add "Admin Panel" link to user dropdown (admin only)
- [ ] Testing
  - [ ] Test multi-user scenarios
  - [ ] Test permission boundaries
  - [ ] Test session expiration
  - [ ] Test migration from single-user
  - [ ] Test admin operations
  - [ ] Test registration limits

### Estimated Complexity: 4-6 days

**Breakdown:**
- Database schema & migrations: 0.5 day
- Backend authentication system: 1 day
- API permission logic: 1 day
- Admin panel backend: 0.5-1 day
- Frontend login/auth UI: 1 day
- Frontend privacy indicators: 0.5 day
- Admin panel UI: 1 day
- Testing & refinement: 0.5-1 day

---

## How to Run

### Option 1: Docker (Recommended for Production)

**Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

**Notes:**
- Database stored in `./data/` directory (persists across container restarts)
- To rebuild after code changes: `docker-compose up -d --build`

### Option 2: Local Development (Node.js)

**Prerequisites:** Node.js 18+ installed

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
node test-tags.js              # Tag system functionality tests
node test-tag-fixes.js         # Tag validation rules tests
```

**Note:** SQL injection protection is verified through prepared statements throughout codebase (see database.js).

All tests include automatic cleanup.

## Database Maintenance

### Repairing Database Corruption

If you encounter FTS corruption errors (`SQLITE_CORRUPT_VTAB`), run the repair script:

```bash
node fix-database.js           # Repair FTS5 table corruption
```

This script will:
- Create a backup of your database (`notecottage.db.backup`)
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
- `trashExpanded`: Boolean for "Trash" virtual folder expansion state (default: `false`)
- `sidebarWidth`: Number in pixels for sidebar width (default: `300`)

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
- Recycle bin provides safety net for accidental deletions with easy restore
- Trash folder integrates seamlessly with existing sidebar UI
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
- Resizable sidebar provides flexible workspace layout customization
- Tooltips on hover solve truncated name visibility issues elegantly
- Double-click folder expansion is intuitive and faster than clicking arrows
- Folder highlighting behavior is clean and unambiguous
- Drag-to-trash provides a natural, intuitive way to delete notes
- Cottage themes provide warm, inviting aesthetics that match the app name
- Theme system is extensible and easy to maintain with CSS custom properties
- Compact theme picker saves header space while being easy to use
- Custom favicon/branding creates a cohesive visual identity
- The cottage-with-book design perfectly symbolizes the app's purpose

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

**Session 7 (December 28, 2025):**
- ✅ **Implemented Recycle Bin** - Soft delete with restore and permanent delete capabilities
  - Added `deleted_at` column to notes table for soft delete tracking
  - All note queries now filter `WHERE deleted_at IS NULL` to exclude deleted notes
  - DELETE operation now sets `deleted_at = CURRENT_TIMESTAMP` instead of permanent deletion
  - Virtual "Trash" folder in sidebar with expand/collapse functionality
  - Shows deleted notes with "Deleted X ago" timestamps
  - Right-click context menu on trash notes to restore or permanently delete
  - Right-click Trash folder to empty all deleted notes at once
  - Read-only view for trash notes (prevents accidental editing)
  - Trash state persists in localStorage
  - Comprehensive API endpoints:
    - `GET /api/trash` - List all deleted notes
    - `PUT /api/trash/:id/restore` - Restore specific note
    - `DELETE /api/trash/:id` - Permanently delete specific note
    - `DELETE /api/trash` - Empty entire trash
  - Updated delete confirmation to mention trash and restore capability
  - Automatic trash count badge on Trash folder
- ✅ **Git Integration** - Initialized version control for project
  - Created `.gitignore` to exclude node_modules, database files, and IDE folders
  - Initial commit with all source files
  - Configured git user identity

**Session 8 (December 28, 2025):**
- ✅ **Tooltips for truncated names** - Improved visibility of long folder/note names
  - Added `title` attributes to all folder and note name elements
  - Shows full name on hover when text is truncated with ellipsis
  - Applied to regular folders, virtual folders, and all note titles
- ✅ **Resizable Sidebar** - Adjustable sidebar width for better workspace control
  - Implemented 5px drag handle between sidebar and editor
  - Smooth drag interaction with visual feedback (blue highlight)
  - Enforces min/max width constraints (200px - 600px)
  - Persists user's preferred width to localStorage
  - Prevents text selection during drag operation
- ✅ **Simplified note selection highlighting** - Removed parent folder highlighting
  - When a note is selected, only the note itself is highlighted (not parent folder)
  - Folder tree still expands to show the note's location
  - Breadcrumb still displays the folder path
  - Clearer visual feedback showing exactly what is selected
  - Fixed "All Notes" folder to only highlight when explicitly clicked, not when viewing notes
- ✅ **Double-click folder expansion** - More intuitive folder interaction
  - Double-click any folder to toggle its expand/collapse state
  - Works on "All Notes", "Trash", and all regular folders
  - Alternative to clicking the arrow icon for faster navigation
- ✅ **Drag-to-trash functionality** - Quick note deletion via drag-and-drop
  - Drag notes directly to the Trash folder to delete them
  - Performs soft delete (sets deleted_at timestamp)
  - Visual drop indicator when hovering over Trash
  - Closes editor if viewing the deleted note
  - Trash only accepts notes (not folders)
- ✅ **Comprehensive Theme System** - Four distinct themes with warm cottage aesthetics
  - Added two new cottage themes alongside original light/dark
  - Cottage: Warm browns, creams, honey gold accents with 6px rounded corners
  - Cottage Dark: Cozy dark theme with warm tones (cabin at night feel)
  - Replaced wide dropdown with compact "Theme" button
  - Floating theme menu with elevated shadow (drops down with z-depth)
  - Fixed high-contrast menu colors for readability across all themes
  - Active theme indicator in menu
  - All themes use CSS custom properties for easy extension
- ✅ **Favicon and Branding** - Custom visual identity for NoteCottage
  - Created custom favicon featuring cozy cabin with open book
  - Steam from chimney flowing into book symbolizes knowledge and ideas
  - Color palette matches Cottage theme (warm browns, tans, terracotta)
  - Added favicon link to HTML for browser tab display
  - Original PNG artwork stored in public/images/

**Session 9 (December 29, 2025):**
- ✅ **Strategic Planning** - Defined long-term roadmap and deployment strategy
  - Established vision as self-hosted, small-scale collaborative tool (Mealie-style)
  - Decided on hybrid shared/private multi-user model (2-5 users)
  - Prioritized Dockerization as foundation for all deployment scenarios
  - Documented mobile strategy: PWA first, then optional native app
  - Updated PROJECT_STATUS.md with comprehensive implementation roadmap
- ✅ **Dockerization (COMPLETE)** - Container-based deployment foundation
  - ✅ Created `.dockerignore` to exclude unnecessary files from image
  - ✅ Created `Dockerfile` with Node.js 20 Alpine base image
    - Multi-stage build pattern for optimal image size
    - Non-root user for security (runs as `node` user)
    - Creates `/app/data` directory for database persistence
    - Exposes port 3000
  - ✅ Created `docker-compose.yml` for easy deployment
    - Volume mount for database persistence (`./data:/app/data`)
    - Environment variable configuration (PORT, DATABASE_PATH)
    - Auto-restart policy
    - Health check for container monitoring
    - Removed obsolete `version` field (Docker Compose v2 compatibility)
  - ✅ Made application Docker-ready
    - Updated `database.js:9` to use `DATABASE_PATH` environment variable
    - Updated `server.js:15` to use `PORT` environment variable
    - Both fallback to local defaults for non-Docker development
  - ✅ **File Audit & Cleanup** - Optimized git and Docker distributions
    - Audited all project files and categorized by purpose
    - Updated `.gitignore` to exclude Docker data directory
    - Refined `.dockerignore` to minimize image size:
      - Excludes documentation (PROJECT_STATUS.md, etc.)
      - Excludes test files (test-*.js, fix-database.js)
      - Excludes IDE files (.claude/, .vscode/)
      - Final image size: ~180MB (node:20-alpine base + 101 npm packages)
  - ✅ **Docker Testing & Validation** - All tests passed successfully
    - ✅ Built Docker image successfully (Docker v29.1.3, Compose v2.40.3)
    - ✅ Container starts and runs with healthy status
    - ✅ Application accessible at http://localhost:3000
    - ✅ Database migrations run automatically on first start
    - ✅ Database persistence verified across container restarts
    - ✅ Volume mount working correctly (`./data/notecottage.db` on host)
    - ✅ Health check passes (container reports healthy status)
    - ✅ WAL mode database files persist correctly (db, db-shm, db-wal)

**Session 10 (December 29, 2025):**
- ✅ **Multi-User Support (IN PROGRESS)** - Session-based authentication with hybrid shared/private folders
  - ✅ **Database Schema Updates**
    - Added `users` table (id, username, email, password_hash, display_name, is_admin, created_at)
    - Added `system_settings` table (key-value storage for app configuration)
    - Added `user_id` column to notes and folders tables (ownership tracking)
    - Added `is_public` boolean to folders table (shared vs private)
    - Per-user Uncategorized folders created automatically on registration
    - First registered user becomes admin automatically
  - ✅ **Authentication System**
    - express-session with SQLite store for persistent sessions
    - bcrypt password hashing (cost factor 12)
    - Session middleware with 30-day cookie lifetime
    - Auth endpoints: register, login, logout, /api/auth/me, profile
    - Middleware: requireAuth, requireAdmin, attachUser
    - Proper session management with secure cookies in production
  - ✅ **API Permission Enforcement**
    - getAllFoldersForUser() filters folders by visibility (public + owned private)
    - Permission checking functions: canUserAccessFolder/Note, canUserModifyFolder/Note
    - All folder/note endpoints protected with requireAuth middleware
    - Create/update/delete operations validate ownership
    - Shared folders (is_public=1) visible and editable by all users
    - Private folders (is_public=0) visible only to owner
  - ✅ **Admin Panel Backend**
    - 7 admin-only endpoints for user and settings management
    - User management: list users, create user, update user, delete user
    - System settings: get/update registration toggle, max users limit
    - Statistics endpoint: user count, note count, folder count
    - Safeguards: can't delete self, can't delete last admin
  - ✅ **Frontend Authentication UI**
    - Created login.html with styled login/registration forms
    - Password strength indicator with visual feedback
    - First-user detection (automatically shows registration for admin account)
    - Form validation and error/success messaging
    - Automatic redirect after successful login/registration
  - ✅ **Frontend Privacy Indicators**
    - Folder form includes public/private checkbox with preview badge
    - Visual badges in folder tree (🌍 for shared, 🔒 for private)
    - User dropdown menu showing current username
    - Theme picker consolidated into user menu
    - Profile and logout options in user menu
    - Admin panel button (visible only to admins)
  - ✅ **UX Fixes**
    - Fixed folder selection toggle (click twice to deselect)
    - Fixed root-level folder creation when "All Notes" is selected
    - Fixed user dropdown menu visibility using CSS classes
    - Consolidated theme picker into user dropdown to reduce header clutter
  - ⏳ **Remaining Tasks**
    - Build admin panel UI (user management, settings, statistics)
    - Comprehensive multi-user testing (permissions, sessions, admin features)

### Areas to Explore
If continuing development, consider:
1. **Graph View** - Visual network of linked notes (now possible with wiki-links)
2. **Additional Themes** - Easy to add more themes using CSS custom properties
3. **Image Support** - Images within notes and possibly standalone image notes with tags (medium complexity, high value)
4. **Security Hardening** - CSRF protection, rate limiting, input validation for production deployment
5. **Keyboard Shortcuts for Folders** - Arrow keys to navigate tree, Enter to open
6. **Create from Broken Link** - Click broken wiki-link to create that note

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
- **Soft delete pattern** (deleted_at timestamp for recycle bin functionality)
- **Virtual folders** (UI-only folders like "All Notes" and "Trash" without database entries)
- **Docker containerization** (Dockerfile, docker-compose, multi-stage builds, volume mounts)
- **Container orchestration** (environment variables, health checks, restart policies)
- **Database persistence in containers** (volume mounting for stateful applications)

**Comparison to Flask:** Very similar patterns, but Node.js is async by default, uses CommonJS modules, and has different idioms for routing and middleware. SQLite operations in Node.js (better-sqlite3) are synchronous unlike typical async database libraries.

---

**Status:** NoteCottage is feature-rich and production-ready for single-user personal use. Core features complete: traditional file-browser UI with inline notes, drag-and-drop, nested folders, wiki-links with autocomplete, backlinks panel, tags with autocomplete, note export, full-text search, status bar with breadcrumbs, autosave with preview integration, recycle bin with restore capability, resizable sidebar, tooltips for truncated names, comprehensive theme system with four distinct themes (Light, Dark, Cottage, Cottage Dark). Database corruption issues resolved with WAL mode and graceful shutdown handlers. Version control initialized with git. **Dockerization complete:** Application now fully containerized with Docker support - tested and validated with database persistence, health checks, and production-ready configuration. **Multi-user support IN PROGRESS:** Session-based authentication implemented with hybrid shared/private folder model - database schema, auth system, API permissions, and frontend UI complete; admin panel UI and comprehensive testing remaining. **Next steps in roadmap:** Complete multi-user implementation (admin panel UI, testing), production-ready infrastructure (nginx reverse proxy, SSL/TLS), PWA for mobile access.
