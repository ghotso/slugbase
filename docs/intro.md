---
id: intro
title: Introduction
sidebar_position: 1
---

# Welcome to SlugBase

**Your links. Your structure. Your language. Your rules.**

SlugBase is an open-source, self-hosted bookmark manager with optional link forwarding. Store and organize your bookmarks, and optionally expose them as personal short redirect URLs.

## What is SlugBase?

SlugBase is a powerful bookmark management system that gives you complete control over how you organize and access your links. Whether you're managing personal bookmarks or sharing resources with teams, SlugBase provides a flexible, privacy-focused solution.

## Key Features

### 📚 Bookmark Management
Store and organize your bookmarks with titles, URLs, and optional custom slugs. Create a personal knowledge base of your favorite links.

### 🏷️ Organization Tools
Organize bookmarks using:
- **Folders** - Group related bookmarks together
- **Tags** - Flexible labeling system with many-to-many relationships
- **Filters** - Quickly find bookmarks by folder, tag, or combinations

### 🔗 Link Forwarding (Optional)
Expose your bookmarks as short redirect URLs using the format `/{user_key}/{slug}`. Perfect for creating memorable, shareable links.

### 👥 Sharing & Collaboration
Share bookmarks and folders with:
- **Teams** - Share with multiple users at once
- **Individual Users** - Direct sharing for specific people
- **Dedicated Shared View** - Access all shared content in one place

### 🔐 Authentication Options
- **OIDC Providers** - Login with GitHub, Google Workspace, or other OIDC-compliant providers
- **Local Authentication** - Email/password as a fallback option
- **Admin System** - Full user and team management

### 🌐 Internationalization
Full i18n support with multiple languages (English, German, French) and easy extension for more languages.

### 🌓 Dark/Light Mode
Automatic theme detection from your browser preferences, with manual toggle and theme persistence.

## Getting Started

1. **[Setup](./Setup.md)** - Initial configuration and creating your first admin user
2. **[Dashboard](./Dashboard.md)** - Overview of your bookmarks and quick navigation
3. **[Bookmarks](./Bookmarks.md)** - Managing your bookmark collection
4. **[Folders](./Folders.md) & [Tags](./Tags.md)** - Organizing your bookmarks
5. **[Shared](./Shared.md)** - Accessing shared content

## Documentation Sections

### Core Features
- [Setup Page](./Setup.md) - Initial system configuration
- [Dashboard](./Dashboard.md) - Main landing page and analytics
- [Bookmarks](./Bookmarks.md) - Bookmark management
- [Folders](./Folders.md) - Folder organization
- [Tags](./Tags.md) - Tag management
- [Shared](./Shared.md) - Shared content access

### User Features
- [Profile](./Profile.md) - Account settings and preferences
- [Login](./Login.md) - Authentication options
- [Password Reset](./PasswordReset.md) - Password recovery
- [Search Engine Guide](./SearchEngineGuide.md) - Browser search integration

### Administration
- [Admin Page](./Admin.md) - User, team, and system management
- [OIDC Setup](./OIDC_Setup.md) - Configuring OIDC providers

## Technology

SlugBase is built with modern web technologies:
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js with Express, TypeScript, Passport.js
- **Database**: SQLite (default) or PostgreSQL
- **Deployment**: Docker-ready with multi-stage builds

## Self-Hosted & Privacy-Focused

SlugBase is designed to be self-hosted, giving you:
- Complete control over your data
- No reliance on third-party services
- Privacy-focused design
- Full customization capabilities

---

Ready to get started? Begin with the [Setup Page](./Setup.md) to configure your SlugBase instance.
