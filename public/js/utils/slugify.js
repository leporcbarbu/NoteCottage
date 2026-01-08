// Slugify utility for heading IDs
// Shared between Node.js (server) and browser (client)
// Converts "My Heading Text" → "my-heading-text"

(function() {
    function slugify(text) {
        // Handle non-string input (marked.js can pass tokens/objects)
        if (typeof text !== 'string') {
            text = String(text);
        }

        // Strip HTML tags if present
        text = text.replace(/<[^>]*>/g, '');

        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')  // Remove special characters
            .replace(/[\s_]+/g, '-')   // Replace spaces/underscores with dash
            .replace(/^-+|-+$/g, '');  // Remove leading/trailing dashes
    }

    // Export for both Node.js and browser environments
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment
        module.exports = { slugify };
    } else {
        // Browser environment - expose globally
        window.slugify = slugify;
    }
})();
