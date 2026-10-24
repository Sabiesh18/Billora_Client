import React, { useState, useEffect } from 'react';
import { billApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ThermalReceiptModal from '../components/billing/ThermalReceiptModal';
import { Bill } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faArrowsRotate,
  faPrint,
  faBan,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

export const OrdersHistoryPage: React.FC = () => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modals
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<Bill | null>(null);
  const [cancelModalBill, setCancelModalBill] = useState<Bill | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading bills';
      showToast('Error loading bills: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const handleOpenReceipt = async (billId: string) => {
    try {
      const details = await billApi.getDetails(billId);
      setSelectedBillForReceipt(details);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not retrieve bill';
      showToast('Could not retrieve bill details: ' + errorMsg, 'error');
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalBill) return;
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel bill';
      showToast('Failed to cancel bill: ' + errorMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Filter Bar */}
      <div className="bg-white border border-[#F3E5DC] p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Invoice # or Customer..."
            className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F67009]"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span>Search</span>
          </button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE (Open)</option>
            <option value="SETTLED">SETTLED (Paid)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={fetchBills}
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3 py-2 rounded-xl border border-[#F3E5DC] transition-colors flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={loading ? 'animate-spin text-[#F67009]' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white border border-[#F3E5DC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F6] text-slate-500 uppercase tracking-wider font-bold border-b border-[#F3E5DC]">
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
            <tbody className="divide-y divide-[#F3E5DC] text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length > 0 ? (
                bills.map((bill) => {
                  const billStatus = bill.billStatus || bill.status || 'ACTIVE';
                  return (
                    <tr key={bill.billId} className="hover:bg-[#FFF9F6] transition-colors">
                      <td className="p-3.5 font-bold text-[#F67009] font-mono">
                        {bill.billNumber}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : 'N/A'}{' '}
                        <span className="text-[10px] text-slate-400">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{bill.orderType}</span>
                        {bill.tableNumber && bill.tableNumber !== 'N/A' && (
                          <span className="ml-1.5 text-[10px] bg-[#FFF0E6] px-1.5 py-0.5 rounded text-[#F67009] border border-[#FED7AA] font-bold">
                            {bill.tableNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {bill.customerName || 'Walk-in Guest'}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900">
                        {settings.currency_symbol || '₹'} {Number(bill.grandTotal).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#FFF9F6] text-slate-700 border border-[#E5D7CE] font-bold">
                          {bill.paymentMode || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            billStatus === 'SETTLED' || billStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : billStatus === 'ACTIVE'
                              ? 'bg-[#FFF0E6] text-[#F67009] border border-[#FED7AA]'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {billStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenReceipt(bill.billId)}
                          className="px-2.5 py-1 bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] rounded-lg border border-[#FED7AA] font-bold transition-colors inline-flex items-center gap-1.5"
                          title="Reprint Thermal Receipt"
                        >
                          <FontAwesomeIcon icon={faPrint} />
                          <span>Receipt</span>
                        </button>

                        {billStatus === 'ACTIVE' && (
                          <button
                            onClick={() => setCancelModalBill(bill)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg border border-rose-200 font-bold transition-colors inline-flex items-center gap-1.5"
                            title="Cancel Bill"
                          >
                            <FontAwesomeIcon icon={faBan} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E5DC] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-600 mb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>Cancel Bill #{cancelModalBill.billNumber}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cancelling a bill will release any associated table and log a permanent audit record into <code className="text-[#F67009] font-bold">tbl_ActivityHistory</code>.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Cancellation (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order, wrong table punched, punch error"
                  className="w-full bg-white border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBill(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faBan} />
                  <span>{actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}</span>
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
};

export default OrdersHistoryPage;
