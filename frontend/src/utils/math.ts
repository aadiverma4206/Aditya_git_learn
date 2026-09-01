import { Point3D } from '../types';

export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function angle2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function magnitude2D(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function normalize2D(x: number, y: number): { x: number; y: number } {
  const mag = magnitude2D(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}

/**
 * Catmull-Rom spline point evaluation
 */
export function catmullRomInterpolate(
  p0: Point3D,
  p1: Point3D,
  p2: Point3D,
  p3: Point3D,
  t: number
): Point3D {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  return {
    x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
    y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3,
    z: p0.z * f0 + p1.z * f1 + p2.z * f2 + p3.z * f3,
  };
}

/**
 * Hysteresis helper for toggle states (prevent flickering)
 */
export class HysteresisState {
  private state: boolean;
  private lowThreshold: number;
  private highThreshold: number;

  constructor(initialState: boolean, lowThreshold: number, highThreshold: number) {
    this.state = initialState;
    this.lowThreshold = lowThreshold;
    this.highThreshold = highThreshold;
  }

  public update(val: number): boolean {
    if (this.state) {
      if (val > this.highThreshold) {
        this.state = false;
      }
    } else {
      if (val < this.lowThreshold) {
        this.state = true;
      }
    }
    return this.state;
  }

  public get(): boolean {
    return this.state;
  }
}
