import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandTrackingData, FingertipData, Landmark21, Handedness, FingerName } from '../types';
import { CoordinateTransformer } from './CoordinateTransformer';
import { MotionProcessor } from '../motionEngine/MotionProcessor';
import { GestureDetector } from '../gestureEngine/GestureDetector';

export class HandLandmarkerManager {
  private static instance: HandLandmarkerManager | null = null;
  private landmarker: HandLandmarker | null = null;
  private motionProcessor: MotionProcessor = new MotionProcessor();
  private gestureDetector: GestureDetector = new GestureDetector();
  private isInitializing: boolean = false;
  private initialized: boolean = false;
  private lastVideoTime: number = -1;
  private cachedHands: HandTrackingData[] = [];
  private cachedGestures: ReturnType<GestureDetector['detectGesture']>[] = [];

  private constructor() {}

  public static getInstance(): HandLandmarkerManager {
    if (!HandLandmarkerManager.instance) {
      HandLandmarkerManager.instance = new HandLandmarkerManager();
    }
    return HandLandmarkerManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm'
      );

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      this.initialized = true;
      console.log('MediaPipe HandLandmarker initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  public isReady(): boolean {
    return this.initialized && this.landmarker !== null;
  }

  public detectVideoFrame(
    videoElement: HTMLVideoElement,
    timestamp: number,
    mirror: boolean,
    minCutoff: number,
    beta: number,
    dCutoff: number,
    smoothingEnabled: boolean
  ): {
    hands: HandTrackingData[];
    gestures: ReturnType<GestureDetector['detectGesture']>[];
  } {
    if (!this.landmarker || !this.initialized || videoElement.readyState < 2) {
      return { hands: [], gestures: [] };
    }

    // Only run MediaPipe inference when video frame actually updates
    if (videoElement.currentTime === this.lastVideoTime) {
      return { hands: this.cachedHands, gestures: this.cachedGestures };
    }
    this.lastVideoTime = videoElement.currentTime;

    let results: HandLandmarkerResult;
    try {
      results = this.landmarker.detectForVideo(videoElement, timestamp);
    } catch (e) {
      return { hands: this.cachedHands, gestures: this.cachedGestures };
    }

    const hands: HandTrackingData[] = [];
    const gestures: ReturnType<GestureDetector['detectGesture']>[] = [];

    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const rawLandmarks = results.landmarks[i];
        const handednessCategory = results.handednesses[i]?.[0];
        const rawHandName = (handednessCategory?.categoryName.toLowerCase() as Handedness) || 'left';
        const handedness: Handedness = mirror
          ? (rawHandName === 'left' ? 'right' : 'left')
          : (rawHandName === 'left' ? 'left' : 'right');
        const confidence = handednessCategory?.score || 0.9;

        const transformedLandmarks: Landmark21[] = rawLandmarks.map((lm) => {
          const norm = CoordinateTransformer.toNormalizedMirrored(lm.x, lm.y, lm.z, mirror);
          return {
            x: norm.x,
            y: norm.y,
            z: norm.z,
            visibility: lm.visibility,
          };
        });

        const fingerIndices: Record<FingerName, number> = {
          thumb: 4,
          index: 8,
          middle: 12,
          ring: 16,
          pinky: 20,
        };

        const fingertips = {} as Record<FingerName, FingertipData>;

        (Object.keys(fingerIndices) as FingerName[]).forEach((finger) => {
          const idx = fingerIndices[finger];
          const rawPoint = transformedLandmarks[idx];

          fingertips[finger] = this.motionProcessor.processFingertip(
            handedness,
            finger,
            rawPoint,
            confidence,
            true,
            timestamp,
            minCutoff,
            beta,
            dCutoff,
            smoothingEnabled
          );
        });

        const wrist = transformedLandmarks[0];
        const middleMcp = transformedLandmarks[9];
        const center = {
          x: (wrist.x + middleMcp.x) / 2,
          y: (wrist.y + middleMcp.y) / 2,
          z: (wrist.z + middleMcp.z) / 2,
        };

        hands.push({
          handedness,
          confidence,
          landmarks: transformedLandmarks,
          fingertips,
          center,
        });

        const gestureState = this.gestureDetector.detectGesture(transformedLandmarks, handedness);
        gestures.push(gestureState);
      }
    } else {
      this.motionProcessor.resetAll();
    }

    this.cachedHands = hands;
    this.cachedGestures = gestures;

    return { hands, gestures };
  }

  public dispose(): void {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.initialized = false;
    this.lastVideoTime = -1;
  }
}
