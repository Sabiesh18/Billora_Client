import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

export const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      showToast('Login successful! Welcome to ' + (settings.restaurant_name || 'Billora POS'), 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid username or password';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
        {/* Logo and Restaurant Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
            🍽️
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            {settings.restaurant_name || 'Billora POS'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Professional Offline Restaurant & Hotel Billing System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 px-4 rounded-lg text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Terminal</span>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            Quick Offline Demo Access
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'password123')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1.5 rounded-md transition-colors font-medium"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('cashier', 'password123')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 px-2.5 py-1.5 rounded-md transition-colors font-medium"
            >
              Cashier
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('manager', 'password123')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-2.5 py-1.5 rounded-md transition-colors font-medium"
            >
              Manager
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">
            Secure offline credentials managed via local PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
