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
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
              🍳
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-100 text-sm truncate leading-tight">
                {settings.restaurant_name || 'Billora POS'}
              </h1>
              <span className="text-[11px] text-amber-400 font-medium">Offline POS Engine</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1">
            {navigation.map(item => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-emerald-400 font-medium">Local Database Ready</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">@{user?.username}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/40 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-500">System</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold capitalize">
              {navigation.find(n => n.id === activePage)?.name || activePage}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-500">Printer:</span>
              <span className="font-semibold text-amber-400 uppercase">{settings.thermal_printer_width || '80mm'}</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-500">Currency:</span>
              <span className="font-semibold text-slate-300">
                {settings.currency_symbol || '₹'} ({settings.currency_code || 'INR'})
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="text-slate-300">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4 md:p-6 bg-slate-950">
          {children}
        </section>
      </main>
    </div>
  );
};

export default MainLayout;
