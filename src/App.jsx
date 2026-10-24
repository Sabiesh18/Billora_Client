import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import TableManagementPage from './pages/TableManagementPage';
import OrdersHistoryPage from './pages/OrdersHistoryPage';
import MenuManagementPage from './pages/MenuManagementPage';
import ReportsPage from './pages/ReportsPage';
import ActivityAuditPage from './pages/ActivityAuditPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('pos'); // Default to POS for immediate cashier productivity

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'pos':
        return <BillingPage />;
      case 'tables':
        return <TableManagementPage setActivePage={setActivePage} />;
      case 'orders':
        return <OrdersHistoryPage />;
      case 'menu':
        return <MenuManagementPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return <ActivityAuditPage />;
      case 'users':
        return <UserManagementPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <BillingPage />;
    }
  };

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      {renderActivePage()}
    </MainLayout>
  );
}
