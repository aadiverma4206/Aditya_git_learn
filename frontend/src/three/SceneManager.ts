import * as THREE from 'three';
import { GeometricObjects } from './GeometricObjects';
import { GpuParticleSystem } from '../particleEngine/GpuParticleSystem';
import { StudioConfig, HandTrackingData, TwoHandMetrics, VisualMode, GestureState } from '../types';
import { TwoHandInteractor } from './TwoHandInteractor';

export class SceneManager {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometricObjects: GeometricObjects;
  private particleSystem: GpuParticleSystem;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private isDisposed: boolean = false;

  constructor(container: HTMLDivElement) {
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Three.js Scene Setup
    this.scene = new THREE.Scene();

    // Perspective Camera matching webcam viewpoint
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 7.5);

    // WebGL Renderer with alpha transparency for compositing over video
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0); // Transparent background

    this.container.appendChild(this.renderer.domElement);

    // Futuristic Scene Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0x00f0ff, 2.0);
    this.directionalLight.position.set(2, 4, 5);
    this.scene.add(this.directionalLight);

    // Initialize 3D Geometry System & Particle System
    this.geometricObjects = new GeometricObjects();
    this.scene.add(this.geometricObjects.getGroup());

    this.particleSystem = new GpuParticleSystem();
    this.scene.add(this.particleSystem.getPoints());
  }

  public handleResize(): void {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public render(
    hands: HandTrackingData[],
    gestures: GestureState[],
    config: StudioConfig,
    deltaTime: number
  ): void {
    if (this.isDisposed) return;

    // 1. Update Geometry based on single/two-hand tracking
    if (config.geometryEnabled) {
      this.geometricObjects.getGroup().visible = true;
      this.geometricObjects.setShapeType(config.shapeType);
      this.geometricObjects.setVisualMode(config.visualMode);

      if (hands.length >= 2 && config.twoHandInteraction) {
        const metrics = TwoHandInteractor.calculateMetrics(hands);
        if (metrics.active) {
          this.geometricObjects.setTransformTarget(
            metrics.midPoint,
            { rx: 0, ry: 0, rz: metrics.angle },
            metrics.scale
          );
        }
      } else if (hands.length === 1) {
        const transform = TwoHandInteractor.getTransformForSingleHand(hands[0]);
        this.geometricObjects.setTransformTarget(
          transform.ndcPos,
          transform.rotation,
          transform.scale
        );
      }

      // Deform shape edges and sculpt vertex parts using hand fingertips and gestures
      this.geometricObjects.deformWithFingertips(hands, gestures, deltaTime);
    } else {
      this.geometricObjects.getGroup().visible = false;
    }

    this.geometricObjects.update(deltaTime);

    // 2. Emit & Update Particles
    if (config.particlesEnabled && hands.length > 0) {
      this.particleSystem.getPoints().visible = true;
      const allFingertips = hands.flatMap((h) => Object.values(h.fingertips));
      this.particleSystem.emitFromFingertips(
        allFingertips,
        config.particleAmount / 50,
        config.visualMode
      );
    } else {
      this.particleSystem.getPoints().visible = false;
    }
    this.particleSystem.update(deltaTime);

    // 3. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public dispose(): void {
    this.isDisposed = true;
    this.geometricObjects.dispose();
    this.particleSystem.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
