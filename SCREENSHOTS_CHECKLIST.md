# Screenshot Checklist for SlugBase Documentation

This file lists all screenshots that need to be added to `docs/assets/` for the Docusaurus documentation.

## Screenshot Requirements

All screenshots should be:
- **Format**: PNG
- **Resolution**: Minimum 1920x1080 (or higher for clarity)
- **Theme**: Include both light and dark mode versions where applicable
- **Content**: Show realistic data (not empty states unless specifically needed)
- **Browser**: Modern browser (Chrome/Firefox) with clean UI

## Screenshots to Create

### 1. Introduction (`intro.md`)
- [x] `intro-hero.png` - Main dashboard view showing SlugBase interface with logo, navigation, and bookmark cards

### 2. Dashboard (`Dashboard.md`)
- [x] `dashboard-overview.png` - Full dashboard page showing hero section with SlugBase logo, tagline, and three navigation cards (Bookmarks, Folders, Tags)
- [x] `dashboard-stats.png` - Dashboard with statistics overview showing total bookmarks, folders, tags, shared bookmarks, shared folders, recent bookmarks, and top tags

### 3. Bookmarks (`Bookmarks.md`)
- [x] `bookmarks-card-view.png` - Bookmarks page in card view mode showing multiple bookmark cards with favicons, titles, URLs, folders, tags, and actions
- [x] `bookmarks-list-view.png` - Bookmarks page in list/table view mode showing compact layout
- [x] `bookmarks-toolbar.png` - Toolbar showing filters, sort dropdown, view toggle, and compact mode toggle
- [x] `bookmark-modal-create.png` - Create bookmark modal showing all fields: title, URL, forwarding toggle, slug field (when enabled), folder/tag autocomplete, sharing options
- [x] `bookmark-modal-forwarding.png` - Bookmark modal with forwarding enabled, showing slug field, live preview URL, and copy button
- [x] `bookmarks-bulk-actions.png` - Bulk actions bar showing selected bookmarks with move, tag, share, and delete options
- [x] `bookmarks-empty-state.png` - Empty state with onboarding CTAs (Create bookmark, Import, Learn forwarding)
- [x] `bookmarks-global-search.png` - Global search modal (Ctrl+K) showing search results for bookmarks, folders, and tags
- [x] `bookmarks-table-view.png` - Table view with columns: checkbox, favicon, title, URL, folders, tags, shared, last accessed, actions

### 4. Folders (`Folders.md`)
- [x] `folders-overview.png` - Folders page showing folder cards with icons, names, shared badges, and actions
- [X] `folder-modal-create.png` - Create folder modal showing name field, icon picker/search, and team sharing options
- [x] `folder-modal-icon-picker.png` - Icon picker modal showing popular icons and search functionality
- [x] `folders-empty-state.png` - Empty state with folder icon and "Create Folder" button

### 5. Tags (`Tags.md`)
- [x] `tags-overview.png` - Tags page showing tag cards in grid layout
- [x] `tag-modal-create.png` - Simple tag creation modal
- [x] `tags-empty-state.png` - Empty state with tag icon and "Create Tag" button

### 6. Shared (`Shared.md`)
- [ ] `shared-bookmarks-tab.png` - Shared page with Bookmarks tab active, showing shared bookmark cards with "Shared by" information
- [ ] `shared-folders-tab.png` - Shared page with Folders tab active, showing shared folder cards
- [ ] `shared-bookmark-card.png` - Close-up of a shared bookmark card showing owner info, shared badge, and read-only indicators

### 7. Profile (`Profile.md`)
- [ ] `profile-overview.png` - Profile page showing Account Information and Preferences sections
- [ ] `profile-email-edit.png` - Profile page with email in edit mode
- [ ] `profile-preferences.png` - Preferences section showing language and theme dropdowns
- [ ] `profile-email-pending.png` - Profile page showing email verification pending banner

### 8. Login (`Login.md`)
- [ ] `login-local-only.png` - Login page with only email/password form (no OIDC providers)
- [ ] `login-with-oidc.png` - Login page showing local auth form and OIDC provider buttons (e.g., "Login with GitHub", "Login with Google")

### 9. Setup (`Setup.md`)
- [ ] `setup-form.png` - Setup page showing initial admin user creation form with email, name, password fields, and admin notice
- [ ] `setup-success.png` - Setup success state with checkmark icon and redirect message

### 10. Password Reset (`PasswordReset.md`)
- [ ] `password-reset-request.png` - Password reset request step showing email input form
- [ ] `password-reset-form.png` - Password reset form (with token) showing new password and confirm password fields

### 11. Search Engine Guide (`SearchEngineGuide.md`)
- [ ] `search-engine-guide-overview.png` - Search engine guide page showing "How It Works", "Your Search URL", browser instructions, and usage example
- [ ] `search-engine-guide-url.png` - Close-up of the personalized search URL display

### 12. Admin (`Admin.md`)
- [ ] `admin-overview.png` - Admin page showing tabbed interface (Users, Teams, OIDC Providers, Settings tabs)
- [ ] `admin-users-tab.png` - Users tab showing user list with search, create, edit, delete actions
- [ ] `admin-teams-tab.png` - Teams tab showing team list
- [ ] `admin-oidc-tab.png` - OIDC Providers tab showing configured providers list
- [ ] `admin-settings-tab.png` - Settings tab showing SMTP configuration form
- [ ] `admin-user-modal.png` - User creation/edit modal
- [ ] `admin-team-modal.png` - Team creation/edit modal
- [ ] `admin-oidc-modal.png` - OIDC provider configuration modal

### 13. OIDC Setup (`OIDC_Setup.md`)
- [ ] `oidc-admin-modal.png` - Admin OIDC provider modal showing all configuration fields
- [ ] `oidc-github-oauth-app.png` - GitHub OAuth App creation page (optional - can be text instructions)
- [ ] `oidc-google-cloud-console.png` - Google Cloud Console OAuth client creation (optional - can be text instructions)

## Total Screenshots Required

**Total: 33 screenshots**

## Notes

- Screenshots should be taken in both light and dark mode where the UI differs significantly
- Use descriptive filenames that match the content
- Ensure screenshots show realistic data (not just empty states)
- Crop screenshots to focus on relevant UI elements
- Consider taking screenshots at different screen sizes for responsive documentation

## File Location

All screenshots should be placed in: `docs/assets/`

## Image References in Documentation

Images are referenced in the markdown files using relative paths:
```markdown
![Alt text](./assets/screenshot-name.png)
```

This ensures images work correctly in Docusaurus regardless of the base URL configuration.
