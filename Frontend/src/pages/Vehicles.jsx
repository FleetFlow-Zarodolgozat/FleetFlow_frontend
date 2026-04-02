import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/Vehicles.css';

const PAGE_SIZE = 10;

const STATUS_LABELS = {
  ACTIVE: 'Active',
  MAINTENANCE: 'In Service',
  INACTIVE: 'Inactive',
  RETIRED: 'Retired',
};

const STATUS_CLASSES = {
  ACTIVE: 'vstatus-active',
  MAINTENANCE: 'vstatus-maintenance',
  INACTIVE: 'vstatus-inactive',
  RETIRED: 'vstatus-retired',
};

const Vehicles = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const debounceRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchVehicles = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToLoad,
        pageSize: PAGE_SIZE,
      };
      if (searchQ.trim()) params.StringQ = searchQ.trim();
      if (statusFilter) params.Status = statusFilter;

      const response = await api.get('/admin/vehicles', { params });
      const payload = response.data || {};
      const rawVehicles = Array.isArray(payload.data) ? payload.data : [];

      setVehicles(rawVehicles);
      setTotalCount(payload.totalCount || 0);
      setPage(payload.page || pageToLoad);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'An error occurred while fetching vehicles.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchQ, statusFilter]);

  useEffect(() => {
    fetchVehicles(1);
    setPage(1);
  }, [searchQ, statusFilter]);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQ(val);
    }, 400);
  };

  const handleDeactivateVehicle = async (id, userEmail) => {
    if (!window.confirm('Are you sure you want to deactivate this vehicle? Any active driver assignment will be ended.')) return;
    setTogglingId(id);
    setError('');
    try {
      if (userEmail) {
        const driversRes = await api.get('/admin/drivers', { params: { page: 1, pageSize: 200 } });
        const driversList = Array.isArray(driversRes.data?.data) ? driversRes.data.data : [];
        const emailLower = userEmail.toLowerCase();
        const found = driversList.find((d) => (d.email || d.Email || '').toLowerCase() === emailLower);
        if (found) {
          const driverUserId = String(found.id ?? found.Id ?? found.userId ?? found.UserId ?? '');
          if (driverUserId) {
            await api.patch(`/admin/unassign/${driverUserId}`);
          }
        }
      }
      await api.patch(`/admin/vehicles/deactivate/${id}`);
      await fetchVehicles(page);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'An error occurred while deactivating the vehicle.';
      setError(message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleActivateVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to activate this vehicle?')) return;
    setTogglingId(id);
    setError('');
    try {
      await api.patch(`/admin/vehicles/activate/${id}`);
      await fetchVehicles(page);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'An error occurred while activating the vehicle.';
      setError(message);
    } finally {
      setTogglingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        items.push(i);
      } else if (i === page - 2 || i === page + 2) {
        items.push('...');
      }
    }
    return items.filter((item, idx) => !(item === '...' && items[idx - 1] === '...'));
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="vehicles-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="vehicles-page">

          {/* Header */}
          <div className="vehicles-header mb-4">
            <h1 className="vehicles-title">Vehicles</h1>
            <Button
              className="add-vehicle-btn"
              onClick={() => navigate('/add-vehicle')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add New Vehicle
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          {/* Table Card */}
          <div className="vehicles-table-card">

            {/* Filters row */}
            <div className="vehicles-filters">
              <div className="vehicles-search-wrapper">
                <svg className="vsearch-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  className="vehicles-search-input"
                  placeholder="Search by plate, model, VIN, driver..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                />
              </div>

              <div className="vehicles-filter-group">
                <div className="vehicles-status-filter">
                  <select
                    className="vstatus-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Status: Active + Service</option>
                    <option value="ACTIVE">Status: Active</option>
                    <option value="MAINTENANCE">Status: In Service</option>
                    <option value="RETIRED">Status: Inactive</option>
                  </select>
                  <svg className="vselect-chevron" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="vehicles-table-wrapper">
              <table className="vehicles-table">
                <thead>
                  <tr>
                    <th>LICENSE PLATE</th>
                    <th>MODEL</th>
                    <th>VIN</th>
                    <th>STATUS</th>
                    <th>DRIVER</th>
                    <th>MILEAGE</th>
                    <th>YEAR</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="vehicles-loading-cell">
                        <Spinner animation="border" size="sm" /> Loading...
                      </td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="vehicles-empty">
                          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="6" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 11V9a7 7 0 0 1 14 0v2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="7.5" cy="17.5" r="1.5" />
                            <circle cx="16.5" cy="17.5" r="1.5" />
                          </svg>
                          <p>No vehicles found matching the given criteria.</p>
                          <Button className="add-vehicle-btn" onClick={() => navigate('/add-vehicle')}>
                            Add New Vehicle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle) => {
                      const vid = vehicle.id ?? vehicle.Id;
                      const status = vehicle.status || vehicle.Status || 'ACTIVE';
                      const assignedUserEmail = vehicle.userEmail || vehicle.UserEmail || null;
                      return (
                        <tr key={vid}>
                          <td className="vehicle-plate-cell">
                            {vehicle.licensePlate || vehicle.LicensePlate || '–'}
                          </td>
                          <td className="vehicle-model-cell">
                            {vehicle.brandModel || vehicle.BrandModel || '–'}
                          </td>
                          <td className="vehicle-vin-cell">
                            {vehicle.vin || vehicle.Vin || '–'}
                          </td>
                          <td>
                            <span className={`vstatus-badge ${STATUS_CLASSES[status] || 'vstatus-inactive'}`}>
                              <span className="vstatus-dot" />
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                          <td className="vehicle-driver-cell">
                            {vehicle.userEmail || vehicle.UserEmail || '–'}
                          </td>
                          <td>
                            {vehicle.currentMileageKm ?? vehicle.CurrentMileageKm
                              ? `${(vehicle.currentMileageKm ?? vehicle.CurrentMileageKm).toLocaleString()} km`
                              : '–'}
                          </td>
                          <td>
                            {vehicle.year || vehicle.Year || '–'}
                          </td>
                          <td className="vactions-cell">
                            <button
                              className="vaction-btn vaction-edit"
                              title="Edit"
                              onClick={() => navigate(`/vehicles/${vid}/edit`)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {status === 'RETIRED' ? (
                              <button
                                className="vaction-btn vaction-activate"
                                title="Activate"
                                onClick={() => handleActivateVehicle(vid)}
                                disabled={togglingId === vid}
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M12 2L15.09 8.26H22L17.55 12.5L19.64 18.76L12 14.01L4.36 18.76L6.45 12.5L2 8.26H8.91L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                className="vaction-btn vaction-deactivate"
                                title="Deactivate"
                                onClick={() => handleDeactivateVehicle(vid, assignedUserEmail)}
                                disabled={togglingId === vid}
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalCount > 0 && (
              <div className="vehicles-pagination">
                <span className="vpagination-info">
                  Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalCount}</strong>
                </span>
                <div className="vpagination-controls">
                  <button
                    className="vpage-btn"
                    disabled={page <= 1}
                    onClick={() => fetchVehicles(page - 1)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="15,18 9,12 15,6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {buildPaginationItems().map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="vpage-ellipsis">…</span>
                    ) : (
                      <button
                        key={item}
                        className={`vpage-btn vpage-num ${item === page ? 'active' : ''}`}
                        onClick={() => fetchVehicles(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    className="vpage-btn"
                    disabled={page >= totalPages}
                    onClick={() => fetchVehicles(page + 1)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="9,6 15,12 9,18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Container>
        <Footer />
      </main>
    </div>
  );
};

export default Vehicles;
