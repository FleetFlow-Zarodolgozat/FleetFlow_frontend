import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/EditDriver.css';
import '../styles/EditVehicle.css';

const AddVehicle = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    vin: '',
    year: '',
    currentMileageKm: '',
    assignedUserId: '',
  });

  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Aktív sofőrök lekérése az API-ból
    const fetchDrivers = async () => {
      setDriversLoading(true);
      try {
        const res = await api.get('/admin/drivers', { params: { page: 1, pageSize: 200 } });
        const payload = res.data || {};
        const list = Array.isArray(payload.data) ? payload.data : [];
        setDrivers(list.filter((d) => d.isActive ?? d.IsActive));
      } catch {
        setDrivers([]);
      } finally {
        setDriversLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const handleChange = (e) => {
    // Frissíti az adatmezőt az input értékével
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    // Jármű létrehozása és opcionálisan sofőrhöz rendelése
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/vehicles', {
        licensePlate: form.licensePlate,
        brand: form.brand,
        model: form.model,
        vin: form.vin,
        year: form.year ? parseInt(form.year, 10) : 0,
        currentMileageKm: form.currentMileageKm ? parseInt(form.currentMileageKm, 10) : 0,
      });

      // Ha egy sofőr lett kiválasztva, az új jármű hozzárendelése
      if (form.assignedUserId) {
        try {
          const listRes = await api.get('/admin/vehicles', {
            params: { page: 1, pageSize: 5, StringQ: form.licensePlate },
          });
          const items = listRes.data?.data ?? listRes.data?.items ?? listRes.data ?? [];
          const found = Array.isArray(items)
            ? items.find(
                (v) =>
                  (v.licensePlate ?? v.LicensePlate ?? '').toLowerCase() ===
                  form.licensePlate.toLowerCase()
              )
            : null;
          const vehicleId = found?.id ?? found?.Id ?? found?.vehicleId ?? found?.VehicleId;
          if (vehicleId) {
            await api.post(`/admin/assign/${form.assignedUserId}/${vehicleId}`);
          }
        } catch (assignErr) {
          const msg = assignErr?.response?.data;
          setSuccess(
            'Vehicle created successfully, but driver assignment failed: ' +
              (typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Unknown error')
          );
          setTimeout(() => navigate('/vehicles'), 2500);
          return;
        }
      }

      setSuccess('Vehicle created successfully.');
      setTimeout(() => navigate('/vehicles'), 1500);
    } catch (err) {
      const msg = err?.response?.data;
      setError(
        typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to create vehicle.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="edit-driver-page">

          {/* Header */}
          <div className="edit-driver-header">
            <div className="edit-driver-title-row">
              <h1 className="edit-driver-title">Add New Vehicle</h1>
              <p className="edit-driver-subtitle">Fill in the details to register a new vehicle to the fleet</p>
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    You can reassign drivers later.
                  </li>
                </ul>
              </div>

            </div>

            {/* ─── Right panel — form ────────────────────── */}
            <form onSubmit={handleSubmit} className="ev-right-panel">

              <div className="edit-driver-card">
                <div className="edit-driver-card-header ev-details-card-header">
                  <div>
                    <h2 className="card-title">Vehicle Details</h2>
                    <p className="card-subtitle">Enter the core information for the new fleet vehicle.</p>
                  </div>
                  <span className="ev-status-badge badge-ev-active">Active</span>
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
                        placeholder="e.g. ABC-123"
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
                    <Form.Label className="field-label">
                      VIN <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="vin"
                      value={form.vin}
                      onChange={handleChange}
                      placeholder="e.g. 1HGBH41JXMN109186"
                      required
                      maxLength={17}
                      className="field-input"
                    />
                    <small className="ev-field-hint">17-character Vehicle Identification Number.</small>
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
                        min={1990}
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

                  {/* ── DRIVER ASSIGNMENT ──────────────────── */}
                  <div className="ev-section-label ev-section-label--gap">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    DRIVER ASSIGNMENT
                  </div>

                  <Form.Group className="form-field">
                    <Form.Label className="field-label">Assign Driver</Form.Label>
                    <Form.Select
                      name="assignedUserId"
                      value={form.assignedUserId}
                      onChange={handleChange}
                      className="field-input"
                      disabled={driversLoading}
                    >
                      <option value="">Select a driver...</option>
                      {drivers.map((d) => {
                        const uid = String(d.userId ?? d.UserId ?? d.id ?? d.Id);
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

        </Container>
        <Footer />
      </main>
    </div>
  );
};

export default AddVehicle;
