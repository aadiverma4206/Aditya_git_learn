import * as THREE from 'three';
import { FingertipData, VisualMode } from '../types';
import { CoordinateTransformer } from '../handTracking/CoordinateTransformer';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;      // 1.0 (new) to 0.0 (dead)
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class GpuParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 1200;
  private particlePoints: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private material: THREE.PointsMaterial;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(this.geometry, this.material);
  }

  public getPoints(): THREE.Points {
    return this.particlePoints;
  }

  public emitFromFingertips(
    fingertips: FingertipData[],
    amountMultiplier: number,
    visualMode: VisualMode
  ): void {
    for (const ft of fingertips) {
      if (!ft.visible) continue;

      // Speed-reactive particle emission rate
      const speedFactor = Math.max(0.2, ft.speed * 3.0);
      const spawnCount = Math.floor(speedFactor * amountMultiplier * 3);

      const ndc = CoordinateTransformer.toWebGLNDC({
        x: ft.smoothedX,
        y: ft.smoothedY,
        z: ft.smoothedZ,
      });

      // World coordinates around fingertip
      const worldX = ndc.x * 4.5;
      const worldY = ndc.y * 3.0;
      const worldZ = ndc.z * 2.0;

      const isLeft = ft.hand === 'left';
      let baseColor = new THREE.Color(isLeft ? 0xff0088 : 0x00f0ff);

      if (visualMode === 'THERMAL') {
        baseColor = new THREE.Color(0xff4400);
      } else if (visualMode === 'CYBER') {
        baseColor = new THREE.Color(isLeft ? 0x9900ff : 0x00ff66);
      } else if (visualMode === 'HOLOGRAM') {
        baseColor = new THREE.Color(0x00e5ff);
      }

      for (let i = 0; i < spawnCount; i++) {
        if (this.particles.length >= this.maxParticles) break;

        const spread = 0.15;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.01 + Math.random() * 0.03) * (1.0 + ft.speed * 2.0);

        this.particles.push({
          x: worldX + (Math.random() - 0.5) * spread,
          y: worldY + (Math.random() - 0.5) * spread,
          z: worldZ + (Math.random() - 0.5) * spread,
          vx: Math.cos(angle) * speed + ft.vx * 0.05,
          vy: Math.sin(angle) * speed + ft.vy * 0.05,
          vz: (Math.random() - 0.5) * speed,
          life: 1.0,
          maxLife: 0.4 + Math.random() * 0.8, // Lifespan in seconds
          size: 0.12 + Math.random() * 0.15,
          color: baseColor.clone(),
        });
      }
    }
  }

  public update(deltaTime: number): void {
    const alive: Particle[] = [];

    let pIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= deltaTime / p.maxLife;

      if (p.life > 0) {
        // Physical motion drift & friction deceleration
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vz *= 0.96;

        const fadeAlpha = p.life;

        this.positions[pIdx * 3] = p.x;
        this.positions[pIdx * 3 + 1] = p.y;
        this.positions[pIdx * 3 + 2] = p.z;

        this.colors[pIdx * 3] = p.color.r * fadeAlpha;
        this.colors[pIdx * 3 + 1] = p.color.g * fadeAlpha;
        this.colors[pIdx * 3 + 2] = p.color.b * fadeAlpha;

        this.sizes[pIdx] = p.size * fadeAlpha;

        alive.push(p);
        pIdx++;
      }
    }

    // Zero out unused vertex buffers
    for (let i = pIdx; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = 0;
      this.positions[i * 3 + 2] = 0;
      this.sizes[i] = 0;
    }

    this.particles = alive;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
