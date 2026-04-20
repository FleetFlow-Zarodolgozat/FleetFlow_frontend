import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import CustomModal from '../components/CustomModal';
import '../styles/Drivers.css';

const PAGE_SIZE = 10;

const Drivers = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: 'Error',
    message: '',
  });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const debounceRef = useRef(null);
  const [isActiveFilter, setIsActiveFilter] = useState(true); // true = Aktív, false = Inaktív
  const [driverImages, setDriverImages] = useState({});
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedActivateDriverId, setSelectedActivateDriverId] = useState(null);
  const [actionFeedbackModal, setActionFeedbackModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  // Központosított hibamegjelenítés, hogy minden backend hiba azonos modalban látszódjon.
  const openErrorModal = (message) => {
    setErrorModal({ open: true, title: 'Error', message });
  };

  const closeErrorModal = () => {
    setErrorModal((prev) => ({ ...prev, open: false }));
  };

  const openActionFeedbackModal = (title, message) => {
    setActionFeedbackModal({ open: true, title, message });
  };

  useEffect(() => {
    if (!actionFeedbackModal.open) return;
    const timeoutId = setTimeout(() => {
      setActionFeedbackModal((prev) => ({ ...prev, open: false }));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [actionFeedbackModal.open]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDrivers = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      // A lista backend oldalon lapozott és szűrt, ezért minden állapotváltozásnál
      // új lekérést indítunk az aktuális oldalra/szűrőkre.
      const params = {
        page: pageToLoad,
        pageSize: PAGE_SIZE,
        IsActiveQ: isActiveFilter,
      };
      if (searchQ.trim()) params.StringQ = searchQ.trim();

      const response = await api.get('/admin/drivers', { params });
      const payload = response.data || {};
      const rawDrivers = Array.isArray(payload.data) ? payload.data : [];
      // A driver lista endpoint nem ad rendszámot minden sorban, ezért soronként
      // lekérjük az aktuális hozzárendelt járművet és dúsítjuk vele a táblát.
      const enriched = await Promise.all(
        rawDrivers.map(async (d) => {
          const driverId = d.id ?? d.Id;
          try {
            const res = await api.get(`/admin/assign/driver/${driverId}`);
            const v = res.data;
            const plate = v?.isAssigned
              ? (v?.assignedVehicle?.licensePlate || v?.assignedVehicle?.LicensePlate || v?.AssignedVehicle?.licensePlate || v?.AssignedVehicle?.LicensePlate || null)
              : null;
            return { ...d, assignedVehiclePlate: plate };
          } catch {
            return { ...d, assignedVehiclePlate: null };
          }
        })
      );

      setDrivers(enriched);
      setTotalCount(payload.totalCount || 0);
      setPage(payload.page || pageToLoad);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'An error occurred while fetching drivers.';
      openErrorModal(message);
    } finally {
      setLoading(false);
    }
  }, [searchQ, isActiveFilter]);

  useEffect(() => {
    fetchDrivers(1);
    setPage(1);
  }, [searchQ, isActiveFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    // Debounce: gépelés közben nem terheljük túl a backend-et,
    // csak rövid szünet után frissítjük a tényleges kereső queryt.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQ(val);
    }, 400);
  };

  const handleDeactivateDriver = (id) => {
    setSelectedDriverId(id);
    setDeactivateModalOpen(true);
  };

  const confirmDeactivateDriver = async () => {
    if (!selectedDriverId) return;
    setTogglingId(selectedDriverId);
    setDeactivateModalOpen(false);
    try {
      await api.patch(`/admin/drivers/deactivate/${selectedDriverId}`);
      openActionFeedbackModal('Successful', 'Driver deactivated successfully.');
      setTogglingId(null);
      setSelectedDriverId(null);
      await fetchDrivers(1);
    } catch (err) {
      setTogglingId(null);
      setSelectedDriverId(null);
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'An error occurred while deactivating the driver.';
      openActionFeedbackModal('Error', message);
    }
  };

  const handleActivateDriver = (id) => {
    setSelectedActivateDriverId(id);
    setActivateModalOpen(true);
  };

  const confirmActivateDriver = async () => {
    if (!selectedActivateDriverId) return;
    setTogglingId(selectedActivateDriverId);
    setActivateModalOpen(false);
    try {
      await api.patch(`/admin/drivers/activate/${selectedActivateDriverId}`);
      openActionFeedbackModal('Successful', 'Driver activated successfully.');
      setTogglingId(null);
      setSelectedActivateDriverId(null);
      await fetchDrivers(1);
    } catch (err) {
      setTogglingId(null);
      setSelectedActivateDriverId(null);
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'An error occurred while activating the driver.';
      openActionFeedbackModal('Error', message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - 1 && i <= page + 1)
      ) {
        items.push(i);
      } else if (i === page - 2 || i === page + 2) {
        items.push('...');
      }
    }
    // Deduplicate consecutive ellipses
    return items.filter((item, idx) => !(item === '...' && items[idx - 1] === '...'));
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  const getDriverInitials = (email) => {
    if (!email) return '?';
    const part = email.split('@')[0];
    return part.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (drivers.length === 0) return;
    let cancelled = false;
    const fetchImages = async () => {
      const newImages = {};
      // A képeket blob URL-re alakítjuk, így a táblában gyorsan és cache-elhetően
      // jelennek meg az avatárok extra render-logika nélkül.
      await Promise.all(
        drivers.map(async (d) => {
          const imgId = d.profileImgFileId ?? d.ProfileImgFileId;
          if (imgId && driverImages[imgId] === undefined) {
            try {
              const res = await api.get(`/files/${imgId}`, { responseType: 'blob' });
              newImages[imgId] = URL.createObjectURL(res.data);
            } catch {
              newImages[imgId] = null;
            }
          }
        })
      );
      if (!cancelled && Object.keys(newImages).length > 0) {
        setDriverImages((prev) => ({ ...prev, ...newImages }));
      }
    };
    fetchImages();
    return () => { cancelled = true; };
  }, [drivers]);

  return (
    <div className="drivers-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="drivers-page">
          {/* Header */}
          <div className="drivers-header mb-4">
            <div className="drivers-header-left">
              <h1 className="drivers-title">Driver Management</h1>
              <div className="drivers-subtitle">
                View, search, and manage all drivers in your fleet
              </div>
            </div>
            <Button
              className="add-driver-btn"
              onClick={() => navigate('/add-driver')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add New Driver
            </Button>
          </div>

          <CustomModal
            isOpen={deactivateModalOpen}
            onClose={() => {
              setDeactivateModalOpen(false);
              setSelectedDriverId(null);
            }}
            title="Confirm Deactivation"
            secondaryAction={{
              label: 'Cancel',
              onClick: () => {
                setDeactivateModalOpen(false);
                setSelectedDriverId(null);
              },
            }}
            primaryAction={{
              label: 'Deactivate',
              onClick: confirmDeactivateDriver,
            }}
          >
            <p className="mb-0">Are you sure you want to deactivate this driver? They will lose access and any active vehicle assignment will be ended.</p>
          </CustomModal>

          <CustomModal
            isOpen={activateModalOpen}
            onClose={() => {
              setActivateModalOpen(false);
              setSelectedActivateDriverId(null);
            }}
            title="Confirm Reactivation"
            secondaryAction={{
              label: 'Cancel',
              onClick: () => {
                setActivateModalOpen(false);
                setSelectedActivateDriverId(null);
              },
            }}
            primaryAction={{
              label: 'Reactivate',
              onClick: confirmActivateDriver,
            }}
          >
            <p className="mb-0">Are you sure you want to reactivate this driver? They will regain access to the system.</p>
          </CustomModal>

          <CustomModal
            isOpen={errorModal.open}
            onClose={closeErrorModal}
            title={errorModal.title}
            primaryAction={{
              label: 'OK',
              onClick: closeErrorModal,
            }}
          >
            <p className="mb-0">{errorModal.message}</p>
          </CustomModal>

          <CustomModal
            isOpen={actionFeedbackModal.open}
            onClose={() => setActionFeedbackModal((prev) => ({ ...prev, open: false }))}
            title={actionFeedbackModal.title}
          >
            <p className="mb-0">{actionFeedbackModal.message}</p>
          </CustomModal>

          {/* Table Card */}
          <div className="drivers-table-card">
            {/* Filters row */}
            <div className="drivers-filters">
              <form className="drivers-search-form" onSubmit={handleSearchSubmit}>
                <div className="drivers-search-wrapper">
                  <svg className="search-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="text"
                    className="drivers-search-input"
                    placeholder="Search by name, email or vehicle plate"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </form>

              <div className="drivers-status-filter">
                <select
                  className="status-select"
                  value={isActiveFilter ? 'active' : 'inactive'}
                  onChange={(e) => setIsActiveFilter(e.target.value === 'active')}
                >
                  <option value="active">Status: Active</option>
                  <option value="inactive">Status: Inactive</option>
                </select>
                <svg className="select-chevron" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Table */}
            <div className="drivers-table-wrapper">
              <table className="drivers-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>ASSIGNED VEHICLE</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>LICENSE NUMBER</th>
                    <th>LICENSE EXPIRY</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="drivers-loading-cell">
                        <Spinner animation="border" size="sm" /> Loading...
                      </td>
                    </tr>
                  ) : drivers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="drivers-empty-cell">
                        No drivers found matching the given criteria.
                      </td>
                    </tr>
                  ) : (
                    drivers.map((driver) => (
                      <tr key={driver.id || driver.Id}>
                        <td className="driver-name-cell">
                          <div className="driver-avatar-cell">
                            <div className="driver-avatar">
                              {driverImages[driver.profileImgFileId] ? (
                                <img src={driverImages[driver.profileImgFileId]} alt={driver.fullName || driver.FullName} />
                              ) : (
                                <span>{getDriverInitials(driver.email || driver.Email)}</span>
                              )}
                            </div>
                            <span className="driver-name">{driver.fullName || driver.FullName || '–'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="assigned-vehicle-badge">{driver.assignedVehiclePlate || '–'}</span>
                        </td>
                        <td className="driver-email-cell">
                          {driver.email || driver.Email || '–'}
                        </td>
                        <td>
                          {driver.phone || driver.Phone || '–'}
                        </td>
                        <td>
                          {driver.licenseNumber || driver.LicenseNumber || '–'}
                        </td>
                        <td>
                          {driver.licenseExpiryDate || driver.LicenseExpiryDate
                            ? new Date(driver.licenseExpiryDate || driver.LicenseExpiryDate).toLocaleDateString('en-GB')
                            : '–'}
                        </td>
                        <td>
                          <span className={`status-badge ${(driver.isActive ?? driver.IsActive) ? 'status-active' : 'status-inactive'}`}>
                            <span className="status-dot" />
                            {(driver.isActive ?? driver.IsActive) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          {(driver.isActive ?? driver.IsActive) && (
                            <button
                              className="action-btn-icon action-edit"
                              title="Edit"
                              onClick={() => navigate(`/drivers/${driver.id || driver.Id}/edit`)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                          {(driver.isActive ?? driver.IsActive) ? (
                            <button
                              className="action-btn-icon action-deactivate"
                              title="Deactivate"
                              onClick={() => handleDeactivateDriver(driver.id || driver.Id)}
                              disabled={togglingId === (driver.id || driver.Id)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              className="action-btn-icon action-activate"
                              title="Activate"
                              onClick={() => handleActivateDriver(driver.id || driver.Id)}
                              disabled={togglingId === (driver.id || driver.Id)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalCount > 0 && (
              <div className="drivers-pagination">
                <span className="pagination-info ff-pagination-info">
                  Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalCount}</strong>
                </span>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    disabled={page <= 1}
                    onClick={() => fetchDrivers(page - 1)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="15,18 9,12 15,6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {buildPaginationItems().map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                    ) : (
                      <button
                        key={item}
                        className={`page-btn page-num ${item === page ? 'active' : ''}`}
                        onClick={() => fetchDrivers(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    className="page-btn"
                    disabled={page >= totalPages}
                    onClick={() => fetchDrivers(page + 1)}
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
      </main>
    </div>
  );
};

export default Drivers;
