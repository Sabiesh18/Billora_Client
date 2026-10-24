import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faRightToBracket,
  faCircleCheck,
  faUser,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

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
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col justify-center items-center p-4 select-none font-sans relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle showLabel={true} />
      </div>
      <div className="w-full max-w-md bg-white border border-[#F3E5DC] rounded-3xl shadow-xl p-8">
        {/* Logo and Restaurant Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#F67009] to-[#F88D3A] text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-md">
            <FontAwesomeIcon icon={faUtensils} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {settings.restaurant_name || 'Billora POS'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Professional Offline Restaurant & Hotel Billing System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-[#F67009] text-[11px]" />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F67009] focus:ring-1 focus:ring-[#F67009] transition-colors"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLock} className="text-[#F67009] text-[11px]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F67009] focus:ring-1 focus:ring-[#F67009] transition-colors"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faRightToBracket} />
                <span>Sign In to Terminal</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-8 pt-6 border-t border-[#F3E5DC]">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
            Quick Offline Demo Access
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'password123')}
              className="px-2 py-1.5 bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] border border-[#FED7AA] rounded-lg text-xs font-bold transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('cashier', 'password123')}
              className="px-2 py-1.5 bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] border border-[#FED7AA] rounded-lg text-xs font-bold transition-colors"
            >
              Cashier
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('manager', 'password123')}
              className="px-2 py-1.5 bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] border border-[#FED7AA] rounded-lg text-xs font-bold transition-colors"
            >
              Manager
            </button>
          </div>
        </div>

        {/* Offline Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
          <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" />
          <span>100% Offline Local Mode • PostgreSQL Connected</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
