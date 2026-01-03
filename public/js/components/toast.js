// Toast Notification Component
// Provides a modern toast notification system

class Toast {
    constructor() {
        this.container = null;
        this.activeToasts = new Map();
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toastContainer')) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toastContainer');
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in ms (default: 3000), 0 for persistent
     * @returns {string} - Toast ID for manual dismissal
     */
    show(message, type = 'info', duration = 3000) {
        const toastId = `toast-${Date.now()}-${Math.random()}`;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;

        // Icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        // Add to container
        this.container.appendChild(toast);

        // Track active toast
        this.activeToasts.set(toastId, toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss if duration is set
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }

        return toastId;
    }

    /**
     * Hide a specific toast
     * @param {string} toastId - The ID of the toast to hide
     */
    hide(toastId) {
        const toast = this.activeToasts.get(toastId);
        if (!toast) return;

        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.activeToasts.delete(toastId);
        }, 300);
    }

    /**
     * Hide all active toasts
     */
    hideAll() {
        this.activeToasts.forEach((toast, id) => {
            this.hide(id);
        });
    }

    /**
     * Convenience methods
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show a saving notification that persists
     * Returns the toast ID so it can be updated to "saved"
     */
    saving() {
        // Hide any existing save toasts first
        this.activeToasts.forEach((toast, id) => {
            if (toast.querySelector('.toast-message')?.textContent.includes('Saving') ||
                toast.querySelector('.toast-message')?.textContent.includes('saved')) {
                this.hide(id);
            }
        });

        return this.show('Saving...', 'info', 0);
    }

    /**
     * Update a saving toast to show "saved" then auto-dismiss
     */
    saved(savingToastId) {
        if (savingToastId) {
            this.hide(savingToastId);
        }
        return this.success('All changes saved', 2000);
    }

    /**
     * Show unsaved changes warning
     */
    unsaved() {
        return this.warning('Unsaved changes', 2000);
    }
}

// Create global toast instance
window.toast = new Toast();
