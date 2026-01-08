import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import { queryOne, execute, query } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export function setupOIDC() {
  passport.serializeUser((user: any, done) => {
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
    const providers = await query('SELECT * FROM oidc_providers', []);
    if (!providers || providers.length === 0) return;

    const providersList = Array.isArray(providers) ? providers : [providers];
    
    for (const provider of providersList) {
      passport.use(
        provider.provider_key,
        new OpenIDConnectStrategy(
          {
            issuer: provider.issuer_url,
            authorizationURL: `${provider.issuer_url}/authorize`,
            tokenURL: `${provider.issuer_url}/token`,
            userInfoURL: `${provider.issuer_url}/userinfo`,
            clientID: provider.client_id,
            clientSecret: provider.client_secret,
            callbackURL: `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/${provider.provider_key}/callback`,
            scope: provider.scopes.split(' '),
          },
          async (issuer, sub, profile, accessToken, refreshToken, done) => {
            try {
              // Check if user exists
              let user = await queryOne(
                'SELECT * FROM users WHERE oidc_sub = ? AND oidc_provider = ?',
                [sub, provider.provider_key]
              );

              if (!user) {
                // Create new user
                const userId = uuidv4();
                const userKey = generateUserKey();
                const email = profile.emails?.[0]?.value || profile.email || `${sub}@${provider.provider_key}`;
                const name = profile.displayName || profile.name || email;

                // Check if this is the first user (auto-admin)
                const userCount = await queryOne('SELECT COUNT(*) as count FROM users', []);
                const isFirstUser = !userCount || parseInt((userCount as any).count) === 0;

                await execute(
                  `INSERT INTO users (id, email, name, user_key, is_admin, oidc_sub, oidc_provider) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [userId, email, name, userKey, isFirstUser, sub, provider.provider_key]
                );

                user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
              }

              return done(null, user);
            } catch (error: any) {
              return done(error, null);
            }
          }
        )
      );
    }
  } catch (error) {
    console.error('Error loading OIDC strategies:', error);
  }
}

function generateUserKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function reloadOIDCStrategies() {
  // Remove existing strategies
  const strategies = Object.keys(passport._strategies);
  strategies.forEach(key => {
    if (key !== 'session') {
      passport.unuse(key);
    }
  });
  
  // Reload from database
  await loadOIDCStrategies();
}
