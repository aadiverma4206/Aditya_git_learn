const memoryPresets = [
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
    getAllPresets() {
        return memoryPresets;
    }
    getPresetById(id) {
        return memoryPresets.find((p) => p.id === id);
    }
    savePreset(name, config) {
        const newPreset = {
            id: `preset-${Date.now()}`,
            name,
            config,
            createdAt: new Date().toISOString(),
        };
        memoryPresets.push(newPreset);
        return newPreset;
    }
}
