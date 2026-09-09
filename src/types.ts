export type PatientStatus = 'stable' | 'monitoring' | 'critical' | 'discharged';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type ConsciousnessLevel = 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';

export interface VitalSigns {
  id: string;
  patientId: string;
  timestamp: string;
  heartRate: number; // BPM (norm: 60-100)
  systolicBP: number; // mmHg (norm: 90-120)
  diastolicBP: number; // mmHg (norm: 60-80)
  spo2: number; // % (norm: 95-100)
  temperature: number; // °C (norm: 36.1 - 37.2)
  respiratoryRate: number; // breaths/min (norm: 12-20)
  bloodGlucose: number; // mg/dL (norm: 70-140)
  consciousness: ConsciousnessLevel;
  supplementalOxygen: boolean;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  ward: 'ICU' | 'Cardiac Care' | 'General Ward' | 'Emergency' | 'Post-Op';
  room: string;
  bed: string;
  doctor: string;
  diagnosis: string;
  status: PatientStatus;
  admissionDate: string;
  allergies: string[];
  notes?: string;
  news2Score: number;
  latestVitals?: VitalSigns;
  simulationActive?: boolean;
}

export interface HealthAlert {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  timestamp: string;
  type: 'HEART_RATE' | 'SPO2' | 'BLOOD_PRESSURE' | 'TEMPERATURE' | 'RESPIRATORY' | 'NEWS2_CRITICAL';
  severity: AlertSeverity;
  message: string;
  value: number | string;
  threshold: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ThresholdConfig {
  heartRate: { min: number; max: number };
  spo2: { min: number };
  bpSystolic: { min: number; max: number };
  bpDiastolic: { min: number; max: number };
  temperature: { min: number; max: number };
  respiratoryRate: { min: number; max: number };
  bloodGlucose: { min: number; max: number };
}

export interface NEWS2Score {
  total: number;
  riskCategory: 'Low' | 'Low-Medium' | 'Medium' | 'High';
  clinicalResponse: string;
  components: {
    respiratoryRateScore: number;
    spo2Score: number;
    supplementalOxygenScore: number;
    systolicBPScore: number;
    heartRateScore: number;
    consciousnessScore: number;
    temperatureScore: number;
  };
}

export interface WardAnalytics {
  totalPatients: number;
  stableCount: number;
  monitoringCount: number;
  criticalCount: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  bedOccupancyRate: number;
  averageHeartRate: number;
  averageSpO2: number;
}

export interface AIClinicalAssessment {
  patientId: string;
  timestamp: string;
  overallCondition: string;
  riskLevel: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  keyObservations: string[];
  recommendedActions: string[];
  monitoringFrequency: string;
  rationale: string;
}
