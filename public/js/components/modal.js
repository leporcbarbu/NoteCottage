// Modal component for NoteCottage
// Reusable modal/dialog system with overlay

class Modal {
    constructor(title, content, buttonsOrOptions = {}) {
        this.title = title;
        this.content = content;

        // Support both buttons array and options object
        // If it's an array with items, use buttons API
        // If it's an empty array or object, use old API
        if (Array.isArray(buttonsOrOptions) && buttonsOrOptions.length > 0) {
            this.buttons = buttonsOrOptions;
            this.options = {
                closeOnOverlayClick: true
            };
        } else {
            this.buttons = null;
            // Convert array to object if needed
            const opts = Array.isArray(buttonsOrOptions) ? {} : buttonsOrOptions;
            this.options = {
                closeOnOverlayClick: opts.closeOnOverlayClick !== false,
                showCancelButton: opts.showCancelButton !== false,
                submitButtonText: opts.submitButtonText || 'Save',
                cancelButtonText: opts.cancelButtonText || 'Cancel'
            };
        }

        this.onSubmitCallback = null;
        this.onCancelCallback = null;
        this.onCloseCallback = null;

        this.modalElement = null;
        this.isOpen = false;

        // Auto-open the modal when constructed with buttons array
        if (this.buttons && this.buttons.length > 0) {
            this.open();
        }
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

        // If buttons array is provided, use it
        if (this.buttons) {
            this.buttons.forEach(btnConfig => {
                const btn = document.createElement('button');
                btn.className = btnConfig.className || 'btn';
                btn.textContent = btnConfig.text || 'Button';
                btn.type = 'button';
                btn.addEventListener('click', async () => {
                    if (btnConfig.callback) {
                        const result = await btnConfig.callback();
                        // If callback returns true, close the modal
                        if (result === true) {
                            this.close();
                        }
                    } else {
                        // No callback, just close
                        this.close();
                    }
                });
                footer.appendChild(btn);
            });
        } else {
            // Use old API with submit/cancel buttons
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
        }

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

    // Static helper method for confirmation dialogs
    static confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = new Modal(title, message, [
                {
                    text: cancelText,
                    className: 'btn btn-secondary',
                    callback: () => {
                        resolve(false);
                        return true; // Close modal
                    }
                },
                {
                    text: confirmText,
                    className: 'btn btn-primary',
                    callback: () => {
                        resolve(true);
                        return true; // Close modal
                    }
                }
            ]);
        });
    }
}
