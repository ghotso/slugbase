import passport from 'passport';
import { Strategy as OpenIDConnectStrategy, Profile } from 'passport-openidconnect';
import crypto from 'crypto';
import { queryOne, execute, query } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { decrypt } from '../utils/encryption.js';

function generateUserKey(): string {
  // Use cryptographically secure random generation
  // Generate 8 random bytes and convert to base36-like string (alphanumeric)
  // Convert to hex first, then take first 12 characters for a good length
  return crypto.randomBytes(8).toString('hex').substring(0, 12);
}

export function setupOIDC() {
  // No serialization needed for JWT-based auth
  // JWT strategy handles user lookup directly
}

export async function loadOIDCStrategies() {
  try {
    const providers = await query('SELECT * FROM oidc_providers', []);
    if (!providers || providers.length === 0) return;

    const providersList = Array.isArray(providers) ? providers : [providers];
    
    for (const provider of providersList) {
      // Decrypt client_secret when loading
      const decryptedSecret = decrypt(provider.client_secret);
      
      const verifyFunction = async (issuer: string, sub: string, profile: Profile, accessToken: string, refreshToken: string, done: (error: any, user?: any) => void) => {
            try {
              const email = profile.emails?.[0]?.value || (profile as any).email;
              if (!email) {
                return done(new Error('Email is required for OIDC authentication'), null);
              }

              // Use email as primary identifier - check if user exists by email
              let user = await queryOne(
                'SELECT * FROM users WHERE email = ?',
                [email]
              );

              if (user) {
                // User exists - update OIDC info if not set
                if (!user.oidc_sub || !user.oidc_provider) {
                  await execute(
                    'UPDATE users SET oidc_sub = ?, oidc_provider = ? WHERE id = ?',
                    [sub, provider.provider_key, user.id]
                  );
                  user = await queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
                }
                // If user exists with different OIDC provider, that's fine - email is the identifier
                return done(null, user);
              }

              // User doesn't exist - check if auto-creation is enabled
              // Handle both SQLite (0/1) and PostgreSQL (true/false) boolean values
              const autoCreate = provider.auto_create_users !== false && 
                                 provider.auto_create_users !== 0 && 
                                 provider.auto_create_users !== '0';
              if (!autoCreate) {
                return done(new Error('User auto-creation is disabled for this provider'), null);
              }

              // Create new user
              const userId = uuidv4();
              const userKey = generateUserKey();
              const name = profile.displayName || profile.name || email;

              // Determine user role
              let isAdmin = false;
              const defaultRole = provider.default_role || 'user';
              
              if (defaultRole === 'admin') {
                isAdmin = true;
              } else {
                // Check if this is the first user (auto-admin for first user, regardless of default_role)
                const userCount = await queryOne('SELECT COUNT(*) as count FROM users', []);
                isAdmin = !userCount || parseInt((userCount as any).count) === 0;
              }

              await execute(
                `INSERT INTO users (id, email, name, user_key, is_admin, oidc_sub, oidc_provider) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, email, name, userKey, isAdmin, sub, provider.provider_key]
              );

              user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
              return done(null, user);
            } catch (error: any) {
              // Handle unique constraint violation (email already exists)
              if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate'))) {
                // Try to get the existing user by email
                const existingUser = await queryOne('SELECT * FROM users WHERE email = ?', [profile.emails?.[0]?.value || (profile as any).email]);
                if (existingUser) {
                  // Update OIDC info for existing user
                  await execute(
                    'UPDATE users SET oidc_sub = ?, oidc_provider = ? WHERE id = ?',
                    [sub, provider.provider_key, existingUser.id]
                  );
                  const updatedUser = await queryOne('SELECT * FROM users WHERE id = ?', [existingUser.id]);
                  return done(null, updatedUser);
                }
              }
              return done(error, null);
            }
      };

      passport.use(
        provider.provider_key,
        new OpenIDConnectStrategy(
          {
            issuer: provider.issuer_url,
            authorizationURL: `${provider.issuer_url}/authorize`,
            tokenURL: `${provider.issuer_url}/token`,
            userInfoURL: `${provider.issuer_url}/userinfo`,
            clientID: provider.client_id,
            clientSecret: decryptedSecret,
            callbackURL: `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/${provider.provider_key}/callback`,
            scope: provider.scopes.split(' '),
          },
          verifyFunction as any
        )
      );
    }
  } catch (error) {
    console.error('Error loading OIDC strategies:', error);
  }
}


export async function reloadOIDCStrategies() {
  // Remove existing strategies (except 'jwt' which is our JWT strategy)
  // Use a type assertion to access internal strategies map
  const strategies = Object.keys((passport as any)._strategies || {});
  strategies.forEach((key: string) => {
    if (key !== 'jwt') {
      passport.unuse(key);
    }
  });
  
  // Reload from database
  await loadOIDCStrategies();
}
