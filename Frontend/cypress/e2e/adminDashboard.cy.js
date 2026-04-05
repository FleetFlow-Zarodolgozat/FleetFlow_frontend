// cypress/e2e/adminDashboard.cy.js
// Egyszerű teszt: admin belépés után a Dashboard Overview megjelenik

describe('Admin Dashboard – egyszerű teszt', () => {
  beforeEach(() => {
    const payload = btoa(JSON.stringify({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'admin@fleetflow.hu',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
    }));
    const fakeToken = `header.${payload}.signature`;

    cy.window().then((win) => {
      win.localStorage.setItem('authToken', fakeToken);
      win.localStorage.setItem('user', JSON.stringify({ email: 'admin@fleetflow.hu', role: 'Admin', id: '1' }));
    });

    cy.intercept('GET', '**/vehicles**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/drivers**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/trips**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/fuellogs**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/servicerequests**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/notifications**', { statusCode: 200, body: [] });

    cy.visit('/dashboard');
  });

  it('megjeleníti a Dashboard Overview feliratot', () => {
    cy.contains('Dashboard Overview').should('be.visible');
  });

  it('megjeleníti az időszak-választó gombokat', () => {
    cy.contains('Today').should('exist');
    cy.contains('Week').should('exist');
    cy.contains('Month').should('exist');
  });
});
