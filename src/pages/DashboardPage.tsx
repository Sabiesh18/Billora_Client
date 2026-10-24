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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Billing Operations Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time overview of today's sales, table status, and orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePage('pos')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <span>⚡</span>
            <span>New POS Bill</span>
          </button>
          <button
            onClick={() => setActivePage('tables')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-2.5 rounded-lg border border-slate-700 transition-colors"
          >
            Table Layout
          </button>
          <button
            onClick={fetchMetrics}
            title="Refresh Metrics"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2.5 rounded-lg border border-slate-700 transition-colors"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Settled Revenue */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Today's Revenue</span>
            <span className="text-xl p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">💰</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {settings.currency_symbol || '₹'} {Number(metrics?.todaySales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>●</span> Settled bills today
            </p>
          </div>
        </div>

        {/* Orders Completed */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Settled Orders</span>
            <span className="text-xl p-2 bg-blue-500/10 text-blue-400 rounded-lg">🧾</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {metrics?.todayOrders || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Paid customer orders</p>
          </div>
        </div>

        {/* Active Open Bills */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Bills</span>
            <span className="text-xl p-2 bg-amber-500/10 text-amber-400 rounded-lg">⏳</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-400">
              {metrics?.activeBills || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Open/unsettled dining orders</p>
          </div>
        </div>

        {/* Table Occupancy Rate */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Occupancy Rate</span>
            <span className="text-xl p-2 bg-purple-500/10 text-purple-400 rounded-lg">🍽️</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {metrics?.occupancyRate || 0}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics?.occupiedTables || 0} of {metrics?.totalTables || 0} dining tables occupied
            </p>
          </div>
        </div>
      </div>

      {/* Two-column insights: Top Selling Items and Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes Today */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>🔥</span> Top Selling Dishes Today
            </h3>
            <span className="text-xs text-slate-400 font-mono">By volume</span>
          </div>

          {metrics?.topSellingItems && metrics.topSellingItems.length > 0 ? (
            <div className="space-y-3">
              {metrics.topSellingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{item.itemName}</p>
                      <p className="text-xs text-slate-400">{item.totalQty} portions ordered</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {settings.currency_symbol || '₹'} {Number(item.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No orders settled yet today. Start taking orders on the POS screen!
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>💳</span> Payment Mode Split
            </h3>
            <span className="text-xs text-slate-400 font-mono">Today's Collections</span>
          </div>

          {metrics?.paymentBreakdown && metrics.paymentBreakdown.length > 0 ? (
            <div className="space-y-3">
              {metrics.paymentBreakdown.map((pm, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {pm.paymentMode === 'CASH' ? '💵' : pm.paymentMode === 'UPI' ? '📱' : pm.paymentMode === 'CARD' ? '💳' : '🔄'}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-slate-100 uppercase">{pm.paymentMode}</span>
                      <p className="text-xs text-slate-400">{pm.count} transactions</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {settings.currency_symbol || '₹'} {Number(pm.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No settled transactions recorded today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
