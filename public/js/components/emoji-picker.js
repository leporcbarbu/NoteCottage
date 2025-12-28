// Emoji Picker component for NoteCottage
// Visual emoji selector with categorized emojis

class EmojiPicker {
    constructor(initialEmoji = '📁') {
        this.selectedEmoji = initialEmoji;
        this.changeCallback = null;

        // Curated emoji list organized by category
        this.emojiCategories = {
            'Folders & Files': ['📁', '📂', '🗂️', '📋', '📄', '📊', '📈', '📉', '🗃️', '📑', '🗒️', '📇'],
            'Objects': ['💡', '🔧', '🎯', '🎨', '🎭', '⚙️', '🔔', '📌', '🏷️', '🔑', '🔒', '🔓'],
            'Activities': ['🏃', '🎮', '🎵', '🎬', '📚', '✈️', '🏠', '💼', '🎓', '🏥', '🏦', '🛒'],
            'Symbols': ['⭐', '❤️', '✅', '❌', '⚠️', 'ℹ️', '⚡', '🔥', '💧', '🌈', '☀️', '🌙'],
            'Nature': ['🌳', '🌸', '🌊', '🌱', '🍀', '🌻', '🌺', '🌵', '🍃', '🌾', '🌿', '🌴'],
            'Food': ['🍕', '🍔', '☕', '🍎', '🍰', '🍜', '🍱', '🍣', '🍷', '🍺', '🧃', '🥤'],
            'Faces': ['😀', '😎', '🤔', '🙌', '👍', '💪', '🧠', '💻', '📱', '📧', '✉️', '📮']
        };

        this.pickerElement = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'emoji-picker-container';

        // Create category tabs and emoji grids
        const tabContainer = document.createElement('div');
        tabContainer.className = 'emoji-tabs';

        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-grid';

        // Get first category to display by default
        const categories = Object.keys(this.emojiCategories);
        let currentCategory = categories[0];

        // Function to render emojis for a category
        const renderCategory = (category) => {
            emojiGrid.innerHTML = '';
            const emojis = this.emojiCategories[category];

            emojis.forEach(emoji => {
                const button = document.createElement('button');
                button.className = 'emoji-button';
                button.textContent = emoji;
                button.type = 'button';

                if (emoji === this.selectedEmoji) {
                    button.classList.add('selected');
                }

                button.addEventListener('click', () => {
                    // Remove previous selection
                    const previousSelected = emojiGrid.querySelector('.emoji-button.selected');
                    if (previousSelected) {
                        previousSelected.classList.remove('selected');
                    }

                    // Add selection to clicked button
                    button.classList.add('selected');
                    this.selectedEmoji = emoji;

                    // Trigger change callback
                    if (this.changeCallback) {
                        this.changeCallback(emoji);
                    }
                });

                emojiGrid.appendChild(button);
            });
        };

        // Create category tabs
        categories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'emoji-tab';
            tab.textContent = category;
            tab.type = 'button';

            if (category === currentCategory) {
                tab.classList.add('active');
            }

            tab.addEventListener('click', () => {
                // Update active tab
                tabContainer.querySelectorAll('.emoji-tab').forEach(t => {
                    t.classList.remove('active');
                });
                tab.classList.add('active');

                // Render category emojis
                currentCategory = category;
                renderCategory(category);
            });

            tabContainer.appendChild(tab);
        });

        // Render initial category
        renderCategory(currentCategory);

        container.appendChild(tabContainer);
        container.appendChild(emojiGrid);

        this.pickerElement = container;
        return container;
    }

    getValue() {
        return this.selectedEmoji;
    }

    setValue(emoji) {
        this.selectedEmoji = emoji;
        if (this.pickerElement) {
            // Update visual selection
            const buttons = this.pickerElement.querySelectorAll('.emoji-button');
            buttons.forEach(btn => {
                if (btn.textContent === emoji) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }
    }

    onChange(callback) {
        this.changeCallback = callback;
        return this;
    }
}
