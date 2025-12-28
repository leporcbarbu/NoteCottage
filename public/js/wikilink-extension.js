// Wiki-Link Extension for marked.js
// Adds support for Obsidian-style [[Note Title]] syntax
// Works in both Node.js (server) and browser (client)

(function() {
    // Regex pattern for wiki-links
    // Matches: [[Note Title]] or [[Note Title|Display Text]]
    const wikiLinkPattern = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

    // Create the marked.js extension
    const wikiLinkExtension = {
        name: 'wikilink',
        level: 'inline',

        start(src) {
            // Return index where [[ is found
            return src.indexOf('[[');
        },

        tokenizer(src) {
            const match = wikiLinkPattern.exec(src);
            if (match) {
                return {
                    type: 'wikilink',
                    raw: match[0],                              // Full match: [[Note Title|Display]]
                    noteTitle: match[1].trim(),                 // Note title to link to
                    displayText: match[2] ? match[2].trim() : match[1].trim()  // Text to display
                };
            }
        },

        renderer(token) {
            // This renderer is a placeholder - will be replaced with custom logic
            // that has access to the title→id mapping
            return `<span class="wiki-link-placeholder">${token.displayText}</span>`;
        }
    };

    // Export for both Node.js and browser environments
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment
        module.exports = wikiLinkExtension;
    } else {
        // Browser environment - expose globally
        window.wikiLinkExtension = wikiLinkExtension;
    }
})();
