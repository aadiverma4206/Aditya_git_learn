import { FingertipData, VisualMode } from '../types';

export class FingertipLightEffect {
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fingertips: FingertipData[],
    visualMode: VisualMode,
    effectIntensity: number
  ): void {
    if (!fingertips || fingertips.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // Additive blending for light effects

    for (const ft of fingertips) {
      if (!ft.visible) continue;

      const px = ft.smoothedX * width;
      const py = ft.smoothedY * height;

      // Speed-reactive light radius and intensity
      const baseRadius = 25 * effectIntensity;
      const velocityBonus = Math.min(60, ft.speed * 80 * effectIntensity);
      const outerRadius = baseRadius + velocityBonus;
      const innerRadius = Math.max(2, 6 * effectIntensity);

      // Color scheme according to finger & hand identity + visualMode
      const isLeft = ft.hand === 'left';
      let primaryColor = isLeft ? 'rgba(255, 0, 150,' : 'rgba(0, 240, 255,';
      let secondaryColor = isLeft ? 'rgba(255, 120, 220,' : 'rgba(120, 240, 255,';

      if (visualMode === 'THERMAL') {
        primaryColor = 'rgba(255, 80, 0,';
        secondaryColor = 'rgba(255, 220, 0,';
      } else if (visualMode === 'CYBER') {
        primaryColor = isLeft ? 'rgba(120, 0, 255,' : 'rgba(0, 255, 100,';
        secondaryColor = 'rgba(255, 255, 255,';
      } else if (visualMode === 'HOLOGRAM') {
        primaryColor = 'rgba(0, 220, 255,';
        secondaryColor = 'rgba(180, 245, 255,';
      }

      // Radial Light Gradient
      const gradient = ctx.createRadialGradient(px, py, innerRadius, px, py, outerRadius);
      const speedAlpha = Math.min(1.0, 0.4 + ft.speed * 0.8);

      gradient.addColorStop(0, `${secondaryColor} ${1.0 * speedAlpha})`);
      gradient.addColorStop(0.3, `${primaryColor} ${0.7 * speedAlpha})`);
      gradient.addColorStop(0.7, `${primaryColor} ${0.25 * speedAlpha})`);
      gradient.addColorStop(1, `${primaryColor} 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, outerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Fingertip Core Hotspot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Energy Ring surrounding active fingertip
      const ringRadius = outerRadius * 0.55;
      ctx.strokeStyle = `${primaryColor} ${0.6 * speedAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
