import React, { useEffect, useRef } from 'react';
import { medicalAudio } from '../utils/audioAlert';

interface EcgCanvasProps {
  heartRate: number;
  spo2: number;
  isAudioEnabled?: boolean;
}

export const EcgCanvas: React.FC<EcgCanvasProps> = ({ heartRate, spo2, isAudioEnabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Keep live references for the 60fps render loop
  const hrRef = useRef(heartRate);
  const spo2Ref = useRef(spo2);
  const audioEnabledRef = useRef(isAudioEnabled);

  useEffect(() => {
    hrRef.current = heartRate;
  }, [heartRate]);

  useEffect(() => {
    spo2Ref.current = spo2;
  }, [spo2]);

  useEffect(() => {
    audioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = containerRef.current?.clientWidth || 700);
    let height = (canvas.height = 160);

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      width = canvas.width = containerRef.current.clientWidth;
      height = canvas.height = 160;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    // Waveform state
    let xPos = 0;
    const speed = 2.2; // pixels per frame (sweep speed ~ 25mm/s)
    let cyclePhase = 0;
    let lastRWaveTrigger = 0;

    // Buffer of previous values to draw continuous line
    let prevY_ECG = height * 0.28;
    let prevY_PLETH = height * 0.75;

    // Physiological ECG generator for Lead II
    // Phase 0..1 in a cardiac cycle
    function getEcgY(phase: number, baselineY: number, amplitude: number): number {
      let offset = 0;
      if (phase >= 0.05 && phase < 0.15) {
        // P Wave
        const p = (phase - 0.05) / 0.1;
        offset = -Math.sin(p * Math.PI) * (amplitude * 0.2);
      } else if (phase >= 0.20 && phase < 0.23) {
        // Q Dip
        const q = (phase - 0.20) / 0.03;
        offset = Math.sin(q * Math.PI) * (amplitude * 0.15);
      } else if (phase >= 0.23 && phase < 0.28) {
        // R Spike
        const r = (phase - 0.23) / 0.05;
        offset = -Math.sin(r * Math.PI) * (amplitude * 1.3);
      } else if (phase >= 0.28 && phase < 0.32) {
        // S Trough
        const s = (phase - 0.28) / 0.04;
        offset = Math.sin(s * Math.PI) * (amplitude * 0.35);
      } else if (phase >= 0.40 && phase < 0.58) {
        // T Wave
        const t = (phase - 0.40) / 0.18;
        offset = -Math.sin(t * Math.PI) * (amplitude * 0.35);
      } else {
        // Isoelectric baseline with tiny micro-jitter
        offset = (Math.random() - 0.5) * 0.8;
      }
      return baselineY + offset;
    }

    // PPG / Plethysmograph generator
    function getPlethY(phase: number, baselineY: number, amplitude: number): number {
      let offset = 0;
      if (phase >= 0.25 && phase < 0.55) {
        // Systolic upstroke & primary pulse peak
        const p = (phase - 0.25) / 0.30;
        offset = -Math.sin(p * Math.PI) * amplitude;
      } else if (phase >= 0.55 && phase < 0.75) {
        // Dicrotic notch and secondary reflection
        const d = (phase - 0.55) / 0.20;
        offset = -Math.sin(d * Math.PI) * (amplitude * 0.38) - amplitude * 0.15;
      } else {
        offset = (Math.random() - 0.5) * 0.5;
      }
      return baselineY + offset;
    }

    // Initial grid render
    function drawGrid() {
      if (!ctx) return;
      ctx.fillStyle = '#0a1016';
      ctx.fillRect(0, 0, width, height);

      // Faint medical grid
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.07)';
      const step = 16;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Divider line between Lead II and Pleth
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.54);
      ctx.lineTo(width, height * 0.54);
      ctx.stroke();
    }

    drawGrid();

    const render = () => {
      if (!ctx) return;

      const currentHr = Math.max(40, Math.min(180, hrRef.current || 75));
      // Frequency: cardiac cycle duration in seconds = 60 / currentHr
      // In 60 FPS, frames per beat = (60 / currentHr) * 60
      const framesPerBeat = (3600 / currentHr);
      const phaseDelta = 1 / framesPerBeat;

      // Clear small erase bar ahead of current sweep cursor
      const eraseWidth = speed * 8;
      ctx.fillStyle = '#0a1016';
      ctx.fillRect(xPos, 0, eraseWidth, height);

      // Redraw faint grid in erased column
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.07)';
      const step = 16;
      const startGridX = Math.floor(xPos / step) * step;
      for (let gx = startGridX; gx < xPos + eraseWidth; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += step) {
        ctx.beginPath();
        ctx.moveTo(xPos, gy);
        ctx.lineTo(xPos + eraseWidth, gy);
        ctx.stroke();
      }
      // Redraw divider in erased region
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(xPos, height * 0.54);
      ctx.lineTo(xPos + eraseWidth, height * 0.54);
      ctx.stroke();

      const nextX = xPos + speed;

      // Calculate Lead II point
      const ecgY = getEcgY(cyclePhase, height * 0.28, height * 0.18);
      // Calculate Pleth point
      const plethY = getPlethY(cyclePhase, height * 0.80, height * 0.16);

      // Check R-Wave trigger for sound beep
      if (cyclePhase >= 0.24 && cyclePhase <= 0.27 && Date.now() - lastRWaveTrigger > (55000 / currentHr)) {
        lastRWaveTrigger = Date.now();
        if (audioEnabledRef.current) {
          medicalAudio.playHeartbeat(850 + (spo2Ref.current - 90) * 20);
        }
      }

      // Draw ECG (Phosphor Green #10b981)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.moveTo(xPos, prevY_ECG);
      ctx.lineTo(nextX, ecgY);
      ctx.stroke();

      // Draw Pleth / SpO2 (Cyan #06b6d4)
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.moveTo(xPos, prevY_PLETH);
      ctx.lineTo(nextX, plethY);
      ctx.stroke();

      // Draw vertical sweep bar glowing indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(nextX, 0, 1.5, height);

      prevY_ECG = ecgY;
      prevY_PLETH = plethY;

      xPos = nextX;
      if (xPos >= width) {
        xPos = 0;
        prevY_ECG = height * 0.28;
        prevY_PLETH = height * 0.80;
      }

      cyclePhase = (cyclePhase + phaseDelta) % 1;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0a1016] shadow-inner">
      {/* Top telemetry tags */}
      <div className="absolute top-2 left-3 flex items-center gap-3 z-10 pointer-events-none select-none">
        <span className="text-xs font-mono font-semibold tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
          II • 25mm/s • 10mm/mV
        </span>
        <span className="text-xs font-mono text-emerald-400/80">
          FILTER: DIAGNOSTIC (0.05-150Hz)
        </span>
      </div>

      <div className="absolute top-[56%] left-3 flex items-center gap-3 z-10 pointer-events-none select-none">
        <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
          PLETH • SpO2 WAVEFORM
        </span>
      </div>

      <div className="absolute top-2 right-3 flex items-center gap-2 z-10 pointer-events-none select-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono font-medium text-emerald-400">LIVE LEAD ACQUISITION</span>
      </div>

      <canvas ref={canvasRef} className="w-full block" height={160} />
    </div>
  );
};
