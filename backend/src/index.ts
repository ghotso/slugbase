import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, isInitialized } from './db/index.js';
import { setupOIDC, loadOIDCStrategies } from './auth/oidc.js';
import { setupJWT } from './auth/jwt.js';
import { validateEnvironmentVariables } from './utils/env-validation.js';
import { setupSecurityHeaders, generalRateLimiter } from './middleware/security.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Validate required environment variables before starting
validateEnvironmentVariables();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers (must be early in middleware chain)
app.use(setupSecurityHeaders());

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../public')));
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Routes
app.use('/api/csrf-token', csrfRoutes); // Must be before CSRF protection
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
app.use('/', redirectRoutes); // Redirect routes at root level

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling (must be last)
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
app.use(notFoundHandler);
app.use(errorHandler);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
  });
}

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
