import React, { useEffect, useRef, useState } from 'react';
import { CameraLayer } from './CameraLayer';
import { useCamera } from '../hooks/useCamera';
import { useStudioStore } from '../state/useStudioStore';
import { HandLandmarkerManager } from '../handTracking/HandLandmarkerManager';
import { TrailRenderer } from '../drawingEngine/TrailRenderer';
import { FingertipLightEffect } from '../effects/FingertipLightEffect';
import { ShaderPasses } from '../effects/ShaderPasses';
import { DebugOverlay } from './DebugOverlay';
import { SceneManager } from '../three/SceneManager';
import { useFps } from '../hooks/useFps';
import { saveCanvasSnapshot } from '../utils/exportCanvas';
import { HandTrackingData, GestureState } from '../types';

interface StudioViewportProps {
  onRegisterSavePNGRef: (fn: () => void) => void;
}

export const StudioViewport: React.FC<StudioViewportProps> = ({ onRegisterSavePNGRef }) => {
  const { videoRef } = useCamera();
  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const threeContainerRef = useRef<HTMLDivElement | null>(null);

  const [handTrackerReady, setHandTrackerReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const trailRendererRef = useRef<TrailRenderer>(new TrailRenderer());
  const fingertipLightRef = useRef<FingertipLightEffect>(new FingertipLightEffect());
  const animFrameIdRef = useRef<number | null>(null);
  const lastStatUpdateRef = useRef<number>(0);

  const { tick } = useFps();
  const config = useStudioStore();
  const setTrackingStats = useStudioStore((s) => s.setTrackingStats);

  // Initialize MediaPipe HandLandmarker & Three.js SceneManager
  useEffect(() => {
    let mounted = true;

    async function setupTracking() {
      try {
        const manager = HandLandmarkerManager.getInstance();
        await manager.initialize();
        if (mounted) {
          setHandTrackerReady(true);
        }
      } catch (err: any) {
        if (mounted) {
          setInitError('Failed to initialize MediaPipe vision tasks WASM module.');
        }
      }
    }

    setupTracking();

    if (threeContainerRef.current) {
      sceneManagerRef.current = new SceneManager(threeContainerRef.current);
    }

    const handleResize = () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.handleResize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, []);

  // Register Save PNG Snapshot callback
  useEffect(() => {
    onRegisterSavePNGRef(() => {
      const webglCanvas = sceneManagerRef.current ? sceneManagerRef.current.getDomElement() : null;
      saveCanvasSnapshot(videoRef.current, canvas2DRef.current, webglCanvas, config.mirrorWebcam);
    });
  }, [config.mirrorWebcam, onRegisterSavePNGRef]);

  // Main 60 FPS Animation & Detection Loop
  useEffect(() => {
    let lastTime = performance.now();

    const renderLoop = (timestamp: number) => {
      const startTime = performance.now();
      const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      const video = videoRef.current;
      const canvas2D = canvas2DRef.current;

      let detectedHands: HandTrackingData[] = [];
      let detectedGestures: GestureState[] = [];

      // 1. Detect Hand Landmarks
      if (handTrackerReady && video && video.readyState >= 2) {
        const manager = HandLandmarkerManager.getInstance();
        const result = manager.detectVideoFrame(
          video,
          timestamp,
          config.mirrorWebcam,
          config.minCutoff,
          config.beta,
          config.dCutoff,
          config.smoothingEnabled
        );
        detectedHands = result.hands;
        detectedGestures = result.gestures;
      }

      const activeFingertips = detectedHands.flatMap((h) => Object.values(h.fingertips));

      // Throttle React state updates to 5Hz (every 200ms) to eliminate React re-render hanging!
      if (timestamp - lastStatUpdateRef.current > 200) {
        setTrackingStats(detectedHands.length, activeFingertips.filter((f) => f.visible).length);
        lastStatUpdateRef.current = timestamp;
      }

      // 2. Render 2D Canvas Layer
      if (canvas2D) {
        const width = canvas2D.parentElement?.clientWidth || window.innerWidth;
        const height = canvas2D.parentElement?.clientHeight || window.innerHeight;

        if (canvas2D.width !== width || canvas2D.height !== height) {
          canvas2D.width = width;
          canvas2D.height = height;
        }

        const ctx = canvas2D.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);

          // Render Shader Mode Filter overlay
          ShaderPasses.applyCanvasModeFilter(ctx, width, height, config.visualMode, timestamp);

          // Render Motion Trails
          if (config.trailsEnabled && activeFingertips.length > 0) {
            trailRendererRef.current.update(activeFingertips, config.trailLength, timestamp);
            trailRendererRef.current.render(ctx, width, height, config.visualMode, config.glowEnabled);
          } else {
            trailRendererRef.current.clear();
          }

          // Render Velocity-Reactive Fingertip Light Halos
          if (config.glowEnabled) {
            fingertipLightRef.current.render(
              ctx,
              width,
              height,
              activeFingertips,
              config.visualMode,
              config.effectIntensity
            );
          }

          // Render Developer Debug Skeleton HUD
          if (config.debugMode) {
            DebugOverlay.render(ctx, width, height, detectedHands, detectedGestures);
          }
        }
      }

      // 3. Render Three.js WebGL Layer
      if (sceneManagerRef.current) {
        sceneManagerRef.current.render(detectedHands, detectedGestures, config, deltaTime);
      }

      // Calculate Latency & Tick FPS
      const processingTime = performance.now() - startTime;
      tick(processingTime);

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [handTrackerReady, config, tick, setTrackingStats]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      {/* Layer 1: HTML5 Webcam Feed */}
      <CameraLayer videoRef={videoRef} mirror={config.mirrorWebcam} />

      {/* Layer 2: 2D Canvas Layer (Light Halos, Motion Trails, Debug HUD) */}
      <canvas ref={canvas2DRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Layer 3: Three.js WebGL Overlay (3D Geometries & Particles) */}
      <div ref={threeContainerRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Camera Initialization Error Banner */}
      {initError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-6 text-center">
          <div className="max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-rose-400 font-mono mb-2">SYSTEM ERROR</h2>
            <p className="text-sm text-slate-300 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-mono font-bold hover:bg-rose-500 transition-colors"
            >
              RELOAD APPLICATION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
