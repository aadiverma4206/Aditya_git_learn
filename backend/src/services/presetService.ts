export interface Preset {
  id: string;
  name: string;
  config: Record<string, any>;
  createdAt: string;
}

const memoryPresets: Preset[] = [
  {
    id: 'cyber-neon-default',
    name: 'Cyber Neon Performance',
    config: {
      visualMode: 'NEON',
      shapeType: 'PRISM',
      particlesEnabled: true,
      trailsEnabled: true,
      bloomEnabled: true,
      bloomStrength: 1.5,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'holographic-panel',
    name: 'Futuristic Hologram',
    config: {
      visualMode: 'HOLOGRAM',
      shapeType: 'HOLOGRAM_PANEL',
      particlesEnabled: true,
      trailsEnabled: true,
      twoHandInteraction: true,
    },
    createdAt: new Date().toISOString(),
  },
];

export class PresetService {
  public getAllPresets(): Preset[] {
    return memoryPresets;
  }

  public getPresetById(id: string): Preset | undefined {
    return memoryPresets.find((p) => p.id === id);
  }

  public savePreset(name: string, config: Record<string, any>): Preset {
    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      config,
      createdAt: new Date().toISOString(),
    };
    memoryPresets.push(newPreset);
    return newPreset;
  }
}
