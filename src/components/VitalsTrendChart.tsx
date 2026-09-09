import React, { useState } from 'react';
import { VitalSigns, ThresholdConfig } from '../types';

interface VitalsTrendChartProps {
  history: VitalSigns[];
  thresholds: ThresholdConfig;
}

type MetricKey = 'heartRate' | 'spo2' | 'bloodPressure' | 'temperature' | 'respiratoryRate';

export const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({ history, thresholds }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('heartRate');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; text: string; time: string } | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-sm">
        Insufficient telemetry history collected yet.
      </div>
    );
  }

  // Define metric details
  const metricConfigs = {
    heartRate: {
      label: 'Heart Rate',
      unit: 'BPM',
      color: '#10b981', // Emerald
      minSafe: thresholds.heartRate.min,
      maxSafe: thresholds.heartRate.max,
      yRange: [40, 160],
      getValue: (v: VitalSigns) => v.heartRate,
    },
    spo2: {
      label: 'Oxygen Saturation',
      unit: '%',
      color: '#06b6d4', // Cyan
      minSafe: thresholds.spo2.min,
      maxSafe: 100,
      yRange: [80, 100],
      getValue: (v: VitalSigns) => v.spo2,
    },
    bloodPressure: {
      label: 'Blood Pressure',
      unit: 'mmHg',
      color: '#f59e0b', // Amber
      colorSecondary: '#3b82f6', // Blue for diastolic
      minSafe: thresholds.bpSystolic.min,
      maxSafe: thresholds.bpSystolic.max,
      yRange: [50, 190],
      getValue: (v: VitalSigns) => v.systolicBP,
      getSecondaryValue: (v: VitalSigns) => v.diastolicBP,
    },
    temperature: {
      label: 'Body Temperature',
      unit: '°C',
      color: '#ec4899', // Pink
      minSafe: thresholds.temperature.min,
      maxSafe: thresholds.temperature.max,
      yRange: [34, 41],
      getValue: (v: VitalSigns) => v.temperature,
    },
    respiratoryRate: {
      label: 'Respiratory Rate',
      unit: 'rpm',
      color: '#8b5cf6', // Purple
      minSafe: thresholds.respiratoryRate.min,
      maxSafe: thresholds.respiratoryRate.max,
      yRange: [6, 32],
      getValue: (v: VitalSigns) => v.respiratoryRate,
    },
  };

  const currentCfg = metricConfigs[selectedMetric];
  const [yMin, yMax] = currentCfg.yRange;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const scaleX = (index: number) => {
    if (history.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (history.length - 1)) * chartWidth;
  };

  const scaleY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return paddingTop + (1 - ratio) * chartHeight;
  };

  // Safe normal zone band
  const safeTopY = scaleY(currentCfg.maxSafe);
  const safeBottomY = scaleY(currentCfg.minSafe);
  const safeHeight = Math.max(2, safeBottomY - safeTopY);

  // Generate primary path
  const points = history.map((v, i) => ({
    x: scaleX(i),
    y: scaleY(currentCfg.getValue(v)),
    value: currentCfg.getValue(v),
    time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  // Secondary path if Blood Pressure
  let secondaryPathD = '';
  let secondaryPoints: { x: number; y: number; value: number }[] = [];
  if (selectedMetric === 'bloodPressure') {
    secondaryPoints = history.map((v, i) => ({
      x: scaleX(i),
      y: scaleY(currentCfg.getSecondaryValue!(v)),
      value: currentCfg.getSecondaryValue!(v),
    }));
    secondaryPathD = secondaryPoints.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      ''
    );
  }

  // Y-axis grid ticks
  const yTicks = [
    yMin,
    Math.round(yMin + (yMax - yMin) * 0.33),
    Math.round(yMin + (yMax - yMin) * 0.66),
    yMax,
  ];

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          {(Object.keys(metricConfigs) as MetricKey[]).map((key) => {
            const isSelected = selectedMetric === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {metricConfigs[key].label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-emerald-500/20 border border-emerald-500/40 inline-block" />
            <span>Target Safe Range</span>
          </div>
          {selectedMetric === 'bloodPressure' && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Systolic
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Diastolic
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Safe Target Zone Background */}
          <rect
            x={paddingLeft}
            y={safeTopY}
            width={chartWidth}
            height={safeHeight}
            fill="rgba(16, 185, 129, 0.08)"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeDasharray="4 4"
          />

          {/* Grid lines & Y-axis labels */}
          {yTicks.map((tickVal) => {
            const y = scaleY(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {/* Secondary Line (Diastolic BP if applicable) */}
          {secondaryPathD && (
            <>
              <path
                d={secondaryPathD}
                fill="none"
                stroke={metricConfigs.bloodPressure.colorSecondary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {secondaryPoints.map((p, i) => (
                <circle
                  key={`sec-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill={metricConfigs.bloodPressure.colorSecondary}
                />
              ))}
            </>
          )}

          {/* Primary Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke={currentCfg.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Primary Data Points with Interactive Hover */}
          {points.map((p, i) => (
            <circle
              key={`pri-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={currentCfg.color}
              className="cursor-pointer transition-transform hover:scale-150"
              onMouseEnter={() =>
                setHoveredPoint({
                  x: p.x,
                  y: p.y,
                  text: `${p.value} ${currentCfg.unit}`,
                  time: p.time,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Time axis labels */}
          {history.length > 0 && (
            <>
              <text
                x={paddingLeft}
                y={svgHeight - 10}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {new Date(history[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </text>
              <text
                x={paddingLeft + chartWidth}
                y={svgHeight - 10}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {new Date(history[history.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </text>
            </>
          )}

          {/* Hover Tooltip inside SVG */}
          {hoveredPoint && (
            <g transform={`translate(${Math.min(svgWidth - 90, Math.max(60, hoveredPoint.x))}, ${Math.max(30, hoveredPoint.y - 30)})`}>
              <rect
                x="-45"
                y="-18"
                width="90"
                height="32"
                rx="6"
                fill="#020617"
                stroke="#334155"
                strokeWidth="1"
              />
              <text x="0" y="-3" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">
                {hoveredPoint.text}
              </text>
              <text x="0" y="9" textAnchor="middle" fill="#94a3b8" fontSize="9">
                {hoveredPoint.time}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
