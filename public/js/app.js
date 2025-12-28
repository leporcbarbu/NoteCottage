// State management
let currentNoteId = null;
let notes = [];
let isEditMode = true;
let currentNoteData = null; // Store current note data including timestamps

// Folder state
let folders = [];
let currentFolderId = null;
let expandedFolders = new Set();
let allNotesExpanded = false; // Virtual "All Notes" folder state

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Date formatting utilities with timezone localization

// Helper function to parse SQLite UTC timestamps correctly
function parseUTCDate(dateString) {
    // SQLite returns timestamps like "2025-12-26 01:08:13" which are in UTC
    // We need to explicitly tell JavaScript this is UTC by adding 'Z'
    // Replace space with 'T' for ISO 8601 format and add 'Z' for UTC
    const isoString = dateString.replace(' ', 'T') + 'Z';
    return new Date(isoString);
}

function formatRelativeTime(dateString) {
    const date = parseUTCDate(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    // For older dates, show formatted date in local timezone
    return formatLocalDate(dateString);
}

function formatLocalDate(dateString) {
    const date = parseUTCDate(dateString);
    // Uses browser's locale and timezone automatically
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFullTimestamp(dateString, label) {
    const date = parseUTCDate(dateString);
    const formattedDate = date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
    return `${label}: ${formattedDate}`;
}

// DOM elements
const notesList = document.getElementById('notesList');
const welcomeScreen = document.getElementById('welcomeScreen');
const editorScreen = document.getElementById('editorScreen');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const searchInput = document.getElementById('searchInput');
const newNoteBtn = document.getElementById('newNoteBtn');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const viewToggle = document.getElementById('viewToggle');
const exportBtn = document.getElementById('exportBtn');
const exportMenu = document.getElementById('exportMenu');
const editorView = document.getElementById('editorView');
const previewView = document.getElementById('previewView');
const previewContent = document.getElementById('previewContent');
const createdDate = document.getElementById('createdDate');
const updatedDate = document.getElementById('updatedDate');
const wordCount = document.getElementById('wordCount');
const folderLocation = document.getElementById('folderLocation');
const tagsList = document.getElementById('tagsList');
const clearTagFilter = document.getElementById('clearTagFilter');
const themeToggle = document.getElementById('themeToggle');

// Tag state
let allTags = [];
let currentTagFilter = null;
let tagAutocomplete = null;
let wikiLinkAutocomplete = null;

// Autosave state
let autosaveTimeout = null;
let hasUnsavedChanges = false;
let isAutoSaving = false;
const AUTOSAVE_DELAY = 2000; // 2 seconds after user stops typing

// Theme functions
function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update toggle button icon
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Word count function
function updateWordCount() {
    const text = noteContent.value.trim();

    if (text.length === 0) {
        wordCount.textContent = '0 words';
        return;
    }

    // Count words (split by whitespace and filter empty strings)
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCountNum = words.length;

    // Format with singular/plural
    wordCount.textContent = `${wordCountNum.toLocaleString()} ${wordCountNum === 1 ? 'word' : 'words'}`;
}

// Autosave functions
function updateSaveStatus(status) {
    // Status can be: 'saved', 'saving', 'unsaved'
    const saveIndicator = document.getElementById('saveStatus');

    if (!saveIndicator) return;

    switch (status) {
        case 'saving':
            saveIndicator.textContent = 'Saving...';
            saveIndicator.className = 'save-status saving';
            break;
        case 'saved':
            saveIndicator.textContent = 'All changes saved';
            saveIndicator.className = 'save-status saved';
            hasUnsavedChanges = false;
            break;
        case 'unsaved':
            saveIndicator.textContent = 'Unsaved changes';
            saveIndicator.className = 'save-status unsaved';
            hasUnsavedChanges = true;
            break;
        default:
            saveIndicator.textContent = '';
            saveIndicator.className = 'save-status';
    }
}

async function autoSave() {
    // Don't autosave if:
    // - No note is currently loaded (new note without save)
    // - Already autosaving
    // - In preview mode
    if (!currentNoteId || isAutoSaving || !isEditMode) {
        return;
    }

    const content = noteContent.value;

    // Don't autosave if content is empty
    if (!content.trim()) {
        return;
    }

    // Check if content actually changed
    if (currentNoteData && currentNoteData.content === content) {
        updateSaveStatus('saved');
        return;
    }

    try {
        isAutoSaving = true;
        updateSaveStatus('saving');

        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error('Failed to autosave note');
        }

        // Update current note data
        if (currentNoteData) {
            currentNoteData.content = content;
        }

        // Reload tags in case new ones were added
        await loadTags();

        // Update save status
        updateSaveStatus('saved');

        // Update the note's timestamp in the sidebar without full reload
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            // Fetch updated note to get new timestamp
            const updatedNote = await fetch(`/api/notes/${currentNoteId}`).then(r => r.json());
            note.updated_at = updatedNote.updated_at;

            // Update the inline note time display
            const noteElement = document.querySelector(`.note-item-inline[data-note-id="${currentNoteId}"]`);
            if (noteElement) {
                const timeElement = noteElement.querySelector('.note-time-inline');
                if (timeElement && updatedNote.updated_at) {
                    timeElement.textContent = formatRelativeTime(updatedNote.updated_at);
                }
            }

            // Update editor timestamp
            if (updatedNote.updated_at) {
                updatedDate.textContent = formatFullTimestamp(updatedNote.updated_at, 'Last edited');
            }
        }

    } catch (error) {
        console.error('Autosave failed:', error);
        updateSaveStatus('unsaved');
    } finally {
        isAutoSaving = false;
    }
}

