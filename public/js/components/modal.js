// Modal component for NoteCottage
// Reusable modal/dialog system with overlay

class Modal {
    constructor(title, content, options = {}) {
        this.title = title;
        this.content = content;
        this.options = {
            closeOnOverlayClick: options.closeOnOverlayClick !== false,
            showCancelButton: options.showCancelButton !== false,
            submitButtonText: options.submitButtonText || 'Save',
            cancelButtonText: options.cancelButtonText || 'Cancel'
        };

        this.onSubmitCallback = null;
        this.onCancelCallback = null;
        this.onCloseCallback = null;

        this.modalElement = null;
        this.isOpen = false;
    }

    render() {
        // Create modal structure
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';

        const titleEl = document.createElement('h2');
        titleEl.textContent = this.title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.type = 'button';
        closeBtn.addEventListener('click', () => this.close());

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';

        // Content can be an HTMLElement or string
        if (typeof this.content === 'string') {
            body.innerHTML = this.content;
        } else if (this.content instanceof HTMLElement) {
            body.appendChild(this.content);
        }

        // Footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        if (this.options.showCancelButton) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = this.options.cancelButtonText;
            cancelBtn.type = 'button';
            cancelBtn.addEventListener('click', () => this.cancel());
            footer.appendChild(cancelBtn);
        }

        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = this.options.submitButtonText;
        submitBtn.type = 'button';
        submitBtn.addEventListener('click', () => this.submit());
        footer.appendChild(submitBtn);

        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);

        overlay.appendChild(dialog);

        // Click overlay to close (if enabled)
        if (this.options.closeOnOverlayClick) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        this.modalElement = overlay;
        return overlay;
    }

    open() {
        if (this.isOpen) return;

        // Render modal if not already rendered
        if (!this.modalElement) {
            this.render();
        }

        // Add to DOM
        document.body.appendChild(this.modalElement);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add keyboard listener for ESC key
        this.handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);

        // Focus first input in modal (accessibility)
        setTimeout(() => {
            const firstInput = this.modalElement.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);

        this.isOpen = true;
    }

    close() {
        if (!this.isOpen) return;

        // Remove from DOM
        if (this.modalElement && this.modalElement.parentNode) {
            this.modalElement.parentNode.removeChild(this.modalElement);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove keyboard listener
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }

        this.isOpen = false;

        // Call close callback
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    submit() {
        if (this.onSubmitCallback) {
            this.onSubmitCallback();
        }
    }

    cancel() {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        } else {
            // Default: just close
            this.close();
        }
    }

    onSubmit(callback) {
        this.onSubmitCallback = callback;
        return this;
    }

    onCancel(callback) {
        this.onCancelCallback = callback;
        return this;
    }

    onClose(callback) {
        this.onCloseCallback = callback;
        return this;
    }
}
