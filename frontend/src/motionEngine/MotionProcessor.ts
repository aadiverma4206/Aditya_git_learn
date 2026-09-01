import { FingertipData, Handedness, FingerName, Point3D } from '../types';
import { OneEuroFilter3D } from './OneEuroFilter';
import { distance2D, angle2D, magnitude2D } from '../utils/math';

interface PreviousFingertipState {
  raw: Point3D;
  smoothed: Point3D;
  timestamp: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
}

export class MotionProcessor {
  private filters: Map<string, OneEuroFilter3D> = new Map();
  private prevStates: Map<string, PreviousFingertipState> = new Map();
  private lastDetectionTime: Map<Handedness, number> = new Map();
  private lostHandTimeoutMs: number = 300; // Reset filters if missing > 300ms

  private getKey(hand: Handedness, finger: FingerName): string {
    return `${hand}_${finger}`;
  }

  public processFingertip(
    hand: Handedness,
    finger: FingerName,
    rawNormalized: Point3D,
    confidence: number,
    visible: boolean,
    timestamp: number,
    minCutoff: number,
    beta: number,
    dCutoff: number,
    smoothingEnabled: boolean
  ): FingertipData {
    const key = this.getKey(hand, finger);

    // Filter lookup or creation
    let filter = this.filters.get(key);
    if (!filter) {
      filter = new OneEuroFilter3D(minCutoff, beta, dCutoff);
      this.filters.set(key, filter);
    }
    filter.updateParams(minCutoff, beta, dCutoff);

    // Lost Hand Protection check
    const lastHandTime = this.lastDetectionTime.get(hand) || 0;
    const timeSinceLastDetection = timestamp - lastHandTime;
    const isReacquired = visible && timeSinceLastDetection > this.lostHandTimeoutMs;

    if (visible) {
      this.lastDetectionTime.set(hand, timestamp);
    }

    if (!visible || isReacquired) {
      // Reset filter and prev state when tracking re-acquired or lost to prevent giant jump lines
      filter.reset();
      if (!visible) {
        this.prevStates.delete(key);
        return {
          hand,
          finger,
          x: rawNormalized.x,
          y: rawNormalized.y,
          z: rawNormalized.z,
          confidence: 0,
          visible: false,
          smoothedX: rawNormalized.x,
          smoothedY: rawNormalized.y,
          smoothedZ: rawNormalized.z,
          vx: 0,
          vy: 0,
          vz: 0,
          speed: 0,
          acceleration: 0,
          direction: 0,
          motionEnergy: 0,
        };
      }
    }

    // Smooth coordinates
    const smoothed = smoothingEnabled
      ? filter.filter(rawNormalized, timestamp)
      : rawNormalized;

    // Velocity & Motion metrics calculation
    const prev = this.prevStates.get(key);
    let vx = 0;
    let vy = 0;
    let vz = 0;
    let speed = 0;
    let acceleration = 0;
    let direction = 0;
    let motionEnergy = 0;

    if (prev && !isReacquired) {
      const dt = Math.max((timestamp - prev.timestamp) / 1000.0, 0.001); // in seconds
      vx = (smoothed.x - prev.smoothed.x) / dt;
      vy = (smoothed.y - prev.smoothed.y) / dt;
      vz = (smoothed.z - prev.smoothed.z) / dt;

      speed = magnitude2D(vx, vy);
      const prevSpeed = prev.speed;
      acceleration = (speed - prevSpeed) / dt;
      direction = angle2D(prev.smoothed.x, prev.smoothed.y, smoothed.x, smoothed.y);
      motionEnergy = speed * 0.7 + Math.abs(acceleration) * 0.3;
    }

    // Save previous state
    this.prevStates.set(key, {
      raw: rawNormalized,
      smoothed,
      timestamp,
      vx,
      vy,
      vz,
      speed,
    });

    return {
      hand,
      finger,
      x: rawNormalized.x,
      y: rawNormalized.y,
      z: rawNormalized.z,
      confidence,
      visible: true,
      smoothedX: smoothed.x,
      smoothedY: smoothed.y,
      smoothedZ: smoothed.z,
      vx,
      vy,
      vz,
      speed,
      acceleration,
      direction,
      motionEnergy,
    };
  }

  public resetHand(hand: Handedness): void {
    const fingers: FingerName[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    for (const finger of fingers) {
      const key = this.getKey(hand, finger);
      const filter = this.filters.get(key);
      if (filter) filter.reset();
      this.prevStates.delete(key);
    }
    this.lastDetectionTime.delete(hand);
  }

  public resetAll(): void {
    this.filters.forEach((filter) => filter.reset());
    this.prevStates.clear();
    this.lastDetectionTime.clear();
  }
}