function scheduleAutosave() {
    // Clear any pending autosave
    if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
    }

    // Mark as having unsaved changes
    updateSaveStatus('unsaved');

    // Schedule autosave after delay
    autosaveTimeout = setTimeout(() => {
        autoSave();
    }, AUTOSAVE_DELAY);
}

function cancelAutosave() {
    if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
        autosaveTimeout = null;
    }
}

// Backlinks functions
async function loadBacklinks(noteId) {
    const backlinksSection = document.querySelector('.backlinks-section');
    const backlinksList = document.getElementById('backlinksList');
    const backlinksCount = document.getElementById('backlinksCount');

    if (!noteId) {
        backlinksSection.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/api/notes/${noteId}/backlinks`);
        const backlinks = await response.json();

        if (backlinks.length === 0) {
            backlinksSection.style.display = 'none';
            return;
        }

        // Show section and update count
        backlinksSection.style.display = 'block';
        backlinksCount.textContent = backlinks.length;

        // Render backlinks
        backlinksList.innerHTML = '';
        backlinks.forEach(backlink => {
            const item = document.createElement('div');
            item.className = 'backlink-item';
            item.textContent = backlink.title;
            item.addEventListener('click', () => loadNote(backlink.id));
            backlinksList.appendChild(item);
        });
    } catch (error) {
        console.error('Failed to load backlinks:', error);
        backlinksSection.style.display = 'none';
    }
}

// Wiki-link functions
function buildClientTitleMap() {
    const titleMap = new Map();

    // Sort by most recent first (notes already sorted by updated_at DESC from server)
    notes.forEach(note => {
        const key = note.title.toLowerCase();
        if (!titleMap.has(key)) {
            titleMap.set(key, {
                id: note.id,
                title: note.title
            });
        }
    });

    return titleMap;
}

function configureMarkedForWikiLinks() {
    const titleMap = buildClientTitleMap();

    const renderer = (token) => {
        const key = token.noteTitle.toLowerCase();
        const targetNote = titleMap.get(key);

        if (targetNote) {
            return `<a href="#" class="wiki-link" data-note-id="${targetNote.id}">${token.displayText}</a>`;
        } else {
            return `<span class="wiki-link-broken" title="Note not found">${token.displayText}</span>`;
        }
    };

    const extension = {
        ...window.wikiLinkExtension,
        renderer
    };

    marked.use({ extensions: [extension] });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    setTheme(currentTheme);

    // Load expanded folders from localStorage
    const saved = localStorage.getItem('expandedFolders');
    if (saved) {
        expandedFolders = new Set(JSON.parse(saved));
    }

    // Load "All Notes" expanded state from localStorage (default true)
    const allNotesSaved = localStorage.getItem('allNotesExpanded');
    if (allNotesSaved !== null) {
        allNotesExpanded = JSON.parse(allNotesSaved);
    }

    loadFolders();
    loadNotes();
    loadTags();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    newNoteBtn.addEventListener('click', createNewNote);
    saveBtn.addEventListener('click', saveCurrentNote);
    deleteBtn.addEventListener('click', deleteCurrentNote);
    viewToggle.addEventListener('click', toggleView);
    searchInput.addEventListener('input', filterNotes);
    clearTagFilter.addEventListener('click', clearFilter);
    themeToggle.addEventListener('click', toggleTheme);

    // Word count update and autosave
    noteContent.addEventListener('input', () => {
        updateWordCount();

        // Schedule autosave for existing notes
        if (currentNoteId) {
            scheduleAutosave();
        }
    });

    // Export functionality
    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
    });

    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.style.display = 'none';
        }
    });

    // Handle export option clicks
    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const format = e.target.dataset.format;
            exportNote(format);
            exportMenu.style.display = 'none';
        });
    });

    // Wiki-link click handler (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('wiki-link')) {
            e.preventDefault();
            const noteId = e.target.getAttribute('data-note-id');
            if (noteId) {
                loadNote(noteId);
            }
        }
    });

    // Folder event listeners
    const newFolderBtn = document.getElementById('newFolderBtn');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', () => createNewFolder(currentFolderId));
    }
}

// Load all notes from the API
async function loadNotes() {
    try {
        let url = '/api/notes';

        // For tag filter, load filtered notes
        if (currentTagFilter) {
            url = `/api/tags/${currentTagFilter}/notes`;
        }
        // Note: we always load ALL notes for folder tree display
        // currentFolderId is only used for visual highlighting, not filtering

        const response = await fetch(url);
        notes = await response.json();

        // Re-render folder tree to show notes inline
        renderFolderTree();

        // Update wiki-link autocomplete if it's initialized
        if (wikiLinkAutocomplete) {
            wikiLinkAutocomplete.updateNotes(notes);
        }

        // Configure marked with wiki-link extension now that notes are loaded
        configureMarkedForWikiLinks();
    } catch (error) {
        console.error('Failed to load notes:', error);
        alert('Failed to load notes. Please try again.');
    }
}

// Load all tags from the API
async function loadTags() {
    try {
        const response = await fetch('/api/tags');
        allTags = await response.json();
        renderTagsList();

        // Update tag autocomplete if it's initialized
        if (tagAutocomplete) {
            const tagNames = allTags.map(tag => tag.name);
            tagAutocomplete.updateTags(tagNames);
        }
    } catch (error) {
        console.error('Failed to load tags:', error);
    }
}

// Load all folders from the API
async function loadFolders() {
    try {
        const response = await fetch('/api/folders');
        folders = await response.json();
        renderFolderTree();
    } catch (error) {
        console.error('Failed to load folders:', error);
    }
}

// Create a note element for inline display
function createNoteElement(note, depth) {
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item-inline';
    noteItem.dataset.noteId = note.id;
    noteItem.style.paddingLeft = `${depth * 20 + 12}px`;

    if (currentNoteId === note.id) {
        noteItem.classList.add('active');
    }

    const noteIcon = document.createElement('span');
    noteIcon.className = 'note-icon';
    noteIcon.textContent = '📝';

    const noteTitle = document.createElement('span');
    noteTitle.className = 'note-title-inline';
    noteTitle.textContent = note.title;

    const noteTime = document.createElement('span');
    noteTime.className = 'note-time-inline';
    if (note.updated_at) {
        noteTime.textContent = formatRelativeTime(note.updated_at);
    }

    noteItem.appendChild(noteIcon);
    noteItem.appendChild(noteTitle);
    noteItem.appendChild(noteTime);

    noteItem.addEventListener('click', () => loadNote(note.id));

    // Add drag-and-drop functionality
    noteItem.draggable = true;

    noteItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'note',
            id: note.id,
            folderId: note.folder_id || currentFolderId
        }));
        noteItem.classList.add('drag-source');
    });

    noteItem.addEventListener('dragend', (e) => {
        noteItem.classList.remove('drag-source');
    });

    return noteItem;
}

// Render folder tree in sidebar
function renderFolderTree() {
    const foldersSection = document.querySelector('.folders-section');
    const foldersContainer = document.getElementById('foldersTree');

    foldersSection.style.display = 'block';
    foldersContainer.innerHTML = '';

    // Render "All Notes" virtual folder first
    const allNotesFolder = createAllNotesFolder();
    foldersContainer.appendChild(allNotesFolder);

    // Render root folders recursively
    folders.forEach(folder => {
        const folderElement = createFolderElement(folder, 0);
        foldersContainer.appendChild(folderElement);
    });
}

// Create the virtual "All Notes" folder
function createAllNotesFolder() {
    const folderItem = document.createElement('div');
    folderItem.className = 'folder-item virtual-folder';
    folderItem.dataset.folderId = 'all-notes';
    folderItem.style.paddingLeft = '12px';

    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-header';
    if (currentFolderId === null) {
        folderHeader.classList.add('active');
    }

    const expandIcon = document.createElement('span');
    expandIcon.className = 'folder-expand-icon';
    expandIcon.textContent = allNotesExpanded ? '▼' : '▶';
    expandIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        allNotesExpanded = !allNotesExpanded;
        localStorage.setItem('allNotesExpanded', JSON.stringify(allNotesExpanded));
        renderFolderTree();
    });

    const folderIcon = document.createElement('span');
    folderIcon.className = 'folder-icon';
    folderIcon.textContent = '📚';

    const folderName = document.createElement('span');
    folderName.className = 'folder-name';
    folderName.textContent = 'All Notes';

    const noteCountBadge = document.createElement('span');
    noteCountBadge.className = 'folder-note-count';
    noteCountBadge.textContent = notes.length;

    folderHeader.appendChild(expandIcon);
    folderHeader.appendChild(folderIcon);
    folderHeader.appendChild(folderName);
    folderHeader.appendChild(noteCountBadge);

    folderHeader.addEventListener('click', () => {
        currentFolderId = null;
        currentTagFilter = null;
        clearTagFilter.style.display = 'none';
        loadNotes();
        renderFolderTree();
    });

    folderItem.appendChild(folderHeader);

    // Show notes if expanded
    if (allNotesExpanded) {
        const notesContainer = document.createElement('div');
        notesContainer.className = 'folder-notes-container';

        notes.forEach(note => {
            const noteElement = createNoteElement(note, 1);
            notesContainer.appendChild(noteElement);
        });

        folderItem.appendChild(notesContainer);
    }

    return folderItem;
}

function createFolderElement(folder, depth) {
    const folderItem = document.createElement('div');
    folderItem.className = 'folder-item';
    folderItem.dataset.folderId = folder.id;
    folderItem.style.paddingLeft = `${depth * 20 + 12}px`;

    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    // Folder header
    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-header';
    if (currentFolderId === folder.id) {
        folderHeader.classList.add('active');
    }

    // Get notes in this folder (convert both to strings for comparison)
    const folderNotes = notes.filter(note =>
        note.folder_id && String(note.folder_id) === String(folder.id)
    );
    const hasNotes = folderNotes.length > 0;
    const hasChildrenOrNotes = hasChildren || hasNotes;

    // Expand/collapse icon
    const expandIcon = document.createElement('span');
    expandIcon.className = 'folder-expand-icon';
    if (hasChildrenOrNotes) {
        expandIcon.textContent = isExpanded ? '▼' : '▶';
        expandIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFolder(folder.id);
        });
    } else {
        expandIcon.textContent = ' ';
        expandIcon.style.visibility = 'hidden';
    }

    // Folder icon
    const folderIcon = document.createElement('span');
    folderIcon.className = 'folder-icon';
    folderIcon.textContent = folder.icon || '📁';

    // Folder name
    const folderName = document.createElement('span');
    folderName.className = 'folder-name';
    folderName.textContent = folder.name;

    // Note count badge
    const noteCountBadge = document.createElement('span');
    noteCountBadge.className = 'folder-note-count';
    noteCountBadge.textContent = folder.noteCount || 0;

    // Assemble header
    folderHeader.appendChild(expandIcon);
    folderHeader.appendChild(folderIcon);
    folderHeader.appendChild(folderName);
    folderHeader.appendChild(noteCountBadge);

    // Click to select folder
    folderHeader.addEventListener('click', () => selectFolder(folder.id));

    // Add context menu for folder operations (right-click)
    folderHeader.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showFolderContextMenu(e, folder);
    });

    // Add drag-and-drop functionality (except for Uncategorized folder)
    if (folder.id !== '1') {
        folderHeader.draggable = true;

        folderHeader.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'folder',
                id: folder.id,
                parentId: folder.parent_id,
                position: folder.position
            }));
            folderHeader.classList.add('drag-source');
            dragManager.setDragElement(folderHeader);
        });

        folderHeader.addEventListener('dragend', (e) => {
            folderHeader.classList.remove('drag-source');
            dragManager.clearDropIndicators();
            dragManager.clearDragElement();
        });
    }

    // Make folder a drop target (all folders can receive drops)
    folderHeader.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        try {
            const dragDataStr = e.dataTransfer.getData('application/json');
            if (!dragDataStr) return; // getData doesn't work in dragover in some browsers

            const dragData = JSON.parse(dragDataStr);
            const position = dragManager.calculateDropPosition(e, folderHeader);

            if (dragManager.validateDrop(dragData, folder, position, folders)) {
                dragManager.showDropIndicator(folderHeader, position);
            } else {
                dragManager.showDropIndicator(folderHeader, 'invalid');
            }
        } catch (err) {
            // Ignore errors from getData in dragover
        }
    });

    folderHeader.addEventListener('dragleave', (e) => {
        // Only clear if leaving to non-child element
        if (!folderHeader.contains(e.relatedTarget)) {
            dragManager.clearDropIndicators();
        }
    });

    folderHeader.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragManager.clearDropIndicators();

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            const position = dragManager.calculateDropPosition(e, folderHeader);

            if (dragData.type === 'folder') {
                await handleFolderDrop(dragData, folder, position);
            } else if (dragData.type === 'note') {
                await handleNoteDrop(dragData, folder);
            }
        } catch (error) {
            console.error('Drop error:', error);
        }
    });

    folderItem.appendChild(folderHeader);

    // Children container (includes both child folders and notes)
    if (hasChildrenOrNotes) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'folder-children';
        childrenContainer.style.display = isExpanded ? 'block' : 'none';

        // Add notes first
        if (hasNotes) {
            folderNotes.forEach(note => {
                const noteElement = createNoteElement(note, depth + 1);
                childrenContainer.appendChild(noteElement);
            });
        }

        // Then add child folders
        if (hasChildren) {
            folder.children.forEach(child => {
                const childElement = createFolderElement(child, depth + 1);
                childrenContainer.appendChild(childElement);
            });
        }

        folderItem.appendChild(childrenContainer);
    }

    return folderItem;
}

function toggleFolder(folderId) {
    if (expandedFolders.has(folderId)) {
        expandedFolders.delete(folderId);
    } else {
        expandedFolders.add(folderId);
    }

    // Save to localStorage
    localStorage.setItem('expandedFolders', JSON.stringify([...expandedFolders]));

    renderFolderTree();
}

// Get all ancestor folder IDs for a given folder
function getAncestorFolderIds(folderId) {
    const ancestors = [];
    let currentId = folderId;

    // Recursively find parent folders
    while (currentId) {
        const folder = findFolderById(currentId, folders);
        if (!folder) break;

        ancestors.push(currentId);
        currentId = folder.parent_id;
    }

    return ancestors;
}

// Helper function to find a folder by ID in the tree
function findFolderById(folderId, folderList) {
    for (const folder of folderList) {
        if (folder.id === folderId) {
            return folder;
        }
        if (folder.children && folder.children.length > 0) {
            const found = findFolderById(folderId, folder.children);
            if (found) return found;
        }
    }
    return null;
}

// Expand folder tree to show a specific folder
function expandToFolder(folderId) {
    if (!folderId) return;

    // Get all ancestor folders
    const ancestors = getAncestorFolderIds(folderId);

    // Expand all ancestors (except the folder itself)
    ancestors.forEach(ancestorId => {
        if (ancestorId !== folderId) {
            expandedFolders.add(ancestorId);
        }
    });

    // Save to localStorage
    localStorage.setItem('expandedFolders', JSON.stringify([...expandedFolders]));
}

// Build folder breadcrumb path
function buildFolderBreadcrumb(folderId) {
    if (!folderId) {
        return '';
    }

    const ancestors = getAncestorFolderIds(folderId);
    const breadcrumbParts = [];

    // Reverse to get root-to-leaf order
    ancestors.reverse().forEach(ancestorId => {
        const folder = findFolderById(ancestorId, folders);
        if (folder) {
            breadcrumbParts.push(`${folder.icon || '📁'} ${folder.name}`);
        }
    });

    return breadcrumbParts.join(' › ');
}

// Update folder location display in status bar
function updateFolderLocation(folderId) {
    if (folderLocation) {
        const breadcrumb = buildFolderBreadcrumb(folderId);
        folderLocation.textContent = breadcrumb;
    }
}

function selectFolder(folderId) {
    currentFolderId = folderId;
    currentTagFilter = null;  // Clear tag filter
    clearTagFilter.style.display = 'none';
    loadNotes();
    renderFolderTree();  // Re-render to update active state
}

async function createNewFolder(parentId = null) {
    const form = new FolderForm();
    const modal = new Modal('Create Folder', form.render());

    modal.onSubmit(async () => {
        const data = form.getData();
        const validation = form.validate();

        if (!validation.valid) {
            form.showErrors(validation.errors);
            return;
        }

        try {
            const payload = {
                name: data.name.trim(),
                parent_id: parentId,
                icon: data.icon
            };

            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create folder');
            }

            modal.close();
            await loadFolders();
        } catch (error) {
            console.error('Error creating folder:', error);
            form.showErrors([error.message]);
        }
    });

    modal.open();
}

async function renameFolder(folderId, currentName) {
    try {
        // Fetch existing folder data
        const folder = await fetch(`/api/folders/${folderId}`).then(r => r.json());

        const form = new FolderForm({
            name: folder.name,
            icon: folder.icon
        });

        const modal = new Modal('Edit Folder', form.render());

        modal.onSubmit(async () => {
            const data = form.getData();
            const validation = form.validate();

            if (!validation.valid) {
                form.showErrors(validation.errors);
                return;
            }

            try {
                const response = await fetch(`/api/folders/${folderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name.trim(),
                        parent_id: folder.parent_id,
                        icon: data.icon
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update folder');
                }

                modal.close();
                await loadFolders();
            } catch (error) {
                console.error('Error updating folder:', error);
                form.showErrors([error.message]);
            }
        });

        modal.open();
    } catch (error) {
        console.error('Error loading folder for edit:', error);
        alert('Failed to load folder');
    }
}

