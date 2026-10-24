import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface MainLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  children: ReactNode;
}

interface NavItem {
  id: string;
  name: string;
  icon: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ activePage, setActivePage, children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();

  const navigation: NavItem[] = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'pos', name: 'Live POS Billing', icon: '⚡' },
    { id: 'tables', name: 'Table Layout', icon: '🍽️' },
    { id: 'orders', name: 'Order History', icon: '🧾' },
    { id: 'menu', name: 'Menu & Categories', icon: '📖' },
    { id: 'reports', name: 'Sales Reports', icon: '📈' },
    { id: 'audit', name: 'Audit History', icon: '🛡️' },
    ...(isAdmin ? [{ id: 'users', name: 'User Management', icon: '👥' }] : []),
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-[#FFF9F6] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#F3E5DC] flex flex-col justify-between select-none shrink-0 shadow-sm">
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-[#F3E5DC] flex items-center gap-3 bg-[#FFF9F6]/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F67009] to-[#F88D3A] text-white flex items-center justify-center text-xl shadow-md">
              🍳
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-900 text-sm truncate leading-tight">
                {settings.restaurant_name || 'Billora POS'}
              </h1>
              <span className="text-[11px] text-[#F67009] font-semibold">Offline POS Engine</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navigation.map(item => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-md font-semibold'
                      : 'text-slate-600 hover:bg-[#FFF0E6] hover:text-[#F67009]'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & system status */}
        <div className="p-3 border-t border-[#F3E5DC] bg-[#FFF9F6]/80">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-emerald-600 font-semibold">Local Database Ready</span>
            </div>
            <span className="text-[10px] text-[#F67009] uppercase font-mono px-1.5 py-0.5 rounded bg-[#FFF0E6] border border-[#FED7AA] font-bold">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#F3E5DC] shadow-xs">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">@{user?.username}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-xs bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white px-2.5 py-1 rounded-lg font-medium transition-colors border border-rose-100"
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#FFF9F6]">
        {/* Header */}
        <header className="h-14 border-b border-[#F3E5DC] bg-white px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-slate-400">System</span>
            <span>/</span>
            <span className="text-[#F67009] font-bold capitalize">
              {navigation.find(n => n.id === activePage)?.name || activePage}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="hidden sm:flex items-center gap-2 bg-[#FFF9F6] border border-[#F3E5DC] px-2.5 py-1 rounded-lg">
              <span className="text-slate-400">Printer:</span>
              <span className="font-bold text-[#F67009] uppercase">{settings.receipt_paper_width || '80mm'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-[#FFF9F6] border border-[#F3E5DC] px-2.5 py-1 rounded-lg">
              <span className="text-slate-400">Currency:</span>
              <span className="font-bold text-slate-700">
                {settings.currency_symbol || '₹'} ({settings.currency_code || 'INR'})
              </span>
            </div>
            <div className="text-slate-600 font-medium">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 overflow-auto p-4 md:p-6 bg-[#FFF9F6]">
          {children}
        </section>
      </main>
    </div>
  );
};

export default MainLayout;