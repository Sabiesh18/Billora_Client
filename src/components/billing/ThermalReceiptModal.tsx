import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Bill } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReceipt,
  faPrint,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#F3E5DC] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header toolbar */}
        <div className="px-5 py-3 border-b border-[#F3E5DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FontAwesomeIcon icon={faReceipt} className="text-[#F67009]" />
              <span>POS Receipt</span>
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
              <FontAwesomeIcon icon={faPrint} />
              <span>Print Slip ({paperWidth})</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-lg px-2 leading-none font-bold"
            >
              <FontAwesomeIcon icon={faXmark} />
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
                {settings.restaurant_name || 'Billora Restaurant'}
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

            {/* Bill Summary Breakdown */}
            {(() => {
              const subTotal = Number(bill.subTotal ?? (bill as any).sub_total ?? 0);
              const discountAmount = Number(bill.discountAmount ?? (bill as any).discount_amount ?? 0);
              const taxAmount = Number(bill.taxAmount ?? (bill as any).tax_amount ?? 0);
              const roundOff = Number(bill.roundOff ?? (bill as any).round_off ?? 0);
              const grandTotal = Number(bill.grandTotal ?? (bill as any).grand_total ?? 0);
              const taxRate = bill.taxRate ?? (bill as any).tax_rate ?? settings.default_tax_rate ?? 5;
              const paymentMode = String(bill.paymentMode ?? (bill as any).payment_mode ?? 'PAID').toUpperCase();
              const paymentStatus = String(bill.paymentStatus ?? (bill as any).payment_status ?? bill.status ?? 'PAID').toUpperCase();
              const itemsList = bill.items || (bill as any).bill_items || [];
              const totalQty = itemsList.reduce((acc: number, item: any) => acc + Number(item.quantity || 1), 0);
              const currency = settings.currency_symbol || '₹';

              return (
                <div className="pt-2 border-t-2 border-dashed border-black mb-2 space-y-1">
                  <div className="text-center font-black tracking-widest text-[11px] mb-1.5 uppercase">
                    *** BILL SUMMARY ***
                  </div>

                  <div className="flex justify-between text-[10px] text-gray-800">
                    <span>Total Items:</span>
                    <span className="font-bold">{itemsList.length} items (Qty: {totalQty})</span>
                  </div>

                  <div className="flex justify-between text-[10px] text-gray-800">
                    <span>Sub Total:</span>
                    <span className="font-bold">{currency} {subTotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>Discount:</span>
                      <span className="font-bold">- {currency} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[10px] text-gray-800">
                    <span>GST / Tax ({taxRate}%):</span>
                    <span className="font-bold">+ {currency} {taxAmount.toFixed(2)}</span>
                  </div>

                  {roundOff !== 0 && (
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>Round Off:</span>
                      <span className="font-bold">
                        {roundOff > 0 ? `+ ${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-xs border-t-2 border-b-2 border-black py-1.5 my-1">
                    <span className="tracking-wide">NET PAYABLE:</span>
                    <span className="text-sm font-black">
                      {currency} {grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[9.5px] pt-0.5">
                    <span className="font-semibold">Payment Mode:</span>
                    <span className="font-black uppercase tracking-wider">{paymentMode}</span>
                  </div>
                  <div className="flex justify-between text-[9.5px]">
                    <span className="font-semibold">Payment Status:</span>
                    <span className="font-black uppercase tracking-wider">{paymentStatus}</span>
                  </div>
                </div>
              );
            })()}

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
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:brightness-105 text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faPrint} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
