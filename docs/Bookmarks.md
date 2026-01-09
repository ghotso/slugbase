# Bookmarks Page

## Overview

The Bookmarks page is the core of SlugBase, allowing users to create, view, edit, and manage their bookmarks. It features a modern card-based layout, filtering capabilities, and integration with folders and tags.

## Route

- **Path**: `/bookmarks`
- **Authentication**: Required
- **Access**: All authenticated users

## Features

### Bookmark Management

- **Create Bookmarks**: Add new bookmarks with title, URL, optional slug, and forwarding
- **Edit Bookmarks**: Modify existing bookmarks
- **Delete Bookmarks**: Remove bookmarks (with confirmation)
- **View Bookmarks**: Display all bookmarks in a responsive grid

### Filtering

- **Filter by Folder**: Dropdown to filter bookmarks by folder
- **Filter by Tag**: Dropdown to filter bookmarks by tag
- **Combined Filters**: Both filters can be used simultaneously
- **Clear Filters**: Reset to show all bookmarks

### Bookmark Cards

Each bookmark card displays:

1. **Header Section**
   - Favicon (fetched from URL or fallback icon)
   - Bookmark title (line-clamped to 2 lines)
   - "Shared" badge if the bookmark is shared with the user

2. **URL Display**
   - Truncated URL with external link icon

3. **Metadata Tags**
   - Folder badges (up to 2 shown, with icon)
   - Tag badges (up to 2 shown)
   - Shared teams indicator (count)

4. **Forwarding URL** (if enabled)
   - Displays slug in format: `/{slug}`
   - Copy button to copy forwarding URL

5. **Actions**
   - **Open Button**: Opens bookmark URL in new tab
   - **Edit Button**: Opens edit modal (own bookmarks only)
   - **Delete Button**: Deletes bookmark (own bookmarks only)

### Card Design

- Modern rounded cards with hover effects
- Gradient icon backgrounds
- Consistent spacing and typography
- Dark/light mode support
- Responsive grid layout (1-4 columns based on screen size)

## User Interactions

### Creating a Bookmark

1. Click "Create Bookmark" button
2. Fill in the bookmark modal:
   - Title (required)
   - URL (required)
   - Slug (optional, auto-generated if not provided)
   - Enable forwarding (optional)
   - Select folders (optional, multiple)
   - Select tags (optional, multiple)
   - Share with teams/users (optional)
3. Click "Save"

### Editing a Bookmark

1. Click the edit icon on a bookmark card (own bookmarks only)
2. Modify fields in the modal
3. Click "Save"

### Deleting a Bookmark

1. Click the delete icon on a bookmark card (own bookmarks only)
2. Confirm deletion in the dialog
3. Bookmark is permanently removed

### Filtering Bookmarks

1. Use "Filter by Folder" dropdown to select a folder
2. Use "Filter by Tag" dropdown to select a tag
3. Filters apply immediately
4. Clear filters by selecting "All Folders" / "All Tags"

### Copying Forwarding URL

1. If forwarding is enabled, click the copy icon next to the slug
2. URL is copied to clipboard
3. Toast notification confirms copy

## Empty State

When no bookmarks exist or filters return no results:

- Displays empty state message
- Shows "Create Bookmark" button
- Clean, centered layout

## Search Engine Guide Link

At the bottom of the page, a note section provides:
- Information about setting up custom search engines
- Link to the Search Engine Guide page
- Helps users access bookmarks quickly from browser address bar

## Component Structure

```tsx
<Bookmarks>
  <Header>
    <Title>
    <Count>
    <Create Button>
  </Header>
  <Filters>
    <Folder Filter>
    <Tag Filter>
  </Filters>
  <Bookmarks Grid>
    <Bookmark Card>
      <Favicon>
      <Title & Badges>
      <URL>
      <Metadata Tags>
      <Forwarding URL>
      <Actions>
    </Card>
  </Grid>
  <Search Engine Note>
  <Bookmark Modal>
  <Confirm Dialog>
</Bookmarks>
```

## API Integration

- `GET /bookmarks` - Fetch bookmarks (with optional folder/tag filters)
- `GET /folders` - Fetch folders for filter dropdown
- `GET /tags` - Fetch tags for filter dropdown
- `GET /teams` - Fetch teams for sharing
- `POST /bookmarks` - Create new bookmark
- `PUT /bookmarks/:id` - Update bookmark
- `DELETE /bookmarks/:id` - Delete bookmark

## Styling

- Modern card design with rounded corners (`rounded-xl`)
- Gradient icon backgrounds
- Hover effects with border color change and shadow
- Consistent badge styling with borders
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Spacing: `gap-4`, padding: `p-5`

## Related Components

- `BookmarkModal` - Create/edit bookmark form
- `Favicon` - Displays bookmark favicon
- `FolderIcon` - Displays folder icons
- `ConfirmDialog` - Deletion confirmation

## Related Pages

- [Folders](./Folders.md) - Folder management
- [Tags](./Tags.md) - Tag management
- [Shared](./Shared.md) - Shared bookmarks view
- [SearchEngineGuide](./SearchEngineGuide.md) - Custom search engine setup

## Technical Details

- **Component File**: `frontend/src/pages/Bookmarks.tsx`
- **State Management**: React hooks (`useState`, `useEffect`)
- **Routing**: React Router
- **API Client**: Custom API client with interceptors
- **Toast Notifications**: Custom toast system
- **Icons**: Lucide React

## i18n Keys Used

- `bookmarks.*` - All bookmark-related strings
- `common.*` - Common UI strings (loading, edit, delete, etc.)
- `folders.*` - Folder-related strings
- `tags.*` - Tag-related strings

## Performance Considerations

- Bookmarks are loaded on component mount and when filters change
- Favicons are loaded lazily with error handling
- Grid layout optimizes for different screen sizes
- Efficient re-renders with React hooks
