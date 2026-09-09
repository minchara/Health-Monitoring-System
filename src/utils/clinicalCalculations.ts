import { VitalSigns, NEWS2Score, ThresholdConfig, HealthAlert, AlertSeverity } from '../types';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  heartRate: { min: 50, max: 120 },
  spo2: { min: 92 },
  bpSystolic: { min: 90, max: 160 },
  bpDiastolic: { min: 55, max: 95 },
  temperature: { min: 35.5, max: 38.5 },
  respiratoryRate: { min: 10, max: 24 },
  bloodGlucose: { min: 65, max: 180 },
};

export function calculateNEWS2(vitals: VitalSigns): NEWS2Score {
  let respScore = 0;
  if (vitals.respiratoryRate <= 8 || vitals.respiratoryRate >= 25) respScore = 3;
  else if (vitals.respiratoryRate >= 21 && vitals.respiratoryRate <= 24) respScore = 2;
  else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 11) respScore = 1;

  let spo2Score = 0;
  if (vitals.spo2 <= 91) spo2Score = 3;
  else if (vitals.spo2 >= 92 && vitals.spo2 <= 93) spo2Score = 2;
  else if (vitals.spo2 >= 94 && vitals.spo2 <= 95) spo2Score = 1;

  const oxygenScore = vitals.supplementalOxygen ? 2 : 0;

  let bpScore = 0;
  if (vitals.systolicBP <= 90 || vitals.systolicBP >= 220) bpScore = 3;
  else if (vitals.systolicBP >= 91 && vitals.systolicBP <= 100) bpScore = 2;
  else if (vitals.systolicBP >= 101 && vitals.systolicBP <= 110) bpScore = 1;

  let hrScore = 0;
  if (vitals.heartRate <= 40 || vitals.heartRate >= 131) hrScore = 3;
  else if (vitals.heartRate >= 111 && vitals.heartRate <= 130) hrScore = 2;
  else if ((vitals.heartRate >= 41 && vitals.heartRate <= 50) || (vitals.heartRate >= 91 && vitals.heartRate <= 110)) hrScore = 1;

  const consciousnessScore = vitals.consciousness === 'Alert' ? 0 : 3;

  let tempScore = 0;
  if (vitals.temperature <= 35.0) tempScore = 3;
  else if (vitals.temperature >= 39.1) tempScore = 2;
  else if (vitals.temperature >= 35.1 && vitals.temperature <= 36.0) tempScore = 1;
  else if (vitals.temperature >= 38.1 && vitals.temperature <= 39.0) tempScore = 1;

  const total = respScore + spo2Score + oxygenScore + bpScore + hrScore + consciousnessScore + tempScore;

  let riskCategory: 'Low' | 'Low-Medium' | 'Medium' | 'High' = 'Low';
  let clinicalResponse = 'Ward-based response; routine monitoring every 4-6 hours.';

  if (total >= 7) {
    riskCategory = 'High';
    clinicalResponse = 'Emergency assessment by critical care specialist or rapid response team. Continuous vitals monitoring.';
  } else if (total >= 5) {
    riskCategory = 'Medium';
    clinicalResponse = 'Urgent review by attending ward physician. Increase monitoring frequency to minimum 1 hour.';
  } else if (respScore === 3 || spo2Score === 3 || bpScore === 3 || hrScore === 3 || tempScore === 3 || consciousnessScore === 3) {
    riskCategory = 'Low-Medium';
    clinicalResponse = 'Urgent ward-based review by registered nurse to determine if medical escalation is needed.';
  }

  return {
    total,
    riskCategory,
    clinicalResponse,
    components: {
      respiratoryRateScore: respScore,
      spo2Score,
      supplementalOxygenScore: oxygenScore,
      systolicBPScore: bpScore,
      heartRateScore: hrScore,
      consciousnessScore,
      temperatureScore: tempScore,
    },
  };
}

export function calculateMAP(systolic: number, diastolic: number): number {
  return Math.round((2 * diastolic + systolic) / 3);
}

