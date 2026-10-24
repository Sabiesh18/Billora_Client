import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function ReportsPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getSalesReport({
        fromDate,
        toDate,
        paymentMode: paymentMode || undefined,
      });
      setReportData(data);
    } catch (err) {
      showToast('Error generating sales report: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [paymentMode]);

  const setPresetRange = (days) => {
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
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Financial Sales Reports</h2>
          <p className="text-xs text-slate-400">Audited revenue analytics from local PostgreSQL database</p>
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setPresetRange(0); fetchReport(); }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            Today
          </button>
          <button
            onClick={() => { setPresetRange(7); fetchReport(); }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => { setPresetRange(30); fetchReport(); }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            Last 30 Days
          </button>

          {/* Date range pickers */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="CARD">CARD</option>
            <option value="SPLIT">SPLIT</option>
          </select>

          <button
            onClick={fetchReport}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow"
          >
            Filter
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Sales Revenue</span>
          <h3 className="text-2xl font-black text-amber-400 mt-2">
            {settings.currency_symbol} {Number(reportData?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Settled invoices in period</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settled Invoices</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2">
            {reportData?.totalOrders || 0}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Total orders processed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tax (GST)</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2">
            {settings.currency_symbol} {Number(reportData?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Output tax liability</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Discounts Given</span>
          <h3 className="text-2xl font-black text-rose-400 mt-2">
            {settings.currency_symbol} {Number(reportData?.totalDiscount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Promotional markdowns</p>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Day-by-Day Revenue Breakdown
          </h3>
          <span className="text-xs text-slate-400">
            {reportData?.dailyTrend?.length || 0} days analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-center">Invoices</th>
                <th className="p-3.5 text-right">Subtotal</th>
                <th className="p-3.5 text-right">Discounts</th>
                <th className="p-3.5 text-right">Taxes</th>
                <th className="p-3.5 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Calculating period statistics...
                  </td>
                </tr>
              ) : reportData?.dailyTrend && reportData.dailyTrend.length > 0 ? (
                reportData.dailyTrend.map((row) => (
                  <tr key={row.reportDate} className="hover:bg-slate-800/40 font-mono">
                    <td className="p-3.5 font-bold text-slate-100 font-sans">
                      {new Date(row.reportDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 text-center">{row.ordersCount}</td>
                    <td className="p-3.5 text-right">
                      {settings.currency_symbol} {Number(row.subTotal).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right text-rose-400">
                      {Number(row.discount) > 0 ? `- ${settings.currency_symbol} ${Number(row.discount).toFixed(2)}` : '0.00'}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {settings.currency_symbol} {Number(row.tax).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-400 text-sm">
                      {settings.currency_symbol} {Number(row.netRevenue).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
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
}
