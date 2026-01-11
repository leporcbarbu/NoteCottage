// Test script to verify heading renderer works with marked.js v17
const { marked } = require('marked');
const { slugify } = require('./public/js/utils/slugify.js');

// Create custom heading renderer using v17 API
const headingRenderer = {
    heading(token) {
        // In marked.js v17+, token.tokens needs to be parsed
        const text = this.parser.parseInline(token.tokens);
        const depth = token.depth;
        const slug = slugify(text);
        return `<h${depth} id="${slug}">${text}</h${depth}>`;
    }
};

// Configure marked with the renderer
marked.use({ renderer: headingRenderer });

// Test markdown with various headings
const testMarkdown = `# Main Heading

This is a paragraph.

## Second Level Heading

Another paragraph here.

### Third Level with **Bold**

Some text with a [link](https://example.com).

#### Code in Heading: \`someFunction()\`
`;

console.log('Testing marked.js v17 heading renderer:\n');
console.log('='.repeat(60));
const html = marked(testMarkdown);
console.log(html);
console.log('='.repeat(60));

// Check if headings render correctly (not as [object Object])
if (html.includes('[object Object]')) {
    console.error('\n❌ FAILED: Headings still showing [object Object]');
    process.exit(1);
} else if (html.includes('<h1 id="main-heading">Main Heading</h1>')) {
    console.log('\n✅ SUCCESS: Headings render correctly!');
    console.log('✅ IDs are properly slugified');
    process.exit(0);
} else {
    console.warn('\n⚠️  WARNING: Unexpected output');
    process.exit(1);
}
