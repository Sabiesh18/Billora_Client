import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { isModuleAllowed, getDefaultLandingPage } from './utils/permissions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import LoginPage from './pages/LoginPage';
import PostLoginLoader from './components/common/PostLoginLoader';
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
import AssetManagementPage from './pages/AssetManagementPage';

export const App: React.FC = () => {
  const { isAuthenticated, isPostLoginLoading, dismissPostLoginLoader, user } = useAuth();
  const [activePage, setActivePage] = useState<string>('pos'); // Default to POS for immediate cashier productivity

  // Validate activePage against user's permitted modules whenever user role or page changes
  useEffect(() => {
    if (user && !isModuleAllowed(user.role, activePage)) {
      setActivePage(getDefaultLandingPage(user.role));
    }
  }, [user, activePage]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Modern animation loader shown only after successful login
  if (isPostLoginLoading) {
    return <PostLoginLoader user={user} onFinish={dismissPostLoginLoader} />;
  }

  const renderActivePage = () => {
    // Role-based route guard: prevents unauthorized rendering even if page state is altered
    if (user && !isModuleAllowed(user.role, activePage)) {
      const fallback = getDefaultLandingPage(user.role);
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center p-8 bg-white rounded-3xl border border-[#F3E5DC] shadow-sm max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF0E6] text-[#F67009] border border-[#FED7AA] flex items-center justify-center text-2xl mb-4 shadow-sm">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Module Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2">
            Your role (<span className="font-bold text-[#F67009] uppercase">{user.role}</span>) does not have access permissions for this section.
          </p>
          <button
            onClick={() => setActivePage(fallback)}
            className="mt-6 px-5 py-2.5 bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition-all"
          >
            Return to Available Modules
          </button>
        </div>
      );
    }

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
      case 'assets':
        return <AssetManagementPage />;
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
};

export default App;
