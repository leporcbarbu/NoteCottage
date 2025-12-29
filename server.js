// Import required modules (like Python's import statements)
const express = require('express');
const path = require('path');
const { marked } = require('marked');

// Import our database module (like: from database import get_all_notes, etc.)
const db = require('./database');

// Import wiki-link extension for marked.js
const wikiLinkExtension = require('./public/js/wikilink-extension');

// Create Express app (equivalent to Flask's app = Flask(__name__))
const app = express();
// Use PORT environment variable if set (for Docker/production), otherwise default to 3000
const PORT = process.env.PORT || 3000;

// Middleware - similar to Flask's before_request or app.config
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory

// Helper function to render markdown with wiki-links
function renderMarkdownWithWikiLinks(content, titleMap) {
    // Create custom renderer for wiki-links
    const renderer = (token) => {
        const key = token.noteTitle.toLowerCase();
        const targetNote = titleMap.get(key);

        if (targetNote) {
            // Valid link - render as clickable anchor
            return `<a href="#" class="wiki-link" data-note-id="${targetNote.id}">${token.displayText}</a>`;
        } else {
            // Broken link - render as grayed out span
            return `<span class="wiki-link-broken" title="Note not found">${token.displayText}</span>`;
        }
    };

    // Create extension with custom renderer
    const extension = {
        ...wikiLinkExtension,
        renderer
    };

    // Configure marked with the extension
    marked.use({ extensions: [extension] });

    // Render markdown to HTML
    return marked(content);
}

// Routes (similar to Flask's @app.route decorators)

// GET / - Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /api/notes - List all notes
app.get('/api/notes', (req, res) => {
    try {
        const notes = db.getAllNotes();

        // Format notes for the frontend
        const formattedNotes = notes.map(note => ({
            id: note.id.toString(), // Convert to string for consistency with old file-based IDs
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting notes:', error);
        res.status(500).json({ error: 'Failed to read notes' });
    }
});

// GET /api/notes/:id - Get a specific note
app.get('/api/notes/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const note = db.getNoteById(noteId);

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Get tags for this note
        const tags = db.getTagsForNote(noteId).map(tag => tag.name);

        // Build title map for wiki-link resolution
        const titleMap = db.getNotesTitleMap();

        res.json({
            id: note.id.toString(),
            title: note.title,
            content: note.content,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            html: renderMarkdownWithWikiLinks(note.content, titleMap), // Convert markdown to HTML with wiki-links
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: tags
        });
    } catch (error) {
        console.error('Error getting note:', error);
        res.status(500).json({ error: 'Failed to read note' });
    }
});

// GET /api/notes/:id/backlinks - Get notes that link to this note
app.get('/api/notes/:id/backlinks', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const targetNote = db.getNoteById(noteId);
        if (!targetNote) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Get all notes to search for wiki-links
        const allNotes = db.getAllNotes();
        const wikiLinkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
        const targetTitleLower = targetNote.title.toLowerCase();
        const backlinks = [];

        allNotes.forEach(note => {
            // Skip the target note itself
            if (note.id === noteId) return;

            // Get full note content
            const fullNote = db.getNoteById(note.id);
            if (!fullNote || !fullNote.content) return;

            // Extract wiki-link targets from content
            const matches = fullNote.content.matchAll(wikiLinkPattern);
            for (const match of matches) {
                const linkTarget = match[1].trim().toLowerCase();
                if (linkTarget === targetTitleLower) {
                    backlinks.push({
                        id: fullNote.id.toString(),
                        title: fullNote.title
                    });
                    break; // Only add once per note
                }
            }
        });

        res.json(backlinks);
    } catch (error) {
        console.error('Error getting backlinks:', error);
        res.status(500).json({ error: 'Failed to get backlinks' });
    }
});

