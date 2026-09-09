import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Patient } from '../types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patientData: Record<string, unknown>) => Promise<void>;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodType, setBloodType] = useState<string>('O+');
  const [ward, setWard] = useState<string>('General Ward');
  const [room, setRoom] = useState('GW-204');
  const [bed, setBed] = useState('Bed 1');
  const [doctor, setDoctor] = useState('Dr. Alex Morgan, MD');
  const [diagnosis, setDiagnosis] = useState('');
  const [allergies, setAllergies] = useState('Penicillin');
  const [notes, setNotes] = useState('');

  // Initial baseline vitals
  const [heartRate, setHeartRate] = useState('76');
  const [systolicBP, setSystolicBP] = useState('122');
  const [diastolicBP, setDiastolicBP] = useState('78');
  const [spo2, setSpo2] = useState('98');
  const [temperature, setTemperature] = useState('36.9');
  const [respiratoryRate, setRespiratoryRate] = useState('16');
  const [bloodGlucose, setBloodGlucose] = useState('105');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !bed.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddPatient({
        name: name.trim(),
        age: Number(age),
        gender,
        bloodType,
        ward,
        room,
        bed,
        doctor: doctor.trim(),
        diagnosis: diagnosis.trim() || 'General Medical Observation',
        allergies: allergies.split(',').map((a) => a.trim()).filter(Boolean),
        notes: notes.trim(),
        heartRate: Number(heartRate),
        systolicBP: Number(systolicBP),
        diastolicBP: Number(diastolicBP),
        spo2: Number(spo2),
        temperature: Number(temperature),
        respiratoryRate: Number(respiratoryRate),
        bloodGlucose: Number(bloodGlucose),
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Admit Inpatient & Assign Bed</h2>
              <p className="text-xs text-slate-400">Initialize continuous telemetry profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Patient Demographics & Bed Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 font-medium mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thomas Mitchell"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Age *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="125"
                  placeholder="e.g. 58"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Blood Type</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Ward Category</label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ICU">ICU (Intensive Care)</option>
                  <option value="Cardiac Care">Cardiac Care (CCU)</option>
                  <option value="General Ward">General Ward</option>
                  <option value="Emergency">Emergency (ER)</option>
                  <option value="Post-Op">Post-Op (PACU)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. ICU-04"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Bed Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bed 3A"
                  value={bed}
                  onChange={(e) => setBed(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Attending Physician</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Clinical Assessment & History
            </h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Primary Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Congestive Heart Failure exacerbation with bilateral pedal edema"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Known Allergies</label>
                  <input
                    type="text"
                    placeholder="Comma-separated: Penicillin, NSAIDs"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Clinical Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Fall risk protocol, NPO past midnight"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Baseline Admission Vitals */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Baseline Admission Vitals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">HR (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Systolic (mmHg)</label>
                <input
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Diastolic (mmHg)</label>
                <input
                  type="number"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block">Resp (rpm)</label>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
              {isSubmitting ? 'Admitting...' : 'Complete Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