async function deleteFolderFunc(folderId, folderName) {
    const confirmDelete = confirm(
        `Delete folder "${folderName}"? This will also delete all subfolders and notes inside.`
    );
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete folder');

        if (currentFolderId === folderId) {
            currentFolderId = null;
        }

        await loadFolders();
        await loadNotes();
    } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Failed to delete folder');
    }
}

function showFolderContextMenu(event, folder) {
    const menuItems = [
        {
            label: `New Subfolder in "${folder.name}"`,
            icon: '+',
            action: () => createNewFolder(folder.id)
        },
        {
            label: `Edit "${folder.name}"`,
            icon: '✏️',
            action: () => renameFolder(folder.id, folder.name)
        }
    ];

    // Only show delete option if not Uncategorized folder
    if (folder.id !== '1') {
        menuItems.push({
            separator: true
        });
        menuItems.push({
            label: `Delete "${folder.name}"`,
            icon: '🗑️',
            danger: true,
            action: () => deleteFolderFunc(folder.id, folder.name)
        });
    }

    contextMenu.show(event.clientX, event.clientY, menuItems);
}

function showTagContextMenu(event, tag) {
    const menuItems = [
        {
            label: `Delete tag "#${tag.name}"`,
            icon: '🗑️',
            danger: true,
            action: () => deleteTagFunc(tag.name)
        }
    ];

    contextMenu.show(event.clientX, event.clientY, menuItems);
}

