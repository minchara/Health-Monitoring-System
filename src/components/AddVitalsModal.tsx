import React, { useState } from 'react';
import { X, Heart, Activity, Droplets, Thermometer, Wind, Zap, Check } from 'lucide-react';
import { Patient, VitalSigns, ConsciousnessLevel } from '../types';
import { calculateNEWS2 } from '../utils/clinicalCalculations';

interface AddVitalsModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSubmitVitals: (patientId: string, vitalsData: Partial<VitalSigns>) => Promise<void>;
}

export const AddVitalsModal: React.FC<AddVitalsModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSubmitVitals,
}) => {
  const latest = patient.latestVitals;

  const [heartRate, setHeartRate] = useState(latest ? String(latest.heartRate) : '75');
  const [systolicBP, setSystolicBP] = useState(latest ? String(latest.systolicBP) : '120');
  const [diastolicBP, setDiastolicBP] = useState(latest ? String(latest.diastolicBP) : '80');
  const [spo2, setSpo2] = useState(latest ? String(latest.spo2) : '98');
  const [temperature, setTemperature] = useState(latest ? String(latest.temperature) : '37.0');
  const [respiratoryRate, setRespiratoryRate] = useState(latest ? String(latest.respiratoryRate) : '16');
  const [bloodGlucose, setBloodGlucose] = useState(latest ? String(latest.bloodGlucose) : '110');
  const [consciousness, setConsciousness] = useState<ConsciousnessLevel>(latest ? latest.consciousness : 'Alert');
  const [supplementalOxygen, setSupplementalOxygen] = useState<boolean>(latest ? latest.supplementalOxygen : false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Live preview of NEWS2 score
  const previewVitals: VitalSigns = {
    id: 'preview',
    patientId: patient.id,
    timestamp: new Date().toISOString(),
    heartRate: Number(heartRate) || 75,
    systolicBP: Number(systolicBP) || 120,
    diastolicBP: Number(diastolicBP) || 80,
    spo2: Number(spo2) || 98,
    temperature: Number(temperature) || 37.0,
    respiratoryRate: Number(respiratoryRate) || 16,
    bloodGlucose: Number(bloodGlucose) || 110,
    consciousness,
    supplementalOxygen,
  };
  const previewNews2 = calculateNEWS2(previewVitals);

  // Quick preset loader
  const applyPreset = (preset: string) => {
    if (preset === 'normal') {
      setHeartRate('72');
      setSystolicBP('120');
      setDiastolicBP('80');
      setSpo2('98');
      setTemperature('36.8');
      setRespiratoryRate('15');
      setBloodGlucose('98');
      setConsciousness('Alert');
      setSupplementalOxygen(false);
    } else if (preset === 'sepsis') {
      setHeartRate('126');
      setSystolicBP('86');
      setDiastolicBP('52');
      setSpo2('90');
      setTemperature('39.2');
      setRespiratoryRate('26');
      setBloodGlucose('185');
      setConsciousness('Voice');
      setSupplementalOxygen(true);
    } else if (preset === 'copd') {
      setHeartRate('104');
      setSystolicBP('145');
      setDiastolicBP('90');
      setSpo2('88');
      setTemperature('37.4');
      setRespiratoryRate('24');
      setBloodGlucose('130');
      setConsciousness('Alert');
      setSupplementalOxygen(true);
    } else if (preset === 'hypertension') {
      setHeartRate('92');
      setSystolicBP('182');
      setDiastolicBP('108');
      setSpo2('97');
      setTemperature('36.9');
      setRespiratoryRate('18');
      setBloodGlucose('115');
      setConsciousness('Alert');
      setSupplementalOxygen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitVitals(patient.id, {
        heartRate: Number(heartRate),
        systolicBP: Number(systolicBP),
        diastolicBP: Number(diastolicBP),
        spo2: Number(spo2),
        temperature: Number(temperature),
        respiratoryRate: Number(respiratoryRate),
        bloodGlucose: Number(bloodGlucose),
        consciousness,
        supplementalOxygen,
        timestamp: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Log Clinical Vital Signs</h2>
            <p className="text-xs text-slate-400">
              Patient: <strong className="text-slate-200">{patient.name}</strong> ({patient.bed})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-6 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap">Clinical Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('normal')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 whitespace-nowrap transition-colors"
          >
            Normal Baseline
          </button>
          <button
            type="button"
            onClick={() => applyPreset('sepsis')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 whitespace-nowrap transition-colors"
          >
            Sepsis Shock
          </button>
          <button
            type="button"
            onClick={() => applyPreset('copd')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 whitespace-nowrap transition-colors"
          >
            COPD Hypoxia
          </button>
          <button
            type="button"
            onClick={() => applyPreset('hypertension')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 whitespace-nowrap transition-colors"
          >
            Hypertensive Urgency
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Heart Rate */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-emerald-400" /> Heart Rate (BPM)
              </label>
              <input
                type="number"
                min="30"
                max="220"
                required
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Systolic BP */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" /> Systolic (mmHg)
              </label>
              <input
                type="number"
                min="50"
                max="260"
                required
                value={systolicBP}
                onChange={(e) => setSystolicBP(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-400" /> Diastolic (mmHg)
              </label>
              <input
                type="number"
                min="30"
                max="160"
                required
                value={diastolicBP}
                onChange={(e) => setDiastolicBP(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* SpO2 */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> SpO2 (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                required
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-pink-400" /> Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="44"
                required
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Respiratory Rate */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-purple-400" /> Resp Rate (rpm)
              </label>
              <input
                type="number"
                min="4"
                max="60"
                required
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Blood Glucose */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Glucose (mg/dL)
              </label>
              <input
                type="number"
                min="20"
                max="600"
                required
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Consciousness */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 font-medium mb-1 block">
                Consciousness Level (AVPU)
              </label>
              <select
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value as ConsciousnessLevel)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Alert">Alert (A - Normal response)</option>
                <option value="Voice">Voice (V - Responds to vocal stimulus)</option>
                <option value="Pain">Pain (P - Responds to pain stimulus)</option>
                <option value="Unresponsive">Unresponsive (U - Comatose/unresponsive)</option>
              </select>
            </div>
          </div>

          {/* Supplemental Oxygen Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="suppO2"
              checked={supplementalOxygen}
              onChange={(e) => setSupplementalOxygen(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
            />
            <label htmlFor="suppO2" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
              Patient is currently receiving supplemental oxygen (Mask / Cannula)
            </label>
          </div>

          {/* Live Preview NEWS2 Banner */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Calculated NEWS2 Score:</span>
              <strong className="text-slate-100 text-sm ml-2 font-mono">{previewNews2.total} points</strong>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                previewNews2.riskCategory === 'High'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : previewNews2.riskCategory === 'Medium'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {previewNews2.riskCategory} Risk
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Commit Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
