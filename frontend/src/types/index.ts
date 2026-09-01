export type Handedness = 'left' | 'right';

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Landmark21 extends Point3D {
  visibility?: number;
}

export interface FingertipData {
  hand: Handedness;
  finger: FingerName;
  x: number;          // Normalized [0, 1] (mirrored)
  y: number;          // Normalized [0, 1]
  z: number;          // Relative depth
  confidence: number;
  visible: boolean;
  // Motion metrics calculated by MotionEngine
  smoothedX: number;
  smoothedY: number;
  smoothedZ: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  acceleration: number;
  direction: number;  // Angle in radians
  motionEnergy: number;
}

export interface HandTrackingData {
  handedness: Handedness;
  confidence: number;
  landmarks: Landmark21[];
  fingertips: Record<FingerName, FingertipData>;
  center: Point3D;
}

export type GestureType =
  | 'NONE'
  | 'INDEX_POINT'
  | 'PINCH'
  | 'OPEN_PALM'
  | 'FIST'
  | 'TWO_FINGER_POINT'
  | 'THREE_FINGER_POINT'
  | 'GRAB'
  | 'RELEASE';

export interface GestureState {
  hand: Handedness;
  gesture: GestureType;
  confidence: number;
  pinchDistance: number;
  isPinching: boolean;
}

export interface TwoHandMetrics {
  active: boolean;
  leftCenter: Point3D;
  rightCenter: Point3D;
  midPoint: Point3D;
  distance: number;   // Distance between hand centers
  angle: number;      // Rotation angle between hand centers
  scale: number;      // Relative scale based on distance
}

export type VisualMode = 'NORMAL' | 'NEON' | 'THERMAL' | 'CYBER' | 'HOLOGRAM' | 'GLITCH';

export type GeometricShapeType = 'TRIANGLE' | 'RECTANGLE' | 'CIRCLE' | 'POLYGON' | 'RING' | 'CUBE' | 'PRISM' | 'HOLOGRAM_PANEL';

export interface StudioConfig {
  // Video & Mirroring
  mirrorWebcam: boolean;
  
  // Motion Engine
  minCutoff: number;      // One Euro Filter min cutoff (Hz)
  beta: number;           // One Euro Filter beta (speed coefficient)
  dCutoff: number;        // One Euro Filter derivative cutoff
  smoothingEnabled: boolean;
  
  // Hand Tracking Sensitivity
  minDetectionConfidence: number;
  minTrackingConfidence: number;

  // Effects & Visuals
  visualMode: VisualMode;
  particlesEnabled: boolean;
  particleAmount: number;
  trailsEnabled: boolean;
  trailLength: number;
  glowEnabled: boolean;
  effectIntensity: number;
  bloomEnabled: boolean;
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;

  // 3D Geometry
  geometryEnabled: boolean;
  shapeType: GeometricShapeType;
  twoHandInteraction: boolean;

  // Debug HUD
  debugMode: boolean;
  showLandmarks: boolean;
  showVectors: boolean;
  showFPS: boolean;
  showLatency: boolean;
}
