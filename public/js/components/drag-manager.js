// Drag Manager for NoteCottage
// Centralized drag-and-drop state management

class DragManager {
    constructor() {
        this.currentDragElement = null;
        this.currentDropTarget = null;
        this.dropPosition = null;
    }

    // Calculate drop position based on mouse Y coordinate
    // Returns: 'above', 'inside', or 'below'
    calculateDropPosition(e, targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        // Divide into three zones
        if (y < height * 0.25) return 'above';
        if (y > height * 0.75) return 'below';
        return 'inside';
    }

    // Validate if drop is allowed
    validateDrop(dragData, targetFolder, position, folders) {
        // Can't drop folder into itself
        if (dragData.type === 'folder' && dragData.id === targetFolder.id) {
            return false;
        }

        // Can't drop folder into its descendants
        if (dragData.type === 'folder' && position === 'inside') {
            if (this.isDescendantClient(targetFolder.id, dragData.id, folders)) {
                return false;
            }
        }

        return true;
    }

    // Client-side descendant check (walk the folder tree)
    isDescendantClient(potentialDescendantId, ancestorId, folders) {
        const findFolder = (id) => {
            for (const folder of folders) {
                if (folder.id === id) return folder;
                if (folder.children) {
                    const found = this.findInTree(folder.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const findInTree = (tree, id) => {
            for (const folder of tree) {
                if (folder.id === id) return folder;
                if (folder.children) {
                    const found = this.findInTree(folder.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        this.findInTree = findInTree;

        // Walk up from potentialDescendant to see if we reach ancestor
        let current = findFolder(potentialDescendantId);
        while (current) {
            if (current.id === ancestorId) {
                return true;
            }
            current = current.parent_id ? findFolder(current.parent_id) : null;
        }
        return false;
    }

    // Show drop indicator based on position
    showDropIndicator(element, position) {
        this.clearDropIndicators();

        if (position === 'invalid') {
            element.classList.add('drag-invalid');
        } else if (position === 'above') {
            element.classList.add('drag-over-above');
        } else if (position === 'below') {
            element.classList.add('drag-over-below');
        } else if (position === 'inside') {
            element.classList.add('drag-over-inside');
        }

        this.currentDropTarget = element;
        this.dropPosition = position;
    }

    // Clear all drop indicators
    clearDropIndicators() {
        if (this.currentDropTarget) {
            this.currentDropTarget.classList.remove(
                'drag-over-above',
                'drag-over-below',
                'drag-over-inside',
                'drag-invalid'
            );
        }

        // Also clear any stray indicators
        document.querySelectorAll('.drag-over-above, .drag-over-below, .drag-over-inside, .drag-invalid').forEach(el => {
            el.classList.remove('drag-over-above', 'drag-over-below', 'drag-over-inside', 'drag-invalid');
        });

        this.currentDropTarget = null;
        this.dropPosition = null;
    }

    // Set current drag element
    setDragElement(element) {
        this.currentDragElement = element;
    }

    // Get current drag element
    getDragElement() {
        return this.currentDragElement;
    }

    // Clear drag element
    clearDragElement() {
        this.currentDragElement = null;
    }
}

// Create global instance
const dragManager = new DragManager();
