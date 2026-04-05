// cypress/e2e/adminDashboard.fixture.cy.js
// Fixture-alapú teszt: a fixture/admin.json adatait ellenőrzi

describe('Admin Dashboard – fixture teszt', () => {
  beforeEach(() => {
    cy.fixture('admin').then((admin) => {
      const payload = btoa(JSON.stringify({
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': admin.email,
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': admin.role,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
      }));
      const fakeToken = `header.${payload}.signature`;

      cy.window().then((win) => {
        win.localStorage.setItem('authToken', fakeToken);
        win.localStorage.setItem('user', JSON.stringify({ email: admin.email, role: admin.role, id: '1' }));
      });

      // Járműlista: fixture total értékének megfelelő számú elem
      const vehicles = Array.from({ length: admin.fleetStats.total }, (_, i) => ({
        id: i + 1,
        licensePlate: `ABC-${100 + i}`,
        status: i < Math.round(admin.fleetStats.total * admin.fleetStats.activePercent / 100) ? 'Active' : 'Inactive',
      }));

      cy.intercept('GET', '**/vehicles**', { statusCode: 200, body: vehicles });
      cy.intercept('GET', '**/drivers**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/trips**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/fuellogs**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/servicerequests**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/notifications**', { statusCode: 200, body: [] });
    });

    cy.visit('/dashboard');
  });

  it('a Total Fleet értéke egyezik a fixture adatával', () => {
    cy.fixture('admin').then((admin) => {
      cy.contains('.stat-label', 'Total Fleet')
        .closest('.card-body')
        .find('.stat-value')
        .invoke('text')
        .should('contain', String(admin.fleetStats.total));
    });
  });
});
