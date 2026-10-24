import React, { useState, useEffect } from 'react';
import { tableApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Table } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faArrowsRotate,
  faChair,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

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
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Header & Area Pills */}
      <div className="bg-white border border-[#F3E5DC] p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedArea === area
                  ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm'
                  : 'bg-[#FFF9F6] text-slate-700 border border-[#F3E5DC] hover:bg-[#FFF0E6] hover:text-[#F67009]'
              }`}
            >
              {area === 'ALL' ? 'All Dining Areas' : area}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setNewTableModal(true)}
            className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Table</span>
          </button>
          <button
            onClick={fetchTables}
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3 py-2 rounded-xl border border-[#F3E5DC] transition-colors flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={loading ? 'animate-spin text-[#F67009]' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <span className="inline-block animate-spin mr-2">
            <FontAwesomeIcon icon={faArrowsRotate} />
          </span>{' '}
          Loading dining tables...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredTables.map((t) => {
            const isOccupied = t.status === 'OCCUPIED';
            return (
              <div
                key={t.tableId}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
                  isOccupied
                    ? 'bg-[#FFF9F6] border-2 border-[#F67009]/80 shadow-md'
                    : 'bg-white border-[#F3E5DC] hover:border-[#F88D3A]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-black text-slate-900 font-mono">
                      {t.tableNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faChair} className="text-slate-400 text-[10px]" />
                    <span>Capacity: <strong className="text-slate-800">{t.seatingCapacity} Seats</strong></span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.locationArea}</p>

                  {isOccupied && (
                    <div className="mt-3 p-2 bg-white rounded-xl border border-[#F3E5DC] shadow-xs">
                      <p className="text-[10px] text-slate-500 font-mono">{t.billNumber || 'Order active'}</p>
                      {t.grandTotal && (
                        <p className="text-xs font-black text-[#F67009] mt-0.5">
                          {settings.currency_symbol || '₹'} {Number(t.grandTotal).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F3E5DC] flex gap-2">
                  <button
                    onClick={() => handleQuickStatusChange(t.tableId, t.status)}
                    className="flex-1 py-1.5 text-[11px] font-bold bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] rounded-xl border border-[#FED7AA] transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E5DC] rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faChair} className="text-[#F67009]" />
              <span>Add New Dining Table</span>
            </h3>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-13, T-VIP, Bar-01"
                  className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dining Area / Floor
                </label>
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="e.g. Ground Floor, Rooftop, AC Hall"
                  className="w-full bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNewTableModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faCircleCheck} />
                  <span>{submitting ? 'Creating...' : 'Save Table'}</span>
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