// POST /api/notes - Create a new note
app.post('/api/notes', (req, res) => {
    try {
        const { title, content, folder_id } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Parse folder_id if provided, otherwise default to 1 (Uncategorized)
        const folderId = folder_id ? parseInt(folder_id) : 1;

        const newNote = db.createNote(title, content, folderId);

        res.status(201).json({
            id: newNote.id.toString(),
            title: newNote.title,
            message: 'Note created successfully'
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PUT /api/notes/:id - Update a note
app.put('/api/notes/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { content } = req.body;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const updated = db.updateNote(noteId, content);

        if (!updated) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            id: noteId.toString(),
            message: 'Note updated successfully'
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE /api/notes/:id - Delete a note (soft delete - moves to trash)
app.delete('/api/notes/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const deleted = db.deleteNote(noteId);

        if (!deleted) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ message: 'Note moved to trash' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// GET /api/trash - Get all deleted notes
app.get('/api/trash', (req, res) => {
    try {
        const deletedNotes = db.getDeletedNotes();

        const formattedNotes = deletedNotes.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            deleted_at: note.deleted_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting trash:', error);
        res.status(500).json({ error: 'Failed to get trash' });
    }
});

// PUT /api/trash/:id/restore - Restore a note from trash
app.put('/api/trash/:id/restore', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const restored = db.restoreNote(noteId);

        if (!restored) {
            return res.status(404).json({ error: 'Note not found in trash' });
        }

        res.json({ message: 'Note restored successfully' });
    } catch (error) {
        console.error('Error restoring note:', error);
        res.status(500).json({ error: 'Failed to restore note' });
    }
});

// DELETE /api/trash/:id - Permanently delete a note
app.delete('/api/trash/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const deleted = db.permanentlyDeleteNote(noteId);

        if (!deleted) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ message: 'Note permanently deleted' });
    } catch (error) {
        console.error('Error permanently deleting note:', error);
        res.status(500).json({ error: 'Failed to permanently delete note' });
    }
});

// DELETE /api/trash - Empty trash (permanently delete all notes in trash)
app.delete('/api/trash', (req, res) => {
    try {
        const deletedCount = db.emptyTrash();

        res.json({
            message: `Trash emptied successfully`,
            count: deletedCount
        });
    } catch (error) {
        console.error('Error emptying trash:', error);
        res.status(500).json({ error: 'Failed to empty trash' });
    }
});

// GET /api/search - Search notes (NEW FEATURE!)
app.get('/api/search', (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = db.searchNotes(query);

        const formattedResults = results.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Error searching notes:', error);
        res.status(500).json({ error: 'Failed to search notes' });
    }
});

// GET /api/tags - Get all tags with usage counts
app.get('/api/tags', (req, res) => {
    try {
        const tags = db.getAllTags();
        res.json(tags);
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({ error: 'Failed to get tags' });
    }
});

// GET /api/tags/:tagName/notes - Get notes filtered by tag
app.get('/api/tags/:tagName/notes', (req, res) => {
    try {
        const tagName = req.params.tagName;
        const notes = db.getNotesByTag(tagName);

        const formattedNotes = notes.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting notes by tag:', error);
        res.status(500).json({ error: 'Failed to get notes by tag' });
    }
});

