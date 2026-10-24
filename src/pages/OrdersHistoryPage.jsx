import React, { useState, useEffect } from 'react';
import { billApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ThermalReceiptModal from '../components/billing/ThermalReceiptModal';

export default function OrdersHistoryPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState(null);
  const [cancelModalBill, setCancelModalBill] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await billApi.getList({
        pageNumber: page,
        pageSize: 20,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setBills(data || []);
    } catch (err) {
      showToast('Error loading bills: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const handleOpenReceipt = async (billId) => {
    try {
      const details = await billApi.getDetails(billId);
      setSelectedBillForReceipt(details);
    } catch (err) {
      showToast('Could not retrieve bill details: ' + err.message, 'error');
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      showToast('Please provide a valid cancellation reason', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      await billApi.cancel(cancelModalBill.billId, cancellationReason);
      showToast('Bill #' + cancelModalBill.billNumber + ' cancelled and audited', 'success');
      setCancelModalBill(null);
      setCancellationReason('');
      fetchBills();
    } catch (err) {
      showToast('Failed to cancel bill: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Invoice # or Customer..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE (Open)</option>
            <option value="SETTLED">SETTLED (Paid)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={fetchBills}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
          >
            Refresh 🔄
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Type & Table</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-center">Payment</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length > 0 ? (
                bills.map((bill) => (
                  <tr key={bill.billId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-amber-400 font-mono">
                      {bill.billNumber}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}{' '}
                      <span className="text-[10px]">
                        {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-300">{bill.orderType}</span>
                      {bill.tableNumber && bill.tableNumber !== 'N/A' && (
                        <span className="ml-1.5 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 border border-slate-700">
                          {bill.tableNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {bill.customerName || 'Walk-in Guest'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-100">
                      {settings.currency_symbol} {Number(bill.grandTotal).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {bill.paymentMode}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          bill.billStatus === 'SETTLED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : bill.billStatus === 'ACTIVE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {bill.billStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenReceipt(bill.billId)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold"
                        title="Reprint Thermal Receipt"
                      >
                        🖨️ Receipt
                      </button>

                      {bill.billStatus === 'ACTIVE' && (
                        <button
                          onClick={() => setCancelModalBill(bill)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded border border-rose-500/30 font-semibold transition-colors"
                          title="Cancel Bill"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No transactions found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Reason Modal with Audit Confirmation */}
      {cancelModalBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400 mb-1">
              ⚠️ Cancel Bill #{cancelModalBill.billNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cancelling a bill will release any associated table and log a permanent audit record into <code className="text-amber-400">tbl_ActivityHistory</code>.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reason for Cancellation (Required)
                </label>
                <textarea
                  required
                  rows="3"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order, wrong table punched, punch error"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBill(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reprint Modal */}
      {selectedBillForReceipt && (
        <ThermalReceiptModal
          bill={selectedBillForReceipt}
          onClose={() => setSelectedBillForReceipt(null)}
        />
      )}
    </div>
  );
}
