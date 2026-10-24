import React, { useState, useEffect } from 'react';
import { tableApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Table } from '../types';

interface TableManagementPageProps {
  setActivePage?: (page: string) => void;
}

export const TableManagementPage: React.FC<TableManagementPageProps> = () => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [newTableModal, setNewTableModal] = useState<boolean>(false);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(4);
  const [locationArea, setLocationArea] = useState<string>('Main Dining');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const data = await tableApi.getAll();
      setTables(data || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading tables';
      showToast('Error loading tables: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const areas = ['ALL', ...Array.from(new Set(tables.map((t) => t.locationArea).filter(Boolean)))];

  const filteredTables = tables.filter(
    (t) => selectedArea === 'ALL' || t.locationArea === selectedArea
  );

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      showToast('Table number is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await tableApi.create({
        tableNumber: tableNumber.trim(),
        seatingCapacity: Number(capacity) || 4,
        locationArea: locationArea.trim() || 'Main Dining',
      });
      showToast('Table created successfully', 'success');
      setNewTableModal(false);
      setTableNumber('');
      fetchTables();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create table';
      showToast('Failed to create table: ' + errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (tableId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    try {
      await tableApi.updateStatus(tableId, nextStatus);
      showToast('Table marked as ' + nextStatus, 'info');
      fetchTables();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Status update failed';
      showToast('Status update failed: ' + errorMsg, 'error');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Area Pills */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedArea === area
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {area === 'ALL' ? 'All Dining Areas' : area}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setNewTableModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-lg shadow flex items-center gap-1.5 transition-colors"
          >
            <span>+</span>
            <span>Add Table</span>
          </button>
          <button
            onClick={fetchTables}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            Refresh 🔄
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          <span className="inline-block animate-spin mr-2">⏳</span> Loading dining tables...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredTables.map((t) => {
            const isOccupied = t.status === 'OCCUPIED';
            return (
              <div
                key={t.tableId}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all shadow-sm ${
                  isOccupied
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-black text-slate-100 font-mono">
                      {t.tableNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Capacity: <strong className="text-slate-300">{t.seatingCapacity} Seats</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{t.locationArea}</p>

                  {isOccupied && (
                    <div className="mt-3 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-mono">{t.billNumber || 'Order active'}</p>
                      {t.grandTotal && (
                        <p className="text-xs font-bold text-amber-400 mt-0.5">
                          {settings.currency_symbol || '₹'} {Number(t.grandTotal).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex gap-2">
                  <button
                    onClick={() => handleQuickStatusChange(t.tableId, t.status)}
                    className="flex-1 py-1.5 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                  >
                    {isOccupied ? 'Free Table' : 'Mark Occupied'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {newTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4">
              Add New Dining Table
            </h3>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-13, T-VIP, Bar-01"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Dining Area / Floor
                </label>
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="e.g. Ground Floor, Rooftop, AC Hall"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNewTableModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
                >
                  {submitting ? 'Creating...' : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementPage;
