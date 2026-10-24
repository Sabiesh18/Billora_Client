import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { BillItem } from '../../types';

interface KOTModalProps {
  items: Array<BillItem | { itemName: string; quantity: number; notes?: string }>;
  tableNumber?: string;
  orderType: string;
  billNumber?: string;
  onClose: () => void;
}

export const KOTModal: React.FC<KOTModalProps> = ({
  items,
  tableNumber,
  orderType,
  billNumber,
  onClose,
}) => {
  const { settings } = useSettings();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(
    settings.thermal_printer_width === '58mm' ? '58mm' : '80mm'
  );

  const handlePrint = () => {
    window.print();
  };

  const is58mm = paperWidth === '58mm';
  const widthContainerClass = is58mm ? 'max-w-[240px]' : 'max-w-[320px]';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              🍳 Kitchen Order Ticket (KOT)
            </span>
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  paperWidth === '80mm'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  paperWidth === '58mm'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl px-2 leading-none"
          >
            &times;
          </button>
        </div>

        {/* Printable Area Container */}
        <div className="p-6 bg-slate-950/70 flex justify-center overflow-y-auto max-h-[75vh]">
          <div
            id="thermal-receipt-print-area"
            className={`w-full ${widthContainerClass} format-${paperWidth} bg-white text-black p-3.5 font-mono ${
              is58mm ? 'text-[10px]' : 'text-[11px]'
            } leading-tight rounded-sm shadow-md`}
          >
            <div className="text-center pb-2 border-b-2 border-black mb-2">
              <h2 className="text-base font-black tracking-widest uppercase">*** K. O. T. ***</h2>
              <p className="text-sm font-black mt-1">TABLE: {tableNumber || 'TAKEAWAY'}</p>
              {billNumber && <p className="text-[10px] font-bold">REF: #{billNumber}</p>}
              <div className="text-[9px] text-gray-700 flex justify-between mt-1 px-1">
                <span>Type: {orderType}</span>
                <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="border-b border-black pb-1 mb-2 font-bold flex text-xs">
              <span className="flex-1">ITEM NAME</span>
              <span className="w-12 text-right">QTY</span>
            </div>

            <div className="space-y-2 py-1 text-xs font-bold border-b-2 border-black pb-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <span className="text-[12px]">{item.itemName}</span>
                    {item.notes && (
                      <p className="text-[10px] text-gray-800 italic mt-0.5">
                        &gt;&gt; Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-black bg-gray-200 px-2 py-0.5 rounded border border-gray-400">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center pt-2 text-[9px] text-gray-600 font-bold uppercase tracking-wider">
              Kitchen Copy &bull; Immediate Preparation
            </div>
            <p className="text-gray-400 text-[7px] text-center pt-2 tracking-widest">- - - - - CUT HERE - - - - -</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow"
          >
            <span>🖨️</span>
            <span>Print KOT Slip ({paperWidth})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KOTModal;
