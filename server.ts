import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Patient, VitalSigns, HealthAlert, WardAnalytics, AIClinicalAssessment, ThresholdConfig } from './src/types';
import { calculateNEWS2, evaluateVitalAlerts, DEFAULT_THRESHOLDS } from './src/utils/clinicalCalculations';

const PORT = 3000;

// In-Memory Data Store
let thresholdConfig: ThresholdConfig = { ...DEFAULT_THRESHOLDS };

let patients: Patient[] = [
  {
    id: 'p-101',
    mrn: 'MRN-88492',
    name: 'Eleanor Vance',
    age: 68,
    gender: 'Female',
    bloodType: 'A+',
    ward: 'ICU',
    room: 'ICU-02',
    bed: 'Bed 2A',
    doctor: 'Dr. Sarah Chen, MD (Intensivist)',
    diagnosis: 'Acute Respiratory Distress Syndrome (ARDS) / Post-Op Sepsis',
    status: 'critical',
    admissionDate: '2026-09-07T14:30:00.000Z',
    allergies: ['Penicillin', 'Sulfa drugs'],
    notes: 'Requires high-flow O2. Continuous arterial line and ECG monitoring. Flagged for sepsis protocol.',
    news2Score: 8,
    simulationActive: true,
  },
  {
    id: 'p-102',
    mrn: 'MRN-77319',
    name: 'Marcus Holloway',
    age: 54,
    gender: 'Male',
    bloodType: 'O+',
    ward: 'Cardiac Care',
    room: 'CCU-05',
    bed: 'Bed 5B',
    doctor: 'Dr. Robert Martinez, FACC',
    diagnosis: 'Non-ST Elevation Myocardial Infarction (NSTEMI) post-PCI',
    status: 'monitoring',
    admissionDate: '2026-09-08T09:15:00.000Z',
    allergies: ['Latex'],
    notes: 'Dual antiplatelet therapy. Monitor for recurrent ischemic episodes and arrhythmias.',
    news2Score: 4,
    simulationActive: true,
  },
  {
    id: 'p-103',
    mrn: 'MRN-91204',
    name: 'Sophia Takahashi',
    age: 32,
    gender: 'Female',
    bloodType: 'B+',
    ward: 'General Ward',
    room: 'GW-312',
    bed: 'Bed 1',
    doctor: 'Dr. Emily Watson, MD',
    diagnosis: 'Complicated Pyelonephritis resolving on IV Ceftriaxone',
    status: 'stable',
    admissionDate: '2026-09-06T18:00:00.000Z',
    allergies: ['None known'],
    notes: 'Afebrile for 24h. Tolerating oral fluids. Preparing for step-down to oral antibiotics.',
    news2Score: 1,
    simulationActive: false,
  },
  {
    id: 'p-104',
    mrn: 'MRN-65821',
    name: 'Arthur Pendelton',
    age: 79,
    gender: 'Male',
    bloodType: 'AB-',
    ward: 'Emergency',
    room: 'ER-Bay 04',
    bed: 'Bed 4',
    doctor: 'Dr. David Kim, FACEP',
    diagnosis: 'Acute Exacerbation of COPD with hypercapnic respiratory failure',
    status: 'monitoring',
    admissionDate: '2026-09-09T06:45:00.000Z',
    allergies: ['Aspirin', 'Codeine'],
    notes: 'On BiPAP support 12/6. Serial arterial blood gases scheduled every 4 hours.',
    news2Score: 5,
    simulationActive: true,
  },
  {
    id: 'p-105',
    mrn: 'MRN-54129',
    name: 'Clara Oswald-Davies',
    age: 42,
    gender: 'Female',
    bloodType: 'O-',
    ward: 'Post-Op',
    room: 'PACU-08',
    bed: 'Bed 8',
    doctor: 'Dr. Linda Ross, MD',
    diagnosis: 'Post-Laparoscopic Cholecystectomy - Day 1 Recovery',
    status: 'stable',
    admissionDate: '2026-09-08T16:20:00.000Z',
    allergies: ['Morphine (mild nausea)'],
    notes: 'Pain well managed on PCA. Ambulated once with assistance. Clear liquid diet.',
    news2Score: 0,
    simulationActive: false,
  },
];

// Seed Historical Vitals per Patient
const vitalsHistory: Record<string, VitalSigns[]> = {};

