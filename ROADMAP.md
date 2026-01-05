# NoteCottage Roadmap

This document outlines planned features, improvements, and fixes for future development.

## Priority: High (Next Release)

### Bug Fixes & Polish
- [ ] Add note count badge to "All Notes" virtual folder (e.g., "All Notes (47)")
- [ ] Add keyboard shortcuts to button tooltips ("Save (Ctrl+S)", "New Note (Ctrl+N)", etc.)
- [ ] Update Docker Hub README with latest documentation
- [ ] Real-world mobile testing on physical Android/iOS devices
- [ ] PWA splash screen testing (requires HTTPS production deployment)

### UX Improvements
- [ ] Enhanced word count area with toggle for:
  - Character count
  - Reading time estimate
  - Word count (current)
- [ ] "Last Updated" sorting option for notes
  - Show most recently edited notes at top
  - Add sort toggle (alphabetical vs. last updated)

## Priority: Medium (Future Releases)

### Search & Discovery
- [ ] Search filters:
  - Filter by folder
  - Filter by date range
  - Filter by tag combinations
- [ ] Graph view of wiki-link connections
  - Visual network diagram
  - Clickable nodes to navigate
  - Zoom and pan controls

### Wiki-Link Enhancements
- [ ] Wiki-link aliases: `[[Actual Note|Display Text]]`
- [ ] Heading links: `[[Note Title#Section Heading]]`
- [ ] Show broken link suggestions (did you mean...)

### Navigation & Organization
- [ ] Keyboard shortcuts for folder navigation
  - Arrow keys to move between folders
  - Enter to expand/collapse
  - Shortcuts listed in help dialog
- [ ] Folder color coding or custom themes per folder
- [ ] Pin/favorite notes for quick access
- [ ] Recent notes list (last 5-10 accessed)

### Note Features
- [ ] Note templates system:
  - Built-in templates (Meeting Notes, Daily Journal, Project Planning)
  - User-created custom templates
  - Template selector when creating new note
  - Save any note as template
- [ ] Interactive checklists in Markdown:
  - `- [ ]` renders as clickable checkbox
  - `- [x]` renders as checked with strikethrough
  - Progress indicator (3/10 tasks complete)
  - Auto-save checkbox state
- [ ] Note history/versioning:
  - Track changes over time
  - Restore old versions
  - View diff between versions
- [ ] Note linking suggestions (auto-suggest related notes)
- [ ] Duplicate note detection

### Import/Export
- [ ] Bulk import of Markdown files with folder structure preservation
- [ ] Export entire folder as ZIP
- [ ] Additional export formats:
  - DOCX (Word document)
  - JSON (structured data)
  - Plain text with frontmatter
- [ ] Import from other note apps (Obsidian, Notion, etc.)

### Themes & Customization
- [ ] Additional color themes:
  - Forest (greens and earth tones)
  - Ocean (blues and teals)
  - Sunset (oranges and purples)
  - Solarized Light/Dark
- [ ] Custom theme creator (user-defined colors)
- [ ] Font size preferences
- [ ] Font family selection (system, serif, monospace)
- [ ] Editor width preferences

### Collaboration & Sharing
- [ ] Share note as read-only link (with expiration)
- [ ] Real-time collaborative editing (operational transforms or CRDTs)
- [ ] Comments on notes
- [ ] Note change notifications for shared folders
- [ ] @mentions for users

## Priority: Low (Nice to Have)

### Advanced Features
- [ ] Note encryption for sensitive content
  - Per-note encryption toggle
  - Master password
  - Encrypted content not searchable
- [ ] Kanban board view for task management
- [ ] Calendar view for date-tagged notes
- [ ] Mind map visualization
- [ ] Daily notes (automatic daily note creation)
- [ ] Note statistics dashboard:
  - Total notes, words, characters
  - Growth over time
  - Most linked notes
  - Most used tags

### Mobile App
- [ ] Native mobile app (React Native or similar)
- [ ] Mobile-specific gestures (swipe to delete, etc.)
- [ ] Better mobile editor experience

### Integration & API
- [ ] REST API for third-party integrations
- [ ] Webhook support for automation
- [ ] Zapier/IFTTT integration
- [ ] Browser extension for web clipping
- [ ] Email-to-note functionality

### Performance & Optimization
- [ ] Lazy loading for large note lists
- [ ] Virtual scrolling for folders with 100+ notes
- [ ] Database optimization for 10,000+ notes
- [ ] Image optimization and lazy loading
- [ ] Search result pagination

### Security Enhancements
- [ ] CSRF protection for production deployments
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout configuration
- [ ] IP-based access restrictions
- [ ] Audit log for admin actions
- [ ] Rate limiting for API endpoints

### DevOps & Deployment
- [ ] Automated backups (scheduled database exports)
- [ ] Health check endpoint for monitoring
- [ ] Metrics/analytics (optional, privacy-focused)
- [ ] Docker Swarm / Kubernetes deployment guide
- [ ] Nginx reverse proxy configuration examples
- [ ] Let's Encrypt SSL automation guide

## Community Requested Features

*This section will be updated based on GitHub issues and user feedback*

- [ ] Feature request tracking goes here

## Won't Do (Out of Scope)

These features are intentionally not planned:

- **Cloud sync service** - NoteCottage is self-hosted, use git or file sync instead
- **AI content generation** - Keep notes authentic and user-created
- **Blockchain/NFT features** - Not relevant to note-taking
- **Social media integration** - Privacy-focused, local-first design
- **Analytics tracking** - Respect user privacy

## Ideas Under Consideration

Features being evaluated for feasibility and fit:

- [ ] Browser-based OCR for images (extract text from screenshots)
- [ ] Audio note recording and transcription
- [ ] Diagram support (mermaid.js, PlantUML)
- [ ] Excalidraw integration for drawings
- [ ] Code block syntax highlighting themes
- [ ] Note publishing to static site

---

**How to Contribute:**
- Open an issue on GitHub to suggest features
- Vote on existing feature requests
- Submit pull requests for features you've implemented
- Join discussions about roadmap priorities

**Last Updated:** January 4, 2026
