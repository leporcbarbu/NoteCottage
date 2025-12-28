// Color Palette component for NoteCottage
// Preset color selection for folders

class ColorPalette {
    constructor(initialColor = '#3498db') {
        this.selectedColor = initialColor;
        this.changeCallback = null;

        // Curated color palette (16 colors)
        this.colors = [
            // Blues
            { hex: '#3498db', name: 'Bright Blue' },
            { hex: '#2980b9', name: 'Medium Blue' },
            { hex: '#34495e', name: 'Dark Blue Grey' },

            // Greens
            { hex: '#27ae60', name: 'Emerald' },
            { hex: '#16a085', name: 'Turquoise' },
            { hex: '#2ecc71', name: 'Light Green' },

            // Reds
            { hex: '#e74c3c', name: 'Bright Red' },
            { hex: '#c0392b', name: 'Dark Red' },

            // Oranges
            { hex: '#e67e22', name: 'Bright Orange' },
            { hex: '#d35400', name: 'Dark Orange' },

            // Purples
            { hex: '#9b59b6', name: 'Medium Purple' },
            { hex: '#8e44ad', name: 'Dark Purple' },

            // Yellows
            { hex: '#f39c12', name: 'Orange Yellow' },
            { hex: '#f1c40f', name: 'Bright Yellow' },

            // Greys
            { hex: '#95a5a6', name: 'Light Grey' },
            { hex: '#7f8c8d', name: 'Medium Grey' }
        ];

        this.paletteElement = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'color-palette-container';

        // Color grid
        const grid = document.createElement('div');
        grid.className = 'color-grid';

        this.colors.forEach(color => {
            const button = document.createElement('button');
            button.className = 'color-button';
            button.style.backgroundColor = color.hex;
            button.title = color.name;
            button.type = 'button';

            if (color.hex === this.selectedColor) {
                button.classList.add('selected');
            }

            button.addEventListener('click', () => {
                // Remove previous selection
                const previousSelected = grid.querySelector('.color-button.selected');
                if (previousSelected) {
                    previousSelected.classList.remove('selected');
                }

                // Add selection to clicked button
                button.classList.add('selected');
                this.selectedColor = color.hex;

                // Debug log
                console.log('Color selected:', color.hex);

                // Trigger change callback
                if (this.changeCallback) {
                    console.log('Triggering color change callback');
                    this.changeCallback(color.hex);
                } else {
                    console.warn('No change callback registered!');
                }
            });

            grid.appendChild(button);
        });

        container.appendChild(grid);

        this.paletteElement = container;
        return container;
    }

    getValue() {
        return this.selectedColor;
    }

    setValue(hex) {
        this.selectedColor = hex;
        if (this.paletteElement) {
            // Update visual selection
            const buttons = this.paletteElement.querySelectorAll('.color-button');
            buttons.forEach(btn => {
                if (btn.style.backgroundColor === hex || this.rgbToHex(btn.style.backgroundColor) === hex) {
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

    // Helper to convert RGB to hex (for comparison)
    rgbToHex(rgb) {
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb;

        const hex = (x) => {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        };
        return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
    }
}
