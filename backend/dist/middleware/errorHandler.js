import { logger } from '../utils/logger.js';
export function errorHandler(err, req, res, next) {
    logger.error('Unhandled server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    });
}
