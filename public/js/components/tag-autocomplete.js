// Tag Autocomplete component for NoteCottage
// Shows tag suggestions as user types hashtags

class TagAutocomplete {
    constructor(textarea, tags) {
        this.textarea = textarea;
        this.tags = tags; // Array of tag names
        this.dropdownElement = null;
        this.isVisible = false;
        this.selectedIndex = 0;
        this.currentQuery = '';
        this.hashtagStartPos = -1;

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

        // Find the last # before cursor
        const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z]\w*)$/);

        if (hashtagMatch) {
            // User is typing a hashtag
            this.hashtagStartPos = cursorPos - hashtagMatch[0].length;
            this.currentQuery = hashtagMatch[1].toLowerCase();

            // Filter tags
            const filteredTags = this.tags.filter(tag =>
                tag.toLowerCase().startsWith(this.currentQuery) &&
                tag.toLowerCase() !== this.currentQuery
            );

            if (filteredTags.length > 0) {
                this.show(filteredTags, cursorPos);
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

        const items = dropdown.querySelectorAll('.tag-autocomplete-item');

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
                    this.selectTag(items[this.selectedIndex].textContent);
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

    selectTag(tag) {
        // Replace the partial hashtag with the complete one
        const before = this.textarea.value.substring(0, this.hashtagStartPos);
        const after = this.textarea.value.substring(this.textarea.selectionStart);

        this.textarea.value = before + '#' + tag + ' ' + after;

        // Set cursor position after the inserted tag
        const newCursorPos = this.hashtagStartPos + tag.length + 2; // +2 for # and space
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);

        this.hide();
        this.textarea.focus();

        // Trigger input event to update preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    show(filteredTags, cursorPos) {
        if (!this.dropdownElement) {
            this.createDropdown();
        }

        // Clear previous items
        this.dropdownElement.innerHTML = '';
        this.selectedIndex = 0;

        // Add filtered tags
        filteredTags.forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'tag-autocomplete-item';
            if (index === 0) item.classList.add('selected');
            item.textContent = tag;

            item.addEventListener('click', () => {
                this.selectTag(tag);
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
        this.hashtagStartPos = -1;
    }

    createDropdown() {
        this.dropdownElement = document.createElement('div');
        this.dropdownElement.className = 'tag-autocomplete-dropdown';
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

    updateTags(newTags) {
        this.tags = newTags;
    }

    destroy() {
        if (this.dropdownElement && this.dropdownElement.parentNode) {
            this.dropdownElement.parentNode.removeChild(this.dropdownElement);
        }
    }
}