export function evaluateVitalAlerts(
  patientId: string,
  patientName: string,
  bed: string,
  vitals: VitalSigns,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const now = new Date().toISOString();

  // Heart Rate
  if (vitals.heartRate < thresholds.heartRate.min || vitals.heartRate > thresholds.heartRate.max) {
    const isCritical = vitals.heartRate < 45 || vitals.heartRate > 140;
    alerts.push({
      id: `alert-hr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      bed,
      timestamp: now,
      type: 'HEART_RATE',
      severity: isCritical ? 'critical' : 'warning',
      message: vitals.heartRate < thresholds.heartRate.min
        ? `Bradycardia detected: ${vitals.heartRate} BPM (Below ${thresholds.heartRate.min} BPM)`
        : `Tachycardia detected: ${vitals.heartRate} BPM (Above ${thresholds.heartRate.max} BPM)`,
      value: vitals.heartRate,
      threshold: `${thresholds.heartRate.min}-${thresholds.heartRate.max} BPM`,
      status: 'active',
    });
  }

  // SpO2
  if (vitals.spo2 < thresholds.spo2.min) {
    const isCritical = vitals.spo2 < 88;
    alerts.push({
      id: `alert-spo2-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      bed,
      timestamp: now,
      type: 'SPO2',
      severity: isCritical ? 'critical' : 'warning',
      message: `Hypoxia alert: SpO2 at ${vitals.spo2}% (Normal > ${thresholds.spo2.min}%)`,
      value: `${vitals.spo2}%`,
      threshold: `≥ ${thresholds.spo2.min}%`,
      status: 'active',
    });
  }

  // Blood Pressure
  if (vitals.systolicBP > thresholds.bpSystolic.max || vitals.systolicBP < thresholds.bpSystolic.min) {
    const isCritical = vitals.systolicBP > 180 || vitals.systolicBP < 80;
    alerts.push({
      id: `alert-bp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      bed,
      timestamp: now,
      type: 'BLOOD_PRESSURE',
      severity: isCritical ? 'critical' : 'warning',
      message: vitals.systolicBP > thresholds.bpSystolic.max
        ? `Hypertensive urgency: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`
        : `Hypotension detected: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`,
      value: `${vitals.systolicBP}/${vitals.diastolicBP}`,
      threshold: `${thresholds.bpSystolic.min}-${thresholds.bpSystolic.max} mmHg`,
      status: 'active',
    });
  }

  // Respiratory Rate
  if (vitals.respiratoryRate < thresholds.respiratoryRate.min || vitals.respiratoryRate > thresholds.respiratoryRate.max) {
    const isCritical = vitals.respiratoryRate < 8 || vitals.respiratoryRate >= 28;
    alerts.push({
      id: `alert-resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      bed,
      timestamp: now,
      type: 'RESPIRATORY',
      severity: isCritical ? 'critical' : 'warning',
      message: `Abnormal Respiratory Rate: ${vitals.respiratoryRate} rpm`,
      value: `${vitals.respiratoryRate} rpm`,
      threshold: `${thresholds.respiratoryRate.min}-${thresholds.respiratoryRate.max} rpm`,
      status: 'active',
    });
  }

  // Temperature
  if (vitals.temperature > thresholds.temperature.max || vitals.temperature < thresholds.temperature.min) {
    const isCritical = vitals.temperature > 39.5 || vitals.temperature < 34.5;
    alerts.push({
      id: `alert-temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      bed,
      timestamp: now,
      type: 'TEMPERATURE',
      severity: isCritical ? 'critical' : 'warning',
      message: vitals.temperature > thresholds.temperature.max
        ? `Pyrexia / High fever: ${vitals.temperature.toFixed(1)}°C`
        : `Hypothermia: ${vitals.temperature.toFixed(1)}°C`,
      value: `${vitals.temperature.toFixed(1)}°C`,
      threshold: `${thresholds.temperature.min}-${thresholds.temperature.max}°C`,
      status: 'active',
    });
  }

  // NEWS2 High score check
  const news2 = calculateNEWS2(vitals);
  if (news2.total >= 7) {
    alerts.push({
      id: `alert-news2-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      bed,
      timestamp: now,
      type: 'NEWS2_CRITICAL',
      severity: 'critical',
      message: `Critical Deterioration Risk: Total NEWS2 score = ${news2.total} (High Risk Category)`,
      value: `NEWS2: ${news2.total}`,
      threshold: '< 5 points',
      status: 'active',
    });
  }

  return alerts;
}
