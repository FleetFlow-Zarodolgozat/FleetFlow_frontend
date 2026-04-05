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

      cy.intercept('GET', '**/profile/mine', { statusCode: 200, body: { fullName: driver.name, email: driver.email } });
      cy.intercept('GET', '**/profile/assigned-vehicle', { statusCode: 200, body: null });
      cy.intercept('GET', '**/statistics/mine*', { statusCode: 200, body: driver.statistics });
      cy.intercept('GET', '**/calendarevents*', { statusCode: 200, body: [] });

      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          win.localStorage.setItem('authToken', fakeToken);
          win.localStorage.setItem('user', JSON.stringify({ email: driver.email, role: driver.role, id: '99' }));
        },
      });
    });
  });

  it('a Total Trips értéke egyezik a fixture adatával', () => {
    cy.fixture('driver').then((driver) => {
      cy.contains('.stat-carousel-item.center .stat-label', 'Total Trips')
        .siblings('.stat-value')
        .invoke('text')
        .should('contain', String(driver.statistics.totalTrips));
    });
  });
});
