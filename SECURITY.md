# Security Documentation

## Data Encryption

### Encrypted Data

The following sensitive data is encrypted in the database:

1. **OIDC Client Secrets** (`oidc_providers.client_secret`)
   - Encrypted using AES-256-GCM
   - Automatically encrypted when stored via API
   - Automatically decrypted when read for OIDC authentication
   - Never exposed in API responses

### Encryption Implementation

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: scrypt with random salt per encryption
- **Key Storage**: Environment variable `ENCRYPTION_KEY` (64 hex characters)
- **Format**: `salt:iv:tag:encryptedData` (all hex encoded)

### Generating Encryption Key

Generate a secure encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using the provided script
node backend/scripts/generate-encryption-key.js
```

Add the generated key to your `.env` file:
```
ENCRYPTION_KEY=your-64-character-hex-key-here
```

### Migration from Plain Text

If you have existing OIDC providers with plain-text secrets, run the migration script:

```bash
tsx backend/scripts/encrypt-existing-secrets.ts
```

This will:
- Detect plain-text secrets
- Encrypt them using the current `ENCRYPTION_KEY`
- Skip already encrypted secrets
- Preserve backward compatibility

### Important Security Notes

1. **Backup the Encryption Key**: If you lose `ENCRYPTION_KEY`, encrypted data cannot be decrypted!
2. **Never Commit Keys**: The encryption key should never be committed to version control
3. **Rotate Keys**: If a key is compromised, you'll need to:
   - Generate a new key
   - Re-encrypt all data (requires decrypting with old key, encrypting with new key)
4. **Production**: Always set `ENCRYPTION_KEY` in production. The default development key is insecure!

## User Passwords

SlugBase supports local user authentication with passwords:
- Passwords are hashed using **bcrypt** with 10 rounds
- Passwords are stored in `users.password_hash` column
- Minimum password length: 8 characters
- Users can authenticate via:
  - Local email/password authentication
  - OIDC providers (optional)
  - Both methods can be used simultaneously

## Authentication (JWT-Based)

SlugBase uses **JWT (JSON Web Tokens)** for authentication instead of server-side sessions:

### JWT Implementation
- **Token Storage**: JWT tokens are stored in `httpOnly` cookies (not accessible via JavaScript)
- **Token Signing**: Uses `JWT_SECRET` from environment variables (or `SESSION_SECRET` as fallback)
- **Token Expiration**: Configurable via `JWT_EXPIRES_IN` (default: 7 days)
- **Cookie Security**:
  - `httpOnly: true` (prevents XSS attacks)
  - `secure: true` in production (HTTPS only)
  - `sameSite: strict` in production (CSRF protection)

### Advantages of JWT
- **Stateless**: No server-side session storage required
- **Scalable**: Works across multiple servers without shared session store
- **Secure**: Tokens are signed and verified cryptographically
- **Flexible**: Can be used in cookies or Authorization headers

### Token Generation
- Tokens are generated on successful login (local or OIDC)
- Tokens contain: `id`, `email`, `name`, `user_key`, `is_admin`
- Tokens are verified on every authenticated request
- User data is fetched fresh from database on each request (for up-to-date permissions)

## API Security

- All authenticated endpoints require valid JWT tokens (from cookies or Authorization header)
- Admin-only endpoints check `is_admin` flag from JWT payload
- OIDC client secrets are never returned in API responses
- Email is used as the primary identifier (unique constraint enforced)
- JWT tokens are verified on every request using Passport JWT strategy

## Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Encryption Key**: Store `ENCRYPTION_KEY` securely (e.g., secret management service)
3. **Database**: Use encrypted database connections in production
4. **HTTPS**: Always use HTTPS in production
5. **Regular Updates**: Keep dependencies updated for security patches
