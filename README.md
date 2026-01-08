# SlugBase

SlugBase is an open-source, self-hosted **bookmark manager with optional link forwarding**.

## Features

- 📚 **Bookmark Management** - Store and organize your bookmarks
- 🔗 **Link Forwarding** - Optional short redirect URLs (`/{user_key}/{slug}`)
- 🏷️ **Tags & Folders** - Organize bookmarks with tags and folders
- 🔐 **OIDC Authentication** - Login with configurable OIDC providers
- 🌍 **Internationalization** - Support for multiple languages (en, de, fr)
- 🌓 **Dark/Light Mode** - Auto-detect or manual toggle
- 💾 **SQLite/PostgreSQL** - SQLite by default, PostgreSQL supported
- 🐳 **Docker Ready** - Easy deployment with Docker

## Quick Start

### Development

1. Install dependencies:
```bash
npm install
```

2. Start development servers:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`
Frontend runs on `http://localhost:3000`

### Production with Docker

1. Build and run:
```bash
docker-compose up -d
```

2. Access the application at `http://localhost:5000`

3. Complete the initial setup by configuring your OIDC provider.

## Configuration

### Environment Variables

- `DB_TYPE` - Database type: `sqlite` (default) or `postgresql`
- `DB_PATH` - SQLite database path (default: `./data/slugbase.db`)
- `DB_HOST` - PostgreSQL host (default: `localhost`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_NAME` - PostgreSQL database name (default: `slugbase`)
- `DB_USER` - PostgreSQL user
- `DB_PASSWORD` - PostgreSQL password
- `SESSION_SECRET` - Session secret (change in production!)
- `BASE_URL` - Base URL for redirects
- `FRONTEND_URL` - Frontend URL for CORS

## Initial Setup

On first start, SlugBase enters **Setup Mode**. You'll be prompted to configure your first OIDC provider:

- **Provider Key**: A unique identifier (e.g., `google`, `github`)
- **Client ID**: OIDC client ID
- **Client Secret**: OIDC client secret
- **Issuer URL**: OIDC issuer URL
- **Scopes**: OIDC scopes (default: `openid profile email`)

The first user to log in automatically becomes an admin.

## Usage

1. **Create Bookmarks**: Add bookmarks with title, URL, and optional slug
2. **Enable Forwarding**: Toggle forwarding to create short URLs
3. **Organize**: Use folders and tags to organize your bookmarks
4. **Filter**: Filter bookmarks by folder or tag
5. **Share**: Copy forwarding URLs to share with others

## License

Open source - see LICENSE file for details.

---

**Your links. Your structure. Your language. Your rules.**