function generateInitialHistory(patientId: string, baseHr: number, baseSys: number, baseDia: number, baseSpo2: number, baseTemp: number, baseResp: number, baseGlucose: number): VitalSigns[] {
  const history: VitalSigns[] = [];
  const now = Date.now();
  for (let i = 15; i >= 0; i--) {
    const timestamp = new Date(now - i * 6 * 60 * 1000).toISOString(); // every 6 minutes
    const jitter = () => (Math.random() - 0.5);
    const hr = Math.round(baseHr + jitter() * 6);
    const sys = Math.round(baseSys + jitter() * 8);
    const dia = Math.round(baseDia + jitter() * 6);
    const spo2 = Math.min(100, Math.round(baseSpo2 + jitter() * 2));
    const temp = Math.round((baseTemp + jitter() * 0.3) * 10) / 10;
    const resp = Math.round(baseResp + jitter() * 2);
    const glucose = Math.round(baseGlucose + jitter() * 8);

    const vital: VitalSigns = {
      id: `v-${patientId}-${i}`,
      patientId,
      timestamp,
      heartRate: hr,
      systolicBP: sys,
      diastolicBP: dia,
      spo2,
      temperature: temp,
      respiratoryRate: resp,
      bloodGlucose: glucose,
      consciousness: patientId === 'p-101' ? 'Voice' : 'Alert',
      supplementalOxygen: patientId === 'p-101' || patientId === 'p-104',
    };
    history.push(vital);
  }
  return history;
}

vitalsHistory['p-101'] = generateInitialHistory('p-101', 118, 92, 58, 91, 38.6, 26, 178);
vitalsHistory['p-102'] = generateInitialHistory('p-102', 84, 138, 86, 97, 36.8, 16, 122);
vitalsHistory['p-103'] = generateInitialHistory('p-103', 72, 116, 74, 99, 37.0, 14, 98);
vitalsHistory['p-104'] = generateInitialHistory('p-104', 98, 142, 88, 93, 37.4, 22, 145);
vitalsHistory['p-105'] = generateInitialHistory('p-105', 68, 118, 76, 98, 36.6, 13, 94);

// Attach latest vitals and compute scores
patients.forEach(p => {
  const history = vitalsHistory[p.id];
  if (history && history.length > 0) {
    p.latestVitals = history[history.length - 1];
    p.news2Score = calculateNEWS2(p.latestVitals).total;
  }
});

