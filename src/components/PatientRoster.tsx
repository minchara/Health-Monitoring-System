import React, { useState } from 'react';
import {
  Search,
  Filter,
  Activity,
  Heart,
  Droplets,
  AlertTriangle,
  ChevronRight,
  Plus,
  UserX,
  Radio,
} from 'lucide-react';
import { Patient, PatientStatus } from '../types';

interface PatientRosterProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenAddPatient: () => void;
  onOpenAddVitalsForPatient: (patient: Patient) => void;
  onDischargePatient: (patientId: string) => void;
}

export const PatientRoster: React.FC<PatientRosterProps> = ({
  patients,
  onSelectPatient,
  onOpenAddPatient,
  onOpenAddVitalsForPatient,
  onDischargePatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const wards = ['all', 'ICU', 'Cardiac Care', 'General Ward', 'Emergency', 'Post-Op'];
  const statuses = [
    { label: 'All Patients', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'Monitoring', value: 'monitoring' },
    { label: 'Stable', value: 'stable' },
  ];

  const filteredPatients = patients.filter((p) => {
    if (selectedWard !== 'all' && p.ward !== selectedWard) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.bed.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Control Bar: Search, Filters & Admit Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, bed or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Ward Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs text-slate-500 font-medium">Ward:</span>
            {wards.map((ward) => (
              <button
                key={ward}
                onClick={() => setSelectedWard(ward)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedWard === ward
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ward === 'all' ? 'All Wards' : ward}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            {statuses.map((st) => (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedStatus === st.value
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Admit Patient Modal Trigger */}
        <button
          onClick={onOpenAddPatient}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Admit Inpatient
        </button>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
          No patients match the specified criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const vitals = patient.latestVitals;
            const isCritical = patient.status === 'critical';
            const isMonitoring = patient.status === 'monitoring';

            return (
              <div
                key={patient.id}
                className={`group bg-slate-900 rounded-2xl border transition-all hover:border-slate-700 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isCritical
                    ? 'border-rose-900/80 bg-gradient-to-b from-rose-950/20 to-slate-900'
                    : isMonitoring
                    ? 'border-amber-900/60'
                    : 'border-slate-800'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-sm border border-slate-700">
                        {patient.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-base leading-tight group-hover:text-emerald-400 transition-colors">
                          {patient.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono">{patient.mrn}</span>
                          <span>•</span>
                          <span>{patient.age}y {patient.gender}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-300">{patient.bloodType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isCritical && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" /> CRITICAL
                      </span>
                    )}
                    {isMonitoring && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-950 text-amber-300 border border-amber-800 whitespace-nowrap">
                        MONITORING
                      </span>
                    )}
                    {!isCritical && !isMonitoring && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 whitespace-nowrap">
                        STABLE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pb-2 border-b border-slate-800/80">
                    <span className="font-medium text-slate-300">
                      {patient.ward} • {patient.bed}
                    </span>
                    <span className="font-mono text-[11px]">
                      NEWS2: <strong className={patient.news2Score >= 7 ? 'text-rose-400' : patient.news2Score >= 5 ? 'text-amber-400' : 'text-emerald-400'}>{patient.news2Score} pts</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-2" title={patient.diagnosis}>
                    <span className="text-slate-500 font-medium">Diagnosis:</span> {patient.diagnosis}
                  </p>

                  {/* Vitals Snapshot */}
                  {vitals ? (
                    <div className="grid grid-cols-4 gap-2 mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 text-emerald-400" /> HR
                        </div>
                        <div className="text-sm font-bold font-mono text-emerald-400">{vitals.heartRate}</div>
                        <div className="text-[9px] text-slate-500">bpm</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                          <Activity className="w-2.5 h-2.5 text-amber-400" /> BP
                        </div>
                        <div className="text-sm font-bold font-mono text-amber-400">
                          {vitals.systolicBP}/{vitals.diastolicBP}
                        </div>
                        <div className="text-[9px] text-slate-500">mmHg</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                          <Droplets className="w-2.5 h-2.5 text-cyan-400" /> SpO2
                        </div>
                        <div className="text-sm font-bold font-mono text-cyan-400">{vitals.spo2}%</div>
                        <div className="text-[9px] text-slate-500">sat</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500">Temp</div>
                        <div className="text-sm font-bold font-mono text-pink-400">{vitals.temperature}°C</div>
                        <div className="text-[9px] text-slate-500">body</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500">No vitals logged yet.</div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenAddVitalsForPatient(patient)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Log vitals measurement"
                    >
                      Log Vitals
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to discharge ${patient.name}?`)) {
                          onDischargePatient(patient.id);
                        }
                      }}
                      className="text-xs p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Discharge patient"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    <span>Bedside Telemetry</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
