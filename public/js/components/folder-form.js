// Folder Form component for NoteCottage
// Integrated form with name input, emoji picker, and color palette

class FolderForm {
    constructor(initialData = {}, options = {}) {
        this.data = {
            name: initialData.name || '',
            icon: initialData.icon || '📁',
            is_public: initialData.is_public || false,
            parent_id: initialData.parent_id || null
        };

        this.options = {
            folders: options.folders || [],
            showParentSelector: options.showParentSelector !== false
        };

        this.formElement = null;
        this.emojiPicker = null;
        this.nameInput = null;
        this.publicCheckbox = null;
        this.parentSelect = null;
        this.previewIcon = null;
        this.previewName = null;
        this.previewBadge = null;
    }

    render() {
        const form = document.createElement('form');
        form.className = 'folder-form';

        // Name input group
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Folder Name';
        nameLabel.htmlFor = 'folder-name-input';

        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.id = 'folder-name-input';
        this.nameInput.className = 'form-input';
        this.nameInput.placeholder = 'e.g., Work Projects';
        this.nameInput.value = this.data.name;
        this.nameInput.required = true;
        this.nameInput.maxLength = 100;

        this.nameInput.addEventListener('input', () => {
            this.data.name = this.nameInput.value;
            this.updatePreview();
        });

        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(this.nameInput);

        // Parent folder selector (if enabled)
        let parentGroup = null;
        if (this.options.showParentSelector && this.options.folders.length > 0) {
            parentGroup = document.createElement('div');
            parentGroup.className = 'form-group';

            const parentLabel = document.createElement('label');
            parentLabel.textContent = 'Parent Folder';

            // Create tree view container
            const treeContainer = document.createElement('div');
            treeContainer.className = 'folder-tree-selector';
            treeContainer.style.border = '1px solid var(--border-color, #d4c5b0)';
            treeContainer.style.borderRadius = '6px';
            treeContainer.style.maxHeight = '200px';
            treeContainer.style.overflowY = 'auto';
            treeContainer.style.padding = '8px';
            treeContainer.style.background = 'var(--bg-primary, white)';
            treeContainer.style.color = 'var(--text-primary, #4a3f2e)';

            // Add "None (Top Level)" option
            const noneOption = document.createElement('div');
            noneOption.className = 'tree-folder-item';
            noneOption.style.padding = '6px 8px';
            noneOption.style.cursor = 'pointer';
            noneOption.style.borderRadius = '4px';
            noneOption.style.marginBottom = '2px';
            noneOption.style.color = 'inherit';
            noneOption.dataset.folderId = '';
            noneOption.innerHTML = '<span style="margin-right: 4px;">📍</span><span>(None - Top Level)</span>';

            if (!this.data.parent_id) {
                noneOption.style.background = 'var(--accent-color, #c89f5d)';
                noneOption.style.color = 'white';
            }

            noneOption.addEventListener('click', () => {
                this.selectParentFolder('', treeContainer);
            });

            noneOption.addEventListener('mouseenter', () => {
                if (noneOption.style.color !== 'white') {
                    noneOption.style.background = 'var(--hover-bg, rgba(200, 159, 93, 0.1))';
                }
            });

            noneOption.addEventListener('mouseleave', () => {
                if (noneOption.style.color !== 'white') {
                    noneOption.style.background = '';
                }
            });

            treeContainer.appendChild(noneOption);

            // Recursively render folder tree
            const renderFolderTree = (folderList, container, depth = 0) => {
                folderList.forEach(folder => {
                    // Skip virtual folders
                    if (folder.isVirtual) {
                        if (folder.children && folder.children.length > 0) {
                            renderFolderTree(folder.children, container, depth);
                        }
                        return;
                    }

                    const folderItem = document.createElement('div');
                    folderItem.className = 'tree-folder-item';
                    folderItem.dataset.folderId = folder.id;
                    folderItem.style.paddingLeft = `${depth * 20 + 8}px`;
                    folderItem.style.padding = '6px 8px';
                    folderItem.style.paddingLeft = `${depth * 20 + 8}px`;
                    folderItem.style.cursor = 'pointer';
                    folderItem.style.borderRadius = '4px';
                    folderItem.style.marginBottom = '2px';
                    folderItem.style.display = 'flex';
                    folderItem.style.alignItems = 'center';
                    folderItem.style.color = 'inherit';

                    // Highlight if selected
                    if (this.data.parent_id && String(this.data.parent_id) === String(folder.id)) {
                        folderItem.style.background = 'var(--accent-color, #c89f5d)';
                        folderItem.style.color = 'white';
                    }

                    const icon = document.createElement('span');
                    icon.textContent = folder.icon || '📁';
                    icon.style.marginRight = '6px';

                    const name = document.createElement('span');
                    name.textContent = folder.name;

                    folderItem.appendChild(icon);
                    folderItem.appendChild(name);

                    folderItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectParentFolder(folder.id, treeContainer);
                    });

                    folderItem.addEventListener('mouseenter', () => {
                        if (folderItem.style.color !== 'white') {
                            folderItem.style.background = 'var(--hover-bg, rgba(200, 159, 93, 0.1))';
                        }
                    });

                    folderItem.addEventListener('mouseleave', () => {
                        if (folderItem.style.color !== 'white') {
                            folderItem.style.background = '';
                        }
                    });

                    container.appendChild(folderItem);

                    // Recursively add children
                    if (folder.children && folder.children.length > 0) {
                        renderFolderTree(folder.children, container, depth + 1);
                    }
                });
            };

