import { Request, Response, NextFunction } from 'express';

/**
 * Error handling middleware
 * Prevents information disclosure in production
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log error details server-side
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't expose error details in production
  if (process.env.NODE_ENV === 'production') {
    // Generic error messages for production
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message || 'An error occurred',
      });
    }

    // Database errors
    if (err.message && (err.message.includes('UNIQUE constraint') || err.message.includes('duplicate'))) {
      return res.status(400).json({ error: 'A record with this value already exists' });
    }

    // Generic server error
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Development: show more details
  return res.status(err.statusCode || 500).json({
    error: err.message || 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}
