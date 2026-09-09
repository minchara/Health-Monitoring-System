import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Activity, Copy, Check, RefreshCw } from 'lucide-react';
import { Patient, AIClinicalAssessment } from '../types';

interface AIClinicalModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export const AIClinicalModal: React.FC<AIClinicalModalProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const [assessment, setAssessment] = useState<AIClinicalAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/clinical-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id }),
      });
      if (!res.ok) throw new Error('Failed to generate clinical synthesis');
      const data: AIClinicalAssessment = await res.json();
      setAssessment(data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch clinical analysis at this moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssessment();
    } else {
      setAssessment(null);
    }
  }, [isOpen, patient.id]);

  if (!isOpen) return null;

  const handleCopyNote = () => {
    if (!assessment) return;
    const text = `CLINICAL TELEMETRY SYNTHESIS (${new Date(assessment.timestamp).toLocaleString()})
Patient: ${patient.name} (${patient.mrn}) | Bed: ${patient.bed}
Diagnosis: ${patient.diagnosis}
Condition: ${assessment.overallCondition}
Risk Level: ${assessment.riskLevel}
Observations:
${assessment.keyObservations.map((o) => `• ${o}`).join('\n')}
Recommended Interventions:
${assessment.recommendedActions.map((a) => `• ${a}`).join('\n')}
Monitoring Frequency: ${assessment.monitoringFrequency}
Physiological Rationale: ${assessment.rationale}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                AI Clinical Decision Support
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Gemini Flash Telemetry
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Patient: <strong className="text-slate-200">{patient.name}</strong> ({patient.bed})
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

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-sm font-medium">Synthesizing hemodynamics and trend trajectory...</p>
              <p className="text-xs text-slate-500">Cross-referencing NEWS2 scores with vital sign thresholds</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
              {error}
              <button
                onClick={fetchAssessment}
                className="mt-2 block text-xs underline text-rose-200"
              >
                Retry Analysis
              </button>
            </div>
          ) : assessment ? (
            <div className="space-y-4">
              {/* Risk Level & Overview */}
              <div
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                  assessment.riskLevel === 'Critical'
                    ? 'bg-rose-950/30 border-rose-800 text-rose-200'
                    : assessment.riskLevel === 'Severe' || assessment.riskLevel === 'Moderate'
                    ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Deterioration Risk: {assessment.riskLevel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{assessment.overallCondition}</p>
                </div>
                <div className="text-right whitespace-nowrap text-xs text-slate-400">
                  <span>Frequency:</span>
                  <div className="font-semibold text-slate-200">{assessment.monitoringFrequency}</div>
                </div>
              </div>

              {/* Key Clinical Observations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Key Physiological Observations
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {assessment.keyObservations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Recommended Clinical Interventions
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {assessment.recommendedActions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rationale */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Physiological Rationale:</span>
                <p>{assessment.rationale}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={fetchAssessment}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-evaluate Vitals
          </button>

          <div className="flex items-center gap-2">
            {assessment && (
              <button
                onClick={handleCopyNote}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Progress Note'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
