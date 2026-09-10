import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ViewingAsBanner from '../components/ViewingAsBanner';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="dashboard-main"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <ViewingAsBanner />
        <main
          className="dashboard-content"
          style={{ flex: 1, padding: '1.5rem', maxWidth: 1280, width: '100%', margin: '0 auto' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
