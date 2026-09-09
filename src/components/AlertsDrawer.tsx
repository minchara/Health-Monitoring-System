import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, ShieldCheck, Check } from 'lucide-react';
import { HealthAlert, AlertSeverity, AlertStatus } from '../types';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: HealthAlert[];
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
  onResolveAlert: (alertId: string, notes?: string) => Promise<void>;
  onSelectPatientById?: (patientId: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onSelectPatientById,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('active');
  const [filterSeverity, setFilterSeverity] = useState<'all' | AlertSeverity>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'active' && a.status === 'resolved') return false;
    if (filterStatus === 'resolved' && a.status !== 'resolved') return false;
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    return true;
  });

  const handleResolveSubmit = async (alertId: string) => {
    await onResolveAlert(alertId, resolutionNote);
    setResolvingId(null);
    setResolutionNote('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Clinical Alert Incident Feed</h2>
              <p className="text-xs text-slate-400">
                {alerts.filter((a) => a.status === 'active').length} active alarms across telemetry wards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Alarms
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterStatus === 'resolved'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as 'all' | AlertSeverity)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              No alerts matching the selected filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isResolved = alert.status === 'resolved';
              const isAcknowledged = alert.status === 'acknowledged';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isResolved
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      : isCritical
                      ? 'bg-rose-950/30 border-rose-800/80 shadow-sm'
                      : 'bg-amber-950/20 border-amber-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isResolved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isCritical
                            ? 'bg-rose-900 text-white animate-pulse'
                            : 'bg-amber-900 text-amber-200'
                        }`}
                      >
                        {isResolved ? 'Resolved' : alert.severity}
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">
                        {alert.patientName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium my-1">{alert.message}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                    <span>
                      Location: <strong className="text-slate-300">{alert.bed}</strong>
                    </span>
                    <span>
                      Target: <strong className="text-slate-300">{alert.threshold}</strong>
                    </span>
                  </div>

                  {/* Status metadata */}
                  {isAcknowledged && (
                    <div className="mt-2 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-1 rounded">
                      Acknowledged by {alert.acknowledgedBy || 'Medical Staff'} (
                      {alert.acknowledgedAt
                        ? new Date(alert.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                      )
                    </div>
                  )}

                  {isResolved && alert.resolutionNote && (
                    <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded">
                      Resolution: {alert.resolutionNote}
                    </div>
                  )}

                  {/* Action Buttons for active alarms */}
                  {!isResolved && (
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      {onSelectPatientById && (
                        <button
                          onClick={() => {
                            onSelectPatientById(alert.patientId);
                            onClose();
                          }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Jump to Monitor &rarr;
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        {!isAcknowledged && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}

                        {resolvingId === alert.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Clinical note..."
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              className="px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 w-32 focus:outline-none"
                            />
                            <button
                              onClick={() => handleResolveSubmit(alert.id)}
                              className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolvingId(alert.id)}
                            className="text-xs px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
