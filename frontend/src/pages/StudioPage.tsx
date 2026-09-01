import React, { useRef, useState } from 'react';
import { StudioViewport } from '../components/StudioViewport';
import { TopBar } from '../components/TopBar';
import { ControlPanel } from '../components/ControlPanel';
import { CalibrationModal } from '../components/CalibrationModal';

export const StudioPage: React.FC = () => {
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const savePNGRef = useRef<(() => void) | null>(null);

  const handleSavePNG = () => {
    if (savePNGRef.current) {
      savePNGRef.current();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Top Bar HUD */}
      <TopBar
        onSavePNG={handleSavePNG}
        onOpenCalibration={() => setCalibrationOpen(true)}
      />

      {/* Main Composite Viewport (Webcam + 2D Canvas + WebGL Three.js) */}
      <StudioViewport
        onRegisterSavePNGRef={(fn) => {
          savePNGRef.current = fn;
        }}
      />

      {/* Translucent Control Side Panel */}
      <ControlPanel />

      {/* Calibration Modal */}
      <CalibrationModal
        isOpen={calibrationOpen}
        onClose={() => setCalibrationOpen(false)}
      />
    </div>
  );
};
