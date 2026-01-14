# SlugBase

**Your links. Your structure. Your language. Your rules.**

SlugBase is an open-source, self-hosted bookmark manager with optional link forwarding. Store and organize your bookmarks, and optionally expose them as personal short redirect URLs.

## Features

### Core Functionality
- 📚 **Bookmark Management** - Store and organize your bookmarks with titles, URLs, and optional custom slugs
- 🔗 **Link Forwarding** - Optional short redirect URLs (`/{user_key}/{slug}`) for easy sharing
- 🏷️ **Tags & Folders** - Organize bookmarks with tags and folders (many-to-many relationships)
- 👥 **Sharing** - Share bookmarks and folders with teams and individual users
- 🔍 **Filtering & Sorting** - Filter by folder/tag, sort by date, alphabetically, usage, or access time
- 🔎 **Global Search** - Press `Ctrl+K` to search across bookmarks, folders, and tags from anywhere
- 📊 **View Modes** - Card view or compact list view with density controls
- 📦 **Bulk Actions** - Select multiple bookmarks for bulk operations (move, tag, share, delete)
- 📥 **Import/Export** - Import bookmarks from JSON or export your collection
- 📌 **Pinned Bookmarks** - Pin important bookmarks for quick access
- 📈 **Usage Tracking** - Automatic tracking of bookmark access counts and last accessed time
- 🌐 **Internationalization** - Full i18n support (English, German, French) with easy extension
- 🌓 **Dark/Light Mode** - Auto-detect from browser or manual toggle with theme persistence

### Authentication & Security
- 🔐 **OIDC Authentication** - Login with configurable OIDC providers (Google, GitHub, etc.)
- 🔑 **Local Authentication** - Email/password authentication as fallback
- 🛡️ **Password Reset** - Email-based password reset flow (SMTP configurable)
- 👨‍💼 **Admin System** - First user becomes admin automatically; admin panel for user/team management

### Database & Deployment
- 💾 **SQLite** - Default database (perfect for small deployments)
- 🐘 **PostgreSQL** - Full PostgreSQL support for larger deployments
- 🔄 **Auto Migrations** - Automatic database migration system with version tracking
- 🐳 **Docker Ready** - Production-ready Docker setup with multi-stage builds
- 📊 **API Documentation** - Auto-generated Swagger/OpenAPI documentation

## Tech Stack

### Frontend
- **React** 18+ with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **i18next** for internationalization
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** throughout
- **Passport.js** for authentication (OIDC + JWT)
- **SQLite** (better-sqlite3) / **PostgreSQL** (pg)
- **Swagger** for API documentation
- **Helmet** for security headers
- **Rate Limiting** for API protection

## Quick Start

### Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd slugbase
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development servers**
```bash
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

4. **Initial Setup**

On first start, SlugBase enters **Setup Mode**. Create your first admin user:
- Navigate to the setup page
- Enter email, name, and password
- First user automatically becomes admin
- After setup, configure OIDC providers in the admin panel

### Production with Docker

1. **Build and run**
```bash
docker-compose up -d
```

2. **Access the application**
- Application: `http://localhost:5000`
- API Docs: `http://localhost:5000/api-docs`

3. **Complete setup**
- Go through initial setup flow
- Configure OIDC providers (optional)
- Configure SMTP settings for password reset (optional)

## Configuration

### Environment Variables

