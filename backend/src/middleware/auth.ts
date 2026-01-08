import { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    user_key: string;
    is_admin: boolean;
  };
}

// Type guard to check if request is AuthRequest
export function isAuthRequest(req: Request): req is AuthRequest {
  return 'user' in req;
}

/**
 * Middleware to authenticate requests using JWT
 * Uses Passport JWT strategy to verify token from cookie or Authorization header
 */
export function requireAuth(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      (req as AuthRequest).user = user;
      next();
    })(req, res, next);
  };
}

export function requireAdmin(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!user.is_admin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      (req as AuthRequest).user = user;
      next();
    })(req, res, next);
  };
}
