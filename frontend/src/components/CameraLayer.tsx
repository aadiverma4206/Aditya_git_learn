import React from 'react';

interface CameraLayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  mirror: boolean;
}

export const CameraLayer: React.FC<CameraLayerProps> = ({ videoRef, mirror }) => {
  return (
    <video
      ref={videoRef as React.RefObject<HTMLVideoElement>}
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-transform duration-200"
      style={{
        transform: mirror ? 'scaleX(-1)' : 'none',
      }}
    />
  );
};
