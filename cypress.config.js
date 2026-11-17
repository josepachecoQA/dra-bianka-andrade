const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4173/',
    viewportWidth: 1280,
    viewportHeight: 800,
    supportFile: 'cypress/support/e2e.js',
    retries: 0,
    setupNodeEvents(on) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
  },
});
