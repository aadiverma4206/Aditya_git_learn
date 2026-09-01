import { app } from './app.js';
import { logger } from './utils/logger.js';

let PORT = Number(process.env.PORT) || 5001;

function startServer(port: number) {
  const server = app.listen(port, () => {
    logger.info(`Hand Motion Light Studio backend running on http://localhost:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      logger.error('Server error:', err);
    }
  });
}

startServer(PORT);