async function deleteTagFunc(tagName) {
    const confirmDelete = confirm(
        `Delete tag "#${tagName}"? This tag is not being used by any notes.`
    );
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/api/tags/${encodeURIComponent(tagName)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete tag');
        }

        await loadTags();
    } catch (error) {
        console.error('Error deleting tag:', error);
        alert('Failed to delete tag: ' + error.message);
    }
}

// Render tags list in sidebar
function renderTagsList() {
    const tagsSection = document.querySelector('.tags-section');

    if (allTags.length === 0) {
        // Hide the entire tags section when there are no tags
        tagsSection.style.display = 'none';
        return;
    }

    // Show tags section when tags exist
    tagsSection.style.display = 'block';
    tagsList.innerHTML = '';

    allTags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        if (currentTagFilter === tag.name) {
            badge.classList.add('active');
        }

        badge.innerHTML = `#${tag.name} <span class="tag-count">${tag.count}</span>`;
        badge.addEventListener('click', () => filterByTag(tag.name));

        // Add context menu for unused tags (count === 0)
        if (tag.count === 0) {
            badge.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showTagContextMenu(e, tag);
            });
            badge.style.cursor = 'context-menu';
        }

        tagsList.appendChild(badge);
    });
}

// Filter notes by tag
async function filterByTag(tagName) {
    currentTagFilter = tagName;
    clearTagFilter.style.display = 'block';
    await loadNotes();
    await loadTags(); // Reload tags to update active state
}