// DELETE /api/tags/:tagName - Delete a tag (only if unused)
app.delete('/api/tags/:tagName', (req, res) => {
    try {
        const tagName = req.params.tagName;

        // Check if tag is in use
        const tag = db.getAllTags().find(t => t.name === tagName);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        if (tag.count > 0) {
            return res.status(400).json({ error: 'Cannot delete tag that is in use' });
        }

        db.deleteTag(tagName);
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

// GET /api/folders - Get folder tree
app.get('/api/folders', (req, res) => {
    try {
        const folders = db.getAllFolders();
        const tree = db.buildFolderTree(folders);
        res.json(tree);
    } catch (error) {
        console.error('Error getting folders:', error);
        res.status(500).json({ error: 'Failed to get folders' });
    }
});

// GET /api/folders/:id - Get single folder with metadata
app.get('/api/folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        const folder = db.getFolderById(folderId);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Get note count for this folder (non-recursive)
        const noteCount = db.getNoteCountByFolder(folderId);

        res.json({
            ...folder,
            id: folder.id.toString(),
            parent_id: folder.parent_id ? folder.parent_id.toString() : null,
            noteCount
        });
    } catch (error) {
        console.error('Error getting folder:', error);
        res.status(500).json({ error: 'Failed to get folder' });
    }
});

// POST /api/folders - Create new folder
app.post('/api/folders', (req, res) => {
    try {
        const { name, parent_id, icon } = req.body;
        console.log('Server received folder create request:', { name, parent_id, icon });

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Validate parent exists if provided
        if (parent_id) {
            const parentExists = db.getFolderById(parseInt(parent_id));
            if (!parentExists) {
                return res.status(400).json({ error: 'Parent folder not found' });
            }
        }

        const newFolder = db.createFolder(name.trim(), parent_id, null, icon);

        res.status(201).json({
            id: newFolder.id.toString(),
            name: newFolder.name,
            message: 'Folder created successfully'
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// PUT /api/folders/:id - Update folder
app.put('/api/folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { name, parent_id, icon } = req.body;

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        // Prevent moving folder into itself or its descendants
        if (parent_id) {
            const parentIdInt = parseInt(parent_id);
            if (db.isDescendant(parentIdInt, folderId)) {
                return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' });
            }
        }

        const updated = db.updateFolder(folderId, name, parent_id, null, icon);

        if (!updated) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json({
            id: folderId.toString(),
            message: 'Folder updated successfully'
        });
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// DELETE /api/folders/:id - Delete folder and cascade to notes
app.delete('/api/folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        // Prevent deletion of Uncategorized folder
        if (folderId === 1) {
            return res.status(400).json({ error: 'Cannot delete Uncategorized folder' });
        }

        const deleted = db.deleteFolder(folderId);

        if (!deleted) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// PUT /api/folders/:id/reorder - Reorder folder (change position and/or parent)
app.put('/api/folders/:id/reorder', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { new_position, parent_id } = req.body;

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        if (typeof new_position !== 'number' || new_position < 0) {
            return res.status(400).json({ error: 'Invalid position' });
        }

        // Prevent reordering Uncategorized folder
        if (folderId === 1) {
            return res.status(400).json({ error: 'Cannot reorder Uncategorized folder' });
        }

        // Validate folder exists
        const folder = db.getFolderById(folderId);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Validate parent exists if provided
        let parentIdInt = null;
        if (parent_id !== undefined && parent_id !== null) {
            parentIdInt = parseInt(parent_id);
            const parentExists = db.getFolderById(parentIdInt);
            if (!parentExists) {
                return res.status(400).json({ error: 'Parent folder not found' });
            }

            // Prevent circular dependency
            if (db.isDescendant(parentIdInt, folderId)) {
                return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' });
            }
        }

        // Call reorder function
        db.reorderFolderFunc(folderId, new_position, parentIdInt);

        res.json({
            id: folderId.toString(),
            message: 'Folder reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering folder:', error);
        res.status(500).json({ error: error.message || 'Failed to reorder folder' });
    }
});

// GET /api/folders/:id/notes - Get notes in folder (non-recursive)
app.get('/api/folders/:id/notes', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        const notes = db.getNotesByFolder(folderId);

        const formattedNotes = notes.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting notes by folder:', error);
        res.status(500).json({ error: 'Failed to get notes by folder' });
    }
});

// PUT /api/notes/:id/move - Move note to different folder
app.put('/api/notes/:id/move', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { folder_id } = req.body;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        // Validate folder exists
        if (folder_id && !db.getFolderById(parseInt(folder_id))) {
            return res.status(400).json({ error: 'Target folder not found' });
        }

        const updated = db.moveNoteToFolder(noteId, folder_id);

        if (!updated) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            id: noteId.toString(),
            message: 'Note moved successfully'
        });
    } catch (error) {
        console.error('Error moving note:', error);
        res.status(500).json({ error: 'Failed to move note' });
    }
});

// PUT /api/notes/:id/reorder - Reorder note (change folder and position)
app.put('/api/notes/:id/reorder', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { folder_id, position } = req.body;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        if (typeof position !== 'number' || position < 0) {
            return res.status(400).json({ error: 'Invalid position' });
        }

        // Validate folder exists
        if (folder_id && !db.getFolderById(parseInt(folder_id))) {
            return res.status(400).json({ error: 'Target folder not found' });
        }

        const updated = db.reorderNote(noteId, folder_id, position);

        if (!updated) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            id: noteId.toString(),
            message: 'Note reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering note:', error);
        res.status(500).json({ error: 'Failed to reorder note' });
    }
});

// Start server (like Flask's app.run())
app.listen(PORT, () => {
    console.log(`NoteCottage server running on http://localhost:${PORT}`);
    console.log(`Database: SQLite (notecottage.db)`);
    console.log(`Using full-text search for better searching!`);
    console.log(`Tags support enabled!`);
});
