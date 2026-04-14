import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/EditDriver.css';
import '../styles/EditVehicle.css';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', badgeClass: 'badge-ev-active' },
  { value: 'RETIRED', label: 'Retired', badgeClass: 'badge-ev-inactive' },
];

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    vin: '',
    year: '',
    currentMileageKm: '',
    status: 'ACTIVE',
    assignedUserId: '',
  });

  const [drivers, setDrivers] = useState({ active: [], all: [] });
  const [originalStatus, setOriginalStatus] = useState('ACTIVE');
  const [originalAssignedUserId, setOriginalAssignedUserId] = useState('');
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/admin/vehicles', {
          params: { page: 1, pageSize: 200 },
        });
        const payload = res.data || {};
        const vehicles = Array.isArray(payload.data) ? payload.data : [];
        const vehicle = vehicles.find((v) => String(v.id ?? v.Id) === String(id));
        if (!vehicle) {
          setError('Vehicle not found.');
          setLoading(false);
          return;
        }

        // Split BrandModel into brand + model
        const brandModel = vehicle.brandModel || vehicle.BrandModel || '';
        const parts = brandModel.split(' ');
        const brand = parts[0] || '';
        const model = parts.slice(1).join(' ') || '';

        setForm({
          licensePlate: vehicle.licensePlate || vehicle.LicensePlate || '',
          brand,
          model,
          vin: vehicle.vin || vehicle.Vin || '',
          year: String(vehicle.year || vehicle.Year || ''),
          currentMileageKm: String(vehicle.currentMileageKm ?? vehicle.CurrentMileageKm ?? ''),
          status: vehicle.status || vehicle.Status || 'ACTIVE',
          assignedUserId: '',
        });
        setOriginalStatus(vehicle.status || vehicle.Status || 'ACTIVE');
        
        // Fetch free/assigned drivers for this vehicle using the new endpoint
        let resolvedOriginalUserId = '';
        let availableDriversList = [];
        
        try {
          const assignRes = await api.get(`/admin/assign/vehicle/${id}`);
          const assignData = assignRes.data || {};
          
          if (assignData.isAssigned) {
            // Vehicle is assigned to a driver
            const assignedDriver = assignData.assignedDriver;
            if (assignedDriver && assignedDriver.id) {
              resolvedOriginalUserId = String(assignedDriver.id);
              availableDriversList = [assignedDriver];
            }
          } else {
            // Vehicle is not assigned, get free drivers
            availableDriversList = Array.isArray(assignData.freeDrivers) ? assignData.freeDrivers : [];
          }
        } catch {
          console.log('Could not fetch available drivers from assign endpoint, falling back to all drivers');
          // Fallback: fetch all active drivers
          try {
            const driversRes = await api.get('/admin/drivers', {
              params: { page: 1, pageSize: 200 },
            });
            const driversPayload = driversRes.data || {};
            const driversList = Array.isArray(driversPayload.data) ? driversPayload.data : [];
            availableDriversList = driversList.filter((d) => d.isActive ?? d.IsActive);
          } catch {
            availableDriversList = [];
          }
        }
        
        // Store drivers for dropdown
        setDrivers({ active: availableDriversList, all: availableDriversList });
        
        // Try to resolve original assigned user ID from vehicle email if not set
        if (!resolvedOriginalUserId) {
          const userEmail = vehicle.userEmail || vehicle.UserEmail;
          if (userEmail) {
            const emailLower = userEmail.toLowerCase();
            const found = availableDriversList.find(
              (d) => (d.email || d.Email || '').toLowerCase() === emailLower
            );
            if (found) {
              resolvedOriginalUserId = String(found.id ?? found.Id ?? found.userId ?? found.UserId ?? '');
              if (resolvedOriginalUserId) {
                setForm((prev) => ({ ...prev, assignedUserId: resolvedOriginalUserId }));
              }
            }
          }
        }
        setOriginalAssignedUserId(resolvedOriginalUserId);
        setHistoryLoading(true);
        try {
          const historyRes = await api.get(`/admin/assignment/history/${id}`);
          const history = Array.isArray(historyRes.data) ? historyRes.data : [];
          setAssignmentHistory(history);

          // Fallback: if original ID not resolved yet, derive from active history entry
          if (!resolvedOriginalUserId) {
            const isActiveEntry = (h) => {
              const val = h.assignedTo ?? h.AssignedTo;
              if (!val) return true;
              if (typeof val === 'string' && (val.startsWith('0001-') || val === '')) return true;
              return false;
            };
            const activeEntry = history.find(isActiveEntry);
            if (activeEntry) {
              const entryEmail = (activeEntry.driverEmail || activeEntry.DriverEmail || '').toLowerCase();
              // Try email match with available drivers
              const found = entryEmail && availableDriversList.find(
                (d) => (d.email || d.Email || '').toLowerCase() === entryEmail
              );
              if (found) {
                const uid = String(found.id ?? found.Id ?? found.userId ?? found.UserId ?? '');
                if (uid) {
                  resolvedOriginalUserId = uid;
                  setOriginalAssignedUserId(uid);
                  setForm((prev) => ({ ...prev, assignedUserId: uid }));
                }
              }
            }
          }
        } catch {
          setAssignmentHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      } catch (err) {
        const msg = err?.response?.data;
        setError(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to load vehicle data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUnassign = async () => {
    if (!originalAssignedUserId) return;
    setUnassigning(true);
    setError('');
    try {
      await api.patch(`/admin/unassign/${originalAssignedUserId}`);
      setOriginalAssignedUserId('');
      setForm((prev) => ({ ...prev, assignedUserId: '' }));
    } catch (err) {
      const msg = err?.response?.data;
      setError(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to unassign driver.');
    } finally {
      setUnassigning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/vehicles/edit/${id}`, {
        licensePlate: form.licensePlate || null,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year, 10) : 0,
        currentMileageKm: form.currentMileageKm ? parseInt(form.currentMileageKm, 10) : 0,
      });
      if (form.status !== originalStatus) {
        // If changing to RETIRED and there's an assigned driver, unassign first
        if (form.status === 'RETIRED' && originalAssignedUserId) {
          await api.patch(`/admin/unassign/${originalAssignedUserId}`);
          setOriginalAssignedUserId('');
          setForm((prev) => ({ ...prev, assignedUserId: '' }));
        }
        const endpoint = form.status === 'ACTIVE'
          ? `/admin/vehicles/activate/${id}`
          : `/admin/vehicles/deactivate/${id}`;
        await api.patch(endpoint);
        setOriginalStatus(form.status);
      }
      // Assign new driver if one was selected (unassign already handled by the Unassign button)
      if (form.assignedUserId && form.assignedUserId !== originalAssignedUserId) {
        await api.post(`/admin/assign/${form.assignedUserId}/${id}`);
        setOriginalAssignedUserId(form.assignedUserId);
      }
      setSuccess('Vehicle updated successfully.');
      setTimeout(() => navigate('/vehicles'), 1500);
    } catch (err) {
      const msg = err?.response?.data;
      setError(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to update vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === form.status) || STATUS_OPTIONS[0];

  return (
    <div className="edit-driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="edit-driver-page">

          {/* Header */}
          <div className="edit-driver-header">
            <div className="edit-driver-title-row">
              <h1 className="edit-driver-title">Edit Vehicle</h1>
              <p className="edit-driver-subtitle">Update vehicle information and assignment</p>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-4">
              {success}
            </Alert>
          )}

          {loading ? (
            <div className="edit-driver-loading">
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="ev-layout">

              {/* ─── Left panel ───────────────────────────── */}
              <div className="ev-left-panel">

                {/* Quick Tips card */}
                <div className="edit-driver-card ev-tips-card">
                  <div className="ev-tips-header">QUICK TIPS</div>
                  <ul className="ev-tips-list">
                    <li>
                      <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                        <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                      </svg>
                      License plates should be entered without spaces for consistency.
                    </li>
                    <li>
                      <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Current mileage is crucial for scheduling upcoming maintenance.
                    </li>
                    <li>
                      <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      You can reassign drivers later from the main dashboard.
                    </li>
                  </ul>
                </div>

                {/* Assignment History card */}
                <div className="edit-driver-card ev-history-card">
                  <div className="ev-tips-header">ASSIGNMENT HISTORY</div>
                  {historyLoading ? (
                    <div className="ev-history-loading">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : assignmentHistory.length === 0 ? (
                    <p className="ev-history-empty">No assignment history found.</p>
                  ) : (
                    <ul className="ev-history-list">
                      {assignmentHistory.map((entry, idx) => {
                        const from = entry.assignedFrom || entry.AssignedFrom;
                        const to = entry.assignedTo || entry.AssignedTo;
                        const driver = entry.driverEmail || entry.DriverEmail || '–';
                        const formatDate = (val) => {
                          if (!val) return null;
                          const d = new Date(val);
                          if (isNaN(d.getTime())) return val;
                          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        };
                        return (
                          <li key={idx} className="ev-history-item">
                            <div className="ev-history-driver">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {driver}
                            </div>
                            <div className="ev-history-dates">
                              <span>{formatDate(from) || '–'}</span>
                              <span className="ev-history-arrow">→</span>
                              <span className={to ? '' : 'ev-history-current'}>{to ? formatDate(to) : 'Active'}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

              </div>

              {/* ─── Right panel — form ────────────────────── */}
              <form onSubmit={handleSubmit} className="ev-right-panel">

                <div className="edit-driver-card">
                  {/* Card header with status badge */}
                  <div className="edit-driver-card-header ev-details-card-header">
                    <div>
                      <h2 className="card-title">Vehicle Details</h2>
                      <p className="card-subtitle">Update the core information for this fleet vehicle.</p>
                    </div>
                    <span className={`ev-status-badge ${currentStatus.badgeClass}`}>
                      {currentStatus.label}
                    </span>
                  </div>

                  <div className="edit-driver-card-body">

                    {/* ── IDENTIFICATION ─────────────────────── */}
                    <div className="ev-section-label">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 3h-8l-2 4h12l-2-4z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      IDENTIFICATION
                    </div>

                    <Form.Group className="form-field">
                      <Form.Label className="field-label">
                        License Plate <span className="required">*</span>
                      </Form.Label>
                      <div className="ev-plate-input-wrapper">
                        <span className="ev-plate-prefix">HU</span>
                        <Form.Control
                          type="text"
                          name="licensePlate"
                          value={form.licensePlate}
                          onChange={handleChange}
                          placeholder="e.g. ABC-1234"
                          required
                          className="field-input ev-plate-input"
                        />
                      </div>
                      <small className="ev-field-hint">Format: Standard alphanumeric license code.</small>
                    </Form.Group>

                    <div className="form-row-2">
                      <Form.Group className="form-field">
                        <Form.Label className="field-label">
                          Brand <span className="required">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="brand"
                          value={form.brand}
                          onChange={handleChange}
                          placeholder="e.g. Ford"
                          required
                          className="field-input"
                        />
                      </Form.Group>
                      <Form.Group className="form-field">
                        <Form.Label className="field-label">
                          Model <span className="required">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="model"
                          value={form.model}
                          onChange={handleChange}
                          placeholder="e.g. Transit Connect"
                          required
                          className="field-input"
                        />
                      </Form.Group>
                    </div>

                    <Form.Group className="form-field">
                      <Form.Label className="field-label">VIN</Form.Label>
                      <Form.Control
                        type="text"
                        name="vin"
                        value={form.vin}
                        onChange={handleChange}
                        placeholder="e.g. 1HGCM82633A004352"
                        className="field-input ev-vin-input"
                        maxLength={17}
                      />
                    </Form.Group>

                    {/* ── SPECIFICATIONS ─────────────────────── */}
                    <div className="ev-section-label ev-section-label--gap">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      SPECIFICATIONS
                    </div>

                    <div className="form-row-2">
                      <Form.Group className="form-field">
                        <Form.Label className="field-label">Manufacturing Year</Form.Label>
                        <Form.Control
                          type="number"
                          name="year"
                          value={form.year}
                          onChange={handleChange}
                          placeholder="YYYY"
                          min={1900}
                          max={new Date().getFullYear() + 1}
                          className="field-input"
                        />
                      </Form.Group>
                      <Form.Group className="form-field">
                        <Form.Label className="field-label">Current Mileage</Form.Label>
                        <div className="ev-mileage-wrapper">
                          <Form.Control
                            type="number"
                            name="currentMileageKm"
                            value={form.currentMileageKm}
                            onChange={handleChange}
                            placeholder="0"
                            min={0}
                            className="field-input ev-mileage-input"
                          />
                          <span className="ev-mileage-suffix">km</span>
                        </div>
                      </Form.Group>
                    </div>

                    {/* ── STATUS ─────────────────────────────── */}
                    <div className="ev-section-label ev-section-label--gap">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      STATUS
                    </div>

                    <div className="ev-status-options">
                      {STATUS_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`ev-status-option${form.status === opt.value ? ' selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={opt.value}
                            checked={form.status === opt.value}
                            onChange={handleChange}
                          />
                          <span className={`ev-status-pill ${opt.badgeClass}`}>{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* ── DRIVER ASSIGNMENT ──────────────────── */}
                    <div className="ev-section-label ev-section-label--gap">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      DRIVER ASSIGNMENT
                    </div>

                    {originalAssignedUserId ? (
                      <div className="form-field">
                        <label className="field-label">Assigned Driver</label>
                        <div className="ev-assigned-driver-row">
                          <span className="ev-assigned-driver-name">
                            {(() => {
                              const found = drivers.all.find(
                                (d) => String(d.id ?? d.Id ?? d.userId ?? d.UserId ?? '') === originalAssignedUserId
                              );
                              return found
                                ? (found.fullName || found.FullName || found.email || found.Email)
                                : originalAssignedUserId;
                            })()}
                          </span>
                          <Button
                            type="button"
                            className="ev-unassign-btn"
                            onClick={handleUnassign}
                            disabled={unassigning}
                          >
                            {unassigning ? (
                              <><Spinner animation="border" size="sm" className="me-1" />Unassigning...</>
                            ) : (
                              <>Unassign Driver</>
                            )}
                          </Button>
                        </div>
                        <p className="ev-unassign-warning">
                          Clicking on "Unassign Driver" will instantly unassign the current driver!
                        </p>
                      </div>
                    ) : (
                      <Form.Group className="form-field">
                        <Form.Label className="field-label">Assign Driver</Form.Label>
                        <Form.Select
                          name="assignedUserId"
                          value={form.assignedUserId}
                          onChange={handleChange}
                          className="field-input"
                        >
                          <option value="">Select a driver...</option>
                          {drivers.active.map((d) => {
                            const uid = String(d.id ?? d.Id ?? d.userId ?? d.UserId);
                            const dName = d.fullName || d.FullName || d.email || d.Email || 'Unknown';
                            const dEmail = d.email || d.Email || '';
                            return (
                              <option key={uid} value={uid}>
                                {dName}{dEmail && ` (${dEmail})`}
                              </option>
                            );
                          })}
                        </Form.Select>
                        <small className="ev-field-hint">
                          ⚠ Assigning a driver will notify them via the mobile app.
                        </small>
                      </Form.Group>
                    )}

                  </div>
                </div>

                {/* Action buttons */}
                <div className="ev-form-actions">
                  <Button
                    variant="outline-secondary"
                    className="action-cancel-btn"
                    onClick={() => navigate('/vehicles')}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="action-save-btn" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="17,21 17,13 7,13 7,21" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="7,3 7,8 15,8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Save Vehicle
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </div>
          )}
        </Container>
        <Footer />
      </main>
    </div>
  );
};

export default EditVehicle;
