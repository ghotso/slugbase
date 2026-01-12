import passport from 'passport';
import { Strategy as OpenIDConnectStrategy, Profile } from 'passport-openidconnect';
import { queryOne, execute, query } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { decrypt } from '../utils/encryption.js';
import { generateUserKey } from '../utils/user-key.js';

export function setupOIDC() {
  // Serialization for OIDC OAuth flow (sessions are only used during OAuth redirect)
  // After OAuth completes, we convert to JWT and destroy the session
  passport.serializeUser((user: any, done) => {
    // Store minimal user info in session (only needed during OAuth flow)
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

export async function loadOIDCStrategies() {
  try {
    const providers = await query('SELECT id, provider_key, client_id, client_secret, issuer_url, authorization_url, token_url, userinfo_url, scopes, auto_create_users, default_role FROM oidc_providers', []);
    if (!providers || providers.length === 0) return;

    const providersList = Array.isArray(providers) ? providers : [providers];
    
    for (const provider of providersList) {
      // Decrypt client_secret when loading
      const decryptedSecret = decrypt(provider.client_secret);
      
      const verifyFunction = async (issuer: string, sub: string, profile: Profile, accessToken: string, refreshToken: string, done: (error: any, user?: any) => void) => {
            try {
              console.log(`[OIDC] Verify function called for provider: ${provider.provider_key}`);
              console.log(`[OIDC] Profile:`, {
                id: profile.id,
                displayName: profile.displayName,
                emails: profile.emails,
                name: profile.name,
              });
              console.log(`[OIDC] Sub:`, sub);
              
              const email = profile.emails?.[0]?.value || (profile as any).email;
              if (!email) {
                console.error(`[OIDC] No email found in profile for provider: ${provider.provider_key}`);
                return done(new Error('Email is required for OIDC authentication'), null);
              }
              
              console.log(`[OIDC] Processing authentication for email: ${email}`);

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
              // Also handle string representations from database queries
              const autoCreateValue = provider.auto_create_users;
              const autoCreate = autoCreateValue === true || 
                                 autoCreateValue === 1 || 
                                 autoCreateValue === '1' ||
                                 (autoCreateValue !== false && 
                                  autoCreateValue !== 0 && 
                                  autoCreateValue !== '0' &&
                                  autoCreateValue !== null &&
                                  autoCreateValue !== undefined);
              console.log(`[OIDC] Auto-create check for ${provider.provider_key}:`, {
                autoCreateValue,
                autoCreate,
              });
              if (!autoCreate) {
                console.error('OIDC auto-creation disabled. Provider:', provider.provider_key, 'auto_create_users:', autoCreateValue);
                return done(new Error('AUTO_CREATE_DISABLED'), null);
              }
              
              console.log(`[OIDC] Creating new user for email: ${email}`);

              // Create new user
              const userId = uuidv4();
              let userKey = await generateUserKey();
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

              // Retry logic for user_key collisions (should be extremely rare)
              let retries = 0;
              const maxRetries = 3;
              while (retries < maxRetries) {
                try {
                  await execute(
                    `INSERT INTO users (id, email, name, user_key, is_admin, oidc_sub, oidc_provider) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, email, name, userKey, isAdmin, sub, provider.provider_key]
                  );
                  break; // Success, exit retry loop
                } catch (error: any) {
                  // If user_key collision, generate new key and retry
                  if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate')) 
                      && error.message.includes('user_key')) {
                    retries++;
                    if (retries >= maxRetries) {
                      return done(new Error('Failed to create user. Please try again.'), null);
                    }
                    userKey = await generateUserKey();
                    continue; // Retry with new key
                  }
                  // For other errors (like email duplicate), throw to outer catch
                  throw error;
                }
              }

              user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
              console.log(`[OIDC] User created successfully:`, { id: user?.id, email: user?.email });
              return done(null, user);
            } catch (error: any) {
              console.error(`[OIDC] Error during user creation/update:`, {
                message: error.message,
                stack: error.stack,
                name: error.name,
              });
              
              // Handle unique constraint violation (email already exists)
              if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate'))) {
                console.log(`[OIDC] Unique constraint violation, trying to get existing user`);
                // Try to get the existing user by email
                const existingUser = await queryOne('SELECT * FROM users WHERE email = ?', [profile.emails?.[0]?.value || (profile as any).email]);
                if (existingUser) {
                  console.log(`[OIDC] Found existing user, updating OIDC info`);
                  // Update OIDC info for existing user
                  await execute(
                    'UPDATE users SET oidc_sub = ?, oidc_provider = ? WHERE id = ?',
                    [sub, provider.provider_key, existingUser.id]
                  );
                  const updatedUser = await queryOne('SELECT * FROM users WHERE id = ?', [existingUser.id]);
                  console.log(`[OIDC] User updated successfully:`, { id: updatedUser?.id, email: updatedUser?.email });
                  return done(null, updatedUser);
                }
              }
              console.error(`[OIDC] Fatal error, cannot proceed:`, error);
              return done(error, null);
            }
      };

      // Construct callback URL - must match exactly what's registered with the OIDC provider
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const callbackURL = `${baseUrl}/api/auth/${provider.provider_key}/callback`;
      
      console.log(`[OIDC] Loading strategy for provider: ${provider.provider_key}`);
      console.log(`[OIDC] Issuer URL: ${provider.issuer_url}`);
      console.log(`[OIDC] Callback URL: ${callbackURL}`);
      console.log(`[OIDC] Scopes: ${provider.scopes}`);
      console.log(`[OIDC] Auto-create users: ${provider.auto_create_users}`);
      
      // Some OIDC providers don't return ID tokens in the token response
      // passport-openidconnect will use the userInfo endpoint as fallback
      // but we need to ensure the configuration allows this
      // Use custom endpoints if provided, otherwise use standard OIDC defaults
      const authorizationURL = provider.authorization_url || `${provider.issuer_url}/authorize`;
      const tokenURL = provider.token_url || `${provider.issuer_url}/token`;
      const userInfoURL = provider.userinfo_url || `${provider.issuer_url}/userinfo`;
      
      const strategyConfig: any = {
        issuer: provider.issuer_url,
        authorizationURL: authorizationURL,
        tokenURL: tokenURL,
        userInfoURL: userInfoURL,
        clientID: provider.client_id,
        clientSecret: decryptedSecret,
        callbackURL: callbackURL,
        scope: provider.scopes.split(' '),
        skipUserProfile: false, // Always fetch from userInfo if needed
      };
      
      console.log(`[OIDC] Using endpoints:`, {
        authorization: authorizationURL,
        token: tokenURL,
        userInfo: userInfoURL,
        customEndpoints: !!(provider.authorization_url || provider.token_url || provider.userinfo_url),
      });
      
      console.log(`[OIDC] Strategy config for ${provider.provider_key}:`, {
        issuer: strategyConfig.issuer,
        authorizationURL: strategyConfig.authorizationURL,
        tokenURL: strategyConfig.tokenURL,
        userInfoURL: strategyConfig.userInfoURL,
        callbackURL: strategyConfig.callbackURL,
        scopes: strategyConfig.scope,
      });
      
      passport.use(
        provider.provider_key,
        new OpenIDConnectStrategy(strategyConfig, verifyFunction as any)
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
