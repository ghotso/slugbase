// IMPORTANT: Load environment variables FIRST, before any other imports
// that might use process.env at module load time
import './load-env.js';

// Now import other modules (they can safely use process.env)
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDatabase, isInitialized, queryOne } from './db/index.js';
import { setupOIDC, loadOIDCStrategies } from './auth/oidc.js';
import { setupJWT } from './auth/jwt.js';
import { validateEnvironmentVariables } from './utils/env-validation.js';
import { setupSecurityHeaders, generalRateLimiter, strictRateLimiter } from './middleware/security.js';
import { validateUrl } from './utils/validation.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './routes/auth.js';
import bookmarkRoutes from './routes/bookmarks.js';
import folderRoutes from './routes/folders.js';
import tagRoutes from './routes/tags.js';
import redirectRoutes from './routes/redirect.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import oidcProviderRoutes from './routes/oidc-providers.js';
import adminUserRoutes from './routes/admin/users.js';
import adminTeamRoutes from './routes/admin/teams.js';
import adminSettingsRoutes from './routes/admin/settings.js';
import passwordResetRoutes from './routes/password-reset.js';
import csrfRoutes from './routes/csrf.js';

// Validate required environment variables before starting
validateEnvironmentVariables();

const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security headers (must be early in middleware chain)
app.use(setupSecurityHeaders());

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../public')));
}

// Middleware
// CORS: Allow both the configured FRONTEND_URL and common development ports
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  frontendUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow any localhost origin
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies for JWT

// General rate limiting (applied to all routes)
app.use(generalRateLimiter);

// Passport initialization (JWT-based, no sessions)
app.use(passport.initialize());
setupJWT(); // Setup JWT strategy
setupOIDC(); // Setup OIDC strategies

// Swagger API Documentation (standalone page, not in admin UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SlugBase API Documentation',
}));

// Routes (register CSRF token endpoint BEFORE CSRF protection)
app.use('/api/csrf-token', csrfRoutes);

// CSRF protection for state-changing operations
// Note: CSRF tokens are provided via GET /api/csrf-token endpoint
// Exclude certain endpoints that don't need CSRF (like password reset, OIDC callbacks)
import { csrfProtection } from './middleware/security.js';
app.use((req: any, res: any, next: any) => {
  // Skip CSRF for GET, HEAD, OPTIONS, and public endpoints
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Skip CSRF for password reset and OIDC callback endpoints
  if (req.path.startsWith('/api/password-reset') || 
      req.path.includes('/callback') ||
      req.path === '/api/auth/setup' ||
      req.path === '/api/health' ||
      req.path === '/api/csrf-token' ||
      req.path.startsWith('/api-docs')) {
    return next();
  }
  // Apply CSRF protection
  csrfProtection(req, res, next);
});

// All other routes
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/oidc-providers', oidcProviderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/teams', adminTeamRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Redirect routes - handle 2-segment paths only (user_key/slug pattern)
// Use regex to ensure route only matches paths with exactly 2 non-empty segments
// This prevents the route from matching `/` (root path)
app.get(/^\/([^\/]+)\/([^\/]+)$/, strictRateLimiter, async (req, res, next) => {
  try {
    // Extract user_key and slug from the matched groups
    const match = req.path.match(/^\/([^\/]+)\/([^\/]+)$/);
    if (!match) {
      return next();
    }
    const user_key = match[1];
    const slug = match[2];

    // user_key and slug are already extracted from regex match above
    if (!user_key || !slug) {
      return next();
    }

    const bookmark = await queryOne(
      `SELECT b.* FROM bookmarks b
       INNER JOIN users u ON b.user_id = u.id
       WHERE u.user_key = ? AND b.slug = ? AND b.forwarding_enabled = TRUE`,
      [user_key, slug]
    );

    if (!bookmark) {
      return res.status(404).send('Not Found');
    }

    const redirectUrl = (bookmark as any).url;
    const urlValidation = validateUrl(redirectUrl);
    if (!urlValidation.valid) {
      console.error('Invalid redirect URL detected:', redirectUrl);
      return res.status(400).send('Invalid redirect URL');
    }

    res.redirect(302, redirectUrl);
  } catch (error: any) {
    console.error('Redirect error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Serve frontend root route in production (AFTER redirect route, since redirect requires 2 segments)
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../../public/index.html'));
  });
}

// Serve frontend catch-all in production (for SPA routing - before error handlers)
// This catches all non-API, non-redirect routes for SPA client-side routing
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    // Skip API routes and redirect patterns (2 segments)
    if (req.path.startsWith('/api/') || req.path.startsWith('/api-docs')) {
      return next();
    }
    const pathSegments = req.path.split('/').filter(Boolean);
    if (pathSegments.length === 2) {
      // This might be a redirect route, let it fall through
      return next();
    }
    res.sendFile(join(__dirname, '../../public/index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        return next();
      }
    });
  });
}

// Error handling (must be last)
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database on startup
async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    // Load OIDC strategies after database is initialized
    await loadOIDCStrategies();
    
    const initialized = await isInitialized();
    console.log(`System initialized: ${initialized}`);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
