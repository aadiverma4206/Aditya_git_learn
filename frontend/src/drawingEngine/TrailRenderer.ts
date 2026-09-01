import { Point3D, FingertipData, VisualMode } from '../types';
import { catmullRomInterpolate } from '../utils/math';

interface TrailPoint {
  x: number;
  y: number;
  speed: number;
  timestamp: number;
}

export class TrailRenderer {
  private trails: Map<string, TrailPoint[]> = new Map();

  private getKey(hand: string, finger: string): string {
    return `${hand}_${finger}`;
  }

  public update(fingertips: FingertipData[], maxTrailLength: number, timestamp: number): void {
    const activeKeys = new Set<string>();

    for (const ft of fingertips) {
      if (!ft.visible) continue;
      const key = this.getKey(ft.hand, ft.finger);
      activeKeys.add(key);

      let history = this.trails.get(key);
      if (!history) {
        history = [];
        this.trails.set(key, history);
      }

      history.push({
        x: ft.smoothedX,
        y: ft.smoothedY,
        speed: ft.speed,
        timestamp,
      });

      const targetLength = Math.min(
        maxTrailLength,
        Math.max(12, Math.floor(ft.speed * 30 + 20))
      );

      while (history.length > targetLength) {
        history.shift();
      }
    }

    this.trails.forEach((history, key) => {
      if (!activeKeys.has(key)) {
        if (history.length > 0) {
          history.shift();
        } else {
          this.trails.delete(key);
        }
      }
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    visualMode: VisualMode,
    glowEnabled: boolean
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // Additive blending for neon light trails

    this.trails.forEach((history, key) => {
      if (history.length < 2) return;

      const isLeft = key.startsWith('left');
      const isIndex = key.endsWith('index');

      // Vibrant neon palette matching reference reel
      let strokeGlow = isLeft ? '#ff00aa' : '#00f0ff';
      let strokeCore = isLeft ? '#ffffff' : '#e6ffff';

      if (isIndex) {
        strokeGlow = isLeft ? '#e000ff' : '#00ffd5';
      }

      if (visualMode === 'THERMAL') {
        strokeGlow = isLeft ? '#ff3300' : '#ffcc00';
      } else if (visualMode === 'CYBER') {
        strokeGlow = isLeft ? '#7000ff' : '#00ff66';
      } else if (visualMode === 'HOLOGRAM') {
        strokeGlow = '#00e5ff';
      }

      const points = history.map((p) => ({
        x: p.x * width,
        y: p.y * height,
        speed: p.speed,
      }));

      // Draw Catmull-Rom spline segments
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(points.length - 1, i + 1)];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        const steps = 5;
        for (let t = 0; t < 1; t += 1 / steps) {
          const pt = catmullRomInterpolate(
            { x: p0.x, y: p0.y, z: 0 },
            { x: p1.x, y: p1.y, z: 0 },
            { x: p2.x, y: p2.y, z: 0 },
            { x: p3.x, y: p3.y, z: 0 },
            t
          );

          if (i === 0 && t === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
      }

      const alpha = Math.min(1.0, history.length / 15);

      if (glowEnabled) {
        ctx.shadowColor = strokeGlow;
        ctx.shadowBlur = 24;
      }

      // Outer Neon Glow Pass
      ctx.strokeStyle = strokeGlow;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = isIndex ? 8 : 5;
      ctx.stroke();

      // Inner White Hotspot Core Pass
      ctx.shadowBlur = 0;
      ctx.strokeStyle = strokeCore;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = isIndex ? 3 : 2;
      ctx.stroke();
    });

    ctx.restore();
  }

  public clear(): void {
    this.trails.clear();
  }
}
