import React, { useState } from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';
import { ThresholdConfig } from '../types';
import { DEFAULT_THRESHOLDS } from '../utils/clinicalCalculations';

interface ThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onSaveThresholds: (newThresholds: ThresholdConfig) => Promise<void>;
}

export const ThresholdsModal: React.FC<ThresholdsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
}) => {
  const [config, setConfig] = useState<ThresholdConfig>({ ...thresholds });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_THRESHOLDS });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveThresholds(config);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Telemetry Alarm Thresholds</h2>
              <p className="text-xs text-slate-400">Configure safety trigger boundaries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-3">
            {/* Heart Rate */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-xs font-semibold text-emerald-400 block mb-1.5">
                Heart Rate Limits (BPM)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Bradycardia Limit (Min)</label>
                  <input
                    type="number"
                    value={config.heartRate.min}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        heartRate: { ...config.heartRate, min: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Tachycardia Limit (Max)</label>
                  <input
                    type="number"
                    value={config.heartRate.max}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        heartRate: { ...config.heartRate, max: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SpO2 */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-xs font-semibold text-cyan-400 block mb-1.5">
                Oxygen Saturation SpO2 (%)
              </span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Hypoxia Trigger Floor (&lt; %)</label>
                <input
                  type="number"
                  value={config.spo2.min}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      spo2: { min: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Blood Pressure Systolic */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-xs font-semibold text-amber-400 block mb-1.5">
                Systolic Blood Pressure (mmHg)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Hypotension Floor (Min)</label>
                  <input
                    type="number"
                    value={config.bpSystolic.min}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bpSystolic: { ...config.bpSystolic, min: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Hypertension Ceiling (Max)</label>
                  <input
                    type="number"
                    value={config.bpSystolic.max}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bpSystolic: { ...config.bpSystolic, max: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Temperature */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-xs font-semibold text-pink-400 block mb-1.5">
                Body Temperature Limits (°C)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Hypothermia Floor</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.temperature.min}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        temperature: { ...config.temperature, min: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Fever Ceiling</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.temperature.max}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        temperature: { ...config.temperature, max: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset AHA/NHS Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Apply Thresholds'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
