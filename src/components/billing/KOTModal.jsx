import React from 'react';

export default function KOTModal({ bill, items, tableNumber, orderType, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            🍳 Kitchen Order Ticket (KOT)
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg px-2">
            &times;
          </button>
        </div>

        <div className="p-6 bg-slate-950/60 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            className="w-full max-w-[300px] bg-white text-black p-4 font-mono text-[11px] leading-tight"
          >
            <div className="text-center pb-2 border-b-2 border-black mb-2">
              <h2 className="text-base font-black uppercase">*** K. O. T. ***</h2>
              <p className="text-xs font-bold mt-1">TABLE: {tableNumber || 'TAKEAWAY'}</p>
              <p className="text-[10px]">Type: {orderType} | Time: {new Date().toLocaleTimeString('en-IN')}</p>
            </div>

            <div className="border-b border-black pb-1 mb-2 font-bold flex text-xs">
              <span className="flex-1">ITEM NAME</span>
              <span className="w-12 text-right">QTY</span>
            </div>

            <div className="space-y-1.5 py-1 text-xs font-bold border-b-2 border-black pb-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span>{item.itemName}</span>
                    {item.notes && (
                      <p className="text-[10px] text-gray-700 italic">>> {item.notes}</p>
                    )}
                  </div>
                  <span className="text-sm bg-gray-200 px-1.5 py-0.5 rounded">{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-2 text-[10px] text-gray-600">
              Kitchen Copy - Prepare ASAP
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-300">
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
          >
            Print KOT Slip
          </button>
        </div>
      </div>
    </div>
  );
}
