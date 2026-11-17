import 'cypress-axe';

Cypress.Commands.add('visitarPagina', () => {
  cy.visit('/', {
    onBeforeLoad(win) {
      cy.spy(win.console, 'error').as('consoleError');
    },
  });
});

Cypress.Commands.add('revelarTudo', () => {
  cy.window().then((win) => {
    const semAnimacao = win.document.createElement('style');
    semAnimacao.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
    win.document.head.appendChild(semAnimacao);
    win.document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    win.document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
  });
});
