import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Alert, Spinner, Button, Form } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [notificationRefresh, setNotificationRefresh] = useState(0);

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
    } catch (err) {
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
    if (activeFilter === 'critical') return notifications.filter(n => {
      const type = (n.type || '').toLowerCase();
      return type === 'critical' || type === 'urgent' || type === 'alert';
    });
    if (activeFilter === 'warnings') return notifications.filter(n => {
      const type = (n.type || '').toLowerCase();
      return type === 'warning' || type === 'warn';
    });
    if (activeFilter === 'system') return notifications.filter(n => {
      const type = (n.type || '').toLowerCase();
      return type === 'system' || type === 'info';
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

    if (type === 'critical' || type === 'urgent' || type === 'alert') {
      return {
        bg: '#fef2f2',
        color: '#dc2626',
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    }
    if (type === 'warning' || type === 'warn') {
      return {
        bg: '#fef3c7',
        color: '#f59e0b',
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    }
    if (type === 'fuel') {
      return {
        bg: '#dbeafe',
        color: '#2563eb',
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    }
    if (type === 'maintenance' || type === 'service') {
      return {
        bg: '#f3f4f6',
        color: '#6b7280',
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    }
    if (type === 'success' || type === 'completed') {
      return {
        bg: '#d1fae5',
        color: '#059669',
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    }
    if (type === 'driver' || type === 'user') {
      return {
        bg: '#dbeafe',
        color: '#2563eb',
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    }

    // Default
    return {
      bg: isRead ? '#f3f4f6' : '#dbeafe',
      color: isRead ? '#9ca3af' : '#2563eb',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };
  };

  const getNotificationStyle = (notification) => {
    const type = (notification.type || '').toLowerCase();
    const isRead = notification.isRead || notification.read;

    if (type === 'critical' || type === 'urgent' || type === 'alert') {
      return { border: '#dc2626' };
    }
    if (type === 'warning' || type === 'warn') {
      return { border: '#f59e0b' };
    }
    if (type === 'fuel') {
      return { border: '#2563eb' };
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
                    <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mark all as read
                </Button>
                <div className="filter-divider"></div>
                <Button className="filter-menu-btn" variant="link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
              className={`filter-tab ${activeFilter === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveFilter('critical')}
            >
              Critical
            </button>
            <button
              className={`filter-tab ${activeFilter === 'warnings' ? 'active' : ''}`}
              onClick={() => setActiveFilter('warnings')}
            >
              Warnings
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
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
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
                        <div className="notification-icon" style={{ backgroundColor: iconData.bg, color: iconData.color }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: styleData.border }} />}
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
                              {notification.type && (
                                <span className="notification-type-label" style={{
                                  marginLeft: 10,
                                  background: '#e5e7eb',
                                  color: '#374151',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  display: 'inline-block',
                                  textTransform: 'capitalize'
                                }}>{notification.type}</span>
                              )}
                            </span>
                            {notification.location && (
                              <span className="notification-location">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                {notification.location}
                              </span>
                            )}
                            {notification.actionUrl && (
                              <a href={notification.actionUrl} className="notification-action">
                                View on Map
                              </a>
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
                        <div className="notification-icon" style={{ backgroundColor: iconData.bg, color: iconData.color }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: styleData.border }} />}
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
                              {notification.type && (
                                <span className="notification-type-label">{notification.type}</span>
                              )}
                            </span>
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
                        <div className="notification-icon" style={{ backgroundColor: iconData.bg, color: iconData.color }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: styleData.border }} />}
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
                        <div className="notification-icon" style={{ backgroundColor: iconData.bg, color: iconData.color }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: styleData.border }} />}
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
                        <div className="notification-icon" style={{ backgroundColor: iconData.bg, color: iconData.color }}>
                          {iconData.icon}
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            <h4 className="notification-title">
                              {notification.title || 'Notification'}
                              {!isRead && <span className="unread-dot" style={{ backgroundColor: styleData.border }} />}
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
      </main>
    </div>
  );
};

export default Notifications;
