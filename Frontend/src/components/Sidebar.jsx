import React from 'react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => (
  <>
    {/* Mobile Menu Button */}
    {!sidebarOpen && (
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
        ☰ Menü
      </button>
    )}
    {/* Sidebar Overlay */}
    {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />} 
    {/* Sidebar */}
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-brand">FleetFlow</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {/* Ide jönnek a menüpontok, pl. Link komponensek */}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-actions">
          {/* Ide jönnek az extra gombok, pl. kijelentkezés */}
        </div>
      </div>
    </aside>
  </>
);

export default Sidebar;
