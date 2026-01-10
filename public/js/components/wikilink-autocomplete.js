// Wiki-Link Autocomplete component for NoteCottage
// Shows note title suggestions as user types [[

class WikiLinkAutocomplete {
    constructor(textarea, notes) {
        this.textarea = textarea;
        this.notes = notes; // Array of note objects with id and title
        this.dropdownElement = null;
        this.isVisible = false;
        this.selectedIndex = 0;
        this.currentQuery = '';
        this.bracketStartPos = -1;
        this.mode = 'notes'; // 'notes' or 'headings'
        this.targetNoteTitle = ''; // For heading mode
        this.headingsCache = new Map(); // Cache headings by note title

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for input in textarea
        this.textarea.addEventListener('input', (e) => {
            this.handleInput(e);
        });

        // Listen for keyboard navigation
        this.textarea.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                this.handleKeydown(e);
            }
        });

        // Close on blur (with delay to allow click)
        this.textarea.addEventListener('blur', () => {
            setTimeout(() => this.hide(), 200);
        });
    }

    handleInput(e) {
        const cursorPos = this.textarea.selectionStart;
        const textBeforeCursor = this.textarea.value.substring(0, cursorPos);

        // Check for heading pattern first: [[NoteName#partial
        const headingMatch = textBeforeCursor.match(/\[\[([^\]#]+)#([^\]]*?)$/);

        if (headingMatch) {
            // User is typing a heading reference
            this.mode = 'headings';
            this.bracketStartPos = cursorPos - headingMatch[0].length;
            this.targetNoteTitle = headingMatch[1].trim();
            this.currentQuery = headingMatch[2].toLowerCase();

            // Fetch and show headings for the target note
            this.showHeadingsForNote(this.targetNoteTitle, cursorPos);
            return;
        }

        // Check for regular wiki-link pattern: [[partial
        const wikiLinkMatch = textBeforeCursor.match(/\[\[([^\]]*?)$/);

        if (wikiLinkMatch) {
            // User is typing a wiki-link
            this.mode = 'notes';
            this.bracketStartPos = cursorPos - wikiLinkMatch[0].length;
            this.currentQuery = wikiLinkMatch[1].toLowerCase();

            // Filter notes by title
            const filteredNotes = this.notes.filter(note =>
                note.title.toLowerCase().includes(this.currentQuery) &&
                note.title.toLowerCase() !== this.currentQuery
            );

            // Sort by relevance (starts with query first)
            filteredNotes.sort((a, b) => {
                const aStarts = a.title.toLowerCase().startsWith(this.currentQuery);
                const bStarts = b.title.toLowerCase().startsWith(this.currentQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.title.localeCompare(b.title);
            });

            if (filteredNotes.length > 0) {
                this.showNotes(filteredNotes, cursorPos);
            } else {
                this.hide();
            }
        } else {
            this.hide();
        }
    }

    handleKeydown(e) {
        const dropdown = this.dropdownElement;
        if (!dropdown) return;

        const items = dropdown.querySelectorAll('.wikilink-autocomplete-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection(items);
                break;

            case 'Enter':
            case 'Tab':
                if (items[this.selectedIndex]) {
                    e.preventDefault();
                    const selectedText = items[this.selectedIndex].textContent;
                    if (this.mode === 'headings') {
                        // Remove the # prefix from display
                        const headingText = selectedText.startsWith('#') ? selectedText.substring(1).trim() : selectedText;
                        this.selectHeading(headingText);
                    } else {
                        this.selectNote(selectedText);
                    }
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectNote(noteTitle) {
        // Replace the partial wiki-link with the complete one
        const before = this.textarea.value.substring(0, this.bracketStartPos);
        const after = this.textarea.value.substring(this.textarea.selectionStart);

        this.textarea.value = before + '[[' + noteTitle + ']]' + after;

        // Set cursor position after the inserted wiki-link
        const newCursorPos = this.bracketStartPos + noteTitle.length + 4; // +4 for [[ and ]]
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);

        this.hide();
        this.textarea.focus();

        // Trigger input event to update preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    selectHeading(headingText) {
        // Replace the partial heading link with the complete one
        const before = this.textarea.value.substring(0, this.bracketStartPos);
        const after = this.textarea.value.substring(this.textarea.selectionStart);

        const completeLink = '[[' + this.targetNoteTitle + '#' + headingText + ']]';
        this.textarea.value = before + completeLink + after;

        // Set cursor position after the inserted wiki-link
        const newCursorPos = this.bracketStartPos + completeLink.length;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);

        this.hide();
        this.textarea.focus();

        // Trigger input event to update preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    showNotes(filteredNotes, cursorPos) {
        if (!this.dropdownElement) {
            this.createDropdown();
        }

        // Clear previous items
        this.dropdownElement.innerHTML = '';
        this.selectedIndex = 0;

        // Limit to first 10 results
        const limitedNotes = filteredNotes.slice(0, 10);

        // Add filtered notes
        limitedNotes.forEach((note, index) => {
            const item = document.createElement('div');
            item.className = 'wikilink-autocomplete-item';
            if (index === 0) item.classList.add('selected');
            item.textContent = note.title;

            item.addEventListener('click', () => {
                this.selectNote(note.title);
            });

            this.dropdownElement.appendChild(item);
        });

        // Position dropdown near cursor
        this.positionDropdown(cursorPos);

        this.isVisible = true;
        this.dropdownElement.style.display = 'block';
    }

    async showHeadingsForNote(noteTitle, cursorPos) {
        // Check cache first
        if (this.headingsCache.has(noteTitle.toLowerCase())) {
            const headings = this.headingsCache.get(noteTitle.toLowerCase());
            this.showHeadings(headings, cursorPos);
            return;
        }

        // Find note by title
        const note = this.notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());

        if (!note) {
            this.showMessage('Note not found', cursorPos);
            return;
        }

        // Fetch note content to extract headings
        try {
            const response = await fetch(`/api/notes/${note.id}`);
            if (!response.ok) throw new Error('Failed to fetch note');

            const noteData = await response.json();
            const headings = this.extractHeadings(noteData.content);

            // Cache the headings
            this.headingsCache.set(noteTitle.toLowerCase(), headings);

            if (headings.length > 0) {
                this.showHeadings(headings, cursorPos);
            } else {
                this.showMessage('No headings found', cursorPos);
            }
        } catch (error) {
            console.error('Error fetching note headings:', error);
            this.showMessage('Error loading headings', cursorPos);
        }
    }

    extractHeadings(content) {
        // Extract markdown headings (# through ######)
        const headingRegex = /^#{1,6}\s+(.+)$/gm;
        const headings = [];
        let match;

        while ((match = headingRegex.exec(content)) !== null) {
            headings.push(match[1].trim());
        }

        return headings;
    }

    showHeadings(headings, cursorPos) {
        if (!this.dropdownElement) {
            this.createDropdown();
        }

        // Clear previous items
        this.dropdownElement.innerHTML = '';
        this.selectedIndex = 0;

        // Filter headings by current query
        const filteredHeadings = headings.filter(heading =>
            heading.toLowerCase().includes(this.currentQuery)
        );

        // Limit to first 10 results
        const limitedHeadings = filteredHeadings.slice(0, 10);

        if (limitedHeadings.length === 0) {
            this.showMessage('No matching headings', cursorPos);
            return;
        }

        // Add filtered headings with # prefix for visual distinction
        limitedHeadings.forEach((heading, index) => {
            const item = document.createElement('div');
            item.className = 'wikilink-autocomplete-item wikilink-autocomplete-heading';
            if (index === 0) item.classList.add('selected');
            item.textContent = '# ' + heading;

            item.addEventListener('click', () => {
                this.selectHeading(heading);
            });

            this.dropdownElement.appendChild(item);
        });

        // Position dropdown near cursor
        this.positionDropdown(cursorPos);

        this.isVisible = true;
        this.dropdownElement.style.display = 'block';
    }

    showMessage(message, cursorPos) {
        if (!this.dropdownElement) {
            this.createDropdown();
        }

        // Clear previous items
        this.dropdownElement.innerHTML = '';
        this.selectedIndex = 0;

        const item = document.createElement('div');
        item.className = 'wikilink-autocomplete-message';
        item.textContent = message;

        this.dropdownElement.appendChild(item);

        // Position dropdown near cursor
        this.positionDropdown(cursorPos);

        this.isVisible = true;
        this.dropdownElement.style.display = 'block';

        // Auto-hide after 2 seconds
        setTimeout(() => this.hide(), 2000);
    }

    hide() {
        if (this.dropdownElement) {
            this.dropdownElement.style.display = 'none';
        }
        this.isVisible = false;
        this.currentQuery = '';
        this.bracketStartPos = -1;
    }

    createDropdown() {
        this.dropdownElement = document.createElement('div');
        this.dropdownElement.className = 'wikilink-autocomplete-dropdown';
        document.body.appendChild(this.dropdownElement);
    }

    positionDropdown(cursorPos) {
        // Get cursor coordinates
        const coords = this.getCursorCoordinates(cursorPos);

        // Position dropdown
        this.dropdownElement.style.left = `${coords.left}px`;
        this.dropdownElement.style.top = `${coords.top + coords.height}px`;

        // Adjust if off screen
        const rect = this.dropdownElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.dropdownElement.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.dropdownElement.style.top = `${coords.top - rect.height}px`;
        }
    }

    getCursorCoordinates(position) {
        // Get textarea position and scroll
        const textareaRect = this.textarea.getBoundingClientRect();
        const scrollTop = this.textarea.scrollTop;

        // Create a mirror div to measure cursor position
        const div = document.createElement('div');
        const styles = window.getComputedStyle(this.textarea);

        // Copy textarea styles
        ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
         'letterSpacing', 'whiteSpace', 'wordWrap', 'padding',
         'borderWidth', 'boxSizing'].forEach(prop => {
            div.style[prop] = styles[prop];
        });

        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.width = `${this.textarea.clientWidth}px`;
        div.style.height = 'auto';
        div.style.overflow = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';

        // Add text up to cursor
        div.textContent = this.textarea.value.substring(0, position);

        // Add a span to measure cursor position
        const span = document.createElement('span');
        span.textContent = '|';
        div.appendChild(span);

        document.body.appendChild(div);

        const spanRect = span.getBoundingClientRect();

        // Calculate position relative to textarea, accounting for scroll
        const relativeTop = spanRect.top - div.getBoundingClientRect().top;
        const coords = {
            left: textareaRect.left + (spanRect.left - div.getBoundingClientRect().left),
            top: textareaRect.top + relativeTop - scrollTop,
            height: spanRect.height
        };

        document.body.removeChild(div);

        return coords;
    }

    updateNotes(newNotes) {
        this.notes = newNotes;
    }

    destroy() {
        if (this.dropdownElement && this.dropdownElement.parentNode) {
            this.dropdownElement.parentNode.removeChild(this.dropdownElement);
        }
    }
}
