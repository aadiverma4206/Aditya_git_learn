import React from 'react';
import { HandTrackingData, GestureState } from '../types';

interface DebugOverlayProps {
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  hands: HandTrackingData[];
  gestures: GestureState[];
}

// MediaPipe 21 Landmark Hand Skeleton Connections
const SKELETON_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17]                               // Palm base
];

export class DebugOverlay {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hands: HandTrackingData[],
    gestures: GestureState[]
  ): void {
    if (!hands || hands.length === 0) return;

    ctx.save();

    for (let hIdx = 0; hIdx < hands.length; hIdx++) {
      const hand = hands[hIdx];
      const gesture = gestures[hIdx];
      const isLeft = hand.handedness === 'left';
      const skeletonColor = isLeft ? '#ff00aa' : '#00f0ff';

      // 1. Draw Skeleton Joint Connections
      ctx.strokeStyle = skeletonColor;
      ctx.lineWidth = 2;
      for (const [i, j] of SKELETON_CONNECTIONS) {
        const p1 = hand.landmarks[i];
        const p2 = hand.landmarks[j];
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }

      // 2. Draw 21 Landmarks
      for (let i = 0; i < hand.landmarks.length; i++) {
        const lm = hand.landmarks[i];
        const px = lm.x * width;
        const py = lm.y * height;

        ctx.fillStyle = i % 4 === 0 ? '#ffffff' : skeletonColor;
        ctx.beginPath();
        ctx.arc(px, py, i % 4 === 0 ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Velocity Vectors for Fingertips
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1.5;
      Object.values(hand.fingertips).forEach((ft) => {
        if (!ft.visible) return;
        const px = ft.smoothedX * width;
        const py = ft.smoothedY * height;
        const vxPx = ft.vx * width * 0.15;
        const vyPx = ft.vy * height * 0.15;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + vxPx, py + vyPx);
        ctx.stroke();
      });

      // 4. Draw Hand Info HUD Badge
      const centerPx = hand.center.x * width;
      const centerPy = hand.center.y * height;

      ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
      ctx.strokeStyle = skeletonColor;
      ctx.lineWidth = 1;

      const boxW = 160;
      const boxH = 50;
      const boxX = Math.max(10, Math.min(width - boxW - 10, centerPx - boxW / 2));
      const boxY = Math.max(10, centerPy - 80);

      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(`HAND: ${hand.handedness.toUpperCase()} (${(hand.confidence * 100).toFixed(0)}%)`, boxX + 8, boxY + 16);
      ctx.fillText(`GESTURE: ${gesture ? gesture.gesture : 'NONE'}`, boxX + 8, boxY + 32);
      ctx.fillText(`SPEED: ${hand.fingertips.index.speed.toFixed(2)}`, boxX + 8, boxY + 44);
    }

    ctx.restore();
  }
}
