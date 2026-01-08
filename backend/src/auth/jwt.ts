import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { queryOne } from '../db/index.js';
import { extractTokenFromRequest } from '../utils/jwt.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'slugbase-jwt-secret-change-in-production';

/**
 * Setup JWT strategy for Passport
 */
export function setupJWT() {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: (req) => extractTokenFromRequest(req),
        secretOrKey: JWT_SECRET,
        passReqToCallback: true,
      },
      async (req: any, payload: any, done: any) => {
        try {
          // Fetch fresh user data from database
          const user = await queryOne('SELECT * FROM users WHERE id = ?', [payload.id]);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}
