import { Request, Response } from 'express';
import { PresetService } from '../services/presetService.js';

const presetService = new PresetService();

export class PresetController {
  public static getPresets(req: Request, res: Response): void {
    const presets = presetService.getAllPresets();
    res.json({ success: true, data: presets });
  }

  public static getPresetById(req: Request, res: Response): void {
    const id = String(req.params.id);
    const preset = presetService.getPresetById(id);
    if (!preset) {
      res.status(404).json({ success: false, error: 'Preset not found' });
      return;
    }
    res.json({ success: true, data: preset });
  }

  public static createPreset(req: Request, res: Response): void {
    const { name, config } = req.body;
    if (!name || !config) {
      res.status(400).json({ success: false, error: 'Name and config are required' });
      return;
    }
    const preset = presetService.savePreset(name, config);
    res.status(201).json({ success: true, data: preset });
  }
}
