import express from 'express';
import cors from 'cors';
import { presetRoutes } from './routes/presetRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Hand Motion Light Studio Backend',
    timestamp: new Date().toISOString(),
  });
});

// Preset Routes
app.use('/api/presets', presetRoutes);

// Central Error Handler
app.use(errorHandler);
