// Folder Form component for NoteCottage
// Integrated form with name input, emoji picker, and color palette

class FolderForm {
    constructor(initialData = {}) {
        this.data = {
            name: initialData.name || '',
            icon: initialData.icon || '📁'
        };

        this.formElement = null;
        this.emojiPicker = null;
        this.nameInput = null;
        this.previewIcon = null;
        this.previewName = null;
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

        preview.appendChild(this.previewIcon);
        preview.appendChild(this.previewName);

        previewGroup.appendChild(previewLabel);
        previewGroup.appendChild(preview);

        // Assemble form
        form.appendChild(nameGroup);
        form.appendChild(iconGroup);
        form.appendChild(previewGroup);

        this.formElement = form;
        return form;
    }

    updatePreview() {
        if (this.previewIcon) {
            this.previewIcon.textContent = this.data.icon;
        }
        if (this.previewName) {
            this.previewName.textContent = this.data.name || 'Folder Name';
        }
    }

    getData() {
        return {
            name: this.data.name,
            icon: this.data.icon
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