// Clear tag filter
async function clearFilter() {
    currentTagFilter = null;
    clearTagFilter.style.display = 'none';
    await loadNotes();
    await loadTags();
}

// Render notes list in sidebar
function renderNotesList(notesToRender) {
    notesList.innerHTML = '';

    if (notesToRender.length === 0) {
        notesList.innerHTML = '<li style="padding: 20px; text-align: center; color: #95a5a6;">No notes yet</li>';
        return;
    }

    notesToRender.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-item';
        if (currentNoteId === note.id) {
            li.classList.add('active');
        }

        const titleDiv = document.createElement('div');
        titleDiv.className = 'note-item-title';
        titleDiv.textContent = note.title;

        li.appendChild(titleDiv);

        // Add timestamp if available
        if (note.updated_at) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'note-item-time';
            timeDiv.textContent = formatRelativeTime(note.updated_at);
            li.appendChild(timeDiv);
        }

        // Add tags if available
        if (note.tags && note.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'note-item-tags';

            note.tags.forEach(tagName => {
                const tagBadge = document.createElement('span');
                tagBadge.className = 'tag-badge-small';
                tagBadge.textContent = `#${tagName}`;
                tagsDiv.appendChild(tagBadge);
            });

            li.appendChild(tagsDiv);
        }

        li.addEventListener('click', () => loadNote(note.id));

        // Add drag-and-drop functionality to notes
        li.draggable = true;

        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'note',
                id: note.id,
                folderId: note.folder_id || currentFolderId
            }));
            li.classList.add('drag-source');
        });

        li.addEventListener('dragend', (e) => {
            li.classList.remove('drag-source');
        });

        notesList.appendChild(li);
    });
}

