import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = (process.env.JWT_SECRET || process.env.SESSION_SECRET || 'slugbase-jwt-secret-change-in-production') as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string;

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  user_key: string;
  is_admin: boolean;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: JWTPayload): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      user_key: user.user_key,
      is_admin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT token from request (cookie or Authorization header)
 */
export function extractTokenFromRequest(req: any): string | null {
  // Try cookie first (httpOnly cookie)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Try Authorization header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}
