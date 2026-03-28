
import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/AddNewTrip.css';


const AddNewTrip = () => {
	useEffect(() => {
		// Disable scroll on mount
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, []);
  const [vehicleCurrentMileageKm, setVehicleCurrentMileageKm] = useState(null);
  useEffect(() => {
	const fetchVehicleMileage = async () => {
	  try {
		const vehicleResponse = await api.get('/profile/assigned-vehicle');
		const v = vehicleResponse.data;
		setVehicleCurrentMileageKm(v.currentMileageKm || v.CurrentMileageKm || 0);
	  } catch (error) {
		setVehicleCurrentMileageKm(null);
	  }
	};
	fetchVehicleMileage();
  }, []);
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [startOdometerKm, setStartOdometerKm] = useState('');
  const [endOdometerKm, setEndOdometerKm] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => {
	// Set default date and time to now
	const now = new Date();
	const pad = n => n.toString().padStart(2, '0');
	const defaultDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
	const defaultHour = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
	setStartDate(defaultDate);
	setStartHour(defaultHour);
	setEndDate(defaultDate);
	setEndHour(defaultHour);
  }, []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess(false);

		try {
			const payload = {
				StartTime: new Date(`${startDate}T${startHour}`).toISOString(),
				EndTime: new Date(`${endDate}T${endHour}`).toISOString(),
				StartLocation: startLocation,
				EndLocation: endLocation,
				DistanceKm: Number(distanceKm),
				StartOdometerKm: Number(startOdometerKm),
				EndOdometerKm: Number(endOdometerKm),
				Notes: notes
			};
			await api.post('trips', payload);
			setSuccess(true);
			setTimeout(() => navigate(-1), 1200);
		} catch (err) {
			let msg = 'An error occurred while saving!';
			if (err.response) {
				if (err.response.status === 403) {
					msg = 'You are not authorized to perform this action.';
				} else if (err.response.data) {
					const data = err.response.data;
					if (typeof data === 'string') msg = data;
					else if (data.message) msg = data.message;
					else if (data.detail) msg = data.detail;
					else if (data.errors) msg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
					else if (err.response.statusText) msg = err.response.statusText;
					else msg = JSON.stringify(data);
				}
			}
			setError(msg);
		}
	};

	return (
		<div className="driver-dashboard">
			<Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
			<div className="main-content">
				<Container className="py-5">
					<Row className="justify-content-center">
						<Col md={8} lg={6}>
							<Card className="shadow-lg border-0 rounded-4 add-new-trip-blue-outline">
								<Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-2 border-bottom" style={{ minHeight: 60 }}>
									<svg width="32" height="32" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
										<polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="fs-5 fw-semibold text-orange">Add New Trip</span>
								</Card.Header>
								<Card.Body className="p-4">
									{error && <Alert variant="danger">{error}</Alert>}
									{success && <Alert variant="success">Saved successfully!</Alert>}
									<Form onSubmit={handleSubmit}>
										<Row className="g-3 align-items-end">
											{/* Date & Time row */}
											<Col xs={12} md={12} lg={6}>
												<Form.Group className="mb-0">
													<Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2 mb-1">
														<span style={{ display: 'flex', alignItems: 'center' }}>
															<svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
																<rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
																<line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
																<line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
																<line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
															</svg>
														</span>
														Start
													</Form.Label>
													<Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ minHeight: '38px' }} />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={6}>
												<Form.Group className="mb-0">
													<Form.Control type="time" value={startHour} onChange={e => setStartHour(e.target.value)} required style={{ minHeight: '38px' }} />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={6}>
												<Form.Group className="mb-0">
													<Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2 mb-1">
														<span style={{ display: 'flex', alignItems: 'center' }}>
															<svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
																<rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
																<line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
																<line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
																<line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
															</svg>
														</span>
														End
													</Form.Label>
													<Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ minHeight: '38px' }} />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={6}>
												<Form.Group className="mb-0">
													<Form.Control type="time" value={endHour} onChange={e => setEndHour(e.target.value)} required style={{ minHeight: '38px' }} />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={12}>
												<Form.Group>
													<Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
														<span style={{ display: 'flex', alignItems: 'center' }}>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
																<rect x="4" y="3" width="16" height="18" rx="2" fill="#22c55e" />
																<path d="M8 7h8M8 11h8M8 15h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
															</svg>
														</span>
														Start Location
													</Form.Label>
													<Form.Control type="text" value={startLocation} onChange={e => setStartLocation(e.target.value)} placeholder="e.g. M1 highway" />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={12}>
												<Form.Group>
													<Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
														<span style={{ display: 'flex', alignItems: 'center' }}>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
																<rect x="4" y="3" width="16" height="18" rx="2" fill="#22c55e" />
																<path d="M8 7h8M8 11h8M8 15h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
															</svg>
														</span>
														End Location
													</Form.Label>
													<Form.Control type="text" value={endLocation} onChange={e => setEndLocation(e.target.value)} placeholder="e.g. M1 highway" />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={4}>
												<Form.Group>
													<Form.Label className="fw-semibold d-flex align-items-center gap-2 text-start w-100">
														Distance <span className="text-muted">(km)</span>
													</Form.Label>
													<Form.Control type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} required min="0" step="1" placeholder="0" />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={4}>
												<Form.Group>
													<Form.Label className="fw-semibold d-flex align-items-center gap-2 text-start w-100">
														Start Odo.
													</Form.Label>
													<Form.Control type="number" value={startOdometerKm} onChange={e => setStartOdometerKm(e.target.value)} required min="0" step="1" placeholder="0" />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={4}>
												<Form.Group>
													<Form.Label className="fw-semibold d-flex align-items-center gap-2 text-start w-100">
														End Odo.
													</Form.Label>
													<Form.Control type="number" value={endOdometerKm} onChange={e => setEndOdometerKm(e.target.value)} required min="0" step="1" placeholder="0" />
												</Form.Group>
											</Col>
											<Col xs={12} md={12} lg={12}>
												<Form.Group>
													<Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
														<span style={{ display: 'flex', alignItems: 'center' }}>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
																<rect x="4" y="3" width="16" height="18" rx="2" fill="#fb923c" />
																<path d="M8 7h8M8 11h8M8 15h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
															</svg>
														</span>
														Notes <span className="text-muted">(optional)</span>
													</Form.Label>
													<Form.Control type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any Notes" />
												</Form.Group>
											</Col>
										</Row>
										<div className="d-flex justify-content-between mt-4">
											<Button variant="outline-secondary" onClick={() => navigate(-1)} type="button">Back</Button>
											<Button variant="primary" className="fw-semibold btn-new-trip-save" type="submit">Create Trip</Button>
										</div>
									</Form>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			</div>
		</div>
	);
}
export default AddNewTrip;
