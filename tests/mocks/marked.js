// Mock for marked.js to avoid ESM issues in Jest
// This provides a minimal implementation for testing

// marked can be called as a function or as marked.parse()
function markedFunc(content) {
  // Simple mock markdown parser - just wraps in <p> tags
  return `<p>${content}</p>`;
}

// Add methods that marked supports
markedFunc.parse = markedFunc;
markedFunc.use = () => {};  // Mock the use method for extensions
markedFunc.setOptions = () => {};

module.exports = { marked: markedFunc };
