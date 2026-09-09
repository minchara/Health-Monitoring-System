import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { PatientRoster } from './components/PatientRoster';
import { BedsideMonitor } from './components/BedsideMonitor';
import { AddVitalsModal } from './components/AddVitalsModal';
import { AddPatientModal } from './components/AddPatientModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { AIClinicalModal } from './components/AIClinicalModal';
import { ThresholdsModal } from './components/ThresholdsModal';
import { Patient, VitalSigns, HealthAlert, WardAnalytics, ThresholdConfig } from './types';
import { DEFAULT_THRESHOLDS } from './utils/clinicalCalculations';
import { medicalAudio } from './utils/audioAlert';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<VitalSigns[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [analytics, setAnalytics] = useState<WardAnalytics | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);

  const [currentView, setCurrentView] = useState<'roster' | 'monitor'>('roster');
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isAddVitalsOpen, setIsAddVitalsOpen] = useState(false);
  const [vitalsTargetPatient, setVitalsTargetPatient] = useState<Patient | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);

  const prevAlertsCountRef = useRef(0);

  // Sync audio enabled state to helper
  const handleToggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    medicalAudio.enabled = nextState;
  };

  // 1. Fetch Patients
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data: Patient[] = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  }, []);

  // 2. Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data: HealthAlert[] = await res.json();
        setAlerts(data);

        // Sound chime for new critical alert if enabled
        const activeCritical = data.filter((a) => a.status === 'active' && a.severity === 'critical').length;
        if (activeCritical > prevAlertsCountRef.current && medicalAudio.enabled) {
          medicalAudio.playAlert('critical');
        }
        prevAlertsCountRef.current = activeCritical;
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, []);

  // 3. Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/summary');
      if (res.ok) {
        const data: WardAnalytics = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  // 4. Fetch Thresholds
  const fetchThresholds = useCallback(async () => {
    try {
      const res = await fetch('/api/thresholds');
      if (res.ok) {
        const data: ThresholdConfig = await res.json();
        setThresholds(data);
      }
    } catch (err) {
      console.error('Error fetching thresholds:', err);
    }
  }, []);

  // 5. Fetch Vitals History for Selected Patient
  const fetchSelectedPatientHistory = useCallback(async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals`);
      if (res.ok) {
        const history: VitalSigns[] = await res.json();
        setSelectedPatientHistory(history);
      }
    } catch (err) {
      console.error('Error fetching patient history:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchPatients(), fetchAlerts(), fetchAnalytics(), fetchThresholds()]);
      setLoading(false);
    }
    init();
  }, [fetchPatients, fetchAlerts, fetchAnalytics, fetchThresholds]);

  // Keep selected patient reference up to date with updated patients array
  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find((p) => p.id === selectedPatient.id);
      if (updated) {
        setSelectedPatient(updated);
      }
    }
  }, [patients, selectedPatient]);

  // Periodic IoT Telemetry Simulation Tick (every 3 seconds)
  useEffect(() => {
    if (!isSimulationActive) return;

    const interval = setInterval(async () => {
      try {
        const tickRes = await fetch('/api/simulation/tick', { method: 'POST' });
        if (tickRes.ok) {
          await Promise.all([fetchPatients(), fetchAlerts(), fetchAnalytics()]);

          if (selectedPatient) {
            await fetchSelectedPatientHistory(selectedPatient.id);
          }
        }
      } catch (err) {
        console.error('Simulation tick error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulationActive, fetchPatients, fetchAlerts, fetchAnalytics, fetchSelectedPatientHistory, selectedPatient]);

  // Select patient to enter Bedside Monitor view
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchSelectedPatientHistory(patient.id);
    setCurrentView('monitor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select patient by ID (from alert link)
  const handleSelectPatientById = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      handleSelectPatient(patient);
    }
  };

  // Add vitals handler
  const handleAddVitals = async (patientId: string, vitalsData: Partial<VitalSigns>) => {
    const res = await fetch(`/api/patients/${patientId}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalsData),
    });
    if (res.ok) {
      await Promise.all([fetchPatients(), fetchAlerts(), fetchAnalytics()]);
      if (selectedPatient && selectedPatient.id === patientId) {
        await fetchSelectedPatientHistory(patientId);
      }
    }
  };

  // Add patient handler
  const handleAddPatient = async (patientData: Record<string, unknown>) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (res.ok) {
      await Promise.all([fetchPatients(), fetchAlerts(), fetchAnalytics()]);
    }
  };

  // Discharge patient handler
  const handleDischargePatient = async (patientId: string) => {
    const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
    if (res.ok) {
      if (selectedPatient && selectedPatient.id === patientId) {
        setSelectedPatient(null);
        setCurrentView('roster');
      }
      await Promise.all([fetchPatients(), fetchAlerts(), fetchAnalytics()]);
    }
  };

  // Acknowledge alert handler
  const handleAcknowledgeAlert = async (alertId: string) => {
    const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledgedBy: 'Attending Nurse' }),
    });
    if (res.ok) {
      await fetchAlerts();
    }
  };

  // Resolve alert handler
  const handleResolveAlert = async (alertId: string, notes?: string) => {
    const res = await fetch(`/api/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) {
      await Promise.all([fetchAlerts(), fetchAnalytics()]);
    }
  };

  // Save thresholds handler
  const handleSaveThresholds = async (newThresholds: ThresholdConfig) => {
    const res = await fetch('/api/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newThresholds),
    });
    if (res.ok) {
      setThresholds(newThresholds);
    }
  };

  // Toggle simulation for a specific patient
  const handleTogglePatientSimulation = async (patientId: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;
    const res = await fetch(`/api/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulationActive: !p.simulationActive }),
    });
    if (res.ok) {
      await fetchPatients();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Clinical Header */}
      <Navbar
        currentView={currentView}
        onNavigateRoster={() => setCurrentView('roster')}
        analytics={analytics}
        activeAlerts={alerts.filter((a) => a.status === 'active')}
        isSimulationActive={isSimulationActive}
        onToggleSimulation={() => setIsSimulationActive(!isSimulationActive)}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenThresholds={() => setIsThresholdsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="py-24 text-center text-slate-500">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Initializing Central Telemetry Engine...</p>
          </div>
        ) : currentView === 'monitor' && selectedPatient ? (
          <BedsideMonitor
            patient={selectedPatient}
            vitalsHistory={selectedPatientHistory}
            thresholds={thresholds}
            isAudioEnabled={isAudioEnabled}
            onOpenAddVitals={() => {
              setVitalsTargetPatient(selectedPatient);
              setIsAddVitalsOpen(true);
            }}
            onOpenAIModal={() => setIsAIOpen(true)}
            onBackToRoster={() => setCurrentView('roster')}
            onTogglePatientSimulation={handleTogglePatientSimulation}
          />
        ) : (
          <PatientRoster
            patients={patients}
            onSelectPatient={handleSelectPatient}
            onOpenAddPatient={() => setIsAddPatientOpen(true)}
            onOpenAddVitalsForPatient={(patient) => {
              setVitalsTargetPatient(patient);
              setIsAddVitalsOpen(true);
            }}
            onDischargePatient={handleDischargePatient}
          />
        )}
      </main>

      {/* Modals & Slide-overs */}
      {isAddVitalsOpen && vitalsTargetPatient && (
        <AddVitalsModal
          patient={vitalsTargetPatient}
          isOpen={isAddVitalsOpen}
          onClose={() => {
            setIsAddVitalsOpen(false);
            setVitalsTargetPatient(null);
          }}
          onSubmitVitals={handleAddVitals}
        />
      )}

      {isAddPatientOpen && (
        <AddPatientModal
          isOpen={isAddPatientOpen}
          onClose={() => setIsAddPatientOpen(false)}
          onAddPatient={handleAddPatient}
        />
      )}

      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onResolveAlert={handleResolveAlert}
        onSelectPatientById={handleSelectPatientById}
      />

      {isAIOpen && selectedPatient && (
        <AIClinicalModal
          patient={selectedPatient}
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
        />
      )}

      <ThresholdsModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
      />
    </div>
  );
}
