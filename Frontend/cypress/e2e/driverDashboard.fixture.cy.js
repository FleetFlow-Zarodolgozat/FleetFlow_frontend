// cypress/e2e/driverDashboard.fixture.cy.js
// Fixture-alapú teszt: a fixture/driver.json adatait ellenőrzi

describe('Driver Dashboard – fixture teszt', () => {
  beforeEach(() => {
    cy.fixture('driver').then((driver) => {
      const payload = btoa(JSON.stringify({
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': driver.email,
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': driver.role,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '99',
      }));
      const fakeToken = `header.${payload}.signature`;

      cy.window().then((win) => {
        win.localStorage.setItem('authToken', fakeToken);
        win.localStorage.setItem('user', JSON.stringify({ email: driver.email, role: driver.role, id: '99' }));
      });

      cy.intercept('GET', '**/profile/mine', { statusCode: 200, body: { fullName: driver.name, email: driver.email } });
      cy.intercept('GET', '**/statistics**', { statusCode: 200, body: driver.statistics });
      cy.intercept('GET', '**/calendarevents**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/vehicles/mine**', { statusCode: 200, body: null });
      cy.intercept('GET', '**/trips**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/fuellogs**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/notifications**', { statusCode: 200, body: [] });
    });

    cy.visit('/dashboard');
  });

  it('a Total Trips értéke egyezik a fixture adatával', () => {
    cy.fixture('driver').then((driver) => {
      // Az első kártya a Total Trips
      cy.get('.stat-carousel-item.center .stat-value')
        .invoke('text')
        .should('contain', String(driver.statistics.totalTrips));
    });
  });
});
