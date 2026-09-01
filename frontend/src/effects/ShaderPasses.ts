import { VisualMode } from '../types';

export class ShaderPasses {
  private static scanlineCanvas: HTMLCanvasElement | null = null;
  private static scanlinePattern: CanvasPattern | null = null;

  private static getScanlinePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.scanlinePattern) return this.scanlinePattern;

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 4;
    patternCanvas.height = 4;
    const pCtx = patternCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      pCtx.fillRect(0, 0, 4, 1.5);
    }
    this.scanlinePattern = ctx.createPattern(patternCanvas, 'repeat');
    return this.scanlinePattern;
  }

  public static applyCanvasModeFilter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mode: VisualMode,
    timestamp: number
  ): void {
    if (mode === 'NORMAL') return;

    ctx.save();

    if (mode === 'CYBER' || mode === 'HOLOGRAM') {
      // Fast single-pass scanline fill via repeating pattern (0 CPU overhead)
      const pattern = this.getScanlinePattern(ctx);
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }

      if (mode === 'HOLOGRAM') {
        // Hologram animated sweep light bar
        const sweepY = (timestamp * 0.2) % (height + 100) - 50;
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
        sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.22)');
        sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 30, width, 60);
      }
    } else if (mode === 'GLITCH') {
      // Lightweight non-blocking RGB split effect using canvas blend modes
      if (Math.random() < 0.2) {
        const sliceY = Math.random() * height;
        const sliceH = Math.random() * 20 + 5;
        const offsetX = (Math.random() - 0.5) * 20;

        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.fillRect(offsetX, sliceY, width, sliceH);
      }
    } else if (mode === 'THERMAL') {
      // Thermal vision gradient overlay
      const thermalGrad = ctx.createLinearGradient(0, 0, width, height);
      thermalGrad.addColorStop(0, 'rgba(0, 0, 120, 0.20)');
      thermalGrad.addColorStop(0.4, 'rgba(255, 0, 100, 0.15)');
      thermalGrad.addColorStop(0.8, 'rgba(255, 200, 0, 0.15)');
      ctx.fillStyle = thermalGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'NEON') {
      // Vibrant cinematic neon bloom tint
      const neonGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        100,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      neonGrad.addColorStop(0, 'rgba(255, 0, 150, 0.08)');
      neonGrad.addColorStop(1, 'rgba(0, 240, 255, 0.08)');
      ctx.fillStyle = neonGrad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}
