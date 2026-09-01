import * as THREE from 'three';
import { GeometricShapeType, Point3D, VisualMode, HandTrackingData, GestureState } from '../types';
import { TwoHandInteractor } from './TwoHandInteractor';

export class GeometricObjects {
  private meshGroup: THREE.Group = new THREE.Group();
  private activeMesh: THREE.Mesh | null = null;
  private wireframeMesh: THREE.LineSegments | null = null;
  private controlNodesGroup: THREE.Group = new THREE.Group();

  private currentShape: GeometricShapeType = 'PRISM';
  private currentMode: VisualMode = 'NEON';

  // Original unaltered vertex positions for non-destructive deformation
  private originalPositions: Float32Array | null = null;
  // Per-vertex persistent offsets created when user grabs and sculpts parts
  private persistentOffsets: Float32Array | null = null;

  // Selected vertex control node state
  private selectedVertexIndex: number = -1;
  private hoveredVertexIndex: number = -1;
  private activeFingertipWorldPositions: THREE.Vector3[] = [];

  // Damped stable target transformation
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private targetRotation: THREE.Euler = new THREE.Euler(0, 0, 0);
  private currentPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private targetScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  constructor() {
    this.createShape(this.currentShape);
  }

  public getGroup(): THREE.Group {
    return this.meshGroup;
  }

  public setShapeType(shape: GeometricShapeType): void {
    if (this.currentShape === shape && this.activeMesh) return;
    this.currentShape = shape;
    this.createShape(shape);
  }

  public setVisualMode(mode: VisualMode): void {
    this.currentMode = mode;
    this.updateMaterialColor();
  }

