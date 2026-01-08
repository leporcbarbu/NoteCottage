// Wiki-Link Extension for marked.js
// Adds support for Obsidian-style [[Note Title]] syntax with enhancements
// Works in both Node.js (server) and browser (client)

(function() {
    // Load slugify utility
    let slugify;
    if (typeof require !== 'undefined') {
        // Node.js environment
        slugify = require('./utils/slugify.js').slugify;
    } else {
        // Browser environment - use global
        slugify = window.slugify;
    }

    // Enhanced regex pattern for wiki-links
    // Matches:
    // ![[Note Title]]           - Embed note
    // ![[image.png]]            - Embed image
    // ![[Note#Heading]]         - Embed from heading
    // [[Note#Heading]]          - Link to heading in note
    // [[#Heading]]              - Link to heading in current note
    // [[Note|Display]]          - Link with custom display text
    // [[Note#Heading|Display]]  - Link to heading with custom text
    const wikiLinkPattern = /^(!?)\[\[([^\]|#]+)?(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/;

    // Create the marked.js extension
    const wikiLinkExtension = {
        name: 'wikilink',
        level: 'inline',

        start(src) {
            // Return index where [[ or ![[  is found
            const bracketIndex = src.indexOf('[[');
            if (bracketIndex === -1) return -1;
            // Check if preceded by !
            if (bracketIndex > 0 && src[bracketIndex - 1] === '!') {
                return bracketIndex - 1;
            }
            return bracketIndex;
        },

        tokenizer(src) {
            const match = wikiLinkPattern.exec(src);
            if (match) {
                const isEmbed = match[1] === '!';
                const noteTitle = match[2] ? match[2].trim() : null;
                const headingText = match[3] ? match[3].trim() : null;
                const customDisplay = match[4] ? match[4].trim() : null;

                // Slugify heading text if present
                const headingSlug = headingText ? slugify(headingText) : null;

                // Determine display text
                let displayText;
                if (customDisplay) {
                    displayText = customDisplay;
                } else if (headingText && noteTitle) {
                    displayText = `${noteTitle}#${headingText}`;
                } else if (headingText) {
                    displayText = `#${headingText}`;
                } else {
                    displayText = noteTitle || '';
                }

                return {
                    type: 'wikilink',
                    raw: match[0],                  // Full match
                    isEmbed: isEmbed,               // true if starts with !
                    noteTitle: noteTitle,           // Note title (null for [[#Heading]])
                    headingText: headingText,       // Original heading text
                    headingSlug: headingSlug,       // Slugified heading for ID
                    displayText: displayText        // Text to display
                };
            }
        },

        renderer(token) {
            // This renderer is a placeholder - will be replaced with custom logic
            // that has access to the title→id mapping and database
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
