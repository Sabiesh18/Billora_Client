import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Bill } from '../../types';

interface ThermalReceiptModalProps {
  bill: Bill | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ bill, onClose }) => {
  const { settings } = useSettings();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(
    settings.thermal_printer_width === '58mm' ? '58mm' : '80mm'
  );

  const handlePrint = () => {
    window.print();
  };

  if (!bill) return null;

  const is58mm = paperWidth === '58mm';
  const widthContainerClass = is58mm ? 'max-w-[240px]' : 'max-w-[340px]';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              🖨️ POS Receipt
            </span>
            {/* Paper Size Selector Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm Standard
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm Compact
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <span>🖨️</span>
              <span>Print Slip ({paperWidth})</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl px-2 leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-950/70">
          {/* Printable Thermal Receipt Area */}
          <div
            id="thermal-receipt-print-area"
            className={`w-full ${widthContainerClass} format-${paperWidth} bg-white text-black p-3.5 font-mono ${
              is58mm ? 'text-[10px]' : 'text-[11px]'
            } leading-tight shadow-lg select-text rounded-sm`}
          >
            {/* Restaurant Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400 mb-2">
              <h2 className={`${is58mm ? 'text-xs' : 'text-sm'} font-black uppercase tracking-tight`}>
                {settings.restaurant_name || 'RESTAURANT & HOTEL'}
              </h2>
              {settings.restaurant_tagline && (
                <p className="text-[10px] text-gray-700 font-medium">{settings.restaurant_tagline}</p>
              )}
              <p className="text-[9px] text-gray-600 mt-0.5">{settings.restaurant_address || 'Local Street'}</p>
              <p className="text-[9px] text-gray-600">Ph: {settings.restaurant_phone || 'N/A'}</p>
              {settings.restaurant_gstin && (
                <p className="text-[9px] font-bold mt-0.5">GSTIN: {settings.restaurant_gstin}</p>
              )}
              {settings.fssai_license && (
                <p className="text-[9px]">FSSAI: {settings.fssai_license}</p>
              )}
            </div>

            {/* Bill Metadata */}
            <div className="text-[10px] mb-2 space-y-0.5 border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between">
                <span className="font-bold">Bill: #{bill.billNumber}</span>
                <span className="uppercase font-semibold">[{bill.orderType || 'DINE_IN'}]</span>
              </div>
              <div className="flex justify-between">
                <span>Table: {bill.tableNumber || 'Takeaway'}</span>
                <span>User: {bill.cashierId || 'POS'}</span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>
                  Date: {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                </span>
                <span>
                  Time: {bill.createdAt ? new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {bill.customerName && (
                <div className="pt-0.5 font-medium truncate">
                  Cust: {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="mb-2">
              <div className="flex font-bold border-b border-gray-700 pb-1 text-[10px]">
                <span className="flex-1">ITEM</span>
                <span className="w-8 text-center">QTY</span>
                <span className={`${is58mm ? 'w-11' : 'w-14'} text-right`}>RATE</span>
                <span className={`${is58mm ? 'w-12' : 'w-14'} text-right`}>AMT</span>
              </div>

              <div className="divide-y divide-dashed divide-gray-200 py-1">
                {(bill.items || []).map((item, idx) => (
                  <div key={idx} className="flex py-1 text-[10px]">
                    <span className="flex-1 truncate pr-1">{item.itemName}</span>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <span className={`${is58mm ? 'w-11' : 'w-14'} text-right`}>
                      {Number(item.unitPrice).toFixed(2)}
                    </span>
                    <span className={`${is58mm ? 'w-12' : 'w-14'} text-right font-bold`}>
                      {Number(item.totalPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="border-t border-dashed border-gray-600 pt-1.5 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Sub Total:</span>
                <span className="font-medium">{Number(bill.subTotal || 0).toFixed(2)}</span>
              </div>

              {Number(bill.discountAmount) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span>- {Number(bill.discountAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(bill.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({bill.taxRate || 5}%):</span>
                  <span>{Number(bill.taxAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(bill.roundOff) !== 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Round Off:</span>
                  <span>{Number(bill.roundOff).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-xs border-t-2 border-b-2 border-black py-1.5 mt-1">
                <span>NET PAYABLE:</span>
                <span className="text-sm">
                  {settings.currency_symbol || '₹'} {Number(bill.grandTotal || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-[9px] pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase tracking-wider">{bill.paymentMode || 'PAID'}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span>Status:</span>
                <span className="font-bold uppercase">{bill.status || 'PAID'}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400 text-[9px] space-y-1">
              <p className="font-bold">{settings.receipt_footer || 'Thank You! Visit Again!'}</p>
              <p className="text-gray-500 text-[8px] tracking-tight">Billora Offline Suite</p>
              <p className="text-gray-400 text-[7px] pt-1 tracking-widest">- - - - - CUT HERE - - - - -</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Paper Width: <strong className="text-amber-400">{paperWidth}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-all"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
