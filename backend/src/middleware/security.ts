import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';

/**
 * Rate limiting configuration
 * Disabled in development for easier testing
 */
const isDevelopment = process.env.NODE_ENV === 'development';

// No-op rate limiter for development (allows all requests)
const noOpRateLimiter = (req: any, res: any, next: any) => next();

export const authRateLimiter = isDevelopment
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // Limit each IP to 300 failed auth attempts per windowMs
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
    });

export const generalRateLimiter = isDevelopment
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 2000, // Limit each IP to 2000 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });

export const strictRateLimiter = isDevelopment
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // Limit each IP to 500 requests per windowMs
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Security headers middleware
 */
export function setupSecurityHeaders() {
  // Only enable HSTS if we're actually using HTTPS
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const isHttps = baseUrl.startsWith('https://');
  
  const cspDirectives: any = {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs inline styles
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"], // Allow data URIs and HTTPS images (for favicons)
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"], // Allow iframes for Swagger UI
  };
  
  // Only upgrade insecure requests when using HTTPS (set to null to disable when using HTTP)
  if (isHttps) {
    cspDirectives.upgradeInsecureRequests = [];
  } else {
    cspDirectives.upgradeInsecureRequests = null; // Explicitly disable when using HTTP
  }
  
  return helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    crossOriginOpenerPolicy: false, // Disable for compatibility (can cause issues with HTTP)
    hsts: isHttps ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false, // Disable HSTS when not using HTTPS
  });
}

/**
 * CSRF protection middleware (custom implementation for JWT-based auth)
 * Generates and validates CSRF tokens stored in httpOnly cookies
 * Note: SameSite=strict cookies provide good CSRF protection, but tokens add defense in depth
 */
export function csrfProtection(req: any, res: any, next: any) {
  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body?.csrfToken;
  const cookieToken = req.cookies?._csrf;

  // If no cookie token exists, generate one (for first request)
  if (!cookieToken) {
    generateCSRFToken(req, res);
    // Allow first request to proceed (they'll get token in response)
    return next();
  }

  // Validate token for state-changing operations
  if (token && token === cookieToken) {
    return next();
  }

  // If token doesn't match, return error
  return res.status(403).json({ error: 'Invalid CSRF token' });
}

/**
 * Generate CSRF token and set cookie
 */
export function generateCSRFToken(req: any, res: any): string {
  const token = crypto.randomBytes(32).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('_csrf', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  return token;
}
