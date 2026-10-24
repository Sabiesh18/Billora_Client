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
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>🛡️</span> Unified Activity & Security Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            Immutable system event logs recorded in <code className="text-amber-400 font-mono">tbl_ActivityHistory</code>
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            Refresh 🔄
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const isBilling = log.module === 'BILLING';
                  const isFailed = log.activityType.includes('FAIL');

                  return (
                    <tr key={log.activityId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('en-IN')}{' '}
                        <span className="text-[10px]">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-100">
                        {log.username || 'SYSTEM'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isFailed
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : isBilling
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {log.activityType}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {log.recordId || '---'}
                      </td>
                      <td className="p-3.5 text-right">
                        {(log.oldValue || log.newValue) && (
                          <button
                            onClick={() => setInspectLog(log)}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
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
                  <td colSpan={7} className="p-8 text-center text-slate-500">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Event Payload Audit: {inspectLog.activityType}
              </h3>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {inspectLog.oldValue && (
                <div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                    Previous State (Before)
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                    {typeof inspectLog.oldValue === 'string'
                      ? inspectLog.oldValue
                      : JSON.stringify(inspectLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {inspectLog.newValue && (
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                    Updated State (After)
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                    {typeof inspectLog.newValue === 'string'
                      ? inspectLog.newValue
                      : JSON.stringify(inspectLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
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