// Create a new note
function createNewNote() {
    // Cancel any pending autosave
    cancelAutosave();

    currentNoteId = null;
    currentNoteData = null;
    noteTitle.value = '';
    noteContent.value = '';
    updateWordCount();

    // Clear timestamps for new note
    createdDate.textContent = '';
    updatedDate.textContent = '';

    // Clear save status (new notes don't autosave)
    updateSaveStatus('');

    // Update folder location for new note
    updateFolderLocation(currentFolderId);

    showEditor();
    noteTitle.focus();

    // Initialize tag autocomplete if not already done
    if (!tagAutocomplete) {
        const tagNames = allTags.map(tag => tag.name);
        tagAutocomplete = new TagAutocomplete(noteContent, tagNames);
    }

    // Initialize wiki-link autocomplete if not already done
    if (!wikiLinkAutocomplete) {
        wikiLinkAutocomplete = new WikiLinkAutocomplete(noteContent, notes);
    }

    // Remove active class from all notes
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Load a specific note
async function loadNote(noteId) {
    try {
        // Cancel any pending autosave from previous note
        cancelAutosave();

        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
            throw new Error('Note not found');
        }

        const note = await response.json();
        currentNoteId = note.id;
        currentNoteData = note;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        updateWordCount();

        // Mark as saved (no unsaved changes when first loaded)
        updateSaveStatus('saved');

        // Display timestamps
        if (note.created_at) {
            createdDate.textContent = formatFullTimestamp(note.created_at, 'Created');
        }
        if (note.updated_at) {
            updatedDate.textContent = formatFullTimestamp(note.updated_at, 'Last edited');
        }

        // Select and expand to parent folder
        if (note.folder_id) {
            expandToFolder(note.folder_id);
            currentFolderId = note.folder_id;
            currentTagFilter = null;
            clearTagFilter.style.display = 'none';
            renderFolderTree();
            updateFolderLocation(note.folder_id);
        } else {
            updateFolderLocation(null);
        }

        showEditor();
        updateActiveNote();

        // Load backlinks for this note
        loadBacklinks(noteId);

        // Initialize tag autocomplete if not already done
        if (!tagAutocomplete) {
            const tagNames = allTags.map(tag => tag.name);
            tagAutocomplete = new TagAutocomplete(noteContent, tagNames);
        }

        // Initialize wiki-link autocomplete if not already done
        if (!wikiLinkAutocomplete) {
            wikiLinkAutocomplete = new WikiLinkAutocomplete(noteContent, notes);
        }

        // If in preview mode, update preview
        if (!isEditMode) {
            updatePreview(note.html);
        }
    } catch (error) {
        console.error('Failed to load note:', error);
        alert('Failed to load note. It may have been deleted.');
        loadNotes();
    }
}

