import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Wind,
  Zap,
  AlertTriangle,
  PlusCircle,
  Sparkles,
  Download,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Radio,
} from 'lucide-react';
import { Patient, VitalSigns, ThresholdConfig } from '../types';
import { EcgCanvas } from './EcgCanvas';
import { VitalsTrendChart } from './VitalsTrendChart';
import { calculateNEWS2, calculateMAP } from '../utils/clinicalCalculations';

interface BedsideMonitorProps {
  patient: Patient;
  vitalsHistory: VitalSigns[];
  thresholds: ThresholdConfig;
  isAudioEnabled: boolean;
  onOpenAddVitals: () => void;
  onOpenAIModal: () => void;
  onBackToRoster: () => void;
  onTogglePatientSimulation: (patientId: string) => void;
}

export const BedsideMonitor: React.FC<BedsideMonitorProps> = ({
  patient,
  vitalsHistory,
  thresholds,
  isAudioEnabled,
  onOpenAddVitals,
  onOpenAIModal,
  onBackToRoster,
  onTogglePatientSimulation,
}) => {
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const latest = patient.latestVitals || (vitalsHistory.length > 0 ? vitalsHistory[vitalsHistory.length - 1] : null);
  const news2 = latest
    ? calculateNEWS2(latest)
    : {
        total: 0,
        riskCategory: 'Low' as const,
        clinicalResponse: 'Stable',
        components: {
          respiratoryRateScore: 0,
          spo2Score: 0,
          supplementalOxygenScore: 0,
          systolicBPScore: 0,
          heartRateScore: 0,
          consciousnessScore: 0,
          temperatureScore: 0,
        },
      };
  const mapValue = latest ? calculateMAP(latest.systolicBP, latest.diastolicBP) : 0;

  // Temperature format helper
  const displayTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  // Heart rhythm tag
  const getHeartRhythm = (hr: number) => {
    if (hr < 50) return 'Sinus Bradycardia';
    if (hr > 110) return 'Sinus Tachycardia';
    return 'Normal Sinus Rhythm';
  };

  // Export medical summary report
  const handleExportSummary = () => {
    const report = {
      hospital: 'Metro Clinical Health Telemetry Network',
      exportDate: new Date().toISOString(),
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bloodType: patient.bloodType,
        ward: patient.ward,
        bed: patient.bed,
        admitted: patient.admissionDate,
        doctor: patient.doctor,
        diagnosis: patient.diagnosis,
        status: patient.status,
        allergies: patient.allergies,
      },
      currentNEWS2: news2,
      latestVitals: latest,
      recentTelemetryPoints: vitalsHistory.slice(-10),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${patient.mrn}_telemetry_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!latest) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
        No active telemetry stream detected for this patient.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Patient Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBackToRoster}
              className="mt-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Return to Ward Roster"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{patient.name}</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {patient.mrn}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  {patient.ward} • {patient.bed}
                </span>

                {patient.status === 'critical' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL
                  </span>
                )}
                {patient.status === 'monitoring' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                    MONITORING
                  </span>
                )}
                {patient.status === 'stable' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    STABLE
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                <span>Age/Sex: <strong className="text-slate-200">{patient.age}y / {patient.gender}</strong></span>
                <span>Blood: <strong className="text-slate-200">{patient.bloodType}</strong></span>
                <span>Physician: <strong className="text-slate-200">{patient.doctor}</strong></span>
                <span>Allergies: <strong className="text-rose-400">{patient.allergies.join(', ') || 'None'}</strong></span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                <span className="text-slate-500 font-medium">Primary Diagnosis:</span> {patient.diagnosis}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onTogglePatientSimulation(patient.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                patient.simulationActive
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle automatic IoT telemetry sensor stream simulation"
            >
              <Radio className={`w-3.5 h-3.5 ${patient.simulationActive ? 'text-emerald-400 animate-pulse' : ''}`} />
              {patient.simulationActive ? 'IoT Sensor: Active' : 'IoT Sensor: Paused'}
            </button>

            <button
              onClick={onOpenAddVitals}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Log Vitals
            </button>

            <button
              onClick={onOpenAIModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              AI Clinical Synthesis
            </button>

            <button
              onClick={handleExportSummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Download telemetry report"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Real-time ECG & Pleth Waveform Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Real-Time Waveform Monitor • Sweep Trace (Lead II & SpO2 Pleth)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Cardiac Rhythm: <span className="text-emerald-400 font-semibold">{getHeartRhythm(latest.heartRate)}</span>
          </span>
        </div>
        <EcgCanvas
          heartRate={latest.heartRate}
          spo2={latest.spo2}
          isAudioEnabled={isAudioEnabled}
        />
      </div>

      {/* High-Fidelity Vitals Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Heart Rate Tile */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            latest.heartRate < thresholds.heartRate.min || latest.heartRate > thresholds.heartRate.max
              ? 'bg-rose-950/40 border-rose-600 shadow-rose-950/50'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-1 font-semibold text-emerald-400">
              <Heart className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>HEART RATE</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">BPM</span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight">
              {latest.heartRate}
            </span>
            <span className="text-xs text-slate-400">/min</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Limits: {thresholds.heartRate.min}-{thresholds.heartRate.max}</span>
            <span className={latest.heartRate < 60 || latest.heartRate > 100 ? 'text-rose-400 font-medium' : 'text-emerald-400'}>
              {latest.heartRate < 60 ? 'Brady' : latest.heartRate > 100 ? 'Tachy' : 'Normal'}
            </span>
          </div>
        </div>

        {/* 2. Blood Pressure Tile */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            latest.systolicBP > thresholds.bpSystolic.max || latest.systolicBP < thresholds.bpSystolic.min
              ? 'bg-amber-950/40 border-amber-600'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-1 font-semibold text-amber-400">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>NIBP (BP)</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">mmHg</span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">
              {latest.systolicBP}
            </span>
            <span className="text-xl font-mono text-amber-500/80">/{latest.diastolicBP}</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>MAP: <strong className="text-slate-200">{mapValue}</strong></span>
            <span className="text-slate-400 text-[10px]">Sys &lt; 140</span>
          </div>
        </div>

        {/* 3. SpO2 Oxygen Saturation Tile */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            latest.spo2 < thresholds.spo2.min
              ? 'bg-rose-950/40 border-rose-600'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-1 font-semibold text-cyan-400">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>SpO2 OXYGEN</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">%</span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-400 tracking-tight">
              {latest.spo2}
            </span>
            <span className="text-xs text-slate-400">%</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Target: ≥ {thresholds.spo2.min}%</span>
            <span className={latest.supplementalOxygen ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
              {latest.supplementalOxygen ? 'O2 Support' : 'Room Air'}
            </span>
          </div>
        </div>

        {/* 4. Temperature Tile */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            latest.temperature > thresholds.temperature.max || latest.temperature < thresholds.temperature.min
              ? 'bg-rose-950/40 border-rose-600'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-1 font-semibold text-pink-400">
              <Thermometer className="w-4 h-4 text-pink-400" />
              <span>BODY TEMP</span>
            </div>
            <button
              onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
            >
              °{tempUnit}
            </button>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-pink-400 tracking-tight">
              {displayTemp(latest.temperature)}
            </span>
            <span className="text-xs text-slate-400">°{tempUnit}</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Norm: 36.1 - 37.2°C</span>
            <span className={latest.temperature >= 38.0 ? 'text-rose-400 font-medium' : 'text-emerald-400'}>
              {latest.temperature >= 38.0 ? 'Pyrexia' : 'Afebrile'}
            </span>
          </div>
        </div>

        {/* 5. Respiratory Rate Tile */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            latest.respiratoryRate < thresholds.respiratoryRate.min || latest.respiratoryRate > thresholds.respiratoryRate.max
              ? 'bg-rose-950/40 border-rose-600'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-1 font-semibold text-purple-400">
              <Wind className="w-4 h-4 text-purple-400" />
              <span>RESP RATE</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">rpm</span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-purple-400 tracking-tight">
              {latest.respiratoryRate}
            </span>
            <span className="text-xs text-slate-400">/min</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Limits: 12-20</span>
            <span className={latest.respiratoryRate > 20 ? 'text-amber-400 font-medium' : 'text-purple-400'}>
              {latest.respiratoryRate > 20 ? 'Tachypnea' : 'Eupnea'}
            </span>
          </div>
        </div>

        {/* 6. Blood Glucose Tile */}
        <div className="p-4 rounded-xl border bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-1 font-semibold text-emerald-400">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>GLUCOSE</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">mg/dL</span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight">
              {latest.bloodGlucose}
            </span>
            <span className="text-xs text-slate-400">mg/dL</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Conscious:</span>
            <span className="text-slate-200 font-medium">{latest.consciousness}</span>
          </div>
        </div>
      </div>

      {/* Clinical Risk Evaluation & NEWS2 Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* NEWS2 Score Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                NEWS2 Clinical Deterioration Index
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  news2.riskCategory === 'High'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : news2.riskCategory === 'Medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {news2.riskCategory} Risk
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <div className="text-4xl font-black font-mono text-slate-100">{news2.total}</div>
              <div className="text-xs text-slate-400">
                <span>/ 20 maximum score</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Threshold: &gt;= 5 triggers urgent escalation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <strong className="text-slate-200">Recommended Action:</strong> {news2.clinicalResponse}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <div>Resp: <strong className="text-slate-200">+{news2.components.respiratoryRateScore}</strong></div>
            <div>SpO2: <strong className="text-slate-200">+{news2.components.spo2Score}</strong></div>
            <div>O2 Rx: <strong className="text-slate-200">+{news2.components.supplementalOxygenScore}</strong></div>
            <div>BP: <strong className="text-slate-200">+{news2.components.systolicBPScore}</strong></div>
            <div>Pulse: <strong className="text-slate-200">+{news2.components.heartRateScore}</strong></div>
            <div>Temp: <strong className="text-slate-200">+{news2.components.temperatureScore}</strong></div>
          </div>
        </div>

        {/* Historical Telemetry Trend Chart */}
        <div className="lg:col-span-2">
          <VitalsTrendChart history={vitalsHistory} thresholds={thresholds} />
        </div>
      </div>
    </div>
  );
};
