// Context Menu component for NoteCottage
// Visual context menu with clickable buttons

class ContextMenu {
    constructor() {
        this.menuElement = null;
        this.isOpen = false;
    }

    show(x, y, items) {
        // Close any existing menu
        this.close();

        // Create menu element
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // Add menu items
        items.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const button = document.createElement('button');
                button.className = 'context-menu-item';
                button.textContent = item.label;
                button.type = 'button';

                if (item.icon) {
                    const icon = document.createElement('span');
                    icon.className = 'context-menu-icon';
                    icon.textContent = item.icon;
                    button.insertBefore(icon, button.firstChild);
                }

                if (item.danger) {
                    button.classList.add('danger');
                }

                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (item.action) {
                        item.action();
                    }
                    this.close();
                });

                menu.appendChild(button);
            }
        });

        // Add to body
        document.body.appendChild(menu);
        this.menuElement = menu;
        this.isOpen = true;

        // Adjust position if menu goes off screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }

        // Close on click outside
        const closeOnClickOutside = (e) => {
            if (!menu.contains(e.target)) {
                this.close();
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeOnClickOutside);
        }, 10);

        // Close on ESC
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
    }

    close() {
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
        this.menuElement = null;
        this.isOpen = false;
    }
}

// Create global instance
const contextMenu = new ContextMenu();
