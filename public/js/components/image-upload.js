// Image Upload Helper Functions

// Upload image file to server
async function uploadImage(file, altText = '') {
    if (!currentNoteId) {
        throw new Error('Please save the note before adding images');
    }

    const formData = new FormData();
    formData.append('image', file);
    if (altText) {
        formData.append('alt_text', altText);
    }

    const response = await fetch(`/api/notes/${currentNoteId}/attachments/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
    }

    const attachment = await response.json();
    return attachment;
}

// Link external image URL
async function linkExternalImage(url, altText = '') {
    if (!currentNoteId) {
        throw new Error('Please save the note before adding images');
    }

    const response = await fetch(`/api/notes/${currentNoteId}/attachments/external`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, alt_text: altText })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link image');
    }

    const attachment = await response.json();
    return attachment;
}

// Load attachments for a note
async function loadAttachments(noteId) {
    try {
        const response = await fetch(`/api/notes/${noteId}/attachments`);

        if (!response.ok) {
            console.error('Failed to load attachments');
            return;
        }

        const attachments = await response.json();
        renderAttachmentsGallery(attachments);
    } catch (error) {
        console.error('Error loading attachments:', error);
    }
}

// Render attachments gallery in sidebar
function renderAttachmentsGallery(attachments) {
    const section = document.querySelector('.attachments-section');
    const list = document.getElementById('attachmentsList');
    const count = document.getElementById('attachmentsCount');

    if (!section || !list || !count) return;

    if (attachments.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    count.textContent = attachments.length;

    list.innerHTML = attachments.map(att => `
        <div class="attachment-item" data-id="${att.id}" data-markdown="${escapeHtml(att.markdown)}">
            <img src="${att.url}" alt="${escapeHtml(att.alt_text || '')}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22%3E?%3C/text%3E%3C/svg%3E'">
            <button class="delete-attachment" data-id="${att.id}" title="Delete">×</button>
        </div>
    `).join('');

    // Click to insert markdown
    list.querySelectorAll('.attachment-item img').forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = img.closest('.attachment-item');
            const markdown = item.dataset.markdown;
            insertMarkdownAtCursor(markdown);
        });
    });

    // Delete buttons
    list.querySelectorAll('.delete-attachment').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const attachmentId = btn.dataset.id;
            if (confirm('Delete this image? This cannot be undone.')) {
                await deleteAttachment(attachmentId);
            }
        });
    });
}

// Delete attachment
async function deleteAttachment(attachmentId) {
    try {
        const response = await fetch(`/api/attachments/${attachmentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete attachment');
        }

        // Reload attachments
        if (currentNoteId) {
            await loadAttachments(currentNoteId);
        }
    } catch (error) {
        console.error('Error deleting attachment:', error);
        alert('Failed to delete attachment: ' + error.message);
    }
}

// Insert markdown at cursor position in textarea
function insertMarkdownAtCursor(markdown) {
    const textarea = document.getElementById('noteContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Insert markdown at cursor position
    const before = text.substring(0, start);
    const after = text.substring(end);

    // Add newlines if not at start/end of line
    let prefix = '';
    let suffix = '';

    if (start > 0 && before.charAt(before.length - 1) !== '\n') {
        prefix = '\n';
    }

    if (after.length > 0 && after.charAt(0) !== '\n') {
        suffix = '\n';
    }

    textarea.value = before + prefix + markdown + suffix + after;

    // Move cursor to end of inserted text
    const newCursorPos = start + prefix.length + markdown.length;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;

    // Focus textarea
    textarea.focus();

    // Trigger input event for autosave
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show image modal
function showImageModal() {
    if (!currentNoteId) {
        alert('Please save the note first before adding images');
        return;
    }

    window.imageModal.open(async (type, fileOrUrl, altText) => {
        try {
            let attachment;

            if (type === 'upload') {
                attachment = await uploadImage(fileOrUrl, altText);
            } else {
                attachment = await linkExternalImage(fileOrUrl, altText);
            }

            // Insert markdown into editor
            insertMarkdownAtCursor(attachment.markdown);

            // Reload gallery
            await loadAttachments(currentNoteId);

        } catch (error) {
            throw error; // Re-throw so modal can display it
        }
    });
}