  private createShape(shape: GeometricShapeType): void {
    // Clear old mesh & control nodes
    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0];
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
      this.meshGroup.remove(child);
    }
    this.controlNodesGroup.clear();

    let geometry: THREE.BufferGeometry;

    switch (shape) {
      case 'TRIANGLE':
        geometry = new THREE.ConeGeometry(1.2, 2.0, 6, 4);
        break;
      case 'RECTANGLE':
      case 'HOLOGRAM_PANEL':
        geometry = new THREE.PlaneGeometry(2.4, 1.6, 8, 8);
        break;
      case 'CIRCLE':
      case 'RING':
        geometry = new THREE.TorusGeometry(1.2, 0.3, 16, 32);
        break;
      case 'CUBE':
        geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6, 4, 4, 4);
        break;
      case 'PRISM':
      default:
        geometry = new THREE.CylinderGeometry(0.9, 1.4, 2.2, 10, 5);
        break;
    }

    // Save exact copy of original un-deformed vertex positions
    const posAttribute = geometry.attributes.position as THREE.BufferAttribute;
    this.originalPositions = new Float32Array(posAttribute.array.length);
    this.originalPositions.set(posAttribute.array);

    this.persistentOffsets = new Float32Array(posAttribute.array.length);

    // Create main translucent glow material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0066aa,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.8,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Create wireframe edge border overlay
    const wireframeGeo = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    this.wireframeMesh = new THREE.LineSegments(wireframeGeo, wireframeMat);
    mesh.add(this.wireframeMesh);

    // Create interactive control nodes (small glowing spheres) at unique mesh vertices
    this.setupControlNodes(geometry);
    mesh.add(this.controlNodesGroup);

    this.activeMesh = mesh;
    this.meshGroup.add(mesh);
    this.updateMaterialColor();

    // Reset rotation & locked state
    this.meshGroup.rotation.set(0, 0, 0);
  }

  private setupControlNodes(geometry: THREE.BufferGeometry): void {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const count = posAttr.count;

    const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });

    const step = Math.max(1, Math.floor(count / 24));
    for (let i = 0; i < count; i += step) {
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
      nodeMesh.position.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      nodeMesh.userData = { vertexIndex: i };
      this.controlNodesGroup.add(nodeMesh);
    }
  }

  private updateMaterialColor(): void {
    if (!this.activeMesh) return;
    const mat = this.activeMesh.material as THREE.MeshPhysicalMaterial;

    let col = 0x00f0ff;
    let emissive = 0x0088cc;

    if (this.currentMode === 'NEON') {
      col = 0xff0088;
      emissive = 0xaa0055;
    } else if (this.currentMode === 'THERMAL') {
      col = 0xff4400;
      emissive = 0xcc2200;
    } else if (this.currentMode === 'CYBER') {
      col = 0x00ff66;
      emissive = 0x00aa44;
    } else if (this.currentMode === 'HOLOGRAM') {
      col = 0x00e5ff;
      emissive = 0x0088cc;
    }

    mat.color.setHex(col);
    mat.emissive.setHex(emissive);
  }

  public setTransformTarget(
    ndcPos: Point3D,
    rotation: { rx: number; ry: number; rz: number },
    scale: number
  ): void {
    // Lock position with smooth center tracking
    this.targetPosition.set(ndcPos.x * 4.5, ndcPos.y * 3.0, ndcPos.z * 2.0);
    this.targetRotation.set(rotation.rx, rotation.ry, rotation.rz);
    const clampedScale = Math.max(0.4, Math.min(3.5, scale));
    this.targetScale.set(clampedScale, clampedScale, clampedScale);
  }

  /**
   * Stabilized Vertex Morphing & Selective Part Deformation Engine
   * Locks center position and rotation to prevent shape wobbling and instability.
   */
  public deformWithFingertips(
    hands: HandTrackingData[],
    gestures: GestureState[],
    deltaTime: number
  ): void {
    if (!this.activeMesh || !this.originalPositions || !this.persistentOffsets) return;

    const geometry = this.activeMesh.geometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const vertexCount = posAttr.count;

    if (hands.length === 0) {
      // Release selections and smoothly return to base resting shape when hands leave
      this.selectedVertexIndex = -1;
      this.hoveredVertexIndex = -1;

      const lerpFactor = Math.min(1.0, 4.0 * deltaTime);
      for (let i = 0; i < posArray.length; i++) {
        const orig = this.originalPositions[i] + this.persistentOffsets[i];
        posArray[i] += (orig - posArray[i]) * lerpFactor;
      }
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
      this.updateWireframe();
      return;
    }

    // 1. Gather all Fingertip world positions
    const fingertipsWorld: THREE.Vector3[] = [];
    let primaryHandSpread = 1.0;
    let isPrimaryPinching = false;
    let primaryPinchPosWorld: THREE.Vector3 | null = null;

    for (let hIdx = 0; hIdx < hands.length; hIdx++) {
      const hand = hands[hIdx];
      const tips = TwoHandInteractor.getFingertipWorldPositions(hand);
      const spread = TwoHandInteractor.calculateFingerSpread(hand);
      if (hIdx === 0) primaryHandSpread = spread;

      const gesture = gestures.find((g) => g.hand === hand.handedness);
      const isPinch = gesture ? gesture.isPinching : false;

      const tipsList = [tips.thumb, tips.index, tips.middle, tips.ring, tips.pinky];
      for (let t = 0; t < tipsList.length; t++) {
        const tip = tipsList[t];
        const tipWorld = new THREE.Vector3(tip.x, tip.y, tip.z);
        fingertipsWorld.push(tipWorld);
      }

      if (isPinch) {
        isPrimaryPinching = true;
        const indexWorld = new THREE.Vector3(tips.index.x, tips.index.y, tips.index.z);
        const thumbWorld = new THREE.Vector3(tips.thumb.x, tips.thumb.y, tips.thumb.z);
        primaryPinchPosWorld = indexWorld.clone().add(thumbWorld).multiplyScalar(0.5);
      }
    }

    this.activeFingertipWorldPositions = fingertipsWorld;

    // Convert fingertips into Mesh local space for stable vertex operations
    const fingertipsLocal = fingertipsWorld.map((wPos) => {
      const local = wPos.clone();
      this.meshGroup.worldToLocal(local);
      return local;
    });

    const meshLocalPinch = primaryPinchPosWorld ? primaryPinchPosWorld.clone() : null;
    if (meshLocalPinch) {
      this.meshGroup.worldToLocal(meshLocalPinch);
    }

    // 2. Stable Selection & Hover with Pinch Hysteresis Lock
    if (!isPrimaryPinching) {
      // When not pinching, find closest control node for hover highlight
      let minHoverDist = Infinity;
      let closestIndex = -1;

      const testPoint = fingertipsLocal[1] || fingertipsLocal[0];
      if (testPoint) {
        for (let i = 0; i < vertexCount; i++) {
          const vLoc = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
          const d = vLoc.distanceTo(testPoint);
          if (d < minHoverDist) {
            minHoverDist = d;
            closestIndex = i;
          }
        }
      }

      if (minHoverDist < 1.0) {
        this.hoveredVertexIndex = closestIndex;
      } else {
        this.hoveredVertexIndex = -1;
      }

      // Reset selection when pinch is released
      this.selectedVertexIndex = -1;
    } else if (this.selectedVertexIndex === -1 && this.hoveredVertexIndex !== -1) {
      // Lock selection onto hovered vertex when pinch starts
      this.selectedVertexIndex = this.hoveredVertexIndex;
    }

    // 3. Stable Vertex Morphing
    const morphRate = Math.min(1.0, 7.0 * deltaTime);
    const fingerCount = fingertipsLocal.length;

    for (let i = 0; i < vertexCount; i++) {
      const origX = this.originalPositions[i * 3];
      const origY = this.originalPositions[i * 3 + 1];
      const origZ = this.originalPositions[i * 3 + 2];

      const currentX = posArray[i * 3];
      const currentY = posArray[i * 3 + 1];
      const currentZ = posArray[i * 3 + 2];

      let targetX = origX;
      let targetY = origY;
      let targetZ = origZ;

      if (this.selectedVertexIndex !== -1) {
        // Manipulate selected vertex part stably
        const selX = posAttr.getX(this.selectedVertexIndex);
        const selY = posAttr.getY(this.selectedVertexIndex);
        const selZ = posAttr.getZ(this.selectedVertexIndex);
        const selPos = new THREE.Vector3(selX, selY, selZ);

        const vPos = new THREE.Vector3(origX, origY, origZ);
        const distToSel = vPos.distanceTo(selPos);
        const influence = Math.exp(-distToSel * 2.2);

        if (meshLocalPinch) {
          const offsetVec = meshLocalPinch.clone().sub(selPos);
          targetX += offsetVec.x * influence;
          targetY += offsetVec.y * influence;
          targetZ += offsetVec.z * influence;

          if (i === this.selectedVertexIndex) {
            this.persistentOffsets[i * 3] += offsetVec.x * 0.1;
            this.persistentOffsets[i * 3 + 1] += offsetVec.y * 0.1;
            this.persistentOffsets[i * 3 + 2] += offsetVec.z * 0.1;
          }
        }

        const spreadFactor = primaryHandSpread;
        targetX += (origX * (spreadFactor - 1.0)) * influence;
        targetY += (origY * (spreadFactor - 1.0)) * influence;
        targetZ += (origZ * (spreadFactor - 1.0)) * influence;

      } else {
        // Dynamic Edge-to-Fingertip Morphing
        let closestTipDist = Infinity;
        let closestTipLoc: THREE.Vector3 | null = null;

        for (let f = 0; f < fingerCount; f++) {
          const tipLoc = fingertipsLocal[f];
          const d = tipLoc.distanceTo(new THREE.Vector3(origX, origY, origZ));
          if (d < closestTipDist) {
            closestTipDist = d;
            closestTipLoc = tipLoc;
          }
        }

        if (closestTipLoc && closestTipDist < 2.2) {
          const pullWeight = Math.max(0.0, 1.0 - closestTipDist / 2.2) * 0.35;
          targetX = THREE.MathUtils.lerp(origX, closestTipLoc.x, pullWeight);
          targetY = THREE.MathUtils.lerp(origY, closestTipLoc.y, pullWeight);
          targetZ = THREE.MathUtils.lerp(origZ, closestTipLoc.z, pullWeight);
        }

        // Finger spread scale
        const spreadScale = Math.max(0.3, Math.min(2.5, primaryHandSpread));
        targetX *= spreadScale;
        targetY *= spreadScale;
        targetZ *= spreadScale;

        // Apply persistent offsets
        targetX += this.persistentOffsets[i * 3];
        targetY += this.persistentOffsets[i * 3 + 1];
        targetZ += this.persistentOffsets[i * 3 + 2];
      }

      // Apply exponential moving average to eliminate high-frequency vertex shaking
      posArray[i * 3] += (targetX - currentX) * morphRate;
      posArray[i * 3 + 1] += (targetY - currentY) * morphRate;
      posArray[i * 3 + 2] += (targetZ - currentZ) * morphRate;
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();

    this.updateControlNodesHighlight(posAttr);
    this.updateWireframe();
  }

  private updateControlNodesHighlight(posAttr: THREE.BufferAttribute): void {
    this.controlNodesGroup.children.forEach((child) => {
      const node = child as THREE.Mesh;
      const vIdx = node.userData.vertexIndex as number;
      if (vIdx !== undefined && vIdx < posAttr.count) {
        node.position.set(posAttr.getX(vIdx), posAttr.getY(vIdx), posAttr.getZ(vIdx));

        const mat = node.material as THREE.MeshBasicMaterial;
        if (vIdx === this.selectedVertexIndex) {
          mat.color.setHex(0xff00ff);
          node.scale.set(2.0, 2.0, 2.0);
        } else if (vIdx === this.hoveredVertexIndex) {
          mat.color.setHex(0xffff00);
          node.scale.set(1.5, 1.5, 1.5);
        } else {
          mat.color.setHex(0x00ffff);
          node.scale.set(1.0, 1.0, 1.0);
        }
      }
    });
  }

  private updateWireframe(): void {
    if (!this.activeMesh || !this.wireframeMesh) return;
    if (this.wireframeMesh.geometry) this.wireframeMesh.geometry.dispose();
    this.wireframeMesh.geometry = new THREE.WireframeGeometry(this.activeMesh.geometry);
  }

  public update(deltaTime: number): void {
    if (!this.meshGroup) return;

    // Rock-solid smooth lerp for position, scale, and rotation
    const lerpSpeed = Math.min(1.0, 8.0 * deltaTime);
    this.meshGroup.position.lerp(this.targetPosition, lerpSpeed);
    this.meshGroup.scale.lerp(this.targetScale, lerpSpeed);

    this.meshGroup.rotation.x += (this.targetRotation.x - this.meshGroup.rotation.x) * lerpSpeed;
    this.meshGroup.rotation.y += (this.targetRotation.y - this.meshGroup.rotation.y) * lerpSpeed;
    this.meshGroup.rotation.z += (this.targetRotation.z - this.meshGroup.rotation.z) * lerpSpeed;
  }

  public dispose(): void {
    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      this.meshGroup.remove(child);
    }
  }
}
