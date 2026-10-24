import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { DashboardMetrics } from '../types';

interface DashboardPageProps {
  setActivePage: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActivePage }) => {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto refresh every 30 seconds for live POS updates
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Billing Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time overview of today's sales, table status, and orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePage('pos')}
            className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <span>⚡</span>
            <span>New POS Bill</span>
          </button>
          <button
            onClick={() => setActivePage('tables')}
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#F3E5DC] transition-colors"
          >
            Table Layout
          </button>
          <button
            onClick={fetchMetrics}
            title="Refresh Metrics"
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3 py-2.5 rounded-xl border border-[#F3E5DC] transition-colors"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Settled Revenue */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Today's Revenue</span>
            <span className="text-xl p-2 bg-[#FFF0E6] text-[#F67009] rounded-xl border border-[#FED7AA]">💰</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">
              {settings.currency_symbol || '₹'} {Number(metrics?.todaySales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>●</span> Settled bills today
            </p>
          </div>
        </div>

        {/* Orders Completed */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Settled Orders</span>
            <span className="text-xl p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">🧾</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">
              {metrics?.todayOrders || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Paid customer orders</p>
          </div>
        </div>

        {/* Active Open Bills */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Active Bills</span>
            <span className="text-xl p-2 bg-[#FFF0E6] text-[#F88D3A] rounded-xl border border-[#FED7AA]">⏳</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#F67009]">
              {metrics?.activeBills || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Open/unsettled dining orders</p>
          </div>
        </div>

        {/* Table Occupancy Rate */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Occupancy Rate</span>
            <span className="text-xl p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">🍽️</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">
              {metrics?.occupancyRate || 0}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics?.occupiedTables || 0} of {metrics?.totalTables || 0} dining tables occupied
            </p>
          </div>
        </div>
      </div>

      {/* Two-column insights: Top Selling Items and Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes Today */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🔥</span> Top Selling Dishes Today
            </h3>
            <span className="text-xs text-slate-400 font-mono">By volume</span>
          </div>

          {metrics?.topSellingItems && metrics.topSellingItems.length > 0 ? (
            <div className="space-y-3">
              {metrics.topSellingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FFF9F6] border border-[#F3E5DC]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FFF0E6] text-[#F67009] border border-[#FED7AA] flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.itemName}</p>
                      <p className="text-xs text-slate-500">{item.totalQty} portions ordered</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#F67009]">
                    {settings.currency_symbol || '₹'} {Number(item.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No orders settled yet today. Start taking orders on the POS screen!
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>💳</span> Payment Mode Split
            </h3>
            <span className="text-xs text-slate-400 font-mono">Today's Collections</span>
          </div>

          {metrics?.paymentBreakdown && metrics.paymentBreakdown.length > 0 ? (
            <div className="space-y-3">
              {metrics.paymentBreakdown.map((pm, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#FFF9F6] border border-[#F3E5DC] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {pm.paymentMode === 'CASH' ? '💵' : pm.paymentMode === 'UPI' ? '📱' : pm.paymentMode === 'CARD' ? '💳' : '🏷️'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{pm.paymentMode}</p>
                      <p className="text-[11px] text-slate-500">{pm.count} transactions</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {settings.currency_symbol || '₹'} {Number(pm.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No transactions recorded today yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;