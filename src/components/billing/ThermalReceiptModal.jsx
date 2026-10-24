import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function ThermalReceiptModal({ bill, onClose }) {
  const { settings } = useSettings();

  const handlePrint = () => {
    window.print();
  };

  if (!bill) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Thermal POS Receipt Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow"
            >
              <span>🖨️</span>
              <span>Print Slip</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg px-2">
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-950/60">
          {/* Printable 80mm thermal receipt area */}
          <div
            id="thermal-receipt-print-area"
            className="w-full max-w-[340px] bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-md select-text"
          >
            {/* Restaurant header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400 mb-2">
              <h2 className="text-sm font-black uppercase tracking-tight">{settings.restaurant_name}</h2>
              <p className="text-[10px] text-gray-700">{settings.restaurant_tagline}</p>
              <p className="text-[9px] text-gray-600 mt-1">{settings.restaurant_address}</p>
              <p className="text-[9px] text-gray-600">Ph: {settings.restaurant_phone}</p>
              {settings.restaurant_gstin && (
                <p className="text-[9px] font-bold mt-0.5">GSTIN: {settings.restaurant_gstin}</p>
              )}
              {settings.fssai_license && (
                <p className="text-[9px]">FSSAI: {settings.fssai_license}</p>
              )}
            </div>

            {/* Bill metadata */}
            <div className="text-[10px] mb-2 space-y-0.5 border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between">
                <span>Invoice: {bill.billNumber}</span>
                <span>Type: {bill.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span>Table: {bill.tableNumber || 'N/A'}</span>
                <span>Cashier: {bill.cashierId || 'POS'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date: {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span>
                <span>Time: {bill.createdAt ? new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {bill.customerName && (
                <div>Customer: {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}</div>
              )}
            </div>

            {/* Line items table */}
            <div className="mb-2">
              <div className="flex font-bold border-b border-gray-500 pb-1 text-[10px]">
                <span className="flex-1">ITEM</span>
                <span className="w-10 text-center">QTY</span>
                <span className="w-14 text-right">RATE</span>
                <span className="w-14 text-right">AMT</span>
              </div>

              <div className="divide-y divide-dashed divide-gray-200 py-1">
                {(bill.items || []).map((item, idx) => (
                  <div key={idx} className="flex py-1 text-[10px]">
                    <span className="flex-1 truncate pr-1">{item.itemName}</span>
                    <span className="w-10 text-center">{item.quantity}</span>
                    <span className="w-14 text-right">{Number(item.unitPrice).toFixed(2)}</span>
                    <span className="w-14 text-right font-medium">{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="border-t border-dashed border-gray-500 pt-1.5 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Sub Total:</span>
                <span>{Number(bill.subTotal || 0).toFixed(2)}</span>
              </div>

              {Number(bill.discountAmount) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span>- {Number(bill.discountAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(bill.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>GST / Tax ({bill.taxRate || 5}%):</span>
                  <span>{Number(bill.taxAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(bill.roundOff) !== 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Round Off:</span>
                  <span>{Number(bill.roundOff).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-xs border-t border-b border-gray-800 py-1 mt-1">
                <span>NET PAYABLE:</span>
                <span>{settings.currency_symbol} {Number(bill.grandTotal || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[9px] pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{bill.paymentMode || 'PAID'}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400 text-[9px] space-y-1">
              <p className="font-bold">{settings.receipt_footer}</p>
              <p className="text-gray-500 text-[8px]">Software by Restaurant Billing Pro (Offline Suite)</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow"
          >
            Print Thermal Slip
          </button>
        </div>
      </div>
    </div>
  );
}
