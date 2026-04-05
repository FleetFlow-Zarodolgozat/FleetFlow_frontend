// cypress/e2e/driverDashboard.cy.js
// Egyszerű teszt: bejelentkezés után a Driver Dashboard főbb elemei megjelennek

describe('Driver Dashboard – egyszerű teszt', () => {
  beforeEach(() => {
    // JWT stub: csak payload szükséges, nem igazi token
    const payload = btoa(JSON.stringify({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'driver@fleetflow.hu',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'DRIVER',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '99',
    }));
    const fakeToken = `header.${payload}.signature`;

    cy.window().then((win) => {
      win.localStorage.setItem('authToken', fakeToken);
      win.localStorage.setItem('user', JSON.stringify({
        email: 'driver@fleetflow.hu',
        role: 'DRIVER',
        id: '99',
      }));
    });

    // API hívások stubbolása
    cy.intercept('GET', '**/profile/mine', { statusCode: 200, body: { fullName: 'Test Driver', email: 'driver@fleetflow.hu' } });
    cy.intercept('GET', '**/statistics**', { statusCode: 200, body: { totalTrips: 12, totalDistance: 1540, totalFuels: 8, totalFuelCost: 45000, totalServices: 3, totalServicesCost: 12000 } });
    cy.intercept('GET', '**/calendarevents**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/vehicles/mine**', { statusCode: 200, body: null });
    cy.intercept('GET', '**/trips**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/fuellogs**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/notifications**', { statusCode: 200, body: [] });

    cy.visit('/dashboard');
  });

  it('megjeleníti a stat-carousel komponenst', () => {
    cy.get('.stat-carousel').should('exist');
  });

  it('megjeleníti a Center kártyát a megfelelő adattal', () => {
    cy.get('.stat-carousel-item.center .stat-label').should('exist');
    cy.get('.stat-carousel-item.center .stat-value').should('exist');
  });

  it('a nyilak működnek: következő kártyára lép', () => {
    cy.get('.stat-carousel-item.center .stat-label').invoke('text').then((firstLabel) => {
      cy.get('.stat-carousel-arrow.right').click();
      cy.get('.stat-carousel-item.center .stat-label').invoke('text').should('not.eq', firstLabel);
    });
  });
});
