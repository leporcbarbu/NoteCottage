// Mock for jsdom to avoid ESM issues in Jest
// This provides a minimal implementation for testing

class JSDOM {
  constructor(html) {
    this.window = {
      document: {
        querySelectorAll: () => [],
        querySelector: () => null,
        body: {
          textContent: html || ''
        }
      }
    };
  }
}

module.exports = { JSDOM };
