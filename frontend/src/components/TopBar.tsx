import React from 'react';
import { useStudioStore } from '../state/useStudioStore';
import { Camera, Eye, Download, Settings, RefreshCw, Zap } from 'lucide-react';

interface TopBarProps {
  onSavePNG: () => void;
  onOpenCalibration: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSavePNG, onOpenCalibration }) => {
  const {
    fps,
    latency,
    handsDetectedCount,
    fingertipsCount,
    cameraConnected,
    cameraError,
    debugMode,
    updateConfig,
    resetConfig,
  } = useStudioStore();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-slate-950/70 backdrop-blur-md border-b border-cyan-500/20 text-white select-none shadow-lg shadow-cyan-950/30">
      {/* Studio Branding */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-600 shadow-md shadow-cyan-500/30 animate-pulse">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-fuchsia-400 font-mono">
            HAND MOTION LIGHT STUDIO
          </h1>
          <p className="text-[10px] text-cyan-400/70 tracking-wider">REAL-TIME WEBCAM VISION & WEBGL ART</p>
        </div>
      </div>

      {/* Real-Time Metrics HUD */}
      <div className="flex items-center space-x-6 text-xs font-mono">
        {/* Camera Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
          <Camera className={`w-3.5 h-3.5 ${cameraConnected ? 'text-emerald-400' : 'text-rose-500'}`} />
          <span className="text-slate-300">
            {cameraConnected ? 'CONNECTED' : cameraError ? 'ERROR' : 'INITIALIZING'}
          </span>
        </div>

        {/* Hands Metric */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400">HANDS:</span>
          <span className="text-cyan-300 font-bold">{handsDetectedCount} / 2</span>
        </div>

        {/* Fingertips Metric */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400">FINGERS:</span>
          <span className="text-fuchsia-300 font-bold">{fingertipsCount} / 10</span>
        </div>

        {/* FPS Counter */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400">FPS:</span>
          <span className={`font-bold ${fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
            {fps}
          </span>
        </div>

        {/* Latency */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400">LATENCY:</span>
          <span className="text-cyan-300 font-bold">{latency}ms</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        {/* Debug Toggle */}
        <button
          onClick={() => updateConfig({ debugMode: !debugMode })}
          title="Toggle Developer Debug HUD"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            debugMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/30'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DEBUG</span>
        </button>

        {/* Calibration Modal Trigger */}
        <button
          onClick={onOpenCalibration}
          title="Calibration & Threshold Settings"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-white"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">CALIBRATE</span>
        </button>

        {/* Save PNG Button */}
        <button
          onClick={onSavePNG}
          title="Export High-Resolution PNG Snapshot"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white hover:brightness-110 shadow-md shadow-cyan-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>SAVE PNG</span>
        </button>

        {/* Reset Settings Button */}
        <button
          onClick={resetConfig}
          title="Reset to Factory Defaults"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
