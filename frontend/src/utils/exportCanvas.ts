export function saveCanvasSnapshot(
  video: HTMLVideoElement | null,
  canvas2D: HTMLCanvasElement | null,
  webglCanvas: HTMLCanvasElement | null,
  mirror: boolean
): void {
  if (!canvas2D) return;

  const width = canvas2D.width || 1280;
  const height = canvas2D.height || 720;

  // Create temporary offscreen composite canvas
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const ctx = compositeCanvas.getContext('2d');

  if (!ctx) return;

  // Layer 1: Webcam Feed (mirrored if config.mirrorWebcam is true)
  if (video && video.readyState >= 2) {
    ctx.save();
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();
  } else {
    // Dark futuristic backdrop if video missing
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, width, height);
  }

  // Layer 2: Three.js WebGL Layer
  if (webglCanvas) {
    ctx.drawImage(webglCanvas, 0, 0, width, height);
  }

  // Layer 3: 2D Canvas Layer (Light trails, halos, light effects)
  ctx.drawImage(canvas2D, 0, 0, width, height);

  // Export & trigger browser download
  compositeCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `hand-motion-light-studio-${timestamp}.png`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
