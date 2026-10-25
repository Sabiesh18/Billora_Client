import React, { useState, useEffect } from 'react';
import { userApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { User } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faUser,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<string>('CASHIER');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userApi.fetchAll({ pageNumber: 1, pageSize: 50 });
      setUsers(data || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading users';
      showToast('Error loading users: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      showToast('Username, password, and full name are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await userApi.add({
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
      });

      showToast('Staff user account created', 'success');
      setModalOpen(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setPhone('');
      fetchUsers();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create user';
      showToast('Failed to create user: ' + errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Header Card */}
      <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">User & Access Management</h2>
          <p className="text-xs text-slate-500">Manage cashier, manager, and administrator staff accounts</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#F3E5DC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F6] text-slate-700 uppercase tracking-wider font-semibold border-b border-[#F3E5DC]">
              <tr>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">System Role</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E5DC]/60 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.userId} className="hover:bg-[#FFF9F6]/60 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-[#F67009]">
                      @{u.username}
                    </td>
                    <td className="p-3.5 text-slate-900 font-semibold">{u.fullName}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : u.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{u.email || '---'}</td>
                    <td className="p-3.5 text-slate-600">{u.phone || '---'}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E5DC] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-[#F67009]" />
              <span>Add New Staff User</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. john_cashier"
                    className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F67009]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F67009]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
                >
                  <option value="CASHIER">CASHIER (Billing & Orders)</option>
                  <option value="MANAGER">MANAGER (Reports & Menu)</option>
                  <option value="ADMIN">ADMIN (Full Permissions)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@restaurant.com"
                    className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F67009]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F67009]"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  <span>{submitting ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
