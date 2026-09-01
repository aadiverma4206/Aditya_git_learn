import React, { useState } from 'react';
import { useStudioStore } from '../state/useStudioStore';
import { VisualMode, GeometricShapeType } from '../types';
import { Sparkles, Activity, Layers, Palette, Box, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const config = useStudioStore();

  const visualModes: VisualMode[] = ['NORMAL', 'NEON', 'THERMAL', 'CYBER', 'HOLOGRAM', 'GLITCH'];
  const shapeTypes: { id: GeometricShapeType; label: string }[] = [
    { id: 'PRISM', label: 'Prism' },
    { id: 'HOLOGRAM_PANEL', label: 'Hologram Panel' },
    { id: 'CUBE', label: 'Cube' },
    { id: 'RING', label: 'Torus Ring' },
    { id: 'TRIANGLE', label: 'Triangle' },
    { id: 'CIRCLE', label: 'Circle' },
  ];

  return (
    <div
      className={`absolute top-16 right-4 z-20 transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-80'
      }`}
    >
      <div className="relative bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 text-white shadow-2xl shadow-cyan-950/50 max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-3 left-3 p-1.5 rounded-lg bg-slate-900 text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {!collapsed && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 pl-8">
              <h2 className="text-sm font-bold font-mono tracking-wider text-cyan-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-fuchsia-400" />
                STUDIO CONTROLS
              </h2>
            </div>

            {/* 1. VISUAL MODES */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                VISUAL MODE / SHADER
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {visualModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => config.setVisualMode(mode)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-mono transition-all border ${
                      config.visualMode === mode
                        ? 'bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 border-cyan-400 text-white font-bold shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 3D GEOMETRY SYSTEM */}
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-fuchsia-400" />
                  3D GEOMETRY OBJECTS
                </label>
                <input
                  type="checkbox"
                  checked={config.geometryEnabled}
                  onChange={(e) => config.updateConfig({ geometryEnabled: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {config.geometryEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-1.5">
                    {shapeTypes.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => config.setShapeType(shape.id)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono text-left transition-all border ${
                          config.shapeType === shape.id
                            ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-400">Two-Hand Manipulation</span>
                    <input
                      type="checkbox"
                      checked={config.twoHandInteraction}
                      onChange={(e) => config.updateConfig({ twoHandInteraction: e.target.checked })}
                      className="accent-fuchsia-500 w-3.5 h-3.5 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 3. LIGHT TRAILS & HALOS */}
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  MOTION TRAILS & LIGHTS
                </label>
                <input
                  type="checkbox"
                  checked={config.trailsEnabled}
                  onChange={(e) => config.updateConfig({ trailsEnabled: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {config.trailsEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Trail Length</span>
                    <span className="text-cyan-400">{config.trailLength} pts</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={config.trailLength}
                    onChange={(e) => config.updateConfig({ trailLength: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span>Effect Intensity</span>
                    <span className="text-cyan-400">{config.effectIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.5"
                    step="0.1"
                    value={config.effectIntensity}
                    onChange={(e) => config.updateConfig({ effectIntensity: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}
            </div>

            {/* 4. GPU PARTICLE SYSTEM */}
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  FINGERTIP PARTICLES
                </label>
                <input
                  type="checkbox"
                  checked={config.particlesEnabled}
                  onChange={(e) => config.updateConfig({ particlesEnabled: e.target.checked })}
                  className="accent-fuchsia-400 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {config.particlesEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Particle Amount</span>
                    <span className="text-fuchsia-400">{config.particleAmount}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.particleAmount}
                    onChange={(e) => config.updateConfig({ particleAmount: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                  />
                </div>
              )}
            </div>

            {/* 5. SMOOTHING & MIRROR */}
            <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>One Euro Filter Smoothing</span>
                <input
                  type="checkbox"
                  checked={config.smoothingEnabled}
                  onChange={(e) => config.updateConfig({ smoothingEnabled: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Mirror Webcam Feed</span>
                <input
                  type="checkbox"
                  checked={config.mirrorWebcam}
                  onChange={(e) => config.updateConfig({ mirrorWebcam: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