// Save the current note
async function saveCurrentNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value;

    if (!title) {
        alert('Please enter a note title');
        noteTitle.focus();
        return;
    }

    if (!content) {
        alert('Please enter some content');
        noteContent.focus();
        return;
    }

    // Cancel any pending autosave since we're doing a manual save
    cancelAutosave();

    try {
        updateSaveStatus('saving');

        let response;

        if (currentNoteId) {
            // Update existing note
            response = await fetch(`/api/notes/${currentNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
        } else {
            // Create new note
            const noteData = { title, content };

            // If a folder is selected, create the note in that folder
            if (currentFolderId) {
                noteData.folder_id = currentFolderId;
            }

            response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(noteData)
            });
        }

        if (!response.ok) {
            throw new Error('Failed to save note');
        }

        const result = await response.json();
        currentNoteId = result.id;

        // Reload notes list and tags
        await loadNotes();
        await loadTags(); // Reload tags in case new ones were added

        // Reload note to get updated timestamps and tags
        await loadNote(currentNoteId);
        updateActiveNote();

        // Update save status
        updateSaveStatus('saved');

        // Show success message (brief flash)
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 1500);

    } catch (error) {
        console.error('Failed to save note:', error);
        updateSaveStatus('unsaved');
        alert('Failed to save note. Please try again.');
    }
}

// Delete the current note
async function deleteCurrentNote() {
    if (!currentNoteId) {
        alert('No note to delete');
        return;
    }

    const confirmDelete = confirm('Are you sure you want to delete this note?');
    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete note');
        }

        currentNoteId = null;
        await loadNotes();
        showWelcome();

    } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note. Please try again.');
    }
}

// Export note in different formats
function exportNote(format) {
    if (!currentNoteId) {
        alert('No note to export');
        return;
    }

    const title = noteTitle.value || 'untitled';
    const content = noteContent.value;
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    switch (format) {
        case 'markdown':
            exportMarkdown(sanitizedTitle, content);
            break;
        case 'html':
            exportHTML(sanitizedTitle, title, content);
            break;
        case 'pdf':
            exportPDF(title, content);
            break;
        default:
            alert('Unknown export format');
    }
}

// Export as Markdown file
function exportMarkdown(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown' });
    downloadFile(blob, `${filename}.md`);
}

// Export as HTML file
function exportHTML(filename, title, content) {
    configureMarkedForWikiLinks();
    const htmlContent = marked.parse(content);
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        code {
            background-color: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "Courier New", monospace;
        }
        pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            color: #666;
            margin: 0;
        }
        img {
            max-width: 100%;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${htmlContent}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    downloadFile(blob, `${filename}.html`);
}

// Export as PDF using browser print
function exportPDF(title, content) {
    configureMarkedForWikiLinks();
    const htmlContent = marked.parse(content);

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @media print {
            @page {
                margin: 2cm;
            }
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
            page-break-after: avoid;
        }
        h1 {
            border-bottom: 2px solid #eee;
            padding-bottom: 8px;
        }
        code {
            background-color: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "Courier New", monospace;
        }
        pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
            page-break-inside: avoid;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            color: #666;
            margin: 0;
            page-break-inside: avoid;
        }
        img {
            max-width: 100%;
            page-break-inside: avoid;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            page-break-inside: avoid;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f6f8fa;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${htmlContent}
</body>
</html>`);

    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        // Close the window after printing (user can cancel)
        setTimeout(() => printWindow.close(), 100);
    };
}

