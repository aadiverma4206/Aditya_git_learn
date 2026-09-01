import React from 'react';
import { useStudioStore } from '../state/useStudioStore';
import { X, Sliders, Save, RotateCcw } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ isOpen, onClose }) => {
  const config = useStudioStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 text-white shadow-2xl shadow-cyan-950/60 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold font-mono tracking-wider text-cyan-300 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-fuchsia-400" />
            MOTION & TRACKING CALIBRATION
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Body */}
        <div className="space-y-5 my-6 text-sm">
          {/* 1. One Euro Filter Cutoff */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-300">Min Cutoff Frequency (Jitter Reduction)</span>
              <span className="text-cyan-400 font-bold">{config.minCutoff.toFixed(2)} Hz</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={config.minCutoff}
              onChange={(e) => config.updateConfig({ minCutoff: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-500">Lower values reduce micro-jitter when hand is stationary.</p>
          </div>

          {/* 2. One Euro Filter Beta */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-300">Beta Speed Coefficient (Fast Response)</span>
              <span className="text-cyan-400 font-bold">{config.beta.toFixed(4)}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={config.beta}
              onChange={(e) => config.updateConfig({ beta: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-500">Higher values eliminate lag during fast hand movement.</p>
          </div>

          {/* 3. MediaPipe Detection Confidence */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-300">Detection Confidence Threshold</span>
              <span className="text-fuchsia-400 font-bold">{(config.minDetectionConfidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={config.minDetectionConfidence}
              onChange={(e) => config.updateConfig({ minDetectionConfidence: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
            />
          </div>

          {/* 4. Bloom Intensity */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-300">Bloom Glow Strength</span>
              <span className="text-cyan-400 font-bold">{config.bloomStrength.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={config.bloomStrength}
              onChange={(e) => config.updateConfig({ bloomStrength: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={config.resetConfig}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              config.saveConfigToLocalStorage();
              onClose();
            }}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" />
            <span>SAVE & APPLY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