let alerts: HealthAlert[] = [
  {
    id: 'alert-init-1',
    patientId: 'p-101',
    patientName: 'Eleanor Vance',
    bed: 'Bed 2A (ICU)',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    type: 'NEWS2_CRITICAL',
    severity: 'critical',
    message: 'Critical NEWS2 Score: 8 (ARDS Protocol triggered)',
    value: 'Score: 8',
    threshold: '< 5 points',
    status: 'active',
  },
  {
    id: 'alert-init-2',
    patientId: 'p-101',
    patientName: 'Eleanor Vance',
    bed: 'Bed 2A (ICU)',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'SPO2',
    severity: 'critical',
    message: 'Hypoxemia alert: SpO2 dropped to 91% on 4L nasal cannula',
    value: '91%',
    threshold: '≥ 92%',
    status: 'active',
  },
  {
    id: 'alert-init-3',
    patientId: 'p-104',
    patientName: 'Arthur Pendelton',
    bed: 'Bed 4 (ER)',
    timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    type: 'RESPIRATORY',
    severity: 'warning',
    message: 'Tachypnea alert: Respiratory rate elevated to 24 rpm',
    value: '24 rpm',
    threshold: '10-22 rpm',
    status: 'acknowledged',
    acknowledgedBy: 'Nurse R. Jenkins, RN',
    acknowledgedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // API ROUTES ---------------------------------------------------------------

  // 1. Health & Server Status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      system: 'Clinical Health Monitoring Telemetry Engine',
      timestamp: new Date().toISOString(),
      activePatients: patients.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
    });
  });

  // 2. Patients List
  app.get('/api/patients', (req: Request, res: Response) => {
    const { status, ward, search } = req.query;
    let filtered = [...patients];

    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }
    if (ward && typeof ward === 'string' && ward !== 'all') {
      filtered = filtered.filter(p => p.ward === ward);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.bed.toLowerCase().includes(q) ||
          p.diagnosis.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  // 3. Single Patient by ID
  app.get('/api/patients/:id', (req: Request, res: Response) => {
    const patient = patients.find(p => p.id === req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({
      ...patient,
      vitalsHistory: vitalsHistory[patient.id] || [],
    });
  });

  // 4. Create / Admit New Patient
  app.post('/api/patients', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.name || !body.age || !body.bed) {
      return res.status(400).json({ error: 'Name, age, and bed are required fields.' });
    }

    const newId = `p-${Date.now()}`;
    const newMrn = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const initialVitals: VitalSigns = {
      id: `v-${newId}-0`,
      patientId: newId,
      timestamp: new Date().toISOString(),
      heartRate: Number(body.heartRate) || 72,
      systolicBP: Number(body.systolicBP) || 120,
      diastolicBP: Number(body.diastolicBP) || 80,
      spo2: Number(body.spo2) || 98,
      temperature: Number(body.temperature) || 36.8,
      respiratoryRate: Number(body.respiratoryRate) || 16,
      bloodGlucose: Number(body.bloodGlucose) || 105,
      consciousness: body.consciousness || 'Alert',
      supplementalOxygen: Boolean(body.supplementalOxygen),
    };

    const news2 = calculateNEWS2(initialVitals);

    const newPatient: Patient = {
      id: newId,
      mrn: newMrn,
      name: body.name,
      age: Number(body.age),
      gender: body.gender || 'Other',
      bloodType: body.bloodType || 'O+',
      ward: body.ward || 'General Ward',
      room: body.room || 'GW-101',
      bed: body.bed,
      doctor: body.doctor || 'Attending Physician',
      diagnosis: body.diagnosis || 'Observation & Telemetry Monitoring',
      status: news2.total >= 7 ? 'critical' : news2.total >= 5 ? 'monitoring' : 'stable',
      admissionDate: new Date().toISOString(),
      allergies: Array.isArray(body.allergies) ? body.allergies : ['None reported'],
      notes: body.notes || 'Admitted for continuous vitals monitoring.',
      news2Score: news2.total,
      latestVitals: initialVitals,
      simulationActive: true,
    };

    patients.unshift(newPatient);
    vitalsHistory[newId] = [initialVitals];

    // Check for initial alerts
    const detectedAlerts = evaluateVitalAlerts(newId, newPatient.name, newPatient.bed, initialVitals, thresholdConfig);
    if (detectedAlerts.length > 0) {
      alerts.unshift(...detectedAlerts);
    }

    res.status(201).json(newPatient);
  });

  // 5. Update Patient
  app.put('/api/patients/:id', (req: Request, res: Response) => {
    const index = patients.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patients[index] = {
      ...patients[index],
      ...req.body,
      id: patients[index].id, // protect ID
    };

    res.json(patients[index]);
  });

  // 6. Discharge / Delete Patient
  app.delete('/api/patients/:id', (req: Request, res: Response) => {
    const index = patients.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const removed = patients.splice(index, 1)[0];
    delete vitalsHistory[removed.id];
    // Archive or remove associated alerts
    alerts = alerts.filter(a => a.patientId !== removed.id);

    res.json({ message: 'Patient discharged successfully', patient: removed });
  });

  // 7. Get Vitals History for Patient
  app.get('/api/patients/:id/vitals', (req: Request, res: Response) => {
    const patientHistory = vitalsHistory[req.params.id] || [];
    res.json(patientHistory);
  });

  // 8. Log New Vitals Reading
  app.post('/api/patients/:id/vitals', (req: Request, res: Response) => {
    const patient = patients.find(p => p.id === req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const body = req.body;
    const newVital: VitalSigns = {
      id: `v-${patient.id}-${Date.now()}`,
      patientId: patient.id,
      timestamp: body.timestamp || new Date().toISOString(),
      heartRate: Number(body.heartRate),
      systolicBP: Number(body.systolicBP),
      diastolicBP: Number(body.diastolicBP),
      spo2: Number(body.spo2),
      temperature: Number(body.temperature),
      respiratoryRate: Number(body.respiratoryRate),
      bloodGlucose: Number(body.bloodGlucose),
      consciousness: body.consciousness || 'Alert',
      supplementalOxygen: Boolean(body.supplementalOxygen),
    };

    if (!vitalsHistory[patient.id]) {
      vitalsHistory[patient.id] = [];
    }
    vitalsHistory[patient.id].push(newVital);
    // Keep max 50 points in memory per patient
    if (vitalsHistory[patient.id].length > 50) {
      vitalsHistory[patient.id].shift();
    }

    const news2 = calculateNEWS2(newVital);
    patient.latestVitals = newVital;
    patient.news2Score = news2.total;

    // Auto update status if vitals become critical
    if (news2.total >= 7 && patient.status !== 'critical') {
      patient.status = 'critical';
    } else if (news2.total >= 5 && patient.status === 'stable') {
      patient.status = 'monitoring';
    }

    // Run alert rules
    const newAlerts = evaluateVitalAlerts(patient.id, patient.name, patient.bed, newVital, thresholdConfig);
    if (newAlerts.length > 0) {
      alerts.unshift(...newAlerts);
    }

    res.status(201).json({
      vital: newVital,
      news2,
      alerts: newAlerts,
      patientStatus: patient.status,
    });
  });

  // 9. Alerts List
  app.get('/api/alerts', (req: Request, res: Response) => {
    const { status, severity, patientId } = req.query;
    let filtered = [...alerts];

    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter(a => a.status === status);
    }
    if (severity && typeof severity === 'string' && severity !== 'all') {
      filtered = filtered.filter(a => a.severity === severity);
    }
    if (patientId && typeof patientId === 'string') {
      filtered = filtered.filter(a => a.patientId === patientId);
    }

    res.json(filtered);
  });

  // 10. Acknowledge Alert
  app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
    const alert = alerts.find(a => a.id === req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = req.body.acknowledgedBy || 'Medical Staff';
    alert.acknowledgedAt = new Date().toISOString();

    res.json(alert);
  });

  // 11. Resolve Alert
  app.post('/api/alerts/:id/resolve', (req: Request, res: Response) => {
    const alert = alerts.find(a => a.id === req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionNote = req.body.notes || 'Vitals stabilized and assessed by nursing team.';

    res.json(alert);
  });

  // 12. Thresholds Configuration
  app.get('/api/thresholds', (req: Request, res: Response) => {
    res.json(thresholdConfig);
  });

  app.put('/api/thresholds', (req: Request, res: Response) => {
    thresholdConfig = { ...thresholdConfig, ...req.body };
    res.json({ message: 'Thresholds updated successfully', thresholds: thresholdConfig });
  });

  // 13. Ward Analytics & Metrics Summary
  app.get('/api/analytics/summary', (req: Request, res: Response) => {
    const totalPatients = patients.length;
    const stableCount = patients.filter(p => p.status === 'stable').length;
    const monitoringCount = patients.filter(p => p.status === 'monitoring').length;
    const criticalCount = patients.filter(p => p.status === 'critical').length;
    const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
    const criticalAlertsCount = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;

    let totalHr = 0;
    let totalSpo2 = 0;
    let countedVitals = 0;

    patients.forEach(p => {
      if (p.latestVitals) {
        totalHr += p.latestVitals.heartRate;
        totalSpo2 += p.latestVitals.spo2;
        countedVitals++;
      }
    });

    const averageHeartRate = countedVitals > 0 ? Math.round(totalHr / countedVitals) : 75;
    const averageSpO2 = countedVitals > 0 ? Math.round(totalSpo2 / countedVitals) : 97;

    const summary: WardAnalytics = {
      totalPatients,
      stableCount,
      monitoringCount,
      criticalCount,
      activeAlertsCount,
      criticalAlertsCount,
      bedOccupancyRate: Math.min(100, Math.round((totalPatients / 10) * 100)), // based on 10 bed capacity
      averageHeartRate,
      averageSpO2,
    };

    res.json(summary);
  });

  // 14. Server-Side Gemini AI Clinical Assessment
  app.post('/api/ai/clinical-summary', async (req: Request, res: Response) => {
    const { patientId } = req.body;
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const history = vitalsHistory[patient.id] || [];
    const latest = patient.latestVitals || (history.length > 0 ? history[history.length - 1] : null);
    const recentAlerts = alerts.filter(a => a.patientId === patient.id).slice(0, 5);

    // If no API key or failure, provide rich deterministic clinical heuristic assessment
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallbackAnalysis = generateClinicalHeuristic(patient, latest, history, recentAlerts);
      return res.json(fallbackAnalysis);
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a clinical decision support system for a hospital Health Monitoring System.
Analyze the following patient's telemetry and vital signs trend:
- Patient: ${patient.name}, ${patient.age}y ${patient.gender}
- Diagnosis: ${patient.diagnosis}
- Ward: ${patient.ward}, Bed: ${patient.bed}
- Status: ${patient.status}
- NEWS2 Score: ${patient.news2Score}
- Latest Vitals: HR: ${latest?.heartRate} bpm, BP: ${latest?.systolicBP}/${latest?.diastolicBP} mmHg, SpO2: ${latest?.spo2}%, Temp: ${latest?.temperature}°C, Resp Rate: ${latest?.respiratoryRate} bpm, Glucose: ${latest?.bloodGlucose} mg/dL, Consciousness: ${latest?.consciousness}, Supplemental O2: ${latest?.supplementalOxygen}
- Recent Alerts: ${recentAlerts.map(a => a.message).join('; ') || 'None'}
- Recent Trend: ${history.slice(-5).map(v => `[HR: ${v.heartRate}, SpO2: ${v.spo2}%, BP: ${v.systolicBP}/${v.diastolicBP}]`).join(' -> ')}

Provide a concise, professional clinical assessment in strictly valid JSON format matching this schema:
{
  "overallCondition": "Concise summary sentence of clinical status",
  "riskLevel": "Low" | "Moderate" | "Severe" | "Critical",
  "keyObservations": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "recommendedActions": ["action 1", "action 2", "action 3"],
  "monitoringFrequency": "e.g. Continuous / Every 15 mins / Every 1 hour",
  "rationale": "Clinical reasoning based on hemodynamics and physiology"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const assessment: AIClinicalAssessment = {
        patientId: patient.id,
        timestamp: new Date().toISOString(),
        overallCondition: parsed.overallCondition || 'Patient stable under ongoing monitoring.',
        riskLevel: parsed.riskLevel || (patient.status === 'critical' ? 'Critical' : patient.status === 'monitoring' ? 'Moderate' : 'Low'),
        keyObservations: parsed.keyObservations || ['Vital signs within anticipated clinical parameters.'],
        recommendedActions: parsed.recommendedActions || ['Continue telemetry surveillance.'],
        monitoringFrequency: parsed.monitoringFrequency || 'Routine 4-hour cycle.',
        rationale: parsed.rationale || 'Telemetry metrics reflect current clinical baseline.',
      };

      return res.json(assessment);
    } catch (err) {
      console.warn('Gemini API call failed, reverting to clinical heuristic:', err);
      const fallbackAnalysis = generateClinicalHeuristic(patient, latest, history, recentAlerts);
      return res.json(fallbackAnalysis);
    }
  });

  // 15. Simulation Telemetry Tick (Simulates IoT Bedside monitors pushing live telemetry)
  app.post('/api/simulation/tick', (req: Request, res: Response) => {
    const updatedCount: string[] = [];
    const createdAlerts: HealthAlert[] = [];

    patients.forEach(patient => {
      if (!patient.simulationActive || patient.status === 'discharged') return;

      const current = patient.latestVitals;
      if (!current) return;

      // Realistic physiological drift
      const deltaHr = Math.round((Math.random() - 0.48) * 3);
      const deltaSys = Math.round((Math.random() - 0.48) * 4);
      const deltaDia = Math.round((Math.random() - 0.48) * 3);
      const deltaSpo2 = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const deltaTemp = Math.round((Math.random() - 0.5) * 0.1 * 10) / 10;
      const deltaResp = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;

      const newVital: VitalSigns = {
        id: `v-${patient.id}-${Date.now()}`,
        patientId: patient.id,
        timestamp: new Date().toISOString(),
        heartRate: Math.max(40, Math.min(180, current.heartRate + deltaHr)),
        systolicBP: Math.max(70, Math.min(210, current.systolicBP + deltaSys)),
        diastolicBP: Math.max(40, Math.min(130, current.diastolicBP + deltaDia)),
        spo2: Math.max(82, Math.min(100, current.spo2 + deltaSpo2)),
        temperature: Math.round((current.temperature + deltaTemp) * 10) / 10,
        respiratoryRate: Math.max(8, Math.min(36, current.respiratoryRate + deltaResp)),
        bloodGlucose: current.bloodGlucose,
        consciousness: current.consciousness,
        supplementalOxygen: current.supplementalOxygen,
      };

      if (!vitalsHistory[patient.id]) vitalsHistory[patient.id] = [];
      vitalsHistory[patient.id].push(newVital);
      if (vitalsHistory[patient.id].length > 40) vitalsHistory[patient.id].shift();

      patient.latestVitals = newVital;
      patient.news2Score = calculateNEWS2(newVital).total;

      const newAlerts = evaluateVitalAlerts(patient.id, patient.name, patient.bed, newVital, thresholdConfig);
      // Avoid duplicate alert flooding within 2 minutes
      newAlerts.forEach(na => {
        const existing = alerts.find(a => a.patientId === na.patientId && a.type === na.type && a.status === 'active');
        if (!existing) {
          alerts.unshift(na);
          createdAlerts.push(na);
        }
      });

      updatedCount.push(patient.id);
    });

    res.json({
      success: true,
      updatedPatientIds: updatedCount,
      newAlertsCount: createdAlerts.length,
      timestamp: new Date().toISOString(),
    });
  });

  // VITE MIDDLEWARE (Development) vs STATIC ASSETS (Production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Health Monitoring System Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateClinicalHeuristic(patient: Patient, latest: VitalSigns | null, history: VitalSigns[], recentAlerts: HealthAlert[]): AIClinicalAssessment {
  const news2 = latest ? calculateNEWS2(latest) : { total: 0, riskCategory: 'Low', clinicalResponse: '' };
  let riskLevel: 'Low' | 'Moderate' | 'Severe' | 'Critical' = 'Low';
  const keyObservations: string[] = [];
  const recommendedActions: string[] = [];

  if (news2.total >= 7 || patient.status === 'critical') {
    riskLevel = 'Critical';
    keyObservations.push(`Acute physiological deterioration (NEWS2 = ${news2.total}).`);
    if (latest && latest.spo2 < 92) keyObservations.push(`Hypoxemic distress: SpO2 at ${latest.spo2}%.`);
    if (latest && latest.heartRate > 115) keyObservations.push(`Marked tachycardia: Heart rate ${latest.heartRate} bpm.`);
    recommendedActions.push('Immediate critical care / Medical Emergency Team bedside review.');
    recommendedActions.push('Titrate oxygen to target SpO2 94-98% (or 88-92% for chronic hypercapnia).');
    recommendedActions.push('Ensure patent wide-bore IV access and arterial line blood gas check.');
  } else if (news2.total >= 5 || patient.status === 'monitoring') {
    riskLevel = 'Moderate';
    keyObservations.push(`Hemodynamic instability noted (NEWS2 = ${news2.total}).`);
    if (latest && latest.systolicBP > 150) keyObservations.push(`Elevated systolic afterload: ${latest.systolicBP} mmHg.`);
    recommendedActions.push('Increase vitals monitoring interval to every 30-60 minutes.');
    recommendedActions.push('Review fluid balance and recent medication administration.');
    recommendedActions.push('Notify on-call ward registrar.');
  } else {
    riskLevel = 'Low';
    keyObservations.push('Patient vitals are currently within stable therapeutic windows.');
    keyObservations.push(`Normocardic (HR ${latest?.heartRate || 72} bpm) with adequate oxygenation (${latest?.spo2 || 98}%).`);
    recommendedActions.push('Maintain routine scheduled ward observations.');
    recommendedActions.push('Support oral hydration and standard nursing care plan.');
  }

  return {
    patientId: patient.id,
    timestamp: new Date().toISOString(),
    overallCondition: `${patient.name} exhibits ${riskLevel.toLowerCase()} clinical risk profile under diagnosis of ${patient.diagnosis}.`,
    riskLevel,
    keyObservations,
    recommendedActions,
    monitoringFrequency: riskLevel === 'Critical' ? 'Continuous telemetry' : riskLevel === 'Moderate' ? 'Every 30 to 60 minutes' : 'Every 4 to 6 hours',
    rationale: `Telemetry assessment synthesized from real-time vitals, trend deltas, and ${recentAlerts.length} active clinical alert triggers.`,
  };
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
