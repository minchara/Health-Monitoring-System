import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  ShieldAlert,
  Clock,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { WardAnalytics, HealthAlert } from '../types';

interface NavbarProps {
  currentView: 'roster' | 'monitor';
  onNavigateRoster: () => void;
  analytics: WardAnalytics | null;
  activeAlerts: HealthAlert[];
  isSimulationActive: boolean;
  onToggleSimulation: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenAlerts: () => void;
  onOpenThresholds: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateRoster,
  analytics,
  activeAlerts,
  isSimulationActive,
  onToggleSimulation,
  isAudioEnabled,
  onToggleAudio,
  onOpenAlerts,
  onOpenThresholds,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Branding & Live Clock */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div
            onClick={onNavigateRoster}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-slate-100 text-lg">
                  HEALTH MONITOR
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  LIVE
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Central Clinical Telemetry & Vitals System
              </span>
            </div>
          </div>

          {/* Quick Roster switch if currently in bedside monitor */}
          {currentView === 'monitor' && (
            <button
              onClick={onNavigateRoster}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              All Patients
            </button>
          )}
        </div>

        {/* Center Live Ward Metrics Pills */}
        {analytics && (
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">Occupancy:</span>
              <strong className="text-slate-100">{analytics.totalPatients}/10 Beds</strong>
              <span className="text-[10px] text-slate-500">({analytics.bedOccupancyRate}%)</span>
            </div>

            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-400 font-semibold">{analytics.stableCount} Stable</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold">{analytics.monitoringCount} Monitor</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-bold">{analytics.criticalCount} Critical</span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{timeStr}</span>
            </div>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* IoT Telemetry Simulation Toggle */}
          <button
            onClick={onToggleSimulation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSimulationActive
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle automatic real-time physiological vitals telemetry streaming"
          >
            <Radio className={`w-3.5 h-3.5 ${isSimulationActive ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Telemetry Stream:</span>
            <span>{isSimulationActive ? 'Active' : 'Paused'}</span>
          </button>

          {/* Audio Beep / Alarm Mute Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg border transition-colors ${
              isAudioEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isAudioEnabled ? 'Audio Alert Beeps: Enabled' : 'Audio Alert Beeps: Muted'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Thresholds Settings Button */}
          <button
            onClick={onOpenThresholds}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Configure Alert Thresholds"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Active Alerts Button with Badge */}
          <button
            onClick={onOpenAlerts}
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              criticalCount > 0
                ? 'bg-rose-950 border-rose-700 text-rose-200 animate-pulse shadow-rose-950/50 shadow-md'
                : activeAlerts.length > 0
                ? 'bg-amber-950 border-amber-800 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts</span>
            {activeAlerts.length > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  criticalCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {activeAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
