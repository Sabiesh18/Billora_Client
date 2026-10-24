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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#F3E5DC] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header toolbar */}
        <div className="px-5 py-3 border-b border-[#F3E5DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              🖨️ POS Receipt
            </span>
            {/* Paper Size Selector Toggle */}
            <div className="flex items-center bg-[#FFF9F6] p-0.5 rounded-lg border border-[#F3E5DC]">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm Standard
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm Compact
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <span>🖨️</span>
              <span>Print Slip ({paperWidth})</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-xl px-2 leading-none font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-6 overflow-y-auto flex justify-center bg-[#FFF9F6]">
          {/* Printable Thermal Receipt Area */}
          <div
            id="thermal-receipt-print-area"
            className={`w-full ${widthContainerClass} format-${paperWidth} bg-white text-black p-3.5 font-mono ${
              is58mm ? 'text-[10px]' : 'text-[11px]'
            } leading-tight shadow-md select-text rounded-sm border border-[#F3E5DC]`}
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
                <p className="text-[9px] text-gray-600">FSSAI: {settings.fssai_license}</p>
              )}
            </div>

            {/* Bill Metadata */}
            <div className="text-[9px] space-y-0.5 pb-2 border-b border-gray-300 mb-2">
              <div className="flex justify-between font-bold">
                <span>INVOICE: #{bill.billNumber}</span>
                <span>TABLE: {bill.tableNumber || 'WALK-IN'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Date: {new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                <span>Time: {new Date(bill.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {bill.customerName && (
                <div className="text-gray-700">Cust: {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}</div>
              )}
              <div className="text-gray-600">Type: {bill.orderType}</div>
            </div>

            {/* Items Table */}
            <div className="border-b border-black pb-1 mb-1 font-bold flex text-[10px]">
              <span className="flex-1">ITEM</span>
              <span className="w-8 text-center">QTY</span>
              <span className="w-12 text-right">PRICE</span>
              <span className="w-14 text-right">TOTAL</span>
            </div>

            <div className="divide-y divide-gray-200 border-b border-black pb-1 mb-2">
              {(bill.items || []).map((item, idx) => (
                <div key={idx} className="py-1 text-[10px] flex justify-between items-baseline">
                  <div className="flex-1 pr-1 truncate font-medium">
                    {item.itemName}
                  </div>
                  <div className="w-8 text-center font-bold">x{item.quantity}</div>
                  <div className="w-12 text-right text-gray-600">
                    {Number(item.unitPrice || 0).toFixed(2)}
                  </div>
                  <div className="w-14 text-right font-bold">
                    {Number(item.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between text-gray-700">
                <span>Sub Total:</span>
                <span>{settings.currency_symbol || '₹'} {Number(bill.subTotal || 0).toFixed(2)}</span>
              </div>

              {Number(bill.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span>- {settings.currency_symbol || '₹'} {Number(bill.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}

              {Number(bill.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>GST / Tax ({bill.taxRate || settings.default_tax_rate}%):</span>
                  <span>+ {settings.currency_symbol || '₹'} {Number(bill.taxAmount || 0).toFixed(2)}</span>
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
        <div className="p-3 border-t border-[#F3E5DC] bg-white flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Paper Width: <strong className="text-[#F67009]">{paperWidth}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white rounded-lg transition-all shadow-sm"
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