// Helper function to download a blob as a file
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Toggle between edit and preview mode
async function toggleView() {
    isEditMode = !isEditMode;

    if (isEditMode) {
        // Switch to edit mode
        viewToggle.textContent = 'Preview';
        editorView.style.display = 'block';
        previewView.style.display = 'none';
    } else {
        // Switch to preview mode
        viewToggle.textContent = 'Edit';
        editorView.style.display = 'none';
        previewView.style.display = 'block';

        // Save before preview if this is an existing note
        if (currentNoteId && hasUnsavedChanges) {
            try {
                await autoSave();
            } catch (error) {
                console.error('Failed to save before preview:', error);
            }
        }

        // Fetch rendered markdown
        if (currentNoteId) {
            try {
                const response = await fetch(`/api/notes/${currentNoteId}`);
                const note = await response.json();
                updatePreview(note.html);
            } catch (error) {
                console.error('Failed to load preview:', error);
            }
        } else {
            // For unsaved notes, we need to render on client side
            // For simplicity, just show a message
            previewContent.innerHTML = '<p><em>Save the note first to see preview</em></p>';
        }
    }
}

// Update preview content
function updatePreview(html) {
    previewContent.innerHTML = html;
}

// Filter notes based on search input using full-text search
async function filterNotes() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        // Reload all notes
        loadNotes();
        return;
    }

    try {
        // Use the backend full-text search API
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
        const searchResults = await response.json();

        // Update notes and re-render
        notes = searchResults;
        renderFolderTree();
    } catch (error) {
        console.error('Search failed:', error);
        // Fallback to showing all notes on error
        loadNotes();
    }
}

// Show welcome screen
function showWelcome() {
    welcomeScreen.style.display = 'flex';
    editorScreen.style.display = 'none';
}

// Show editor screen
function showEditor() {
    welcomeScreen.style.display = 'none';
    editorScreen.style.display = 'flex';
}

// Update active note highlight in sidebar
function updateActiveNote() {
    // Remove active class from all note items (inline)
    document.querySelectorAll('.note-item-inline').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to current note
    if (currentNoteId) {
        const activeItem = document.querySelector(`.note-item-inline[data-note-id="${currentNoteId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
    }

    // Ctrl/Cmd + N to create new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }

    // Ctrl/Cmd + P to toggle preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toggleView();
    }
});

// Drag-and-drop handler functions

async function handleFolderDrop(dragData, targetFolder, position) {
    try {
        let newParentId = targetFolder.parent_id;
        let newPosition = 0;

        if (position === 'inside') {
            // Drop inside folder - make it a child
            newParentId = targetFolder.id;
            newPosition = 0; // Insert at beginning
        } else {
            // Drop above or below - insert at target's level
            newParentId = targetFolder.parent_id;
            newPosition = position === 'above' ? targetFolder.position : targetFolder.position + 1;
        }

        // Call reorder API
        const response = await fetch(`/api/folders/${dragData.id}/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                new_position: newPosition,
                parent_id: newParentId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reorder folder');
        }

        // Reload folder tree
        await loadFolders();
    } catch (error) {
        console.error('Error handling folder drop:', error);
        alert('Failed to move folder: ' + error.message);
    }
}

async function handleNoteDrop(dragData, targetFolder) {
    try {
        const response = await fetch(`/api/notes/${dragData.id}/move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                folder_id: targetFolder.id
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to move note');
        }

        // Reload notes if we're viewing the source or target folder
        if (currentFolderId === dragData.folderId || currentFolderId === targetFolder.id) {
            await loadNotes();
        }

        // Reload folders to update note counts
        await loadFolders();
    } catch (error) {
        console.error('Error handling note drop:', error);
        alert('Failed to move note: ' + error.message);
    }
}
