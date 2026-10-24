import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function PaymentModal({ bill, onSettle, onClose, loading }) {
  const { settings } = useSettings();
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState(bill.grandTotal);
  const [notes, setNotes] = useState('');

  const grandTotal = Number(bill.grandTotal || 0);
  const paid = Number(amountPaid || 0);
  const changeDue = Math.max(0, paid - grandTotal);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paid < grandTotal) {
      alert(`Amount paid cannot be less than Grand Total (${settings.currency_symbol} ${grandTotal})`);
      return;
    }
    onSettle({ paymentMode, amountPaid: paid, notes });
  };

  const setQuickAmount = (val) => {
    setAmountPaid(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-slate-100">Bill Settlement & Payment</h3>
            <p className="text-xs text-slate-400">Bill #{bill.billNumber || 'NEW'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Payable Amount Highlight */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Payable Amount:</span>
            <span className="text-2xl font-black text-amber-400">
              {settings.currency_symbol} {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: '💵' },
                { id: 'UPI', label: 'UPI / QR', icon: '📱' },
                { id: 'CARD', label: 'Card', icon: '💳' },
                { id: 'SPLIT', label: 'Split', icon: '🔄' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMode(m.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMode === m.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl mb-1">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Tendered (Cash/Quick) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount Received ({settings.currency_symbol})
            </label>
            <input
              type="number"
              step="any"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-base font-bold text-slate-100 focus:outline-none focus:border-amber-500"
            />
            {/* Quick cash pills */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setQuickAmount(grandTotal)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
              >
                Exact ({settings.currency_symbol}{grandTotal})
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(Math.ceil(grandTotal / 100) * 100)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
              >
                Next 100
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(Math.ceil(grandTotal / 500) * 500 || 500)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
              >
                Next 500
              </button>
            </div>
          </div>

          {/* Balance / Change Due display */}
          {paymentMode === 'CASH' && paid > grandTotal && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center justify-between text-emerald-300 text-sm">
              <span className="font-medium">Change to Return to Customer:</span>
              <span className="font-bold text-base">
                {settings.currency_symbol} {changeDue.toFixed(2)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Transaction Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Card last 4 digits, UPI ref number"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Confirm & Settle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