#### Database
- `DB_TYPE` - Database type: `sqlite` (default) or `postgresql`
- `DB_PATH` - SQLite database path (default: `./data/slugbase.db`)
- `DB_HOST` - PostgreSQL host (default: `localhost`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_NAME` - PostgreSQL database name (default: `slugbase`)
- `DB_USER` - PostgreSQL user
- `DB_PASSWORD` - PostgreSQL password

#### Server
- `PORT` - Server port (default: `5000`)
- `NODE_ENV` - Environment: `development` or `production`
- `SESSION_SECRET` - Session secret (change in production!)
- `BASE_URL` - Base URL for redirects (e.g., `https://slugbase.example.com`)
- `FRONTEND_URL` - Frontend URL for CORS (default: `http://localhost:3000`)

#### Email (SMTP)
- `SMTP_ENABLED` - Enable SMTP (default: `false`)
- `SMTP_HOST` - SMTP host (e.g., `smtp.gmail.com`)
- `SMTP_PORT` - SMTP port (default: `587`)
- `SMTP_SECURE` - Use TLS/SSL (default: `false`)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM_EMAIL` - From email address
- `SMTP_FROM_NAME` - From name

### Database Migrations

SlugBase uses an automatic migration system:

1. **Migrations Location**: `backend/src/db/migrations/`
2. **Naming Convention**: `NNN_migration_name.ts` (e.g., `001_migrate_slug_nullable.ts`)
3. **Auto-registration**: All migrations are auto-registered on startup
4. **Tracking**: Applied migrations are tracked in `schema_migrations` table
5. **Execution**: Migrations run automatically after initial schema setup

To add a new migration:
1. Create a new file: `backend/src/db/migrations/002_your_migration.ts`
2. Export: `migrationId`, `migrationName`, `up()` function, and optionally `down()` function
3. Import and register in `backend/src/db/migrations/index.ts`

## Project Structure

```
slugbase/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication logic (JWT, OIDC)
│   │   ├── config/        # Configuration files
│   │   ├── db/            # Database layer
│   │   │   ├── migrations/ # Database migrations
│   │   │   ├── schema.sql  # Initial schema
│   │   │   └── index.ts    # DB utilities
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin components
│   │   │   ├── modals/    # Modal components
│   │   │   └── ui/        # UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── locales/       # i18n translations
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utility functions
│   └── package.json
├── docs/                   # Documentation (see below)
├── docker-compose.yml      # Docker Compose config
├── Dockerfile              # Production Dockerfile
└── package.json            # Root workspace config
```

## Documentation

Comprehensive documentation for all frontend pages is available in the `docs/` directory:

- [Dashboard](./docs/Dashboard.md) - Main landing page
- [Bookmarks](./docs/Bookmarks.md) - Bookmark management
- [Folders](./docs/Folders.md) - Folder organization
- [Tags](./docs/Tags.md) - Tag management
- [Shared](./docs/Shared.md) - Shared content view
- [Profile](./docs/Profile.md) - User profile and settings
- [Admin](./docs/Admin.md) - Admin panel
- [Login](./docs/Login.md) - Authentication page
- [Setup](./docs/Setup.md) - Initial setup flow
- [PasswordReset](./docs/PasswordReset.md) - Password reset flow
- [SearchEngineGuide](./docs/SearchEngineGuide.md) - Search engine setup guide

## API Documentation

Interactive API documentation is available at `/api-docs` when the server is running. The API uses:
- **JWT** tokens for authentication (except login/setup endpoints)
- **RESTful** design principles
- **OpenAPI/Swagger** specification

## Usage Examples

### Creating a Bookmark with Forwarding

1. Click "Create Bookmark"
2. Enter title and URL
3. Optionally set a custom slug (e.g., `my-link`)
4. Enable "Forwarding Enabled"
5. Add folders and tags
6. Save

The bookmark will be accessible at: `{BASE_URL}/{your_user_key}/my-link`

### Setting up Custom Search Engine

1. Go to Bookmarks page
2. Click "Learn how to set up a custom search engine" link
3. Follow the guide for your browser
4. Use your search URL: `{BASE_URL}/{user_key}/%s`
5. Set keyword (e.g., `go`)
6. Access bookmarks by typing: `go {slug}` in your address bar

### Sharing Bookmarks

1. Create or edit a bookmark
2. Click the share icon
3. Select teams or individual users
4. Shared users will see the bookmark in their "Shared" page

## Development

### Building

```bash
npm run build
```

Builds both frontend and backend for production.

### Adding a New Language

1. Create `frontend/src/locales/{lang}.json`
2. Copy structure from `en.json`
3. Translate all strings
4. Import in `frontend/src/i18n.ts`
5. Add language option in Profile page

### Adding a New Migration

1. Create `backend/src/db/migrations/NNN_description.ts`
2. Export migration functions (see existing migrations for structure)
3. Import and register in `backend/src/db/migrations/index.ts`
4. Migrations run automatically on next server start

## Security

- Passwords are hashed using bcrypt
- JWT tokens with secure configuration
- Helmet.js security headers
- Rate limiting on authentication endpoints
- CORS configuration
- SQL injection protection (parameterized queries)
- XSS protection (React's built-in escaping)
- CSRF protection on state-changing operations

See [SECURITY.md](./SECURITY.md) for more details.

## License

Open source - see LICENSE file for details.

---

**SlugBase** – Your links. Your structure. Your language. Your rules.
