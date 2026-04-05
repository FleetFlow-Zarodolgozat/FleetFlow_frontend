// cypress/e2e/adminDashboard.fixture.cy.js
// Fixture-alapú teszt: a fixture/admin.json adatait ellenőrzi

describe('Admin Dashboard – fixture teszt', () => {
  beforeEach(() => {
    cy.fixture('admin').then((admin) => {
      const activeVehicles = Math.round(admin.fleetStats.total * admin.fleetStats.activePercent / 100);
      const inactiveVehicles = admin.fleetStats.total - activeVehicles;
      const maintenanceVehicles = Math.ceil(inactiveVehicles / 2);
      const retiredVehicles = inactiveVehicles - maintenanceVehicles;

      const payload = btoa(JSON.stringify({
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': admin.email,
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': admin.role,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
      }));
      const fakeToken = `header.${payload}.signature`;

      cy.intercept('GET', '**/calendarevents*', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/statistics/admin-dashboard*', {
        statusCode: 200,
        body: {
          totalFleet: admin.fleetStats.total,
          fuelCosts: 0,
          fuelCostsChange: 0,
          activeTrips: admin.trips,
          utilizationRate: admin.fleetStats.activePercent,
          pendingMaintenance: 0,
          urgentRequests: 0,
        },
      });
      cy.intercept('GET', '**/drivers**', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/vehicles*', { statusCode: 200, body: [] });
      cy.intercept('GET', '**/admin/vehicles*', (req) => {
        const status = req.query.Status;

        let totalCount = retiredVehicles;
        if (status === 'ACTIVE') totalCount = activeVehicles;
        if (status === 'MAINTENANCE') totalCount = maintenanceVehicles;

        req.reply({
          statusCode: 200,
          body: {
            data: [],
            totalCount,
          },
        });
      });
      cy.intercept('GET', '**/fuellogs/admin*', { statusCode: 200, body: { data: [] } });
      cy.intercept('GET', '**/trips/admin*', { statusCode: 200, body: { data: [] } });
      cy.intercept('GET', '**/service-requests/admin*', { statusCode: 200, body: { data: [] } });

      cy.visit('/dashboard', {
        onBeforeLoad(win) {
          win.localStorage.setItem('authToken', fakeToken);
          win.localStorage.setItem('user', JSON.stringify({ email: admin.email, role: admin.role, id: '1' }));
        },
      });
    });
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
