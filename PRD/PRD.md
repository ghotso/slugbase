# SlugBase – Product Requirements Document (PRD)

## 1. Vision

SlugBase is an open-source, self-hosted **bookmark manager with optional link forwarding**.

Users can store bookmarks normally or expose them as personal short redirect URLs in the format:

```
BASE_URL/{user_key}/{slug}
```

SlugBase focuses on simplicity, privacy, and ownership – no artificial limits, no forced SaaS model.

---

## 2. Goals

* Combine **bookmark management** and **personal short-link forwarding** in one clean tool.
* Be fully **self-hostable** with zero vendor lock-in.
* Provide **OIDC authentication** with pluggable providers.
* Offer **Tags & Folders** as first-class organizational features.
* Support **internationalization (i18n)** using easily maintainable JSON locale files.
* Support **SQLite by default**, switchable to **PostgreSQL**.
* Provide a modern minimalist UI with **manual and browser-based dark/light mode**.

---

## 3. Non-Goals (MVP)

* No analytics or click tracking in MVP.
* No monetization features.
* No organization/team features.

---

## 4. Core Features

### 4.1 Bookmarks

Each bookmark contains:

* Title
* Target URL
* Slug (e.g. `cgpt`)
* Forwarding enabled (boolean)
* Owner (user)
* Tags
* Folder (optional)

Bookmarks can exist without forwarding enabled and behave as a normal bookmark manager entry.

---

### 4.2 Tags & Folders

* Users can create, edit, delete:

  * Tags
  * Folders
* Each bookmark can:

  * Belong to exactly one folder
  * Have multiple tags
* UI must support:

  * Filter by folder
  * Filter by tags
  * Combined filters

---

### 4.3 Redirect / Forwarding

If forwarding is enabled, the following route redirects:

```
GET /{user_key}/{slug}
```

→ Redirects to the bookmark’s target URL using HTTP 302 or 307.

If forwarding is disabled or the bookmark does not exist, return `404`.

---

### 4.4 Authentication (OIDC)

* Login via configurable **OIDC providers**.
* Providers are defined via configuration.
* Each provider contains:

  * provider_key
  * client_id
  * client_secret
  * issuer_url
  * scopes

---

### 4.5 Initial Setup & Admin Handling

* On first start, SlugBase enters **Setup Mode**.
* `/setup` page is accessible only when the system is uninitialized.
* The **first created user automatically becomes admin**.
* After setup is completed, `/setup` is permanently disabled.

---

### 4.6 User Keys

* Each user receives a unique public `user_key`.
* Used in redirect URLs.
* Displayed in the user profile.

---

### 4.7 Internationalization (i18n)

* All UI text must be externalized into locale JSON files.
* Structure example:

  ```
  /locales/en.json
  /locales/de.json
  /locales/fr.json
  ```
* Adding a new language must only require:

  * Creating a new JSON file
  * No code changes
* Browser language auto-detection with manual override in user settings.

---

### 4.8 UI / UX

* Minimalist modern design.
* Fully responsive.
* Dark & Light mode:

  * Auto-detect from browser
  * Manual toggle in UI
* Bookmark creation flow:

  * Title
  * URL
  * Slug
  * Forwarding toggle
  * Folder selection
  * Tag selection
* One-click copy for redirect URLs.

---

## 5. MVP Scope

| Feature                    | Included |
| -------------------------- | -------- |
| OIDC authentication        | Yes      |
| Setup page                 | Yes      |
| Auto admin assignment      | Yes      |
| Bookmark CRUD              | Yes      |
| Redirect forwarding        | Yes      |
| Tags & Folders             | Yes      |
| i18n via JSON locale files | Yes      |
| SQLite support             | Yes      |
| PostgreSQL support         | Yes      |
| Dark / Light UI            | Yes      |
| Analytics                  | No       |

---

## 6. User Stories

* As a user, I want to save bookmarks without exposing them publicly.
* As a user, I want to organize bookmarks with folders and tags.
* As a user, I want to optionally expose a bookmark as a short redirect URL.
* As a user, I want to use the UI in my own language.
* As an admin, I want setup to be impossible after first initialization.

---

## 7. Deployment

* Runs via Docker or as a single service.
* DB selected via environment variable.
* No external services required.

---

## 8. Open Source Principles

* No artificial feature limits.
* Fully open-source codebase.
* Simple localization contribution flow.

---

SlugBase – **Your links. Your structure. Your language. Your rules.**
