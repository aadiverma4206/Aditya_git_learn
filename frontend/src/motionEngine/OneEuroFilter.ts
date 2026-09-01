import { Point3D } from '../types';

class LowPassFilter {
  private alpha: number = 1.0;
  private s: number = 0;
  private initialized: boolean = false;

  public filter(value: number, alpha: number): number {
    this.alpha = alpha;
    if (!this.initialized) {
      this.s = value;
      this.initialized = true;
    } else {
      this.s = alpha * value + (1.0 - alpha) * this.s;
    }
    return this.s;
  }

  public reset(): void {
    this.initialized = false;
    this.s = 0;
  }

  public lastValue(): number {
    return this.s;
  }
}

export class OneEuroFilter1D {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number = 0;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  public filter(x: number, timestamp: number): number {
    if (this.lastTime === 0 || timestamp <= this.lastTime) {
      this.lastTime = timestamp;
      return this.xFilter.filter(x, 1.0);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 0.001); // in seconds
    this.lastTime = timestamp;

    const prevX = this.xFilter.lastValue();
    const dx = (x - prevX) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(x, this.alpha(cutoff, dt));
  }

  public reset(): void {
    this.lastTime = 0;
    this.xFilter.reset();
    this.dxFilter.reset();
  }

  public updateParams(minCutoff: number, beta: number, dCutoff: number): void {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }
}

export class OneEuroFilter3D {
  private xFilter: OneEuroFilter1D;
  private yFilter: OneEuroFilter1D;
  private zFilter: OneEuroFilter1D;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.xFilter = new OneEuroFilter1D(minCutoff, beta, dCutoff);
    this.yFilter = new OneEuroFilter1D(minCutoff, beta, dCutoff);
    this.zFilter = new OneEuroFilter1D(minCutoff, beta, dCutoff);
  }

  public filter(point: Point3D, timestamp: number): Point3D {
    return {
      x: this.xFilter.filter(point.x, timestamp),
      y: this.yFilter.filter(point.y, timestamp),
      z: this.zFilter.filter(point.z, timestamp),
    };
  }

  public reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
  }

  public updateParams(minCutoff: number, beta: number, dCutoff: number): void {
    this.xFilter.updateParams(minCutoff, beta, dCutoff);
    this.yFilter.updateParams(minCutoff, beta, dCutoff);
    this.zFilter.updateParams(minCutoff, beta, dCutoff);
  }
}
