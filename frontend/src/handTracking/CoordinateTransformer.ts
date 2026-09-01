import { Point3D } from '../types';

export interface ViewportRect {
  width: number;
  height: number;
}

export class CoordinateTransformer {
  /**
   * Transforms raw MediaPipe landmark [0, 1] to normalized mirrored point [0, 1].
   * MediaPipe (0,0) is top-left, x increases to right.
   * When mirrored, x_mirrored = 1 - raw_x.
   */
  public static toNormalizedMirrored(rawX: number, rawY: number, rawZ: number, mirror = true): Point3D {
    return {
      x: mirror ? 1.0 - rawX : rawX,
      y: rawY,
      z: rawZ,
    };
  }

  /**
   * Converts normalized mirrored point [0, 1] to pixel canvas coordinates (0 to width, 0 to height).
   */
  public static toCanvasCoordinates(normPoint: Point3D, viewport: ViewportRect): { x: number; y: number } {
    return {
      x: normPoint.x * viewport.width,
      y: normPoint.y * viewport.height,
    };
  }

  /**
   * Converts normalized mirrored point [0, 1] to Three.js WebGL Normalized Device Coordinates (NDC)
   * where X is in [-1, 1] (left to right), Y is in [-1, 1] (bottom to top), and Z is depth.
   */
  public static toWebGLNDC(normPoint: Point3D): Point3D {
    return {
      x: (normPoint.x - 0.5) * 2.0,
      y: (0.5 - normPoint.y) * 2.0, // Flip Y for WebGL top-to-bottom
      z: normPoint.z,
    };
  }

  /**
   * Converts WebGL NDC coordinates back to 2D canvas coordinates
   */
  public static ndcToCanvas(ndc: Point3D, viewport: ViewportRect): { x: number; y: number } {
    return {
      x: ((ndc.x / 2.0) + 0.5) * viewport.width,
      y: ((0.5 - (ndc.y / 2.0))) * viewport.height,
    };
  }
}