            renderFolderTree(this.options.folders, treeContainer);

            parentGroup.appendChild(parentLabel);
            parentGroup.appendChild(treeContainer);
        }

        // Icon picker group
        const iconGroup = document.createElement('div');
        iconGroup.className = 'form-group';

        const iconLabel = document.createElement('label');
        iconLabel.textContent = 'Icon';

        this.emojiPicker = new EmojiPicker(this.data.icon);
        const emojiPickerElement = this.emojiPicker.render();

        this.emojiPicker.onChange((emoji) => {
            this.data.icon = emoji;
            this.updatePreview();
        });

        iconGroup.appendChild(iconLabel);
        iconGroup.appendChild(emojiPickerElement);

        // Privacy toggle group
        const privacyGroup = document.createElement('div');
        privacyGroup.className = 'form-group privacy-group';

        const privacyLabel = document.createElement('label');
        privacyLabel.style.display = 'flex';
        privacyLabel.style.alignItems = 'center';
        privacyLabel.style.cursor = 'pointer';

        this.publicCheckbox = document.createElement('input');
        this.publicCheckbox.type = 'checkbox';
        this.publicCheckbox.id = 'folder-public-checkbox';
        this.publicCheckbox.checked = this.data.is_public;
        this.publicCheckbox.style.marginRight = '8px';

        this.publicCheckbox.addEventListener('change', () => {
            this.data.is_public = this.publicCheckbox.checked;
            this.updatePreview();
        });

        const privacyText = document.createElement('span');
        privacyText.innerHTML = '<strong>🌍 Shared Folder</strong> (visible to all users)';

        privacyLabel.appendChild(this.publicCheckbox);
        privacyLabel.appendChild(privacyText);

        const privacyHint = document.createElement('div');
        privacyHint.style.fontSize = '12px';
        privacyHint.style.color = 'var(--text-secondary)';
        privacyHint.style.marginTop = '4px';
        privacyHint.textContent = 'Unchecked folders are private (only you can see them)';

        privacyGroup.appendChild(privacyLabel);
        privacyGroup.appendChild(privacyHint);

        // Preview section
        const previewGroup = document.createElement('div');
        previewGroup.className = 'form-group folder-preview-group';

        const previewLabel = document.createElement('label');
        previewLabel.textContent = 'Preview';

        const preview = document.createElement('div');
        preview.className = 'folder-preview';

        this.previewIcon = document.createElement('span');
        this.previewIcon.className = 'folder-icon';
        this.previewIcon.textContent = this.data.icon;

        this.previewName = document.createElement('span');
        this.previewName.className = 'folder-name';
        this.previewName.textContent = this.data.name || 'Folder Name';

        this.previewBadge = document.createElement('span');
        this.previewBadge.className = 'privacy-badge';
        this.previewBadge.style.marginLeft = '8px';
        this.previewBadge.style.fontSize = '14px';
        this.previewBadge.textContent = this.data.is_public ? '🌍' : '🔒';
        this.previewBadge.title = this.data.is_public ? 'Shared folder' : 'Private folder';

        preview.appendChild(this.previewIcon);
        preview.appendChild(this.previewName);
        preview.appendChild(this.previewBadge);

        previewGroup.appendChild(previewLabel);
        previewGroup.appendChild(preview);

        // Assemble form
        form.appendChild(nameGroup);
        if (parentGroup) {
            form.appendChild(parentGroup);
        }
        form.appendChild(iconGroup);
        form.appendChild(privacyGroup);
        form.appendChild(previewGroup);

        this.formElement = form;
        return form;
    }

    selectParentFolder(folderId, treeContainer) {
        // Update data
        this.data.parent_id = folderId || null;

        // Update visual selection in tree
        const allItems = treeContainer.querySelectorAll('.tree-folder-item');
        allItems.forEach(item => {
            const itemId = item.dataset.folderId;
            if (String(itemId) === String(folderId)) {
                item.style.background = 'var(--accent-color, #c89f5d)';
                item.style.color = 'white';
            } else {
                item.style.background = '';
                item.style.color = 'inherit';
            }
        });
    }

    updatePreview() {
        if (this.previewIcon) {
            this.previewIcon.textContent = this.data.icon;
        }
        if (this.previewName) {
            this.previewName.textContent = this.data.name || 'Folder Name';
        }
        if (this.previewBadge) {
            this.previewBadge.textContent = this.data.is_public ? '🌍' : '🔒';
            this.previewBadge.title = this.data.is_public ? 'Shared folder' : 'Private folder';
        }
    }

    getData() {
        return {
            name: this.data.name,
            icon: this.data.icon,
            is_public: this.data.is_public,
            parent_id: this.data.parent_id
        };
    }

    validate() {
        const errors = [];

        if (!this.data.name || !this.data.name.trim()) {
            errors.push('Folder name is required');
        }

        if (this.data.name.length > 100) {
            errors.push('Folder name must be 100 characters or less');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    showErrors(errors) {
        // Remove existing error messages
        const existingErrors = this.formElement.querySelectorAll('.form-error');
        existingErrors.forEach(el => el.remove());

        if (errors && errors.length > 0) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'form-error';
            errorContainer.textContent = errors.join(', ');
            this.formElement.insertBefore(errorContainer, this.formElement.firstChild);
        }
    }
}
