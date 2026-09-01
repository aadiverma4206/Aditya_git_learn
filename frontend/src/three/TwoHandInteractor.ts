import { HandTrackingData, TwoHandMetrics, Point3D } from '../types';
import { distance3D, angle2D } from '../utils/math';
import { CoordinateTransformer } from '../handTracking/CoordinateTransformer';

export class TwoHandInteractor {
  public static calculateMetrics(hands: HandTrackingData[]): TwoHandMetrics {
    if (hands.length < 2) {
      return {
        active: false,
        leftCenter: { x: 0, y: 0, z: 0 },
        rightCenter: { x: 0, y: 0, z: 0 },
        midPoint: { x: 0, y: 0, z: 0 },
        distance: 0,
        angle: 0,
        scale: 1,
      };
    }

    const leftHand = hands.find((h) => h.handedness === 'left') || hands[0];
    const rightHand = hands.find((h) => h.handedness === 'right') || hands[1];

    const leftCenter = leftHand.center;
    const rightCenter = rightHand.center;

    // Midpoint between hands
    const midPoint: Point3D = {
      x: (leftCenter.x + rightCenter.x) / 2,
      y: (leftCenter.y + rightCenter.y) / 2,
      z: (leftCenter.z + rightCenter.z) / 2,
    };

    // Spatial 3D distance between hand centers
    const rawDistance = distance3D(leftCenter, rightCenter);

    // Angle between hands in 2D viewport space
    const angle = angle2D(leftCenter.x, leftCenter.y, rightCenter.x, rightCenter.y);

    // Map distance to object scale (e.g. 0.15 distance -> scale 0.6, 0.60 distance -> scale 2.5)
    const scale = Math.max(0.5, Math.min(3.0, rawDistance * 4.0));

    return {
      active: true,
      leftCenter,
      rightCenter,
      midPoint,
      distance: rawDistance,
      angle,
      scale,
    };
  }

  public static getTransformForSingleHand(hand: HandTrackingData): {
    ndcPos: Point3D;
    rotation: { rx: number; ry: number; rz: number };
    scale: number;
  } {
    const norm = hand.center;
    const ndcPos = CoordinateTransformer.toWebGLNDC(norm);
    const indexTip = hand.fingertips.index;

    // Rotation derived from hand index velocity/direction
    const rx = (indexTip.smoothedY - 0.5) * Math.PI;
    const ry = (indexTip.smoothedX - 0.5) * Math.PI;
    const rz = indexTip.direction;

    return {
      ndcPos,
      rotation: { rx, ry, rz },
      scale: 1.0 + indexTip.speed * 0.5,
    };
  }

  /**
   * Converts all 5 fingertip coordinates of a hand (thumb, index, middle, ring, pinky)
   * into WebGL 3D world space coordinates on the focal plane (z = 0 plane).
   */
  public static getFingertipWorldPositions(hand: HandTrackingData): {
    thumb: Point3D;
    index: Point3D;
    middle: Point3D;
    ring: Point3D;
    pinky: Point3D;
    wrist: Point3D;
  } {
    const mapPoint = (p: { x: number; y: number; z: number }): Point3D => {
      const ndc = CoordinateTransformer.toWebGLNDC({ x: p.x, y: p.y, z: p.z });
      return {
        x: ndc.x * 4.5,
        y: ndc.y * 3.0,
        z: ndc.z * 2.0,
      };
    };

    const wristRaw = hand.landmarks && hand.landmarks[0] ? hand.landmarks[0] : hand.center;

    return {
      thumb: mapPoint({ x: hand.fingertips.thumb.smoothedX, y: hand.fingertips.thumb.smoothedY, z: hand.fingertips.thumb.smoothedZ }),
      index: mapPoint({ x: hand.fingertips.index.smoothedX, y: hand.fingertips.index.smoothedY, z: hand.fingertips.index.smoothedZ }),
      middle: mapPoint({ x: hand.fingertips.middle.smoothedX, y: hand.fingertips.middle.smoothedY, z: hand.fingertips.middle.smoothedZ }),
      ring: mapPoint({ x: hand.fingertips.ring.smoothedX, y: hand.fingertips.ring.smoothedY, z: hand.fingertips.ring.smoothedZ }),
      pinky: mapPoint({ x: hand.fingertips.pinky.smoothedX, y: hand.fingertips.pinky.smoothedY, z: hand.fingertips.pinky.smoothedZ }),
      wrist: mapPoint({ x: wristRaw.x, y: wristRaw.y, z: wristRaw.z }),
    };
  }

  /**
   * Calculates finger spread factor (ratio of distance between fingertips vs palm center).
   * Spreading fingers wide returns > 1.2, closing fingers into pinch/fist returns < 0.6.
   */
  public static calculateFingerSpread(hand: HandTrackingData): number {
    const center = hand.center;
    const tips = [
      hand.fingertips.thumb,
      hand.fingertips.index,
      hand.fingertips.middle,
      hand.fingertips.ring,
      hand.fingertips.pinky,
    ];

    let totalDist = 0;
    tips.forEach((tip) => {
      totalDist += distance3D(center, { x: tip.smoothedX, y: tip.smoothedY, z: tip.smoothedZ });
    });

    const avgDist = totalDist / tips.length;
    // Base normal open hand distance ~0.22 normalized units
    const spreadFactor = avgDist / 0.22;
    return Math.max(0.2, Math.min(3.0, spreadFactor));
  }
}
