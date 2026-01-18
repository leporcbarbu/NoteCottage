# Roadmap

Features and improvements I'm considering. Not all of these will happen - just ideas I'm exploring.

## Recently Completed (v1.3.2)

**Markdown & Caching Fixes**
- ✅ GFM line breaks: Single Enter now creates line breaks in preview
- ✅ Service worker caching strategy: Network-first for code, network-only for API
- ✅ Folder context menu: "New Note" option for quick note creation
- ✅ Quiet notifications: No more "saved" toast when switching notes

**Testing & Quality (v1.3.0)**
- ✅ Comprehensive test suite: 66 tests with 40% coverage
- ✅ CI/CD pipeline: GitHub Actions running on every commit
- ✅ Bug fixes: Note permissions, folder deletion, restore auth

**Session & Admin (v1.3.1)**
- ✅ Session persistence: Remembers last opened note
- ✅ Admin panel version display and force reload button

**UX & Mobile Improvements (v1.2.1)**
- ✅ Note count badges: Shows total notes in folders (including subfolders)
- ✅ Context menus for notes: Right-click or long-press to delete notes
- ✅ Mobile long-press support: 500ms press with haptic feedback for all menus
- ✅ Improved sidebar readability: Removed timestamps, more room for note titles
- ✅ Enhanced contrast: Darker badge colors, better inline code visibility
- ✅ Dark theme code blocks: Now match page background instead of blue-gray
- ✅ Unified menu system: All context menus use consistent styling

**Wiki-Link Enhancements (v1.2.0)**
- ✅ Link aliases: `[[Note Title|Display Text]]` - documented existing feature
- ✅ Heading links: `[[Note#Section]]` - documented existing feature
- ✅ Combined syntax: `[[Note#Section|Display]]` - works perfectly
- ✅ Heading autocomplete: Type `[[Note#` to see heading suggestions
- ✅ Fixed broken link + alias bug: Clicking `[[Missing|Alias]]` now creates "Missing", not "Alias"
- ✅ Enhanced autocomplete with caching and better UX

## Next Up

**Polish**
- [ ] Keyboard shortcuts in tooltips ("Save (Ctrl+S)")
- [ ] Update Docker Hub README
- [ ] Test PWA on actual phones (Android/iOS)
- [ ] PWA splash screen testing (need HTTPS)

**UX**
- [ ] Enhanced word count with character count and reading time
- [ ] Sort notes by "last updated" instead of just alphabetical

## Considering

**Search & Discovery**
- [ ] Search filters (by folder, date, tags)
- [ ] Graph view of wiki-links (visual network diagram)
- [ ] "Did you mean..." suggestions for broken links (fuzzy matching)

**Navigation**
- [ ] Note history stack (back/forward navigation when following wiki-links)
- [ ] Close button for notes (returns to previous note in stack)
- [ ] Keyboard shortcuts for back/forward (Alt+Left/Right arrows)
- [ ] Tab interface for desktop (multiple notes open simultaneously)
- [ ] Keyboard shortcuts for folders (arrow keys, enter to expand)
- [ ] Pin/favorite notes
- [ ] Recent notes list (last 5-10)
- [ ] Folder color coding

**Note Features**
- [ ] Note renaming with automatic wiki-link updates
  - Allow editing note titles after creation
  - Automatically update all `[[Old Title]]` references across all notes
  - Handle aliases, heading links, and combined syntax
  - Prevents orphaned links when organizing notes
- [ ] Templates (built-in + custom)
- [ ] Interactive checkboxes in Markdown (`- [ ]` becomes clickable)
- [ ] Note history/versioning with diffs
- [ ] Auto-suggest related notes
- [ ] Duplicate detection

**Import/Export**
- [ ] Bulk import Markdown files with folders
- [ ] Export folder as ZIP
- [ ] DOCX export
- [ ] Import from Obsidian/Notion

**Themes**
- [ ] More color themes (Forest, Ocean, Sunset, Solarized)
- [ ] Custom theme creator
- [ ] Font preferences (size, family)
- [ ] Editor width settings

**Collaboration**
- [ ] Share note as read-only link with expiration
- [ ] Real-time collaborative editing
- [ ] Comments on notes
- [ ] @mentions

## Maybe Someday

**Advanced**
- [ ] Note encryption (per-note with master password)
- [ ] Kanban board view
- [ ] Calendar view for dated notes
- [ ] Mind map visualization
- [ ] Daily notes (auto-create daily note)
- [ ] Stats dashboard (growth over time, most linked notes, etc.)

**Mobile**
- [ ] Native mobile app
- [ ] Swipe gestures
- [ ] Better mobile editor

**API & Integrations**
- [ ] REST API
- [ ] Webhooks
- [ ] Browser extension for web clipping
- [ ] Email-to-note

**Performance**
- [ ] Lazy loading and virtual scrolling
- [ ] Optimization for 10k+ notes
- [ ] Image lazy loading
- [ ] Search pagination

**Security**
- [ ] CSRF protection
- [ ] Two-factor auth
- [ ] Session timeout config
- [ ] Rate limiting

**DevOps**
- [ ] Automated backups
- [ ] Health check endpoint
- [ ] Kubernetes deployment guide

## Not Planning

- Cloud sync (use git or file sync)
- AI content generation
- Social media integration
- Analytics/tracking (privacy first)

## Exploring

- [ ] OCR for images
- [ ] Audio recording/transcription
- [ ] Diagram support (mermaid, PlantUML)
- [ ] Excalidraw integration
- [ ] Publish notes to static site

---

Open an issue on GitHub to suggest features or join the discussion. Last updated January 17, 2026.
