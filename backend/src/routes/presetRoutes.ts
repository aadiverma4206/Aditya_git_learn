import { Router } from 'express';
import { PresetController } from '../controllers/presetController.js';

export const presetRoutes = Router();

presetRoutes.get('/', PresetController.getPresets);
presetRoutes.get('/:id', PresetController.getPresetById);
presetRoutes.post('/', PresetController.createPreset);
