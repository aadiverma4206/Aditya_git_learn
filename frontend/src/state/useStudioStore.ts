import { create } from 'zustand';
import { StudioConfig, VisualMode, GeometricShapeType } from '../types';

const DEFAULT_CONFIG: StudioConfig = {
  mirrorWebcam: true,
  minCutoff: 1.0,
  beta: 0.007,
  dCutoff: 1.0,
  smoothingEnabled: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,

  visualMode: 'NEON',
  particlesEnabled: true,
  particleAmount: 60,
  trailsEnabled: true,
  trailLength: 45,
  glowEnabled: true,
  effectIntensity: 1.0,
  bloomEnabled: true,
  bloomThreshold: 0.2,
  bloomStrength: 1.2,
  bloomRadius: 0.5,

  geometryEnabled: true,
  shapeType: 'PRISM',
  twoHandInteraction: true,

  debugMode: false,
  showLandmarks: true,
  showVectors: true,
  showFPS: true,
  showLatency: true,
};

interface StudioStore extends StudioConfig {
  fps: number;
  latency: number;
  handsDetectedCount: number;
  fingertipsCount: number;
  cameraConnected: boolean;
  cameraError: string | null;

  setFps: (fps: number) => void;
  setLatency: (latency: number) => void;
  setTrackingStats: (hands: number, fingertips: number) => void;
  setCameraStatus: (connected: boolean, error?: string | null) => void;

  updateConfig: (patch: Partial<StudioConfig>) => void;
  resetConfig: () => void;
  setVisualMode: (mode: VisualMode) => void;
  setShapeType: (shape: GeometricShapeType) => void;

  loadSavedConfig: () => void;
  saveConfigToLocalStorage: () => void;
}

const LOCAL_STORAGE_KEY = 'hand_motion_studio_config_v1';

export const useStudioStore = create<StudioStore>((set, get) => ({
  ...DEFAULT_CONFIG,
  fps: 60,
  latency: 0,
  handsDetectedCount: 0,
  fingertipsCount: 0,
  cameraConnected: false,
  cameraError: null,

  setFps: (fps) => set({ fps }),
  setLatency: (latency) => set({ latency }),
  setTrackingStats: (handsDetectedCount, fingertipsCount) =>
    set({ handsDetectedCount, fingertipsCount }),
  setCameraStatus: (cameraConnected, cameraError = null) =>
    set({ cameraConnected, cameraError }),

  updateConfig: (patch) => {
    set((state) => {
      const next = { ...state, ...patch };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  resetConfig: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ ...DEFAULT_CONFIG });
  },

  setVisualMode: (visualMode) => get().updateConfig({ visualMode }),
  setShapeType: (shapeType) => get().updateConfig({ shapeType }),

  loadSavedConfig: () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set((state) => ({ ...state, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to load saved config from localStorage', e);
    }
  },

  saveConfigToLocalStorage: () => {
    const current = get();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  },
}));
