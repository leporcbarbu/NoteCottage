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

        // Find the last [[ before cursor (not closed with ]])
        const wikiLinkMatch = textBeforeCursor.match(/\[\[([^\]]*?)$/);

        if (wikiLinkMatch) {
            // User is typing a wiki-link
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
                this.show(filteredNotes, cursorPos);
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
                    this.selectNote(items[this.selectedIndex].textContent);
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

    show(filteredNotes, cursorPos) {
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
