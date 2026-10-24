import React, { useState, useEffect } from 'react';
import { activityApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ActivityLog } from '../types';

export const ActivityAuditPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [inspectLog, setInspectLog] = useState<ActivityLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await activityApi.getHistory({
        pageNumber: page,
        pageSize: 25,
        module: moduleFilter || undefined,
      });
      setLogs(data || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading audit history';
      showToast('Error loading audit history: ' + errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="bg-white border border-[#F3E5DC] p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🛡️</span> Unified Activity & Security Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Immutable system event logs recorded in <code className="text-[#F67009] font-mono font-bold">tbl_ActivityHistory</code>
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-[#E5D7CE] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#F67009]"
          >
            <option value="">All Modules</option>
            <option value="AUTH">AUTH (Logins/Logouts)</option>
            <option value="BILLING">BILLING (Orders/Settlements)</option>
            <option value="MENU">MENU (Price/Item updates)</option>
            <option value="TABLE">TABLE (Table allocation)</option>
            <option value="USER">USER (Staff administration)</option>
            <option value="SETTINGS">SETTINGS (Configuration)</option>
          </select>

          <button
            onClick={fetchLogs}
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#F3E5DC] transition-colors"
          >
            Refresh 🔄
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-[#F3E5DC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F6] text-slate-500 uppercase tracking-wider font-bold border-b border-[#F3E5DC]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor / User</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Event Description</th>
                <th className="p-3.5">Record ID</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E5DC] text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const isBilling = log.module === 'BILLING';
                  const isFailed = log.activityType.includes('FAIL');

                  return (
                    <tr key={log.activityId} className="hover:bg-[#FFF9F6] transition-colors">
                      <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {log.username || 'SYSTEM'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FFF9F6] text-slate-700 border border-[#E5D7CE] font-bold">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isFailed
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : isBilling
                              ? 'bg-[#FFF0E6] text-[#F67009] border border-[#FED7AA]'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {log.activityType}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {log.recordId || '---'}
                      </td>
                      <td className="p-3.5 text-right">
                        {(log.oldValue || log.newValue) && (
                          <button
                            onClick={() => setInspectLog(log)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#FFF0E6] hover:bg-[#FED7AA] text-[#F67009] rounded-lg border border-[#FED7AA] transition-colors"
                          >
                            Inspect JSON
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No activity logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E5DC] rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3E5DC] mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Event Payload Audit: {inspectLog.activityType}
              </h3>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {inspectLog.oldValue && (
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block mb-1">
                    Previous State (Before)
                  </span>
                  <pre className="p-3 rounded-xl bg-[#FFF9F6] border border-[#F3E5DC] text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48">
                    {typeof inspectLog.oldValue === 'string'
                      ? inspectLog.oldValue
                      : JSON.stringify(inspectLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {inspectLog.newValue && (
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                    Updated State (After)
                  </span>
                  <pre className="p-3 rounded-xl bg-[#FFF9F6] border border-[#F3E5DC] text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48">
                    {typeof inspectLog.newValue === 'string'
                      ? inspectLog.newValue
                      : JSON.stringify(inspectLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-[#F3E5DC]">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityAuditPage;