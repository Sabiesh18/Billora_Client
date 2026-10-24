import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { SalesReport } from '../types';

export const ReportsPage: React.FC = () => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [reportData, setReportData] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getSalesReport({
        fromDate,
        toDate,
        paymentMode: paymentMode || undefined,
      });
      setReportData(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error generating report';
      showToast('Error generating sales report: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [paymentMode]);

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Filter Header */}
      <div className="bg-white border border-[#F3E5DC] p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Financial Sales Reports</h2>
          <p className="text-xs text-slate-500">Audited revenue analytics from local PostgreSQL database</p>
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setPresetRange(0); fetchReport(); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF9F6] border border-[#F3E5DC] text-slate-700 hover:bg-[#FFF0E6] hover:text-[#F67009] transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => { setPresetRange(7); fetchReport(); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF9F6] border border-[#F3E5DC] text-slate-700 hover:bg-[#FFF0E6] hover:text-[#F67009] transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => { setPresetRange(30); fetchReport(); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF9F6] border border-[#F3E5DC] text-slate-700 hover:bg-[#FFF0E6] hover:text-[#F67009] transition-colors"
          >
            Last 30 Days
          </button>

          {/* Date range pickers */}
          <div className="flex items-center gap-1.5 bg-[#FFF9F6] border border-[#E5D7CE] px-2.5 py-1 rounded-xl">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
            />
          </div>

          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="bg-[#FFF9F6] border border-[#E5D7CE] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#F67009]"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="CARD">CARD</option>
            <option value="SPLIT">SPLIT</option>
          </select>

          <button
            onClick={fetchReport}
            className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-md transition-all"
          >
            Filter
          </button>

          <button
            onClick={handlePrint}
            className="bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#FED7AA] flex items-center gap-1 transition-colors"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Sales Revenue</span>
          <h3 className="text-2xl font-black text-[#F67009] mt-2">
            {settings.currency_symbol || '₹'} {Number(reportData?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Settled invoices in period</p>
        </div>

        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settled Invoices</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {reportData?.totalOrders || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Total orders processed</p>
        </div>

        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tax (GST)</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {settings.currency_symbol || '₹'} {Number(reportData?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Output tax liability</p>
        </div>

        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Discounts Given</span>
          <h3 className="text-2xl font-black text-rose-600 mt-2">
            {settings.currency_symbol || '₹'} {Number(reportData?.totalDiscount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Promotional markdowns</p>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white border border-[#F3E5DC] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#F3E5DC] bg-[#FFF9F6] flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Day-by-Day Revenue Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {reportData?.dailyTrend?.length || 0} days analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F6] text-slate-500 uppercase tracking-wider font-bold border-b border-[#F3E5DC]">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-center">Invoices</th>
                <th className="p-3.5 text-right">Subtotal</th>
                <th className="p-3.5 text-right">Discounts</th>
                <th className="p-3.5 text-right">Taxes</th>
                <th className="p-3.5 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E5DC] text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Calculating period statistics...
                  </td>
                </tr>
              ) : reportData?.dailyTrend && reportData.dailyTrend.length > 0 ? (
                reportData.dailyTrend.map((row) => (
                  <tr key={row.reportDate} className="hover:bg-[#FFF9F6] font-mono">
                    <td className="p-3.5 font-bold text-slate-900 font-sans">
                      {new Date(row.reportDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 text-center font-bold">{row.ordersCount}</td>
                    <td className="p-3.5 text-right">
                      {settings.currency_symbol || '₹'} {Number(row.subTotal).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right text-rose-600 font-bold">
                      {Number(row.discount) > 0 ? `- ${settings.currency_symbol || '₹'} ${Number(row.discount).toFixed(2)}` : '0.00'}
                    </td>
                    <td className="p-3.5 text-right text-slate-600">
                      {settings.currency_symbol || '₹'} {Number(row.tax).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-black text-[#F67009] text-sm">
                      {settings.currency_symbol || '₹'} {Number(row.netRevenue).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No revenue recorded for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;