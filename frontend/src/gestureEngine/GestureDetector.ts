import { Landmark21, GestureState, GestureType, Handedness } from '../types';
import { distance3D, distance2D } from '../utils/math';

export class GestureDetector {
  // Hysteresis threshold states per hand
  private isPinchingMap: Map<Handedness, boolean> = new Map();
  private isFistMap: Map<Handedness, boolean> = new Map();

  // Normalized distance thresholds
  private pinchStartThreshold = 0.05;   // Pinch triggers when distance < 0.05
  private pinchReleaseThreshold = 0.08; // Pinch releases when distance > 0.08

  private fistStartThreshold = 0.12;    // Fist triggers when tip-to-wrist distance < 0.12
  private fistReleaseThreshold = 0.16;  // Fist releases when distance > 0.16

  public detectGesture(landmarks: Landmark21[], hand: Handedness): GestureState {
    if (!landmarks || landmarks.length < 21) {
      return {
        hand,
        gesture: 'NONE',
        confidence: 0,
        pinchDistance: 1.0,
        isPinching: false,
      };
    }

    const wrist = landmarks[0];

    // Fingertips & PIP joints
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const middlePip = landmarks[10];
    const ringPip = landmarks[14];
    const pinkyPip = landmarks[18];

    // Calculate Pinch distance (normalized 3D distance between thumb tip and index tip)
    const pinchDistance = distance3D(thumbTip, indexTip);

    // Apply Hysteresis for Pinch
    const wasPinching = this.isPinchingMap.get(hand) || false;
    let isPinching = wasPinching;

    if (wasPinching) {
      if (pinchDistance > this.pinchReleaseThreshold) {
        isPinching = false;
      }
    } else {
      if (pinchDistance < this.pinchStartThreshold) {
        isPinching = true;
      }
    }
    this.isPinchingMap.set(hand, isPinching);

    // Finger Extension Check (distance from fingertip to wrist vs PIP/MCP to wrist)
    const isIndexExtended = distance3D(indexTip, wrist) > distance3D(indexPip, wrist) * 1.15;
    const isMiddleExtended = distance3D(middleTip, wrist) > distance3D(middlePip, wrist) * 1.15;
    const isRingExtended = distance3D(ringTip, wrist) > distance3D(ringPip, wrist) * 1.15;
    const isPinkyExtended = distance3D(pinkyTip, wrist) > distance3D(pinkyPip, wrist) * 1.15;

    // Average finger-to-wrist distance for Fist check
    const avgTipDist = (
      distance3D(indexTip, wrist) +
      distance3D(middleTip, wrist) +
      distance3D(ringTip, wrist) +
      distance3D(pinkyTip, wrist)
    ) / 4.0;

    const wasFist = this.isFistMap.get(hand) || false;
    let isFist = wasFist;
    if (wasFist) {
      if (avgTipDist > this.fistReleaseThreshold) {
        isFist = false;
      }
    } else {
      if (avgTipDist < this.fistStartThreshold) {
        isFist = true;
      }
    }
    this.isFistMap.set(hand, isFist);

    // Gesture Evaluation Priority
    let gesture: GestureType = 'NONE';
    let confidence = 0.85;

    if (isPinching) {
      gesture = 'PINCH';
      confidence = 0.95;
    } else if (isFist) {
      gesture = 'FIST';
      confidence = 0.90;
    } else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      gesture = 'OPEN_PALM';
      confidence = 0.92;
    } else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      gesture = 'TWO_FINGER_POINT';
      confidence = 0.88;
    } else if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
      gesture = 'THREE_FINGER_POINT';
      confidence = 0.88;
    } else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      gesture = 'INDEX_POINT';
      confidence = 0.94;
    }

    return {
      hand,
      gesture,
      confidence,
      pinchDistance,
      isPinching,
    };
  }

  public resetHand(hand: Handedness): void {
    this.isPinchingMap.delete(hand);
    this.isFistMap.delete(hand);
  }
}
