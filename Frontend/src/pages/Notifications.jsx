import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Alert, Spinner, Button, Form } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/Notifications.css';

import Footer from '../components/Footer';
import { authService } from '../services/authService';
// Ikon háttérszín a notification típus alapján
const getNotificationTypeIconBg = (notification) => {
  const type = (notification.type || '').toUpperCase();
  if (type === 'ACCOUNT' || type === 'ASSIGNMENT') {
    return 'rgba(34,197,94,0.12)'; // halvány zöld
  }
  if (type === 'FUEL_LOG') {
    return 'rgba(245,158,11,0.12)'; // halvány narancs
  }
  if (type === 'TRIP') {
    return 'rgba(37,99,235,0.12)'; // halvány kék
  }
  if (type === 'SERVICE_REQUEST') {
    return 'rgba(162,28,175,0.12)'; // halvány lila
  }
  // fallback: halvány szürke
  return 'rgba(107,114,128,0.12)';
};

const Notifications = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [notificationRefresh, setNotificationRefresh] = useState(0);

  // Sötétebb szövegszín a type labelhez
  const getNotificationTypeTextColor = (notification) => {
    const type = (notification.type || '').toUpperCase();
    if (type === 'ACCOUNT' || type === 'ASSIGNMENT') {
      return '#166534'; // green-800
    }
    if (type === 'FUEL_LOG') {
      return '#b45309'; // amber-700
    }
    if (type === 'TRIP') {
      return '#1e40af'; // blue-800
    }
    if (type === 'SERVICE_REQUEST') {
      return '#701a75'; // purple-900
    }
    // fallback: szürke
    return '#374151';
  };
  //Type labelhez világosabb háttérszín a type alapján
  const getNotificationTypeBgRgbaColor = (notification) => {
    const type = (notification.type || '').toUpperCase();
    if (type === 'ACCOUNT' || type === 'ASSIGNMENT') {
      return 'rgba(34,197,94,0.18)'; // green-500
    }
    if (type === 'FUEL_LOG') {
      return 'rgba(245,158,11,0.18)'; // amber-500
    }
    if (type === 'TRIP') {
      return 'rgba(37,99,235,0.18)'; // blue-600
    }
    if (type === 'SERVICE_REQUEST') {
      return 'rgba(162,28,175,0.18)'; // purple-800
    }
    // fallback: szürke
    return 'rgba(107,114,128,0.18)';
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notifications', {
        params: {
          page: 1,
          pageSize: 50,
        },
      });
      const payload = response.data || [];
      setNotifications(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Hiba történt az értesítések lekérésekor!');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!window.confirm('Biztosan megjelölöd az összes értesítést olvasottként?')) return;
    setError('');
    try {
      await api.patch('/notifications/read');
      await fetchNotifications();
      setNotificationRefresh(r => r + 1);
    } catch (err) {
      let msg = 'Hiba történt a művelet során!';
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'string') msg = data;
        else if (data.message) msg = data.message;
        else if (data.detail) msg = data.detail;
        else if (data.errors) msg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
        else if (err.response.statusText) msg = err.response.statusText;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt az értesítést?')) return;
    setError('');
    try {
      await api.delete(`/notifications/${id}`);
      await fetchNotifications();
      setNotificationRefresh(r => r + 1);
    } catch (err) {
      let msg = 'Hiba történt a törlés során!';
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'string') msg = data;
        else if (data.message) msg = data.message;
        else if (data.detail) msg = data.detail;
        else if (data.errors) msg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
        else if (err.response.statusText) msg = err.response.statusText;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await fetchNotifications();
      setNotificationRefresh(r => r + 1);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications
  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter(n => !n.isRead && !n.read);
    if (activeFilter === 'fuel_log') return notifications.filter(n => (n.type || '').toUpperCase() === 'FUEL_LOG');
    if (activeFilter === 'service') return notifications.filter(n => (n.type || '').toUpperCase() === 'SERVICE_REQUEST');
    if (activeFilter === 'trip') return notifications.filter(n => (n.type || '').toUpperCase() === 'TRIP');
    if (activeFilter === 'system') return notifications.filter(n => {
      const type = (n.type || '').toUpperCase();
      return type === 'ACCOUNT' || type === 'ASSIGNMENT';
    });
    return notifications;
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead && !n.read).length;
  };

  // Group notifications by date
  const groupByDate = (items) => {
    const groups = {};
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as week start
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    items.forEach(item => {
      const dateVal = item.DateTime || item.date || item.createdAt || item.timestamp;
      if (!dateVal) return;

      const itemDate = new Date(dateVal);

      // Check if today
      if (itemDate.toDateString() === today.toDateString()) {
        groups['today'] = groups['today'] || [];
        groups['today'].push(item);
      }
      // Check if this week (after start of week)
      else if (itemDate >= startOfWeek) {
        groups['thisWeek'] = groups['thisWeek'] || [];
        groups['thisWeek'].push(item);
      }
      // Check if this month (after start of month)
      else if (itemDate >= startOfMonth) {
        groups['thisMonth'] = groups['thisMonth'] || [];
        groups['thisMonth'].push(item);
      }
      // Check if this year (after start of year)
      else if (itemDate >= startOfYear) {
        groups['thisYear'] = groups['thisYear'] || [];
        groups['thisYear'].push(item);
      }
      // Over 1 year ago
      else {
        groups['overOneYear'] = groups['overOneYear'] || [];
        groups['overOneYear'].push(item);
      }
    });

    return groups;
  };

  const getNotificationIcon = (notification) => {
    const type = (notification.type || '').toLowerCase();
    const isRead = notification.isRead || notification.read;
    const color = getNotificationTypeTextColor(notification);

    if (type === 'fuel') {
      return {
        bg: '#dbeafe',
        color,
        icon: (
          <svg width="20" height="20" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      };
    }

    // Default
    return {
      bg: isRead ? '#f3f4f6' : '#dbeafe',
      color,
      icon: (
        <svg width="20" height="20" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    };
  };

  const getNotificationStyle = (notification) => {
    const type = (notification.type || '').toUpperCase();
    const isRead = notification.isRead || notification.read;

    // ACCOUNT vagy ASSIGNMENT: zöld
    if (type === 'ACCOUNT' || type === 'ASSIGNMENT') {
      return { border: '#22c55e' }; // green-500
    }
    // FUEL_LOG: narancssárga
    if (type === 'FUEL_LOG') {
      return { border: '#f59e0b' }; // amber-500
    }
    // TRIP: kék
    if (type === 'TRIP') {
      return { border: '#2563eb' }; // blue-600
    }
    // SERVICE_REQUEST: lila
    if (type === 'SERVICE_REQUEST') {
      return { border: '#a21caf' }; // purple-800
    }
    return { border: isRead ? '#e5e7eb' : '#2563eb' };
  };

  const formatTimeAgo = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupByDate(filteredNotifications);
  const unreadCount = getUnreadCount();

  return (
    <div className="notifications-page">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notificationRefresh={notificationRefresh} />

      <main className="main-content">
        <Container fluid className="px-4 py-4">
          {/* Header */}
          <div className="notifications-header mb-4">
            <Row className="align-items-center">
              <Col xs={12} lg={6}>
                <h1 className="page-title">Notifications</h1>
              </Col>
              <Col xs={12} lg={6} className="d-flex justify-content-end gap-2 mt-3 mt-lg-0">
                <Button className="mark-all-read-btn" onClick={handleMarkAllAsRead} variant="link">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Mark all as read
                </Button>
              </Col>
            </Row>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs mb-4">
            <button
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread
              {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}
            </button>
            <button
              className={`filter-tab ${activeFilter === 'service' ? 'active' : ''}`}
              onClick={() => setActiveFilter('service')}
            >
              Service
            </button>
            <button
              className={`filter-tab ${activeFilter === 'fuel_log' ? 'active' : ''}`}
              onClick={() => setActiveFilter('fuel_log')}
            >
              Fuel Log
            </button>
            <button
              className={`filter-tab ${activeFilter === 'trip' ? 'active' : ''}`}
              onClick={() => setActiveFilter('trip')}
            >
              Trip
            </button>
            <button
              className={`filter-tab ${activeFilter === 'system' ? 'active' : ''}`}
              onClick={() => setActiveFilter('system')}
            >
              System
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mb-3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mb-0">No notifications found.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {/* Today Section */}
              {groupedNotifications['today'] && groupedNotifications['today'].length > 0 && (
                <div className="notifications-section mb-4">
                  <h3 className="section-title">TODAY</h3>
                  {groupedNotifications['today'].map(notification => {
                    const iconData = getNotificationIcon(notification);
                    const styleData = getNotificationStyle(notification);
                    const isRead = notification.isRead || notification.read;
                    const dateVal = notification.DateTime || notification.date || notification.createdAt || notification.timestamp;

                    return (
                      <div
                        key={notification.id}
                        className={`notification-card ${!isRead ? 'unread' : ''}`}
                        style={{ borderLeft: `4px solid ${styleData.border}` }}
                        onClick={() => !isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="notification-icon" style={{ backgroundColor: `${getNotificationTypeIconBg(notification)} !important`, color: getNotificationTypeTextColor(notification) }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: '#dc2626' }} />}
                            </h4>
                            <button
                              className="notification-delete-custom"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              title="Törlés"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                          <p className="notification-message">
                            {notification.message || notification.content || ''}
                          </p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              {formatTimeAgo(dateVal)}
                            </span>
                            {notification.type && (
                              <span className="notification-type-label" style={{
                                marginLeft: 10,
                                background: getNotificationTypeBgRgbaColor(notification),
                                color: getNotificationTypeTextColor(notification),
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                              }}>{notification.type}</span>
                            )}
                          </div>
                        {/* Delete button now in header */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* This Week Section */}
              {groupedNotifications['thisWeek'] && groupedNotifications['thisWeek'].length > 0 && (
                <div className="notifications-section mb-4">
                  <h3 className="section-title">THIS WEEK</h3>
                  {groupedNotifications['thisWeek'].map(notification => {
                    const iconData = getNotificationIcon(notification);
                    const styleData = getNotificationStyle(notification);
                    const isRead = notification.isRead || notification.read;
                    const dateVal = notification.DateTime || notification.date || notification.createdAt || notification.timestamp;

                    return (
                      <div
                        key={notification.id}
                        className={`notification-card ${!isRead ? 'unread' : ''}`}
                        style={{ borderLeft: `4px solid ${styleData.border}` }}
                        onClick={() => !isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="notification-icon" style={{ backgroundColor: getNotificationTypeIconBg(notification), color: getNotificationTypeTextColor(notification) }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: '#dc2626' }} />}
                            </h4>
                          </div>
                          <p className="notification-message">
                            {notification.message || notification.content || ''}
                          </p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              {formatTimeAgo(dateVal)}
                            </span>
                            {notification.type && (
                              <span className="notification-type-label" style={{
                                marginLeft: 10,
                                background: getNotificationTypeBgRgbaColor(notification),
                                color: getNotificationTypeTextColor(notification),
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                              }}>{notification.type}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="notification-delete-custom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          title="Törlés"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* This Month Section */}
              {groupedNotifications['thisMonth'] && groupedNotifications['thisMonth'].length > 0 && (
                <div className="notifications-section mb-4">
                  <h3 className="section-title">THIS MONTH</h3>
                  {groupedNotifications['thisMonth'].map(notification => {
                    const iconData = getNotificationIcon(notification);
                    const styleData = getNotificationStyle(notification);
                    const isRead = notification.isRead || notification.read;
                    const dateVal = notification.DateTime || notification.date || notification.createdAt || notification.timestamp;

                    return (
                      <div
                        key={notification.id}
                        className={`notification-card ${!isRead ? 'unread' : ''}`}
                        style={{ borderLeft: `4px solid ${styleData.border}` }}
                        onClick={() => !isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="notification-icon" style={{ backgroundColor: getNotificationTypeIconBg(notification), color: getNotificationTypeTextColor(notification) }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: '#dc2626' }} />}
                            </h4>
                          </div>
                          <p className="notification-message">
                            {notification.message || notification.content || ''}
                          </p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              {formatTimeAgo(dateVal)}
                            </span>
                            {notification.type && (
                              <span className="notification-type-label" style={{
                                marginLeft: 10,
                                background: getNotificationTypeBgRgbaColor(notification),
                                color: getNotificationTypeTextColor(notification),
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                              }}>{notification.type}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="notification-delete-custom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          title="Törlés"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* This Year Section */}
              {groupedNotifications['thisYear'] && groupedNotifications['thisYear'].length > 0 && (
                <div className="notifications-section mb-4">
                  <h3 className="section-title">THIS YEAR</h3>
                  {groupedNotifications['thisYear'].map(notification => {
                    const iconData = getNotificationIcon(notification);
                    const styleData = getNotificationStyle(notification);
                    const isRead = notification.isRead || notification.read;
                    const dateVal = notification.DateTime || notification.date || notification.createdAt || notification.timestamp;

                    return (
                      <div
                        key={notification.id}
                        className={`notification-card ${!isRead ? 'unread' : ''}`}
                        style={{ borderLeft: `4px solid ${styleData.border}` }}
                        onClick={() => !isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="notification-icon" style={{ backgroundColor: getNotificationTypeIconBg(notification), color: getNotificationTypeTextColor(notification) }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: '#dc2626' }} />}
                            </h4>
                          </div>
                          <p className="notification-message">
                            {notification.message || notification.content || ''}
                          </p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              {formatTimeAgo(dateVal)}
                            </span>
                            {notification.type && (
                              <span className="notification-type-label" style={{
                                marginLeft: 10,
                                background: getNotificationTypeBgRgbaColor(notification),
                                color: getNotificationTypeTextColor(notification),
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                              }}>{notification.type}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="notification-delete-custom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          title="Törlés"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Over 1 Year Ago Section */}
              {groupedNotifications['overOneYear'] && groupedNotifications['overOneYear'].length > 0 && (
                <div className="notifications-section mb-4">
                  <h3 className="section-title">OVER 1 YEAR AGO</h3>
                  {groupedNotifications['overOneYear'].map(notification => {
                    const iconData = getNotificationIcon(notification);
                    const styleData = getNotificationStyle(notification);
                    const isRead = notification.isRead || notification.read;
                    const dateVal = notification.DateTime || notification.date || notification.createdAt || notification.timestamp;

                    return (
                      <div
                        key={notification.id}
                        className={`notification-card ${!isRead ? 'unread' : ''}`}
                        style={{ borderLeft: `4px solid ${styleData.border}` }}
                        onClick={() => !isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="notification-icon" style={{ backgroundColor: getNotificationTypeIconBg(notification), color: getNotificationTypeTextColor(notification) }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: '#dc2626' }} />}
                            </h4>
                          </div>
                          <p className="notification-message">
                            {notification.message || notification.content || ''}
                          </p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                              </svg>
                              {formatTimeAgo(dateVal)}
                            </span>
                            {notification.type && (
                              <span className="notification-type-label" style={{
                                marginLeft: 10,
                                background: getNotificationTypeBgRgbaColor(notification),
                                color: getNotificationTypeTextColor(notification),
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                              }}>{notification.type}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="notification-delete-custom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          title="Törlés"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Container>
        {/* Footer csak ha nem ADMIN */}
        {authService.getCurrentUser()?.role !== 'ADMIN' && (
          <Footer userType={authService.getCurrentUser()?.role} />
        )}
      </main>
    </div>
  );
};

export default Notifications;
